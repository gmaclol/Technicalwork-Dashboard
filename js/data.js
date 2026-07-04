// ── Data loading, rendering, navigation ──
import { db, doc, collection, getDocs, onSnapshot, getDoc, setDoc, updateDoc, deleteField, FieldPath } from './firebase.js';
import { APPALTI, currentUser, currentAppalto, currentDate, setCurrentAppalto, setCurrentDate, invalidateConfigCache } from './state.js';
import { escapeHtml, isToday, relativeTime, dateOnlyRelativeTime, techStatus, formatDateLabel, parseTimestamp, showToast, parseQuantity, formatQuantityTotal, showConfirm, showRenameModal } from './utils.js';
import { exportToExcel, printTable } from './export.js';

// ── STALE HASH HELPERS ──
function simpleHash(obj) {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

// ── CUSTOM SELECT DROPDOWN LOGIC ──
export function toggleCustomSelect(event, btn) {
  if (event) event.stopPropagation();
  const dropdown = btn.closest('.custom-select');
  if (!dropdown) return;
  const isOpen = dropdown.classList.contains('open');
  // Close all other custom select dropdowns
  document.querySelectorAll('.custom-select.open').forEach(d => {
    if (d !== dropdown) d.classList.remove('open');
  });
  dropdown.classList.toggle('open');
}

export function selectCustomOption(btn) {
  const dropdown = btn.closest('.custom-select');
  if (!dropdown) return;
  const val = btn.dataset.value;
  const label = btn.textContent;
  
  // Update hidden input
  const hiddenInput = dropdown.querySelector('input[type="hidden"]');
  if (hiddenInput) {
    hiddenInput.value = val;
    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Update label
  const labelSpan = dropdown.querySelector('.select-label');
  if (labelSpan) labelSpan.textContent = label;
  
  // Update active state
  dropdown.querySelectorAll('.select-opt').forEach(opt => opt.classList.remove('active'));
  btn.classList.add('active');
  
  dropdown.classList.remove('open');
}

function buildCustomSelect(id, label, options, defaultValue) {
  const selectedOption = options.find(opt => opt.value === defaultValue) || options[0] || { value: '', label: '-- Seleziona --' };
  const optionsHtml = options.map(opt => `
    <button type="button" class="select-opt ${opt.value === defaultValue ? 'active' : ''}"
      role="option" aria-selected="${opt.value === defaultValue ? 'true' : 'false'}"
      data-value="${escapeHtml(opt.value)}" onclick="selectCustomOption(this)"
    >${escapeHtml(opt.label)}</button>
  `).join('');

  return `
    <div class="custom-select" id="${id}-container">
      <button type="button" class="select-trigger" onclick="toggleCustomSelect(event, this)">
        <span class="select-label">${escapeHtml(selectedOption.label)}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5l3 3 3-3"/></svg>
      </button>
      <div class="select-options-list" role="listbox">
        ${optionsHtml}
      </div>
      <input type="hidden" id="${id}" value="${escapeHtml(defaultValue)}">
    </div>
  `;
}


let _staleCache = null;
let _staleCheckedForAppalto = null;
let _staleCacheMap = new Map();

async function checkStaleHashes(appalto, tecnici) {
  const todayYMD = new Date().toISOString().slice(0, 10);
  const staleMap = new Map(); // techId → stale_since date string

  try {
    // Leggi hash correnti da Firestore
    const staleDocRef = doc(db, 'settings', 'stale_hashes');
    const snap = await getDoc(staleDocRef);
    const allData = snap.exists() ? snap.data() : {};
    const appaltoData = allData[appalto] || {};
    let changed = false;

    for (const t of tecnici) {
      const key = t.id;
      const currentHash = simpleHash(t.materiali || {});
      const saved = appaltoData[key];

      if (saved && saved.hash === currentHash) {
        // Hash invariato — mantieni stale_since
        if (saved.stale_since && saved.stale_since !== todayYMD) {
          staleMap.set(key, saved.stale_since);
        }
      } else {
        // Hash cambiato o nuovo — aggiorna
        appaltoData[key] = { hash: currentHash, stale_since: todayYMD };
        changed = true;
      }
    }

    if (changed) {
      allData[appalto] = appaltoData;
      await setDoc(staleDocRef, allData, { merge: true });
    }
  } catch(e) {
    console.warn('Stale check error:', e);
  }

  return staleMap;
}

// ── HIDDEN TECNICI ──
let _hiddenCache = null;
let _lastAllDocs = [];

export function setHiddenCache(list) {
  _hiddenCache = list;
}

export function getHiddenTecniciSync() {
  return _hiddenCache || [];
}

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
const _liveCounts = {}; // cache live counts
export function getCountListeners() { return _countListeners; }

function updateSidebarBadge(appalto, count) {
  const cnt = document.getElementById('cnt-' + appalto);
  if (cnt) {
    cnt.textContent = count;
    if (count > 0 && count !== '…') cnt.style.color = 'var(--accent)';
    else cnt.style.color = '';
  }
}

let _globalHiddenListener = null;

/**
 * Controlla se un documento tecnico è nella lista degli hidden.
 * La hidden list contiene NOMI display (d.tecnico), ma confrontiamo
 * anche d.id (deviceId) per robustezza in caso di mismatch.
 * Il confronto è case-insensitive per evitare bug da capitalizzazione.
 */
function isHiddenDoc(d, hidden) {
  if (!hidden || hidden.length === 0) return false;
  const name = (d.tecnico || '').toLowerCase();
  const id   = (d.id || '').toLowerCase();
  return hidden.some(h => {
    const hl = (h || '').toLowerCase();
    return hl === name || hl === id;
  });
}

export function initGlobalHiddenListener() {
  if (_globalHiddenListener) return;
  _globalHiddenListener = onSnapshot(doc(db, 'settings', 'hidden_tecnici'), (snap) => {
    _hiddenCache = snap.exists() ? (snap.data().hidden || []) : [];
    
    // 1. Aggiorna i badge della sidebar per la data corrente
    updateSidebarCountsForDate(currentDate);
    
    // 2. Se siamo sulla dashboard principale (tabella materiali), forza il re-render
    if (currentAppalto && document.getElementById('tb-appalto') && _lastAllDocs.length > 0) {
      triggerTableRenderWithHidden();
    }
  }, (e) => {
    console.error("Errore listener globale hidden_tecnici:", e);
  });
}

async function triggerTableRenderWithHidden() {
  const content = document.getElementById('content');
  if (!content || !currentAppalto) return;
  
  const dateKey = currentDate || 'live';
  const hidden = getHiddenTecniciSync();
  const rawMaterials = await fetchRawMasterList(currentAppalto);
  
  let tecnici = [];
  if (dateKey === 'live') {
    tecnici = _lastAllDocs
      .filter(d => !/_\d{4}-\d{2}-\d{2}$/.test(d.id))
      .filter(d => !isHiddenDoc(d, hidden))
      .filter(d => isToday(d.ultimo_aggiornamento))
      .filter(d => {
        const mats = d.materiali;
        if (!mats) return false;
        return Object.values(mats).some(v => v !== '' && v !== '0' && v !== 0);
      });
      
    let staleMap = _staleCacheMap;
    renderTable(currentAppalto, tecnici, content, dateKey, _lastAllDocs, rawMaterials, staleMap);
    _liveCounts[currentAppalto] = tecnici.length;
    const liveCnt = document.getElementById('cnt-' + currentAppalto);
    if (liveCnt) liveCnt.textContent = tecnici.length;
  } else {
    const snapshots = _lastAllDocs.filter(d => d.id.endsWith('_' + dateKey));
    tecnici = snapshots.map(d => ({
      ...d,
      id: d.id.replace('_' + dateKey, ''),
      tecnico: d.tecnico || d.id.replace('_' + dateKey, '')
    })).filter(d => !isHiddenDoc(d, hidden));
    
    renderTable(currentAppalto, tecnici, content, dateKey, _lastAllDocs, rawMaterials, new Map());
    const histCnt = document.getElementById('cnt-' + currentAppalto);
    if (histCnt) histCnt.textContent = tecnici.length;
  }
}

export async function preloadCounts() {
  try {
    const hiddenSnap = await getDoc(doc(db, 'settings', 'hidden_tecnici'));
    _hiddenCache = hiddenSnap.exists() ? (hiddenSnap.data().hidden || []) : [];
  } catch (e) {
    _hiddenCache = [];
  }
  initGlobalHiddenListener();
  for (const appalto of APPALTI) {
    if (!_countListeners[appalto]) {
      _countListeners[appalto] = onSnapshot(collection(db, appalto), async (snap) => {
        const currentHidden = getHiddenTecniciSync();
        const live = snap.docs.filter(d => {
          if (/_\d{4}-\d{2}-\d{2}$/.test(d.id)) return false;
          const data = d.data();
          if (isHiddenDoc({ id: d.id, tecnico: data.tecnico }, currentHidden)) return false;
          if (!isToday(data.ultimo_aggiornamento)) return false;
          const mats = data.materiali;
          if (!mats) return false;
          return Object.values(mats).some(v => v !== '' && v !== '0' && v !== 0);
        });
        _liveCounts[appalto] = live.length;
        if (currentDate === 'live') {
          updateSidebarBadge(appalto, live.length);
        }
      });
    }
  }
}

export async function updateSidebarCountsForDate(dateKey) {
  if (dateKey === 'live') {
    APPALTI.forEach(a => {
      if (_liveCounts[a] !== undefined) updateSidebarBadge(a, _liveCounts[a]);
    });
    return;
  }

  // Fetch storici per la data selezionata (no onSnapshot, solo getDocs)
  const currentHidden = getHiddenTecniciSync();
  for (const appalto of APPALTI) {
    updateSidebarBadge(appalto, '…');
    getDocs(collection(db, appalto)).then(snap => {
      const docs = snap.docs.filter(d => d.id.endsWith('_' + dateKey));
      const count = docs.filter(d => {
        const data = d.data();
        const docId = d.id.replace('_' + dateKey, '');
        if (isHiddenDoc({ id: docId, tecnico: data.tecnico }, currentHidden)) return false;
        const mats = data.materiali;
        if (!mats) return false;
        return Object.values(mats).some(v => v !== '' && v !== '0' && v !== 0);
      }).length;
      if (currentDate === dateKey) { // Update solo se siamo ancora sulla stessa data
        updateSidebarBadge(appalto, count);
      }
    }).catch(() => {
      if (currentDate === dateKey) updateSidebarBadge(appalto, '—');
    });
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
    if (ov) { ov.classList.add('show'); ov.setAttribute('aria-hidden', 'false'); }
    sb.setAttribute('aria-hidden', 'false');
    // Focus the close button for keyboard users
    const closeBtn = sb.querySelector('.menu-close');
    if (closeBtn) requestAnimationFrame(() => closeBtn.focus());
  }
}

export function closeDrawer() {
  const sb = document.querySelector('.sidebar');
  const ov = document.getElementById('sidebar-overlay');
  if (sb) { sb.classList.remove('open'); sb.setAttribute('aria-hidden', 'true'); }
  if (ov) { ov.classList.remove('show'); ov.setAttribute('aria-hidden', 'true'); }
  // Return focus to the menu toggle button
  const menuBtn = document.querySelector('.menu-toggle');
  if (menuBtn) menuBtn.focus();
}

// ── FETCH MASTER LIST ──
const _masterListCache = {};

export async function forceListUpdateFromGithub() {
  // Usa APPALTI dinamici + 'lista' (il file base) — così funziona anche con nuove company aggiunte
  const keys = ['lista', ...APPALTI].map(a => a.toLowerCase());
  for (const k of keys) {
    localStorage.removeItem(`tw_list_${k}`);
    localStorage.removeItem(`tw_list_time_${k}`);
    delete _masterListCache[k];
  }
  // Invalida anche la cache di config.json così le nuove company vengono scaricate subito
  invalidateConfigCache();
  // Scrivi su Firestore per invalidare le cache degli altri manager connessi
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
    let url = `https://raw.githubusercontent.com/gmaclol/Technicalwork-Materiali/master/lists/${appalto}.txt?t=${Date.now()}`;
    let res = await fetch(url);
    
    if (res.status === 404) {
      // 404: L'appalto non ha un file dedicato (es. Sertori). Fallback a lista.txt
      url = `https://raw.githubusercontent.com/gmaclol/Technicalwork-Materiali/master/lists/lista.txt?t=${Date.now()}`;
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

// ── ADD MATERIAL ROW ──
// Caratteri vietati nelle chiavi Firestore (punto consentito tramite FieldPath)
const FIRESTORE_FORBIDDEN = /[\/\[\]~*]/;

function validateMaterialName(name) {
  if (!name || !name.trim()) return 'Il nome del materiale non può essere vuoto.';
  if (FIRESTORE_FORBIDDEN.test(name)) return 'Il nome contiene caratteri non consentiti (/ [ ] ~ *).';
  if (name.length > 120) return 'Il nome è troppo lungo (max 120 caratteri).';
  return null;
}

export async function addMaterialRow() {
  try {
    showToast('Recupero tecnici e materiali...', 'info');

    // 1. Recupera materiali esistenti per la tendina
    const rawMaterials = await fetchRawMasterList(currentAppalto);
    const existingMaterials = new Set();
    _lastAllDocs.forEach(d => {
      if (d.materiali) Object.keys(d.materiali).forEach(m => existingMaterials.add(m));
    });
    rawMaterials.forEach(m => {
      if (!/^::.*::$/.test(m.trim()) && !/^;;.*;;$/.test(m.trim())) {
        existingMaterials.add(m);
      }
    });
    const sortedMaterials = Array.from(existingMaterials).sort((a, b) => a.localeCompare(b));

    // 2. Recupera tecnici globali e locali per individuare tutti quelli noti e chi non è attivo oggi
    const snap = await getDocs(collection(db, currentAppalto));
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const liveDocs = docs.filter(d => !/_\d{4}-\d{2}-\d{2}$/.test(d.id));
    const histDocs = docs.filter(d => /_\d{4}-\d{2}-\d{2}$/.test(d.id));

    // Mappa dei tecnici unici (id -> { id, tecnico, dispositivo, materiali, ordine, isLive })
    const techsMap = new Map();

    // Leggiamo devices_names globale per ricavare i nomi aggiornati ed escludere i client web
    let devicesData = {};
    try {
      const devicesSnap = await getDoc(doc(db, 'settings', 'devices_names'));
      if (devicesSnap.exists()) {
        devicesData = devicesSnap.data();
      }
    } catch (e) {
      console.warn("Impossibile caricare i dispositivi globali in addMaterialRow:", e);
    }

    // Inizializziamo la mappa con TUTTI i tecnici app (non web) registrati nel sistema
    Object.keys(devicesData).forEach(deviceId => {
      const dev = devicesData[deviceId];
      if (!dev || !dev.name || dev.type === 'web') return;

      techsMap.set(deviceId, {
        id: deviceId,
        tecnico: dev.name,
        dispositivo: '—',
        materiali: {},
        ordine: [],
        isLive: false
      });
    });

    // Ordiniamo storici per ID (cronologico per via del suffisso data)
    histDocs.sort((a, b) => a.id.localeCompare(b.id));

    // Sovrascriviamo o integriamo con gli storici dell'appalto
    histDocs.forEach(d => {
      const match = d.id.match(/^(.*)_(\d{4}-\d{2}-\d{2})$/);
      if (match) {
        const deviceId = match[1];
        const existing = techsMap.get(deviceId);
        techsMap.set(deviceId, {
          id: deviceId,
          tecnico: d.tecnico || (existing ? existing.tecnico : deviceId),
          dispositivo: d.dispositivo || (existing ? existing.dispositivo : '—'),
          materiali: d.materiali || {},
          ordine: d.ordine || [],
          isLive: false
        });
      }
    });

    // Sovrascriviamo o integriamo con i live dell'appalto
    liveDocs.forEach(d => {
      const activeToday = isToday(d.ultimo_aggiornamento);
      const existing = techsMap.get(d.id);
      techsMap.set(d.id, {
        id: d.id,
        tecnico: d.tecnico || (existing ? existing.tecnico : d.id),
        dispositivo: d.dispositivo || (existing ? existing.dispositivo : '—'),
        materiali: d.materiali || {},
        ordine: d.ordine || [],
        isLive: activeToday
      });
    });

    // Filtriamo i tecnici nascosti/disattivati
    const hidden = getHiddenTecniciSync();
    const activeTechs = Array.from(techsMap.values()).filter(t => !isHiddenDoc(t, hidden));

    if (activeTechs.length === 0) {
      showToast('Nessun tecnico disponibile.', 'warning');
      return;
    }

    // 3. Generazione opzioni materiali e tecnici
    const materialSelectOptions = [
      { value: '', label: '-- Scrivi custom sopra o scegli esistente --' },
      ...sortedMaterials.map(m => ({ value: m, label: m }))
    ];

    const techSelectOptions = [
      { value: 'all', label: '-- Aggiungi a tutti i tecnici --' },
      ...activeTechs.map(t => ({ value: t.id, label: t.tecnico || t.id }))
    ];

    const techOptionsHtml = `
      <div style="margin-top:10px; text-align:left;">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Seleziona tecnico:</label>
        ${buildCustomSelect('rename-tech-select', 'Seleziona tecnico', techSelectOptions, 'all')}
      </div>
    `;

    const htmlContent = `
      <div style="margin-top:14px; text-align:left; display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Oppure seleziona materiale esistente:</label>
          ${buildCustomSelect('rename-material-select', 'Oppure seleziona materiale esistente', materialSelectOptions, '')}
        </div>
        ${techOptionsHtml}
        <div>
          <label for="rename-qty-input" style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Imposta quantità:</label>
          <input type="text" id="rename-qty-input" class="rename-field" style="width:100%; box-sizing:border-box; margin-top:0;" value="1" placeholder="es: 1 o 1+2sparati">
        </div>
      </div>
    `;

    // 4. Mostra il modale unificato
    const modalResult = await showRenameModal({
      title: 'Aggiungi materiale',
      defaultValue: '',
      icon: '➕',
      okLabel: 'Aggiungi',
      htmlContent: htmlContent
    });

    if (!modalResult) return;

    const inputVal = typeof modalResult === 'object' ? modalResult.value : modalResult;
    const materialSelectVal = typeof modalResult === 'object' ? modalResult.materialSelect : '';
    const selectedTechId = typeof modalResult === 'object' ? modalResult.techSelect : 'all';
    const qtyInputVal = typeof modalResult === 'object' ? modalResult.qtyInput : '1';

    // Determina il materiale finale da utilizzare
    const finalMaterialName = inputVal ? inputVal : materialSelectVal;
    if (!finalMaterialName) {
      showToast('Devi inserire un nome custom o selezionare un materiale esistente.', 'warning');
      return;
    }

    // 5. Validazioni e duplicati per nuovi materiali
    if (!materialSelectVal) {
      const validationError = validateMaterialName(finalMaterialName);
      if (validationError) {
        showToast(validationError, 'warning');
        return;
      }

      const normalizedName = finalMaterialName.toLowerCase();
      const isDuplicate = sortedMaterials.some(m => m.toLowerCase() === normalizedName);
      if (isDuplicate) {
        const goAhead = await showConfirm({
          title: 'Materiale già presente',
          msg: `"${escapeHtml(finalMaterialName)}" esiste già nella lista. Vuoi aggiungerlo comunque?`,
          icon: '⚠️',
          okLabel: 'Aggiungi comunque',
          okAccent: true,
          asHtml: true
        });
        if (!goAhead) return;
      }
    }

    showToast('Aggiunta in corso...', 'info');

    let updatedCount = 0;

    const updateOrCreateTechDoc = async (t) => {
      if (t.isLive) {
        await updateDoc(
          doc(db, currentAppalto, t.id),
          new FieldPath('materiali', finalMaterialName), qtyInputVal,
          'last_updated_at', Date.now(),
          'last_updated_by', 'admin'
        );
      } else {
        const newMateriali = { ...t.materiali, [finalMaterialName]: qtyInputVal };
        const newOrdine = [...t.ordine];
        if (!newOrdine.includes(finalMaterialName)) newOrdine.push(finalMaterialName);

        const timestamp = new Date().toLocaleTimeString('it-IT').slice(0, 5) + ' ' + new Date().toLocaleDateString('it-IT');
        await setDoc(doc(db, currentAppalto, t.id), {
          tecnico: t.tecnico,
          dispositivo: t.dispositivo || '—',
          ultimo_aggiornamento: timestamp,
          last_updated_at: Date.now(),
          last_updated_by: 'admin',
          appalto: currentAppalto,
          materiali: newMateriali,
          ordine: newOrdine
        });
      }
    };

    if (selectedTechId !== 'all') {
      const targetTech = activeTechs.find(t => t.id === selectedTechId);
      if (targetTech) {
        await updateOrCreateTechDoc(targetTech);
        updatedCount = 1;
      }
    } else {
      // Write parallele per tutti i tecnici
      await Promise.all(activeTechs.map(t => updateOrCreateTechDoc(t)));
      updatedCount = activeTechs.length;
    }

    _lastRenderedKey = null;
    showToast(`✅ Aggiornato "${escapeHtml(finalMaterialName)}" per ${updatedCount} tecnico/i.`, 'success', 3500, true);
  } catch (e) {
    showToast('Errore durante l\'aggiunta: ' + e.message, 'error', 5000);
    console.error(e);
  }
}

export async function editMaterialRow(oldName) {
  // 1. Impedisci la modifica di materiali standard presenti nella master list
  const rawMaterials = await fetchRawMasterList(currentAppalto);
  const isStandard = rawMaterials.some(m => {
    const cleanM = m.trim();
    return !/^::.*::$/.test(cleanM) && !/^;;.*;;$/.test(cleanM) && cleanM.toLowerCase() === oldName.toLowerCase();
  });
  if (isStandard) {
    showToast(`Non puoi modificare un materiale standard dell'appalto (${oldName}).`, 'error');
    return;
  }

  const newName = await showRenameModal({
    title: `Modifica nome materiale`,
    defaultValue: oldName,
    icon: '✏️'
  });
  if (!newName || newName === oldName) return;

  // Validazione input
  const validationError = validateMaterialName(newName);
  if (validationError) {
    showToast(validationError, 'warning');
    return;
  }

  try {
    showToast('Recupero tecnici...', 'info');

    const snap = await getDocs(collection(db, currentAppalto));
    const allDocs = snap.docs.filter(d => !/_\d{4}-\d{2}-\d{2}$/.test(d.id));
    const activeTechs = allDocs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(t => t.materiali && (oldName in t.materiali));

    if (activeTechs.length === 0) {
      showToast('Nessun tecnico ha questo materiale compilato al momento.', 'warning');
      return;
    }

    const confirmTechOptions = activeTechs.map(t => ({ value: t.id, label: t.tecnico || t.id }));

    const msgHtml = `
      <p>${escapeHtml(`Vuoi rinominare "${oldName}" in "${newName}" per tutti i tecnici o solo per uno di essi?`)}</p>
      <div style="margin-top:14px; text-align:left;">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">Seleziona tecnico (se vuoi modificare solo uno):</label>
        ${buildCustomSelect('confirm-select-tech', 'Seleziona tecnico', confirmTechOptions, confirmTechOptions[0]?.value || '')}
      </div>
    `;

    let selectedTechId = null;

    const choice = await showConfirm({
      title: 'Modifica materiale',
      msg: msgHtml,
      icon: '✏️',
      okLabel: 'Modifica per tutti',
      okAccent: true,
      extraLabel: 'Solo per selezionato',
      asHtml: true
    });

    const selectEl = document.getElementById('confirm-select-tech');
    if (selectEl) {
      selectedTechId = selectEl.value;
    }

    const msgEl = document.getElementById('confirm-msg');
    if (msgEl) {
      msgEl.innerHTML = '';
    }

    if (!choice) return;

    showToast('Aggiornamento in corso...', 'info');
    
    let updatedCount = 0;
    if (choice === 'extra' && selectedTechId) {
      const targetTech = activeTechs.find(t => t.id === selectedTechId);
      if (targetTech) {
        const val = targetTech.materiali[oldName];
        const newMateriali = { ...targetTech.materiali };
        delete newMateriali[oldName];
        newMateriali[newName] = val;

        await updateDoc(doc(db, currentAppalto, targetTech.id), {
          materiali: newMateriali,
          last_updated_at: Date.now(),
          last_updated_by: 'admin'
        });
        updatedCount = 1;
      }
    } else if (choice === true) {
      // Esecuzione parallela
      await Promise.all(activeTechs.map(t => {
        const val = t.materiali[oldName];
        const newMateriali = { ...t.materiali };
        delete newMateriali[oldName];
        newMateriali[newName] = val;

        return updateDoc(doc(db, currentAppalto, t.id), {
          materiali: newMateriali,
          last_updated_at: Date.now(),
          last_updated_by: 'admin'
        });
      }));
      updatedCount = activeTechs.length;
    }

    // ⚡ Optimistic DOM update: rename the row immediately so the user sees the change
    const row = document.querySelector(`tr[data-material="${CSS.escape(oldName.toLowerCase())}"]`);
    if (row) {
      const matCell = row.querySelector('td.td-material');
      if (matCell) {
        const textNodes = Array.from(matCell.childNodes).filter(n => n.nodeType === 3);
        if (textNodes.length) textNodes[textNodes.length - 1].textContent = newName;
      }
      if (choice === true) {
        row.dataset.material = newName.toLowerCase();
        matCell.querySelectorAll('[data-material]').forEach(el => {
          if (el.dataset.material === oldName) el.dataset.material = newName;
        });
      } else if (choice === 'extra' && selectedTechId) {
        const targetTech = activeTechs.find(t => t.id === selectedTechId);
        if (targetTech) {
          const ths = document.querySelectorAll('thead th');
          const techIdx = Array.from(ths).findIndex(th => {
            const n = th.querySelector('.tech-name');
            return n && n.textContent.trim() === (targetTech.tecnico || targetTech.id);
          });
          if (techIdx > 0) {
            const cell = row.children[techIdx];
            if (cell) { cell.textContent = '·'; cell.className = 'td-value empty'; }
            const newRow = document.querySelector(`tr[data-material="${CSS.escape(newName.toLowerCase())}"]`);
            if (newRow && techIdx < newRow.children.length) {
              const newCell = newRow.children[techIdx];
              const val = targetTech.materiali[oldName];
              if (newCell && val) { newCell.textContent = val; newCell.className = 'td-value has-value'; }
            }
          }
        }
      }
    }
    _lastRenderedKey = null;
    showToast(`✅ Ridenominato con successo per ${updatedCount} tecnico/i.`, 'success');
  } catch (e) {
    showToast('Errore durante la modifica: ' + e.message, 'error', 5000);
    console.error(e);
  }
}

export async function deleteMaterialRow(materialName) {
  // 1. Impedisci l'eliminazione di materiali standard presenti nella master list
  const rawMaterials = await fetchRawMasterList(currentAppalto);
  const isStandard = rawMaterials.some(m => {
    const cleanM = m.trim();
    return !/^::.*::$/.test(cleanM) && !/^;;.*;;$/.test(cleanM) && cleanM.toLowerCase() === materialName.toLowerCase();
  });
  if (isStandard) {
    showToast(`Non puoi eliminare un materiale standard dell'appalto (${materialName}).`, 'error');
    return;
  }

  try {
    showToast('Recupero tecnici...', 'info');
    const snap = await getDocs(collection(db, currentAppalto));
    
    const allDocs = snap.docs.filter(d => !/_\d{4}-\d{2}-\d{2}$/.test(d.id));
    const activeTechs = allDocs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(t => t.materiali && (materialName in t.materiali));

    if (activeTechs.length === 0) {
      showToast('Nessun tecnico ha questo materiale compilato al momento.', 'warning');
      return;
    }

    const confirmTechOptions = activeTechs.map(t => ({ value: t.id, label: t.tecnico || t.id }));

    const msgHtml = `
      <p>${escapeHtml(`Vuoi eliminare definitivamente "${materialName}" da tutti i tecnici o solo da uno di essi?`)}</p>
      <div style="margin-top:14px; text-align:left;">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:6px;">Seleziona tecnico (se vuoi eliminare solo da uno):</label>
        ${buildCustomSelect('confirm-select-tech', 'Seleziona tecnico', confirmTechOptions, confirmTechOptions[0]?.value || '')}
      </div>
    `;

    let selectedTechId = null;

    const choice = await showConfirm({
      title: 'Elimina materiale',
      msg: msgHtml,
      icon: '🗑️',
      okLabel: 'Elimina per tutti',
      okAccent: false,
      extraLabel: 'Solo per selezionato',
      asHtml: true
    });

    const selectEl = document.getElementById('confirm-select-tech');
    if (selectEl) selectedTechId = selectEl.value;

    const msgEl = document.getElementById('confirm-msg');
    if (msgEl) msgEl.innerHTML = '';

    if (!choice) return;

    showToast('Eliminazione in corso...', 'info');

    let updatedCount = 0;
    if (choice === 'extra' && selectedTechId) {
      const targetTech = activeTechs.find(t => t.id === selectedTechId);
      if (targetTech) {
        const newMateriali = { ...targetTech.materiali };
        delete newMateriali[materialName];
        await updateDoc(doc(db, currentAppalto, targetTech.id), {
          materiali: newMateriali,
          last_updated_at: Date.now(),
          last_updated_by: 'admin'
        });
        updatedCount = 1;
      }
    } else if (choice === true) {
      // Esecuzione parallela
      await Promise.all(activeTechs.map(t => {
        const newMateriali = { ...t.materiali };
        delete newMateriali[materialName];
        return updateDoc(doc(db, currentAppalto, t.id), {
          materiali: newMateriali,
          last_updated_at: Date.now(),
          last_updated_by: 'admin'
        });
      }));
      updatedCount = activeTechs.length;
    }

    // ⚡ Optimistic DOM update
    const delRow = document.querySelector(`tr[data-material="${CSS.escape(materialName.toLowerCase())}"]`);
    if (delRow) {
      if (choice === true) {
        delRow.remove();
      } else if (choice === 'extra' && selectedTechId) {
        const targetTech = activeTechs.find(t => t.id === selectedTechId);
        if (targetTech) {
          const ths = document.querySelectorAll('thead th');
          const techIdx = Array.from(ths).findIndex(th => {
            const n = th.querySelector('.tech-name');
            return n && n.textContent.trim() === (targetTech.tecnico || targetTech.id);
          });
          if (techIdx > 0 && techIdx < delRow.children.length) {
            const cell = delRow.children[techIdx];
            if (cell) { cell.textContent = '·'; cell.className = 'td-value empty'; }
          }
        }
      }
    }
    _lastRenderedKey = null;
    showToast(`✅ Rimosso da ${updatedCount} tecnico/i con successo.`, 'success');
  } catch (e) {
    showToast('Errore durante l\'eliminazione: ' + e.message, 'error', 5000);
    console.error(e);
  }
}

// ── INCREMENTAL RENDER STATE (Step 5) ──
let _lastRenderedKey = null;
let _lastRenderedTecNames = [];
let _lastRenderedValues = new Map();

export function resetLastRenderedKey() { _lastRenderedKey = null; }

// ── KPI HELPER (Step 12) ──
function updateKpiCards(tecnici) {
  let totalFree = 0;
  let totalUsed = 0;
  tecnici.forEach(t => {
    if (t.materiali) {
      Object.values(t.materiali).forEach(v => {
        const q = parseQuantity(v);
        totalFree += q.free;
        totalUsed += q.used;
      });
    }
  });

  const formattedTotal = formatQuantityTotal(totalFree, totalUsed) || '0';

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

  if (kpiTotal) kpiTotal.textContent = formattedTotal;
  if (kpiTecnici) kpiTecnici.textContent = tecnici.length;
  if (kpiSync) kpiSync.textContent = relativeTime(latestStr);
}

// ── LOAD DATA ──
let _liveListener = null;

export function stopLiveListener() {
  if (_liveListener) {
    _liveListener();
    _liveListener = null;
  }
}

export async function loadAppalto(appalto, dateKey = 'live') {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="state-box">
      <div class="loader-spinner"></div>
      <p>Recupero dati ${appalto}…</p>
    </div>`;

  stopLiveListener();

  // Reset incremental state on appalto change
  _lastRenderedKey = null;
  _staleCheckedForAppalto = null; // Reset stale cache per nuovo appalto

  try {
    if (dateKey === 'live') {
      _liveListener = onSnapshot(collection(db, appalto), async (snap) => {
        try {
          const allDocs = [];
          snap.forEach(d => allDocs.push({ id: d.id, ...d.data() }));
          _lastAllDocs = allDocs;

          const hidden = getHiddenTecniciSync();
          const tecnici = allDocs
            .filter(d => !/_\d{4}-\d{2}-\d{2}$/.test(d.id))
            .filter(d => !isHiddenDoc(d, hidden))
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
            _lastRenderedKey = null;
            renderTable(appalto, [], content, dateKey, allDocs, rawMaterials, new Map());
            return;
          }

          let staleMap;
          if (_staleCheckedForAppalto !== appalto) {
            staleMap = await checkStaleHashes(appalto, tecnici);
            _staleCheckedForAppalto = appalto;
            _staleCacheMap = staleMap;
          } else {
            staleMap = _staleCacheMap;
          }

          renderTable(appalto, tecnici, content, dateKey, allDocs, rawMaterials, staleMap);
        } catch(err) {
          console.error('Errore in live listener:', err);
        }
      }, e => {
        console.error(e);
        content.innerHTML = `<div class="state-box fade-in"><p>Errore connessione Live.</p></div>`;
      });
    } else {
      const snap = await getDocs(collection(db, appalto));
      const allDocs = [];
      snap.forEach(d => allDocs.push({ id: d.id, ...d.data() }));
      _lastAllDocs = allDocs;

      const snapshots = allDocs.filter(d => d.id.endsWith('_' + dateKey));
      const hidden = getHiddenTecniciSync();
      const tecnici = snapshots.map(d => ({
        ...d,
        id: d.id.replace('_' + dateKey, ''),
        tecnico: d.tecnico || d.id.replace('_' + dateKey, '')
      })).filter(d => {
        if (isHiddenDoc(d, hidden)) return false;
        const mats = d.materiali;
        if (!mats) return false;
        return Object.values(mats).some(v => v !== '' && v !== '0' && v !== 0);
      });

      const rawMaterials = await fetchRawMasterList(appalto);

      if (tecnici.length === 0) {
        renderTable(appalto, [], content, dateKey, allDocs, rawMaterials, new Map());
        return;
      }

      renderTable(appalto, tecnici, content, dateKey, allDocs, rawMaterials, new Map());
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
function renderTable(appalto, tecnici, container, dateKey = 'live', allDocs = [], fallbackMaterials = [], staleMap = new Map()) {
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
              
              const isAdmin = currentUser && currentUser.role === 'admin';
              if (isAdmin && dateKey === 'live') {
                cell.className = `td-value ${cls} editable-cell`;
                cell.dataset.raw = val;
                cell.dataset.techId = t.id;
                cell.dataset.materialName = mat;
                cell.setAttribute('tabindex', '0');
                cell.setAttribute('role', 'button');
                cell.setAttribute('aria-label', `Quantità ${mat} per ${t.tecnico || t.id}: ${val || 'vuoto'}`);
              } else {
                cell.className = `td-value ${cls}`;
                delete cell.dataset.raw;
                delete cell.dataset.techId;
                delete cell.dataset.materialName;
                cell.removeAttribute('tabindex');
                cell.removeAttribute('role');
                cell.removeAttribute('aria-label');
              }
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
        const isAdminUser = currentUser && currentUser.role === 'admin';
        timeEl.textContent = isAdminUser ? relativeTime(time) : dateOnlyRelativeTime(time);
        timeEl.title = time;
      }
      // Update status dot
      const nameEl = container.querySelectorAll('.tech-name')[tIdx];
      if (nameEl) {
        const dot = nameEl.querySelector('.status-circle');
        if (dot) dot.className = techStatus(time);
      }

      // Update battery display if admin
      const isAdminUser = currentUser && currentUser.role === 'admin';
      if (isAdminUser) {
        const headerCell = container.querySelectorAll('thead th')[tIdx + 1];
        if (headerCell) {
          const batteryEl = headerCell.querySelector('.tech-battery');
          if (batteryEl) {
            batteryEl.textContent = t.batteria ? `🔋 ${t.batteria}` : '';
            batteryEl.style.display = t.batteria ? 'inline-block' : 'none';
          }
        }
      }
    });

    // Update subtitle
    const subtitle = container.querySelector('.content-subtitle');
    if (subtitle) {
      const isSnapshot = dateKey !== 'live';
      subtitle.innerHTML = `${tecnici.length} tecnici · ${allMaterials.length} materiali${isSnapshot ? ' · <span style="color:var(--yellow)">snapshot</span>' : ''}`;
    }

    // Update KPI cards
    updateKpiCards(tecnici);

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

  // KPI Cards (Step 12)
  if (tecnici.length > 0) {
    let totalFree = 0;
    let totalUsed = 0;
    tecnici.forEach(t => {
      if (t.materiali) {
        Object.values(t.materiali).forEach(v => { 
          const q = parseQuantity(v); 
          totalFree += q.free;
          totalUsed += q.used;
        });
      }
    });
    const formattedTotal = formatQuantityTotal(totalFree, totalUsed) || '0';

    let latestDate = null, latestStr = '—';
    tecnici.forEach(t => {
      const d = parseTimestamp(t.ultimo_aggiornamento);
      if (d && (!latestDate || d > latestDate)) { latestDate = d; latestStr = t.ultimo_aggiornamento; }
    });

    html += `
    <div class="kpi-grid fade-in">
      <div class="kpi-card">
        <div class="kpi-icon">📦</div>
        <div class="kpi-value" id="kpi-total">${formattedTotal}</div>
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
            <th><div class="th-inner th-material">Materiale${isAdmin && dateKey === 'live' ? ' <button class="btn-mat-action btn-mat-add" onclick="addMaterialRow()" title="Aggiungi riga materiale">+</button>' : ''}</div></th>`;

    tecnici.forEach(t => {
      const name = t.tecnico || t.id;
      const time = t.ultimo_aggiornamento || '—';
      const hasLocation = t.lat && t.lng;
      let statusHtml = `<span class="${techStatus(time)}"></span>`;
      let timeDisplay = isAdmin ? relativeTime(time) : dateOnlyRelativeTime(time);
      let locationHtml = '';

      if (isAdmin) {
        let items = [];
        if (hasLocation) {
          const mapsUrl = `https://www.google.com/maps?q=${t.lat},${t.lng}`;
          items.push(`<a class="tech-location" href="${mapsUrl}" target="_blank" id="loc-${t.id}" onclick="loadGeo(event,'${t.id}',${t.lat},${t.lng})" style="margin-top: 0;">⊙ mostra posizione</a>`);
        }
        // Always render battery container so it can be updated incrementally
        items.push(`<span class="tech-battery" style="font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 6px; padding: 4px 8px; display: ${t.batteria ? 'inline-block' : 'none'}; white-space: nowrap;">${t.batteria ? '🔋 ' + t.batteria : ''}</span>`);
        
        locationHtml = `<div class="tech-admin-row" style="display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 6px; flex-wrap: wrap;">${items.join('')}</div>`;
      }

      // Stale badge
      let staleHtml = '';
      const staleSince = staleMap.get(t.id);
      if (staleSince) {
        const [sy, sm, sd] = staleSince.split('-');
        staleHtml = `<span class="stale-badge" title="Lista materiali invariata dal ${sd}/${sm}/${sy}">⚠ ${sd}/${sm}</span>`;
      }

      html += `
            <th onclick="if(window.innerWidth <= 900) scrollCellIntoViewCenter(this)" style="cursor: pointer;">
              <div class="th-inner th-tech">
                <span class="tech-name">
                  <button type="button" class="tech-nav-left" aria-label="Sposta a sinistra" onclick="event.stopPropagation(); scrollTechHeaderNeighbor(this, -1)">◀</button>
                  ${statusHtml}${escapeHtml(name)}
                </span>
                <span class="tech-time" title="${time}">${timeDisplay}</span>
                ${staleHtml}
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

      // Action buttons for Admin role to visually edit/delete material row directly
      let adminActionsHtml = '';
      if (isAdmin && dateKey === 'live' && isExtra) {
        adminActionsHtml = `
          <span class="material-row-actions">
            <button class="btn-mat-action btn-mat-edit" data-material="${escapeHtml(mat)}" onclick="editMaterialRow(this.dataset.material)" title="Modifica nome materiale">✏️</button>
            <button class="btn-mat-action btn-mat-delete" data-material="${escapeHtml(mat)}" onclick="deleteMaterialRow(this.dataset.material)" title="Elimina intera riga materiale">🗑️</button>
          </span>
        `;
      }

      html += `<tr data-material="${escapeHtml(mat.toLowerCase())}"${rowClass}><td class="td-material"${titleAttr}>${adminActionsHtml}${escapeHtml(mat)}</td>`;
      tecnici.forEach(t => {
        const raw = (t.materiali && t.materiali[mat]) || '';
        const val = (raw === '0' || raw === 0) ? '' : raw;
        const cls = val !== '' ? 'has-value' : 'empty';
        const display = val !== '' ? val : '·';
        
        let editableAttr = '';
        if (isAdmin && dateKey === 'live') {
          editableAttr = ` data-tech-id="${escapeHtml(t.id)}" data-material-name="${escapeHtml(mat)}" data-raw="${escapeHtml(val)}" class="td-value ${cls} editable-cell" title="Tocca per modificare" tabindex="0" role="button" aria-label="Quantità ${escapeHtml(mat)} per ${escapeHtml(t.tecnico || t.id)}: ${escapeHtml(val || 'vuoto')}"`;          
        } else {
          editableAttr = ` class="td-value ${cls}"`;
        }
        
        html += `<td${editableAttr}>${display}</td>`;
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

// ── INLINE QUANTITY EDITING ──
// Shared open function (called by both click/touch and dblclick)
window.editQuantityInline = function(cell) {
  if (cell.classList.contains('editing')) return;
  cell.classList.add('editing');
  
  const techId = cell.dataset.techId;
  const materialName = cell.dataset.materialName;
  const rawVal = cell.dataset.raw || '';
  const capturedAppalto = currentAppalto;
  
  const input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'decimal'; // numeric keyboard hint on mobile
  input.value = rawVal;
  input.className = 'quantity-edit-input';
  
  input.style.width = '100%';
  input.style.boxSizing = 'border-box';
  input.style.textAlign = 'center';
  input.style.background = 'var(--bg-input, rgba(255,255,255,0.05))';
  input.style.color = 'var(--text, #ffffff)';
  input.style.border = '1px solid var(--accent, #3b82f6)';
  input.style.borderRadius = '4px';
  input.style.padding = '4px';
  
  cell.innerHTML = '';
  cell.appendChild(input);
  // Delay focus slightly on touch devices to avoid iOS scroll jumps
  setTimeout(() => { input.focus(); input.select(); }, 50);
  
  let finished = false;
  
  async function finishEdit(save) {
    if (finished) return;
    finished = true;
    
    cell.classList.remove('editing');
    const newVal = input.value.trim();
    
    if (save && newVal !== rawVal) {
      cell.textContent = '...';
      try {
        cell.dataset.raw = newVal;
        const newCls = newVal !== '' ? 'has-value' : 'empty';
        cell.className = `td-value ${newCls} editable-cell`;
        cell.textContent = newVal !== '' ? newVal : '·';
        cell.setAttribute('aria-label', `Quantità ${materialName} per ${techId}: ${newVal || 'vuoto'}`);
        
        await updateDoc(
          doc(db, capturedAppalto, techId),
          new FieldPath('materiali', materialName), newVal,
          'last_updated_at', Date.now(),
          'last_updated_by', currentUser?.name || 'admin'
        );
        showToast('Quantità aggiornata', 'success');
      } catch(e) {
        showToast('Errore durante l\'aggiornamento: ' + e.message, 'error');
        console.error(e);
        cell.dataset.raw = rawVal;
        cell.textContent = rawVal !== '' ? rawVal : '·';
        cell.className = `td-value ${rawVal !== '' ? 'has-value' : 'empty'} editable-cell`;
        cell.setAttribute('aria-label', `Quantità ${materialName} per ${techId}: ${rawVal || 'vuoto'}`);
      }
    } else {
      cell.textContent = rawVal !== '' ? rawVal : '·';
      cell.className = `td-value ${rawVal !== '' ? 'has-value' : 'empty'} editable-cell`;
      cell.setAttribute('aria-label', `Quantità ${materialName} per ${techId}: ${rawVal || 'vuoto'}`);
    }
  }
  
  input.addEventListener('blur', () => {
    // On touch, blur can fire when scrolling. Only save if input had a chance to be interacted with.
    finishEdit(true);
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      finishEdit(false);
    }
  });
};

// ── TOUCH / CLICK HANDLER FOR EDITABLE CELLS ──
// Uses event delegation on document to catch both desktop (dblclick) and mobile (double-tap / long-press)
(function installEditableCellHandler() {
  let _lastTap = { el: null, time: 0 };
  let _longPressTimer = null;
  const DOUBLE_TAP_MS = 350;
  const LONG_PRESS_MS = 600;

  // Desktop: dblclick
  document.addEventListener('dblclick', (e) => {
    const cell = e.target.closest('.editable-cell');
    if (!cell) return;
    e.preventDefault();
    window.editQuantityInline(cell);
  }, { passive: false });

  // Keyboard: Enter / Space to edit when focused
  document.addEventListener('keydown', (e) => {
    const cell = e.target.closest('.editable-cell');
    if (!cell) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (cell.classList.contains('editing')) return;
      e.preventDefault();
      window.editQuantityInline(cell);
    }
  });

  // Mobile: double-tap OR long-press
  document.addEventListener('touchstart', (e) => {
    const cell = e.target.closest('.editable-cell');
    if (!cell) return;
    const now = Date.now();

    // Long press
    _longPressTimer = setTimeout(() => {
      _longPressTimer = null;
      _lastTap = { el: null, time: 0 };
      window.editQuantityInline(cell);
    }, LONG_PRESS_MS);

    // Double-tap detection
    if (_lastTap.el === cell && (now - _lastTap.time) < DOUBLE_TAP_MS) {
      clearTimeout(_longPressTimer);
      _longPressTimer = null;
      _lastTap = { el: null, time: 0 };
      e.preventDefault(); // prevent zoom
      window.editQuantityInline(cell);
    } else {
      _lastTap = { el: cell, time: now };
    }
  }, { passive: false });

  document.addEventListener('touchend', () => {
    if (_longPressTimer) { clearTimeout(_longPressTimer); _longPressTimer = null; }
  }, { passive: true });

  document.addEventListener('touchmove', () => {
    if (_longPressTimer) { clearTimeout(_longPressTimer); _longPressTimer = null; }
    _lastTap = { el: null, time: 0 };
  }, { passive: true });
}());
