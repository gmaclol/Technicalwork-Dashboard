// ── Data loading, rendering, navigation ──
import { db, doc, collection, getDocs, onSnapshot, getDoc, setDoc } from './firebase.js';
import { APPALTI, currentUser, currentAppalto, currentDate, setCurrentAppalto, setCurrentDate } from './state.js';
import { escapeHtml, isToday, relativeTime, techStatus, formatDateLabel, parseTimestamp, showToast } from './utils.js';
import { exportToExcel, printTable } from './export.js';

// ── HIDDEN TECNICI ──
let _hiddenCache = null;

export async function getHiddenTecnici() {
  if (_hiddenCache !== null) return _hiddenCache;
  try {
    const snap = await getDoc(doc(db, 'settings', 'hidden_tecnici'));
    _hiddenCache = snap.exists() ? (snap.data().hidden || []) : [];
  } catch { _hiddenCache = []; }
  return _hiddenCache;
}

export async function saveHiddenTecnici(list) {
  _hiddenCache = list;
  try {
    await setDoc(doc(db, 'settings', 'hidden_tecnici'), { hidden: list });
  } catch(e) { console.error('Errore salvataggio nascosti', e); }
}

export function resetHiddenCache() { _hiddenCache = null; }

// ── PRELOAD COUNTS ──
const _countListeners = {};
export function getCountListeners() { return _countListeners; }

export async function preloadCounts() {
  for (const appalto of APPALTI) {
    if (!_countListeners[appalto]) {
      _countListeners[appalto] = onSnapshot(collection(db, appalto), async (snap) => {
        const currentHidden = await getHiddenTecnici();
        const live = snap.docs.filter(d => {
          if (/_\d{4}-\d{2}-\d{2}$/.test(d.id)) return false;
          const data = d.data();
          if (currentHidden.includes(data.tecnico || d.id)) return false;
          if (!isToday(data.ultimo_aggiornamento)) return false;
          const mats = data.materiali;
          if (!mats) return false;
          return Object.values(mats).some(v => v !== '' && v !== '0' && v !== 0);
        });
        const cnt = document.getElementById('cnt-' + appalto);
        if (cnt) {
          cnt.textContent = live.length;
          if (live.length > 0) cnt.style.color = 'var(--accent)';
          else cnt.style.color = '';
        }
      });
    }
  }
}

// ── DATE HELPERS ──
export function onDateChange(val) {
  window.location.hash = `#/appalti/${currentAppalto}/${val}`;
}

// ── SNAPSHOT DROPDOWN ──
export function closeSnapshotDropdown() {
  document.querySelectorAll('.snapshot-dropdown.open').forEach(dd => {
    dd.classList.remove('open');
    const trigger = dd.querySelector('.snapshot-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

export function toggleSnapshotDropdown(event) {
  event.stopPropagation();
  const dropdown = event.currentTarget.closest('.snapshot-dropdown');
  if (!dropdown) return;
  const isOpen = dropdown.classList.contains('open');
  closeSnapshotDropdown();
  if (!isOpen) {
    dropdown.classList.add('open');
    event.currentTarget.setAttribute('aria-expanded', 'true');
    const active = dropdown.querySelector('.snapshot-option.active');
    const first = dropdown.querySelector('.snapshot-option');
    const target = active || first;
    if (target) target.focus();
  }
}

export function pickSnapshotDate(val) {
  closeSnapshotDropdown();
  onDateChange(val);
}

// ── NAVIGATION ──
export function selectAppalto(name, el) {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  setCurrentAppalto(name);
  setCurrentDate('live');
  _hiddenCache = null;
  document.getElementById('tb-appalto').textContent = name;
  loadAppalto(name, 'live');
  closeDrawer();
}

export function toggleDrawer() {
  const sb = document.querySelector('.sidebar');
  const ov = document.getElementById('sidebar-overlay');
  if (sb.classList.contains('open')) {
    closeDrawer();
  } else {
    sb.classList.add('open');
    ov.classList.add('show');
  }
}

export function closeDrawer() {
  const sb = document.querySelector('.sidebar');
  const ov = document.getElementById('sidebar-overlay');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('show');
}

// ── FETCH MASTER LIST ──
const _masterListCache = {};

export async function forceListUpdateFromGithub() {
  const keys = ['lista', 'elecnor', 'sertori', 'sirti'].map(a => a.toLowerCase());
  for (const k of keys) {
    localStorage.removeItem(`tw_list_${k}`);
    localStorage.removeItem(`tw_list_time_${k}`);
    delete _masterListCache[k];
  }
  // Scrivi su Firestore per invalidare le cache degli altri manager connessi se vuoi
  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    await setDoc(doc(db, 'settings', 'dashboard'), { forceListUpdate: Date.now() }, { merge: true });
  } catch(e) {}
}

async function fetchRawMasterList(appalto) {
  const normApp = appalto.toLowerCase();
  if (_masterListCache[normApp]) return _masterListCache[normApp];

  const cacheKey = `tw_list_${normApp}`;
  const timeKey = `tw_list_time_${normApp}`;
  const cachedData = localStorage.getItem(cacheKey);
  const cachedTime = localStorage.getItem(timeKey);
  const now = Date.now();

  let globalTimestamp = 0;
  // Legge attivamente da Firebase il timestamp globale impostato dal bottone dell'admin
  try {
    const snap = await getDoc(doc(db, 'settings', 'dashboard'));
    if (snap.exists()) {
      globalTimestamp = snap.data().forceListUpdate || 0;
    }
  } catch(e) {}
  
  // 24 hours = 86400000ms
  const isExpired = !cachedTime || (now - parseInt(cachedTime) > 86400000);
  const isInvalidated = parseInt(cachedTime || 0) < globalTimestamp;

  if (cachedData && !isExpired && !isInvalidated) {
    try {
      _masterListCache[normApp] = JSON.parse(cachedData);
      return _masterListCache[normApp];
    } catch(e) { }
  }

  const HARDCODED_FALLBACK = [
    ":: MATERIALE ACCESSORIO ::",
    "PTE / MU", "ROE / ROEL", "CAVO DROP (MT)", "MINIPRESA / BORCHIA", "MODEM / ONT",
    ":: ALTRO ::",
    "RIFLETTORE", "SISTEMAZIONE LOCALI"
  ];
  
  let listToReturn = null;

  try {
    let url = `https://raw.githubusercontent.com/gmaclol/Technicalwork-Materiali/master/lists/${appalto}.txt`;
    let res = await fetch(url);
    
    if (res.status === 404) {
      // 404: L'appalto non ha un file dedicato (es. Sertori). Fallback a lista.txt
      url = `https://raw.githubusercontent.com/gmaclol/Technicalwork-Materiali/master/lists/lista.txt`;
      res = await fetch(url);
    }
    
    if (res.status === 200) {
      const text = await res.text();
      const list = text.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
      if (list.length > 0) {
        listToReturn = list;
        localStorage.setItem(cacheKey, JSON.stringify(list));
        localStorage.setItem(timeKey, now.toString());
      }
    } else {
      console.warn("GitHub risponde con errore", res.status, "su", appalto);
    }
  } catch (e) {
    console.error("Errore di rete o CORS nel fetch della raw list:", e);
  }

  if (!listToReturn && cachedData) {
    try {
      listToReturn = JSON.parse(cachedData);
      console.log("Rete o GitHub bloccati, ripiego sulla cache locale di 24h.");
    } catch(e) {}
  }

  _masterListCache[normApp] = listToReturn || HARDCODED_FALLBACK;
  return _masterListCache[normApp];
}

// ── GEOCODING ──
const _geoCache = {};

export async function loadGeo(event, techId, lat, lng) {
  event.preventDefault();
  const el = document.getElementById('loc-' + techId);
  if (!el || el.dataset.loaded) {
    window.open(el.href, '_blank');
    return;
  }
  el.textContent = '⊙ caricamento...';
  const geoKey = `${lat}_${lng}`;
  try {
    let label = "";
    if (_geoCache[geoKey]) {
      label = _geoCache[geoKey];
    } else {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const json = await res.json();
      const addr = json.address;
      label = addr.road
        ? `${addr.road}${addr.house_number ? ' ' + addr.house_number : ''}, ${addr.city || addr.town || addr.village || ''}`
        : json.display_name.split(',').slice(0, 2).join(',');
      _geoCache[geoKey] = label;
    }
    el.textContent = '⊙ ' + label.trim();
    el.dataset.loaded = '1';
  } catch {
    el.textContent = `⊙ ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`;
    el.dataset.loaded = '1';
  }
}

// ── SCROLL HELPERS ──
export function scrollCellIntoViewCenter(cellEl) {
  const scroller = cellEl && cellEl.closest ? cellEl.closest('.table-scroll') : null;
  if (!scroller) {
    cellEl.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    return;
  }
  const cellRect = cellEl.getBoundingClientRect();
  const scrollerRect = scroller.getBoundingClientRect();
  const current = scroller.scrollLeft;
  const cellCenter = cellRect.left - scrollerRect.left + cellRect.width / 2;
  const target = current + cellCenter - scrollerRect.width / 2;
  scroller.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
}

export function scrollTechHeaderNeighbor(btnEl, delta) {
  const th = btnEl && btnEl.closest ? btnEl.closest('th') : null;
  if (!th) return;
  const headerRow = th.parentElement;
  if (!headerRow || !headerRow.children) return;
  const ths = Array.from(headerRow.children).filter(el => el.tagName === 'TH');
  const idx = ths.indexOf(th);
  const target = ths[idx + delta];
  if (target) scrollCellIntoViewCenter(target);
}

// ── FILTER MATERIALS ──
export function filterMaterials(query) {
  const q = query.trim().toLowerCase();
  const rows = document.querySelectorAll('tbody tr');
  let lastSepRow = null;
  let lastSepHasVisible = false;

  rows.forEach(row => {
    if (row.classList.contains('separator-row')) {
      if (lastSepRow) lastSepRow.style.display = lastSepHasVisible ? '' : 'none';
      lastSepRow = row;
      lastSepHasVisible = false;
    } else {
      const mat = row.dataset.material || '';
      const visible = q === '' || mat.includes(q);
      row.style.display = visible ? '' : 'none';
      if (visible) lastSepHasVisible = true;
    }
  });
  if (lastSepRow) lastSepRow.style.display = lastSepHasVisible ? '' : 'none';
}

// ── INCREMENTAL RENDER STATE (Step 5) ──
let _lastRenderedKey = null;
let _lastRenderedTecNames = [];
let _lastRenderedValues = new Map();

// ── KPI HELPER (Step 12) ──
function updateKpiCards(tecnici) {
  let total = 0;
  tecnici.forEach(t => {
    if (t.materiali) {
      Object.values(t.materiali).forEach(v => {
        const n = parseInt(v);
        if (!isNaN(n) && n > 0) total += n;
      });
    }
  });

  let latestDate = null;
  let latestStr = '—';
  tecnici.forEach(t => {
    const d = parseTimestamp(t.ultimo_aggiornamento);
    if (d && (!latestDate || d > latestDate)) {
      latestDate = d;
      latestStr = t.ultimo_aggiornamento;
    }
  });

  const kpiTotal = document.getElementById('kpi-total');
  const kpiTecnici = document.getElementById('kpi-tecnici');
  const kpiSync = document.getElementById('kpi-sync');

  if (kpiTotal) kpiTotal.textContent = total.toLocaleString('it-IT');
  if (kpiTecnici) kpiTecnici.textContent = tecnici.length;
  if (kpiSync) kpiSync.textContent = relativeTime(latestStr);
}

// ── LOAD DATA ──
let _liveListener = null;

export async function loadAppalto(appalto, dateKey = 'live') {
  _hiddenCache = null;
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="state-box">
      <div class="loader-spinner"></div>
      <p>Recupero dati ${appalto}…</p>
    </div>`;

  if (_liveListener) {
    _liveListener();
    _liveListener = null;
  }

  // Reset incremental state on appalto change
  _lastRenderedKey = null;

  try {
    if (dateKey === 'live') {
      _liveListener = onSnapshot(collection(db, appalto), async (snap) => {
        const allDocs = [];
        snap.forEach(d => allDocs.push({ id: d.id, ...d.data() }));

        const hidden = await getHiddenTecnici();
        const tecnici = allDocs
          .filter(d => !/_\d{4}-\d{2}-\d{2}$/.test(d.id))
          .filter(d => !hidden.includes(d.tecnico || d.id))
          .filter(d => isToday(d.ultimo_aggiornamento))
          .filter(d => {
            const mats = d.materiali;
            if (!mats) return false;
            return Object.values(mats).some(v => v !== '' && v !== '0' && v !== 0);
          });

        const cnt = document.getElementById('cnt-' + appalto);
        if (cnt) {
          cnt.textContent = tecnici.length;
          if (tecnici.length > 0) cnt.style.color = 'var(--accent)';
          else cnt.style.color = '';
        }

        const rawMaterials = await fetchRawMasterList(appalto);
        if (tecnici.length === 0) {
          if (rawMaterials.length === 0) {
            content.innerHTML = `
              <div class="state-box fade-in">
                <h2>Nessun dato</h2>
                <p>Nessun tecnico ha ancora sincronizzato per <strong>${appalto}</strong>.</p>
              </div>`;
            return;
          }
          _lastRenderedKey = null; // force full render
          renderTable(appalto, [], content, dateKey, allDocs, rawMaterials);
          return;
        }

        renderTable(appalto, tecnici, content, dateKey, allDocs, rawMaterials);
      }, e => {
        console.error(e);
        content.innerHTML = `<div class="state-box fade-in"><p>Errore connessione Live.</p></div>`;
      });
    } else {
      const snap = await getDocs(collection(db, appalto));
      const allDocs = [];
      snap.forEach(d => allDocs.push({ id: d.id, ...d.data() }));

      const snapshots = allDocs.filter(d => d.id.endsWith('_' + dateKey));
      const hidden = await getHiddenTecnici();
      const tecnici = snapshots.map(d => ({
        ...d,
        id: d.id.replace('_' + dateKey, ''),
        tecnico: d.tecnico || d.id.replace('_' + dateKey, '')
      })).filter(d => !hidden.includes(d.tecnico || d.id));

      const rawMaterials = await fetchRawMasterList(appalto);

      if (tecnici.length === 0) {
        renderTable(appalto, [], content, dateKey, allDocs, rawMaterials);
        return;
      }

      renderTable(appalto, tecnici, content, dateKey, allDocs, rawMaterials);
    }
  } catch (e) {
    content.innerHTML = `
      <div class="state-box fade-in">
        <h2 style="color:var(--red)">Errore</h2>
        <p>Impossibile caricare i dati. Controlla la connessione.</p>
      </div>`;
    console.error(e);
  }
}

// ── RENDER TABLE ──
function renderTable(appalto, tecnici, container, dateKey = 'live', allDocs = [], fallbackMaterials = []) {
  const ordineBase = (fallbackMaterials && fallbackMaterials.length > 0) 
    ? fallbackMaterials 
    : (tecnici.find(t => t.ordine && t.ordine.length > 0)?.ordine || []);
    
  const ordineSet = new Set(ordineBase);
  const extra = [];
  const extraSeen = new Set();
  const extraInfo = new Map();
  tecnici.forEach(t => {
    if (t.materiali) {
      Object.keys(t.materiali).forEach(m => {
        const raw = t.materiali[m];
        const val = (raw === '0' || raw === 0) ? '' : String(raw);
        // Ignora i materiali fuori lista (ghost keys storiche) se il tecnico non ha realmente un valore numerico o testo effettivo
        if (val === '') return;

        if (!ordineSet.has(m)) {
          if (!extraSeen.has(m)) {
            extraSeen.add(m);
            extra.push(m);
          }
          if (!extraInfo.has(m)) extraInfo.set(m, new Set());
          extraInfo.get(m).add(t.tecnico || t.id);
        }
      });
    }
  });

  let allMaterials = [...extra, ...ordineBase];
  // Rimuovi completamente i separatori app-only dalla visualizzazione in dashboard
  allMaterials = allMaterials.filter(m => !/^::.*::$/.test(m.trim()) && !/^;;.*;;$/.test(m.trim()));

  const extraSet = new Set(extra);
  if (tecnici.length === 0 && fallbackMaterials && fallbackMaterials.length > 0) {
    allMaterials = fallbackMaterials;
  }

  if (allMaterials.length === 0) {
    container.innerHTML = `
      <div class="state-box fade-in">
        <h2>Nessun materiale</h2>
        <p>I dati non contengono materiali.</p>
      </div>`;
    return;
  }

  // ── Step 5: Incremental render check ──
  const renderKey = `${appalto}:${dateKey}`;
  const tecNames = tecnici.map(t => t.tecnico || t.id);
  const canIncrement = _lastRenderedKey === renderKey
    && tecNames.length === _lastRenderedTecNames.length
    && tecNames.every((n, i) => n === _lastRenderedTecNames[i])
    && container.querySelector('table')
    && window._lastMaterials && window._lastMaterials.length === allMaterials.length;

  if (canIncrement) {
    // Incremental update — only change cells that differ
    tecnici.forEach((t, tIdx) => {
      const name = t.tecnico || t.id;
      allMaterials.forEach(mat => {
        if (/^::.*::$/.test(mat.trim()) || /^;;.*;;$/.test(mat.trim())) return;
        const raw = (t.materiali && t.materiali[mat]) || '';
        const val = (raw === '0' || raw === 0) ? '' : String(raw);
        const key = `${name}:${mat}`;
        if (_lastRenderedValues.get(key) !== val) {
          const row = container.querySelector(`tr[data-material="${CSS.escape(mat.toLowerCase())}"]`);
          if (row) {
            const cell = row.children[tIdx + 1];
            if (cell) {
              const cls = val !== '' ? 'has-value' : 'empty';
              const display = val !== '' ? val : '·';
              cell.className = `td-value ${cls}`;
              cell.textContent = display;
            }
          }
          _lastRenderedValues.set(key, val);
        }
      });

      // Update time display
      const time = t.ultimo_aggiornamento || '—';
      const timeEl = container.querySelectorAll('.tech-time')[tIdx];
      if (timeEl) {
        timeEl.textContent = relativeTime(time);
        timeEl.title = time;
      }
      // Update status dot
      const nameEl = container.querySelectorAll('.tech-name')[tIdx];
      if (nameEl) {
        const dot = nameEl.querySelector('.status-circle');
        if (dot) dot.className = techStatus(time);
      }
    });

    // Update subtitle
    const subtitle = container.querySelector('.content-subtitle');
    if (subtitle) {
      const isSnapshot = dateKey !== 'live';
      subtitle.innerHTML = `${tecnici.length} tecnici · ${allMaterials.length} materiali${isSnapshot ? ' · <span style="color:var(--yellow)">snapshot</span>' : ''}`;
    }

    // Update KPI cards
    if (currentUser && currentUser.role === 'admin') {
      updateKpiCards(tecnici);
    }

    window._lastTecnici = tecnici;
    window._lastMaterials = allMaterials;
    return;
  }

  // ── Step 6: Save search value before full re-render ──
  const savedSearch = document.getElementById('material-search')?.value || '';

  // ── Full render ──
  const todayYMD = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');
  const allIds = allDocs.map(d => d.id);
  const snapshotDates = [...new Set(
    allIds
      .map(id => { const m = id.match(/_(\d{4}-\d{2}-\d{2})$/); return m ? m[1] : null; })
      .filter(d => Boolean(d) && d !== todayYMD)
  )].sort().reverse().slice(0, 7);

  const snapshotOptions = [{ value: 'live', label: '📡 Oggi (live)' }];
  snapshotDates.forEach(d => {
    snapshotOptions.push({ value: d, label: formatDateLabel(d) });
  });
  const selectedSnapshot = snapshotOptions.find(opt => opt.value === dateKey) || snapshotOptions[0];
  const snapshotMenu = snapshotOptions.map(opt => `
    <button type="button" class="snapshot-option ${opt.value === dateKey ? 'active' : ''}"
      role="option" aria-selected="${opt.value === dateKey ? 'true' : 'false'}"
      data-value="${opt.value}" onclick="pickSnapshotDate('${opt.value}')"
    >${escapeHtml(opt.label)}</button>
  `).join('');

  const isSnapshot = dateKey !== 'live';
  const isAdmin = currentUser && currentUser.role === 'admin';

  let html = `
    <div class="content-header fade-in">
      <div>
        <div class="content-title">${appalto}</div>
        <div class="content-subtitle">${tecnici.length} tecnici · ${allMaterials.length} materiali${isSnapshot ? ' · <span style="color:var(--yellow)">snapshot</span>' : ''}</div>
      </div>
      <div class="content-actions">
        <div class="snapshot-dropdown" id="snapshot-dropdown">
          <button type="button" class="snapshot-trigger" onclick="toggleSnapshotDropdown(event)"
            aria-haspopup="listbox" aria-expanded="false">
            <span class="snapshot-label">${escapeHtml(selectedSnapshot.label)}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="snapshot-menu" role="listbox" aria-label="Seleziona snapshot">
            ${snapshotMenu}
          </div>
        </div>
        <button class="btn-icon-text btn-export" onclick="exportToExcel('${appalto}', window._lastTecnici, window._lastMaterials)" ${tecnici.length === 0 ? 'disabled' : ''}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Esporta
        </button>
        <button class="btn-icon-text" onclick="printTable('${appalto}', window._lastTecnici, window._lastMaterials)" ${tecnici.length === 0 ? 'disabled' : ''}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Stampa
        </button>
      </div>
    </div>`;

  // KPI Cards (Step 12 — admin only)
  if (isAdmin && tecnici.length > 0) {
    let totalMats = 0;
    tecnici.forEach(t => {
      if (t.materiali) Object.values(t.materiali).forEach(v => { const n = parseInt(v); if (!isNaN(n) && n > 0) totalMats += n; });
    });
    let latestDate = null, latestStr = '—';
    tecnici.forEach(t => {
      const d = parseTimestamp(t.ultimo_aggiornamento);
      if (d && (!latestDate || d > latestDate)) { latestDate = d; latestStr = t.ultimo_aggiornamento; }
    });

    html += `
    <div class="kpi-grid fade-in">
      <div class="kpi-card">
        <div class="kpi-icon">📦</div>
        <div class="kpi-value" id="kpi-total">${totalMats.toLocaleString('it-IT')}</div>
        <div class="kpi-label">Materiali totali</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">👷</div>
        <div class="kpi-value" id="kpi-tecnici">${tecnici.length}</div>
        <div class="kpi-label">Tecnici attivi</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🔄</div>
        <div class="kpi-value" id="kpi-sync">${relativeTime(latestStr)}</div>
        <div class="kpi-label">Ultimo sync</div>
      </div>
    </div>`;
  }

  if (tecnici.length > 0) {
    html += `
    <div class="search-wrap">
      <input class="search-input" type="search" placeholder="Cerca materiale…"
        oninput="filterMaterials(this.value)" id="material-search" aria-label="Filtra materiali">
    </div>`;
  }

  html += `<div class="table-scroll fade-in">`;

  if (tecnici.length === 0) {
    html += `
      <div class="state-box" style="background: rgba(255,255,255,0.03); margin-top: 20px; border: 1px dashed rgba(255,255,255,0.1);">
        <p>Nessun tecnico ha sincronizzato dati per questa selezione.</p>
      </div>`;
  } else {
    html += `
      <table>
        <thead>
          <tr>
            <th><div class="th-inner th-material">Materiale</div></th>`;

    tecnici.forEach(t => {
      const name = t.tecnico || t.id;
      const time = t.ultimo_aggiornamento || '—';
      const hasLocation = t.lat && t.lng;
      let statusHtml = `<span class="${techStatus(time)}"></span>`;
      let timeDisplay = relativeTime(time);
      let locationHtml = '';

      if (isAdmin && hasLocation) {
        const mapsUrl = `https://www.google.com/maps?q=${t.lat},${t.lng}`;
        locationHtml = `<a class="tech-location" href="${mapsUrl}" target="_blank" id="loc-${t.id}" onclick="loadGeo(event,'${t.id}',${t.lat},${t.lng})">⊙ mostra posizione</a>`;
      }

      html += `
            <th onclick="if(window.innerWidth <= 900) scrollCellIntoViewCenter(this)" style="cursor: pointer;">
              <div class="th-inner th-tech">
                <span class="tech-name">
                  <button type="button" class="tech-nav-left" aria-label="Sposta a sinistra" onclick="event.stopPropagation(); scrollTechHeaderNeighbor(this, -1)">◀</button>
                  ${statusHtml}${name}
                </span>
                <span class="tech-time" title="${time}">${timeDisplay}</span>
                ${locationHtml}
              </div>
            </th>`;
    });

    html += `
          </tr>
        </thead>
        <tbody>`;

    allMaterials.forEach(mat => {
      const isSep = /^::.*::$/.test(mat.trim()) || /^;;.*;;$/.test(mat.trim());
      if (isSep) {
        const label = mat.replace(/^[:;]+|[:;]+$/g, '').trim();
        html += `
          <tr class="separator-row" data-sep="${escapeHtml(label)}">
            <td colspan="${tecnici.length + 1}">${label}</td>
          </tr>`;
        return;
      }

      const isExtra = extraSet.has(mat) && !isSep;
      const rowClass = isExtra ? ' class="extra-row"' : '';
      let titleAttr = '';
      if (isExtra && extraInfo.has(mat)) {
        const owners = Array.from(extraInfo.get(mat)).join(', ');
        titleAttr = ` title="Inserito da: ${escapeHtml(owners)}"`;
      }

      html += `<tr data-material="${escapeHtml(mat.toLowerCase())}"${rowClass}><td class="td-material"${titleAttr}>${mat}</td>`;
      tecnici.forEach(t => {
        const raw = (t.materiali && t.materiali[mat]) || '';
        const val = (raw === '0' || raw === 0) ? '' : raw;
        const cls = val !== '' ? 'has-value' : 'empty';
        const display = val !== '' ? val : '·';
        html += `<td class="td-value ${cls}">${display}</td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody></table>`;
  }

  html += `</div>`;
  container.innerHTML = html;

  // Save references for export
  window._lastTecnici = tecnici;
  window._lastMaterials = allMaterials;

  // ── Step 5: Save render state for incremental updates ──
  _lastRenderedKey = renderKey;
  _lastRenderedTecNames = [...tecNames];
  _lastRenderedValues = new Map();
  tecnici.forEach(t => {
    const name = t.tecnico || t.id;
    allMaterials.forEach(mat => {
      if (/^::.*::$/.test(mat.trim()) || /^;;.*;;$/.test(mat.trim())) return;
      const raw = (t.materiali && t.materiali[mat]) || '';
      const val = (raw === '0' || raw === 0) ? '' : String(raw);
      _lastRenderedValues.set(`${name}:${mat}`, val);
    });
  });

  // ── Step 6: Restore search value ──
  if (savedSearch) {
    const searchEl = document.getElementById('material-search');
    if (searchEl) {
      searchEl.value = savedSearch;
      filterMaterials(savedSearch);
    }
  }
}
