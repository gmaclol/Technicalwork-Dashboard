// ── Ricerca PFS — Sidebar Section ──
// One-to-one replica of PfsActivity + PfsAdapter.kt for web
// User identified by login credential (currentUser.name → WEB-Username)

import { db, doc, getDoc, setDoc, updateDoc, deleteField, onSnapshot } from './firebase.js';
import { currentUser } from './state.js';
import { escapeHtml, showToast } from './utils.js';

// ─── Constants ───────────────────────────────────────────────────────────────
const GITHUB_BASE   = 'https://raw.githubusercontent.com/gmaclol/Technicalwork-Materiali/master/lists/Regioni/';
// Names must match filenames exactly (space → %20 in URL)
const ITALIAN_REGIONS = [
  'Piemonte', 'Valle d\'Aosta', 'Lombardia', 'Trentino-Alto Adige',
  'Veneto', 'Friuli-Venezia Giulia', 'Liguria', 'Emilia-Romagna',
  'Toscana', 'Umbria', 'Marche', 'Lazio', 'Abruzzo', 'Molise',
  'Campania', 'Puglia', 'Basilicata', 'Calabria', 'Sicilia', 'Sardegna'
];
const DEFAULT_FAVORITES = ['Asti', 'Biella', 'TOH_1'];
const FAV_KEY          = 'tw_pfs_lookup_favs';
const CACHE_PREFIX     = 'tw_pfs_area_';
const CACHE_TIME_PFX   = 'tw_pfs_area_time_';
const SHORT_ID_KEY     = 'tw_web_short_id';
const CACHE_TTL        = 86400000; // 24h
const AVAIL_REGIONS_KEY = 'tw_pfs_avail_regions';
const AVAIL_REGIONS_TTL = 3600000; // 1h

// Bracket regex — mirrors PfsAdapter: val bracketRegex = Regex("\\[(.*?)\\]")
const BRACKET_RE = /\[(.*?)\]/;

// ─── State ────────────────────────────────────────────────────────────────────
let _currentArea     = null;
let _allPfsParsed    = [];
let _pfsLookupActive = false;
let _allAreas        = []; // sidebar favorites list
let _expandedSet     = new Set();
let _availableRegions = null; // discovered from GitHub (null = not yet probed)
let _favsListener    = null; // Firestore listener for sync

// ─── Web User Identity ────────────────────────────────────────────────────────
function getShortId() {
  let id = localStorage.getItem(SHORT_ID_KEY);
  if (!id) { id = Math.random().toString(36).slice(2, 8); localStorage.setItem(SHORT_ID_KEY, id); }
  return id;
}

export function getWebDeviceId() {
  // Unique per browser+user: WEB-Piero-abc123 (multiple Piero accounts tracked separately)
  return currentUser ? `WEB-${currentUser.name}-${getShortId()}` : null;
}

function getOsInfo() {
  const ua = navigator.userAgent;
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows NT 6/.test(ua))  return 'Windows 7/8';
  if (/Mac OS X/.test(ua)) {
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    return 'macOS';
  }
  if (/Android/.test(ua))       return 'Android';
  if (/Linux/.test(ua))         return 'Linux';
  return 'Sconosciuto';
}
function getBrowserInfo() {
  const match = navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)[\/\s](\d+)/i);
  return match ? `${match[1]} ${match[2]}` : 'Browser';
}

export function getWebDeviceInfo() {
  return {
    deviceId: getWebDeviceId(),
    name:     currentUser?.name || '—',
    type:     'web',
    os:       getOsInfo(),
    browser:  getBrowserInfo(),
    cores:    navigator.hardwareConcurrency ?? null,
    memory:   navigator.deviceMemory ?? null,
  };
}

// ─── Firestore: register/update web user ─────────────────────────────────────
async function registerWebUser() {
  const id = getWebDeviceId();
  if (!id) return;
  const info = getWebDeviceInfo();
  try {
    const docRef = doc(db, 'settings', 'devices_names');
    const snap = await getDoc(docRef);
    const data = snap.exists() ? snap.data() : {};
    
    // Se l'utente è già registrato correttamente, evitiamo scritture inutili per salvare quota
    if (data[id] && data[id].type === 'web' && data[id].pfsAreas) {
      return;
    }
    
    const payload = {
      baseName:  info.name,
      type:      'web',
      os:        info.os,
      browser:   info.browser,
      cores:     info.cores,
      memory:    info.memory,
      updatedAt: Date.now()
    };
    
    // Inizializza i preferiti sul DB se questo dispositivo non ne ha ancora
    if (!data[id] || !data[id].pfsAreas) {
      payload.pfsAreas = getFavorites();
    }

    await setDoc(docRef, { [id]: payload }, { merge: true });
  } catch(e) {
    console.warn('PfsLookup: errore registrazione web user', e);
  }
}

// ─── Favorites ────────────────────────────────────────────────────────────────
function getFavorites() {
  try { 
    const stored = localStorage.getItem(FAV_KEY);
    if (stored === null) {
      // Se è la prima volta, salva i default e ritornali
      setFavorites(DEFAULT_FAVORITES);
      return [...DEFAULT_FAVORITES];
    }
    return JSON.parse(stored) || [];
  }
  catch { return [...DEFAULT_FAVORITES]; }
}
function setFavorites(favs) { 
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  // Notifica il cambio a chiunque stia ascoltando (es. sidebar)
  const event = new CustomEvent('pfs-favs-updated', { detail: favs });
  window.dispatchEvent(event);
}

function toggleFavorite(area) {
  const favs = getFavorites();
  const idx  = favs.indexOf(area);
  if (idx >= 0) favs.splice(idx, 1); else favs.push(area);
  setFavorites(favs);
  
  // Ricalcola _allAreas: ora basato solo ed esclusivamente sui favoriti attuali
  _allAreas = [...favs];

  const id = getWebDeviceId();
  if (id) {
    updateDoc(doc(db, 'settings', 'devices_names'), {
      [`${id}.pfsAreas`]: favs, [`${id}.updatedAt`]: Date.now(),
    }).catch(e => console.warn('Errore salvataggio preferiti Firestore:', e));
  }
  return favs.includes(area);
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
async function fetchPfsArea(area) {
  const cacheKey = CACHE_PREFIX + area;
  const timeKey  = CACHE_TIME_PFX + area;
  
  // 1. Check Cache JSON caricati
  for (const region of ITALIAN_REGIONS) {
    const data = _regionJsonCache[region];
    if (data) {
      const list = data.Comuni?.[area] || data.Macrozone?.[area];
      if (list) {
        const text = list.filter(l => !l.startsWith('<')).join('\n');
        _cacheArea(cacheKey, timeKey, text);
        return text;
      }
    }
  }

  // 2. Fetch from Regions JSON (Priorità Piemonte)
  const prioritized = ['Piemonte', ...ITALIAN_REGIONS.filter(r => r !== 'Piemonte')];
  for (const region of prioritized) {
    if (!_regionJsonCache[region]) {
      try {
        const encodedRegion = region.replace(/ /g, '%20');
        const res = await fetch(`${GITHUB_BASE}${encodedRegion}.json`);
        if (res.ok) {
          const json = await res.json();
          const rootKey = Object.keys(json).find(k => k.toLowerCase() === region.toLowerCase()) || region;
          _regionJsonCache[region] = json[rootKey] || null;
        }
      } catch { continue; }
    }
    const regionData = _regionJsonCache[region];
    if (regionData) {
      const list = regionData.Comuni?.[area] || regionData.Macrozone?.[area];
      if (list) {
        const text = list.filter(l => !l.startsWith('<')).join('\n');
        _cacheArea(cacheKey, timeKey, text);
        return text;
      }
    }
  }

  // 3. Fallback .txt (per aree non presenti nei JSON regionali)
  try {
    const fallbackBase = GITHUB_BASE.replace('Regioni/', '');
    const res = await fetch(`${fallbackBase}${area}.txt`);
    if (res.ok) {
      const t = await res.text();
      if (t && !t.includes('<!DOCTYPE')) {
        _cacheArea(cacheKey, timeKey, t);
        return t;
      }
    }
  } catch {}

  return localStorage.getItem(cacheKey) || '';
}
function _cacheArea(k, tk, t) { localStorage.setItem(k, t); localStorage.setItem(tk, Date.now().toString()); }

// ─── Parse ────────────────────────────────────────────────────────────────────
// Mirrors PfsActivity.parsePfsList() and PfsItem data class
function parsePfsList(text) {
  // First item is always the "report missing" special entry
  const list = [{ name: 'Segnala il PFS mancante!!', rawAddress: '', isMissing: true }];
  if (!text) return list;

  const parsed = text.split('\n').map(l => l.trim()).filter(Boolean).flatMap(line => {
    if (line.toLowerCase().includes('segnala il pfs mancante')) return [];
    // :::: separator (confirmed address)
    if (line.includes('::::')) {
      const sep  = line.indexOf('::::');
      const name = line.slice(0, sep).trim();
      const addr = line.slice(sep + 4).trim();
      return [{ name, rawAddress: addr, isMissing: false, _searchStr: (name + ' ' + getDisplayAddress(addr)).toLowerCase() }];
    }
    // :: separator
    if (line.includes('::')) {
      const sep  = line.indexOf('::');
      const name = line.slice(0, sep).trim();
      const addr = line.slice(sep + 2).trim();
      return [{ name, rawAddress: addr, isMissing: false, _searchStr: (name + ' ' + getDisplayAddress(addr)).toLowerCase() }];
    }
    return [];
  });

  list.push(...parsed);
  return list;
}

// ─── Address helpers (mirror PfsAdapter bracket logic) ───────────────────────
function getDisplayAddress(rawAddress) {
  if (!rawAddress) return '';
  // Remove [lat, lng] content from display — mirrors: displayAddress = item.address.replace(bracketRegex, "").trim()
  return rawAddress.replace(BRACKET_RE, '').trim();
}

function getMapsUrl(rawAddress) {
  if (!rawAddress) return '';
  // Mirror: mapsQuery = match?.groupValues[1].trim() ?: displayAddress
  const match = rawAddress.match(BRACKET_RE);
  const query = match ? match[1].trim() : getDisplayAddress(rawAddress);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// ─── Submit missing address to Firestore (mirrors PfsActivity.onSubmitAddress) ─
async function submitMissingAddress(area, pfsName, newAddress, btnEl) {
  if (!newAddress.trim()) return;
  const now = new Date();
  const orario = now.toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  try {
    btnEl.disabled = true;
    btnEl.textContent = '⏳';
    await setDoc(
      doc(db, 'pfs_segnalati', `${Date.now()}`),
      {
        nome_pfs:          pfsName,
        nuovo_indirizzo:   newAddress.trim(),
        comune:            area,
        tecnico:           (currentUser?.name || '—') + ' (WEB)',
        orario:            orario,
        timestamp_raw:     Date.now(),
      }
    );
    showToast('✅ Segnalazione inviata!', 'success', 3000);
    // Clear input
    const wrap = btnEl.closest('.pfs-missing-wrap');
    if (wrap) { const inp = wrap.querySelector('.pfs-missing-input'); if (inp) inp.value = ''; }
  } catch(e) {
    showToast('Errore invio segnalazione', 'error');
    console.error(e);
  } finally {
    btnEl.disabled = false;
    btnEl.textContent = '📤 Invia';
  }
}

// ─── Toggle expand (accordion — mirrors RecyclerView item click) ──────────────
export function pfsItemToggle(idx) {
  const card = document.querySelector(`.pfs-lookup-card[data-idx="${idx}"]`);
  if (!card) return;
  const isExpanded = _expandedSet.has(idx);
  if (isExpanded) {
    _expandedSet.delete(idx);
    card.classList.remove('pfs-expanded');
  } else {
    _expandedSet.add(idx);
    card.classList.add('pfs-expanded');
  }
}

// ─── Sidebar Renderer ─────────────────────────────────────────────────────────
export function initPfsLookupSidebar(areas, filterQuery = '') {
  const container = document.getElementById('pfs-lookup-areas');
  if (!container) return;
  _allAreas = areas;
  const favs   = getFavorites();
  const q      = filterQuery.toLowerCase().trim();
  const filtered = q ? areas.filter(a => a.toLowerCase().includes(q)) : areas;
  const sorted   = [...filtered].sort((a, b) => {
    const fa = favs.includes(a), fb = favs.includes(b);
    if (fa !== fb) return fa ? -1 : 1;
    return a.localeCompare(b);
  });

  if (sorted.length === 0) {
    container.innerHTML = `<div class="pfs-lookup-no-results">Nessuna area trovata</div>`;
    return;
  }

  container.innerHTML = sorted.map(area => {
    const isFav    = favs.includes(area);
    const isActive = _currentArea === area;
    return `
      <div class="pfs-lookup-row" data-area="${area}">
        <button class="pfs-lookup-area-btn${isActive ? ' active' : ''}"
          onclick="pfsLookupSelectArea('${area.replace(/'/g, "\\'")}')"
          title="Carica PFS ${area}">
          <span class="pfs-lookup-dot${isFav ? ' fav' : ''}"></span>
          <span class="pfs-lookup-area-name">${area}</span>
        </button>
        <button class="pfs-lookup-star${isFav ? ' active' : ''}"
          onclick="pfsLookupToggleStar('${area.replace(/'/g, "\\'")}', this)"
          title="${isFav ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}">
          ${isFav ? '★' : '☆'}
        </button>
      </div>`;
  }).join('');
}

// ─── Main Content Renderer ────────────────────────────────────────────────────
export async function showPfsLookupContent(area) {
  _currentArea     = area;
  _pfsLookupActive = true;
  _expandedSet     = new Set();

  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.pfs-lookup-area-btn').forEach(b => {
    b.classList.toggle('active', b.closest('[data-area]')?.dataset.area === area);
  });

  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="state-box">
      <div class="loader-spinner"></div>
      <p>Caricamento PFS ${area}…</p>
    </div>`;

  const rawText = await fetchPfsArea(area);
  if (!_pfsLookupActive) return;

  _allPfsParsed = parsePfsList(rawText);

  if (!rawText) {
    content.innerHTML = `
      <div class="state-box fade-in">
        <h2 style="color:var(--red)">Area non trovata</h2>
        <p>Nessuna lista PFS disponibile per "${area}".</p>
      </div>`;
    return;
  }

  renderPfsLookupContent(area);
}



// ─── Build items HTML (extracted for partial updates) ──────────────────────
function buildPfsItemsHtml(list, area) {
  return list.map((p) => {
    const i = _allPfsParsed.indexOf(p);
    const isExpanded = _expandedSet.has(i);
    if (p.isMissing) {
      return `<div class="pfs-lookup-card pfs-lookup-missing${isExpanded?' pfs-expanded':''}" data-idx="${i}"
        onclick="pfsItemToggle(${i})" role="button" tabindex="0"
        onkeydown="if(event.key==='Enter')pfsItemToggle(${i})" style="animation-delay:0s">
        <div class="pfs-card-header">
          <span class="pfs-card-name pfs-card-name-missing">⚠ ${escapeHtml(p.name)}</span>
          <span class="pfs-card-chevron">${isExpanded?'▲':'▼'}</span>
        </div>
        <div class="pfs-card-expand" onclick="event.stopPropagation()">
          <div class="pfs-missing-wrap">
            <input class="pfs-missing-input" type="text"
              placeholder="Inserisci il nuovo indirizzo…"
              onclick="event.stopPropagation()"
              onkeydown="if(event.key==='Enter'){pfsSubmitAddress(${i},'${area.replace(/'/g,"\\'")}')}">
            <button class="pfs-missing-btn" onclick="pfsSubmitAddress(${i},'${area.replace(/'/g,"\\'")}')">📤 Invia</button>
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:8px;line-height:1.5">
            Segnala un PFS mancante o con indirizzo errato. La segnalazione verrà revisionata.
          </div>
        </div>
      </div>`;
    }
    const displayAddr = getDisplayAddress(p.rawAddress);
    const mapsUrl     = p.rawAddress ? getMapsUrl(p.rawAddress) : null;
    const addrLine    = displayAddr
      ? `<div class="pfs-card-addr">${escapeHtml(displayAddr)}</div>`
      : `<div class="pfs-card-addr" style="color:var(--text-muted);font-style:italic">Indirizzo non disponibile</div>`;
    const mapBtn = mapsUrl ? `
      <div class="pfs-card-btn-row">
        <a class="pfs-map-btn" href="${mapsUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()">
          🗺 Mappa: ${escapeHtml(displayAddr||p.name||'')}
        </a>
        <button class="pfs-copy-btn" onclick="event.stopPropagation();pfsCopyAddress('${mapsUrl.replace(/'/g,'&#39;')}')">📋 Copia</button>
      </div>` : '';
    return `<div class="pfs-lookup-card${isExpanded?' pfs-expanded':''}" data-idx="${i}"
      onclick="pfsItemToggle(${i})" role="button" tabindex="0"
      onkeydown="if(event.key==='Enter')pfsItemToggle(${i})"
      style="animation-delay:${Math.min(i,15)*0.025}s">
      <div class="pfs-card-header">
        <span class="pfs-card-name">${escapeHtml(p.name)}</span>
        <span class="pfs-card-chevron">${isExpanded?'▲':'▼'}</span>
      </div>
      <div class="pfs-card-expand" onclick="event.stopPropagation()">
        ${addrLine}${mapBtn}
      </div>
    </div>`;
  }).join('');
}

const MAX_VISIBLE_ITEMS = 100;
let _currentFilteredList = [];
let _visibleCount = 0;

window.pfsLoadMore = function() {
  _visibleCount += MAX_VISIBLE_ITEMS;
  const list = _currentFilteredList.slice(0, _visibleCount);
  const existingList = document.getElementById('pfs-lookup-list');
  if (existingList) {
    const remaining = _currentFilteredList.length - _visibleCount;
    const loadMoreHtml = remaining > 0 
      ? `<div id="pfs-load-more" class="pfs-load-more" onclick="pfsLoadMore()" style="text-align:center; padding:15px; margin-top:10px; background:var(--surface-light); border-radius:12px; cursor:pointer; color:var(--accent-blue); font-weight:600; font-size:14px; transition:0.2s">Mostra altri (${remaining} rimanenti) ▼</div>` 
      : '';
    existingList.innerHTML = buildPfsItemsHtml(list, _currentArea) + loadMoreHtml;
  }
};

function renderPfsLookupContent(area, searchQuery = '') {
  const content = document.getElementById('content');
  if (!content) return;
  const q    = searchQuery.toLowerCase().trim();
  
  _currentFilteredList = q
    ? _allPfsParsed.filter(p => p.isMissing || (p._searchStr && p._searchStr.includes(q)))
    : _allPfsParsed;
    
  _visibleCount = MAX_VISIBLE_ITEMS;
  const list = _currentFilteredList.slice(0, _visibleCount);
  
  const totalCount = _allPfsParsed.length - 1;

  if (q) {
    // Auto-expand all filtered items on search
    list.forEach(p => {
      const i = _allPfsParsed.indexOf(p);
      if (i >= 0) _expandedSet.add(i);
    });
  }

  const remaining = _currentFilteredList.length - _visibleCount;
  const loadMoreHtml = remaining > 0 
    ? `<div id="pfs-load-more" class="pfs-load-more" onclick="pfsLoadMore()" style="text-align:center; padding:15px; margin-top:10px; background:var(--surface-light); border-radius:12px; cursor:pointer; color:var(--accent-blue); font-weight:600; font-size:14px; transition:0.2s">Mostra altri (${remaining} rimanenti) ▼</div>` 
    : '';

  // ── Partial update: only replace the list, keep the input intact ──
  const existingList = document.getElementById('pfs-lookup-list');
  if (existingList) {
    existingList.innerHTML = (buildPfsItemsHtml(list, area) + loadMoreHtml) ||
      `<div class="pfs-lookup-empty">Nessun PFS trovato per "${q}"</div>`;
    const sub = document.getElementById('pfs-lookup-subtitle');
    const filteredCount = _currentFilteredList.filter(p => !p.isMissing).length;
    if (sub) sub.textContent = `${totalCount} punti${q?' · '+filteredCount+' filtrati':''}  •  ${q ? 'Risultati espansi' : 'Tocca per espandere'}`;
    return;
  }

  // ── First render: build full structure ──
  content.innerHTML = `
    <div class="content-header fade-in" style="background:rgba(0,0,0,0.2);">
      <div>
        <div class="content-title" style="display:flex;align-items:center;gap:12px;">
          <span class="pfs-section-chip">RICERCA PFS</span>${area}
        </div>
        <div class="content-subtitle" id="pfs-lookup-subtitle">
          ${totalCount} punti &bull; Tocca per espandere
        </div>
      </div>
    </div>
    <div class="pfs-scroll-wrap">
      <div class="search-wrap" style="margin-top:20px;margin-bottom:8px;">
        <input id="pfs-lookup-search" type="search" class="search-input"
          placeholder="Cerca PFS, indirizzo…"
          oninput="pfsLookupSearch(this.value)"
          aria-label="Cerca PFS" style="max-width:480px;">
      </div>
      <div id="pfs-lookup-list" class="pfs-lookup-list">
        ${(buildPfsItemsHtml(list, area) + loadMoreHtml) || `<div class="pfs-lookup-empty">Nessun PFS trovato</div>`}
      </div>
    </div>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────
let _searchTimeout = null;
export function pfsLookupSearch(query) {
  if (!_currentArea) return;
  clearTimeout(_searchTimeout);
  _searchTimeout = setTimeout(() => {
    renderPfsLookupContent(_currentArea, query);
  }, 150);
}

export function pfsLookupSelectArea(area) {
  window.location.hash = `#/pfs-lookup/${encodeURIComponent(area)}`;
}

export function pfsLookupToggleStar(area, btnEl) {
  const isNowFav = toggleFavorite(area);
  btnEl.textContent = isNowFav ? '★' : '☆';
  btnEl.classList.toggle('active', isNowFav);
  const dot = btnEl.closest('[data-area]')?.querySelector('.pfs-lookup-dot');
  if (dot) dot.classList.toggle('fav', isNowFav);
  showToast(isNowFav ? `★ "${area}" aggiunto ai preferiti` : `"${area}" rimosso`, 'info', 1500);
  // Aggiorna la sidebar usando _allAreas ricalcolato in toggleFavorite
  initPfsLookupSidebar(_allAreas);
}

export function pfsSubmitAddress(idx, area) {
  const card  = document.querySelector(`.pfs-lookup-card[data-idx="${idx}"]`);
  if (!card) return;
  const inp   = card.querySelector('.pfs-missing-input');
  const btn   = card.querySelector('.pfs-missing-btn');
  const item  = _allPfsParsed[idx];
  if (!inp || !btn || !item) return;
  submitMissingAddress(area, item.name, inp.value, btn);
}

export async function pfsCopyAddress(mapsUrl) {
  try {
    await navigator.clipboard.writeText(mapsUrl);
    showToast('📋 Link Maps copiato!', 'success', 2000);
  } catch {
    // Fallback for browsers without clipboard API
    const el = document.createElement('textarea');
    el.value = mapsUrl; el.style.position = 'fixed'; el.style.opacity = '0';
    document.body.appendChild(el); el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('📋 Link copiato!', 'success', 2000);
  }
}

export function stopPfsLookupListener() {
  _pfsLookupActive = false;
  // Non killiamo _favsListener qui, altrimenti la sidebar globale non si sincronizza
  // mentre navighiamo in altri tab come 'Aree Preferite'.
}

// ─── Regions Browser ─────────────────────────────────────────────────────────
const REGION_LABELS = {
  'Piemonte': 'Piemonte', 'Valle d\'Aosta': 'Valle d\'Aosta',
  'Lombardia': 'Lombardia', 'Trentino-Alto Adige': 'Trentino A.A.',
  'Veneto': 'Veneto', 'Friuli-Venezia Giulia': 'Friuli V.G.',
  'Liguria': 'Liguria', 'Emilia-Romagna': 'Emilia-Romagna',
  'Toscana': 'Toscana', 'Umbria': 'Umbria', 'Marche': 'Marche',
  'Lazio': 'Lazio', 'Abruzzo': 'Abruzzo', 'Molise': 'Molise',
  'Campania': 'Campania', 'Puglia': 'Puglia', 'Basilicata': 'Basilicata',
  'Calabria': 'Calabria', 'Sicilia': 'Sicilia', 'Sardegna': 'Sardegna'
};

let _activeRegions  = new Set();  // which region chips are toggled ON
let _regionJsonCache = {};         // key → parsed JSON for region
let _regionLoading   = new Set();  // regions currently being fetched
let _regionBrowserSearch = '';

// Probe GitHub to find which region JSONs actually exist (cached 1h in localStorage)
async function discoverAvailableRegions() {
  try {
    const cached = localStorage.getItem(AVAIL_REGIONS_KEY);
    const cachedAt = parseInt(localStorage.getItem(AVAIL_REGIONS_KEY + '_time') || '0');
    if (cached && Date.now() - cachedAt < AVAIL_REGIONS_TTL) {
      return JSON.parse(cached);
    }
  } catch {}

  const available = [];
  await Promise.all(ITALIAN_REGIONS.map(async region => {
    try {
      const encoded = region.replace(/ /g, '%20');
      const res = await fetch(`${GITHUB_BASE}${encoded}.json`, { method: 'HEAD' });
      if (res.ok) available.push(region);
    } catch {}
  }));

  // Maintain order
  const ordered = ITALIAN_REGIONS.filter(r => available.includes(r));
  try {
    localStorage.setItem(AVAIL_REGIONS_KEY, JSON.stringify(ordered));
    localStorage.setItem(AVAIL_REGIONS_KEY + '_time', Date.now().toString());
  } catch {}
  return ordered;
}

async function fetchRegionJson(region) {
  if (_regionJsonCache[region]) return _regionJsonCache[region];
  const encodedRegion = region.replace(/ /g, '%20');
  const res = await fetch(`${GITHUB_BASE}${encodedRegion}.json`);
  if (!res.ok) return null;
  const json = await res.json();
  const rootKey = Object.keys(json).find(k => k.toLowerCase() === region.toLowerCase()) || region;
  _regionJsonCache[region] = json[rootKey] || null;
  return _regionJsonCache[region];
}

function getRegionAreas(regionData) {
  const areas = [];
  if (regionData?.Comuni)   areas.push(...Object.keys(regionData.Comuni));
  if (regionData?.Macrozone) areas.push(...Object.keys(regionData.Macrozone));
  return areas;
}

export async function showPfsRegionBrowser() {
  _pfsLookupActive = false;
  _currentArea = null;
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.pfs-lookup-area-btn').forEach(b => b.classList.remove('active'));
  const content = document.getElementById('content');
  if (_activeRegions.size === 0) _activeRegions.add('Piemonte');
  if (!_availableRegions) {
    _renderRegionBrowser(content);
    _availableRegions = await discoverAvailableRegions();
    if (_activeRegions.has('Piemonte') && !_regionJsonCache['Piemonte']) {
      await fetchRegionJson('Piemonte').catch(() => {});
    }
  }
  _renderRegionBrowser(content);
}

function _renderRegionBrowser(content) {
  const q = _regionBrowserSearch.toLowerCase().trim();
  const regionsToShow = _availableRegions || ITALIAN_REGIONS;
  const favs = getFavorites();

  // Build chips HTML (always refreshed)
  const chipsHtml = regionsToShow.map(r => {
    const on = _activeRegions.has(r), loading = _regionLoading.has(r);
    return `<button class="region-chip${on?' active':''}" onclick="pfsToggleRegion('${r.replace(/'/g, "\\'")}')" ${loading?'disabled':''}>
      ${loading?'<span class="region-chip-spinner"></span>':''}${REGION_LABELS[r]||r}</button>`;
  }).join('');

  // Build areas HTML — cross-PFS search included
  let areasHtml = '', totalCount = 0;
  for (const r of _activeRegions) {
    const data = _regionJsonCache[r];
    if (!data) continue;
    const allAreas = getRegionAreas(data);
    const filtered = q ? allAreas.filter(area => {
      if (area.toLowerCase().includes(q)) return true;
      const items = data.Comuni?.[area] || data.Macrozone?.[area] || [];
      return items.some(line => line.toLowerCase().includes(q));
    }) : allAreas;
    if (!filtered.length) continue;
    totalCount += filtered.length;
    const areaItems = filtered.map(area => {
      const isFav = favs.includes(area);
      
      // If searching, show matching PFS items directly (expanded)
      if (q) {
        const rawItems = data.Comuni?.[area] || data.Macrozone?.[area] || [];
        const areaMatches = area.toLowerCase().includes(q);
        // If area name matches, show all items. Otherwise, only matching items.
        const matchingLines = areaMatches ? rawItems : rawItems.filter(l => l.toLowerCase().includes(q));
        
        if (matchingLines.length > 0) {
          let parsed = parsePfsList(matchingLines.join('\n')).filter(p => !p.isMissing);
          if (q && parsed.length > 30) parsed = parsed.slice(0, 30); // Limit rendered cards to 30 per area
          const cardsHtml = parsed.map((p, idx) => {
            const displayAddr = getDisplayAddress(p.rawAddress);
            const mapsUrl = p.rawAddress ? getMapsUrl(p.rawAddress) : null;
            const delay = Math.min(idx, 10) * 0.03;
            return `
              <div class="pfs-lookup-card pfs-expanded fade-in" style="margin: 4px 0 4px 24px; border-left: 2px solid var(--accent-glow); animation-delay: ${delay}s">
                <div class="pfs-card-header" style="padding: 8px 12px; cursor: default;">
                  <span class="pfs-card-name" style="font-size: 13px;">${escapeHtml(p.name)}</span>
                </div>
                <div class="pfs-card-expand" style="padding: 0 12px 10px; display: block; opacity: 1; max-height: none;">
                  <div class="pfs-card-addr" style="font-size: 12px; margin-bottom: 6px;">${escapeHtml(displayAddr || 'Indirizzo non disponibile')}</div>
                  ${mapsUrl ? `
                    <div class="pfs-card-btn-row" style="margin-top: 4px; gap: 8px;">
                      <a class="pfs-map-btn" href="${mapsUrl}" target="_blank" rel="noopener" style="font-size: 11px; padding: 4px 10px;">🗺 Mappa</a>
                      <button class="pfs-copy-btn" onclick="pfsCopyAddress('${mapsUrl.replace(/'/g,"&#39;")}')" style="font-size: 11px; padding: 4px 10px;">📋 Copia</button>
                    </div>` : ''}
                </div>
              </div>`;
          }).join('');

          return `
            <div class="region-search-result-group" style="margin-bottom: 20px;">
              <div class="region-area-row" style="border-bottom: 1px dashed var(--border); margin-bottom: 8px; background: rgba(255,255,255,0.02);">
                <button class="region-area-btn" onclick="pfsLookupSelectArea('${area.replace(/'/g,"\\'")}')">
                  <span class="pfs-lookup-dot${isFav?' fav':''}"></span>
                  <span style="font-weight: 700; color: var(--accent);">${area}</span>
                </button>
                <button class="pfs-lookup-star${isFav?' active':''}" onclick="pfsRegionToggleStar('${area.replace(/'/g,"\\'")}', this)">${isFav?'★':'☆'}</button>
              </div>
              ${cardsHtml}
            </div>`;
        }
      }

      return `<div class="region-area-row">
        <button class="region-area-btn" onclick="pfsLookupSelectArea('${area.replace(/'/g,"\\'")}')">
          <span class="pfs-lookup-dot${isFav?' fav':''}"></span>
          <span>${area}</span>
        </button>
        <button class="pfs-lookup-star${isFav?' active':''}" onclick="pfsRegionToggleStar('${area.replace(/'/g,"\\'")}', this)">${isFav?'★':'☆'}</button>
      </div>`;
    }).join('');
    areasHtml += `<div class="region-section">
      <div class="region-section-header">
        <span class="region-section-title">${REGION_LABELS[r]||r}</span>
        <span class="region-section-count">${filtered.length} aree</span>
      </div>
      <div class="region-section-body">${areaItems}</div>
    </div>`;
  }
  const emptyContent = _activeRegions.size === 0
    ? `<div class="state-box" style="margin-top:40px"><div style="font-size:48px">🗺️</div><p style="margin-top:12px;color:var(--text-muted)">Seleziona una o più regioni per vedere i comuni PFS</p></div>`
    : (areasHtml || `<div class="pfs-lookup-empty">Nessun risultato per "${q}"</div>`);
  const subtitleText = _activeRegions.size > 0
    ? `${_activeRegions.size} region${_activeRegions.size>1?'i attive':'e attiva'} · ${totalCount} aree`
    : 'Seleziona le regioni da sfogliare';

  // ── Partial update (search): only update areas + subtitle ──
  const existingAreas = document.getElementById('region-areas-container');
  if (existingAreas) {
    existingAreas.innerHTML = emptyContent;
    const sub = document.getElementById('region-browser-subtitle');
    if (sub) sub.textContent = subtitleText;
    const cw = document.getElementById('region-chips-wrap');
    if (cw) cw.innerHTML = chipsHtml;
    return;
  }

  // ── First render: build full structure ──
  content.innerHTML = `
    <div class="content-header fade-in" style="background:rgba(0,0,0,0.2);">
      <div>
        <div class="content-title" style="display:flex;align-items:center;gap:12px;">
          <span class="pfs-section-chip">RICERCA PFS</span>Sfoglia Regioni
        </div>
        <div class="content-subtitle" id="region-browser-subtitle">${subtitleText}</div>
      </div>
    </div>
    <div class="pfs-scroll-wrap">
      <div style="padding:20px 40px 0;">
        <div class="region-chips-wrap" id="region-chips-wrap">${chipsHtml}</div>
      </div>
      <div class="search-wrap" style="margin:16px 40px 0;">
        <input id="region-browser-search" type="search" class="search-input"
          placeholder="Cerca comune o PFS…" oninput="pfsRegionSearch(this.value)" style="max-width:480px;">
      </div>
      <div id="region-areas-container" style="padding:16px 40px 32px;">${emptyContent}</div>
    </div>`;
}

export async function pfsToggleRegion(region) {
  if (_activeRegions.has(region)) {
    _activeRegions.delete(region);
    _renderRegionBrowser(document.getElementById('content'));
    return;
  }
  // Activate + lazy load
  _activeRegions.add(region);
  if (!_regionJsonCache[region]) {
    _regionLoading.add(region);
    _renderRegionBrowser(document.getElementById('content'));
    try { await fetchRegionJson(region); } catch {}
    _regionLoading.delete(region);
  }
  _renderRegionBrowser(document.getElementById('content'));
}

let _regionSearchTimeout = null;
export function pfsRegionSearch(q) {
  clearTimeout(_regionSearchTimeout);
  _regionSearchTimeout = setTimeout(() => {
    _regionBrowserSearch = q;
    _renderRegionBrowser(document.getElementById('content'));
  }, 150);
}

export function pfsRegionToggleStar(area, btnEl) {
  const isNowFav = toggleFavorite(area);
  btnEl.textContent = isNowFav ? '★' : '☆';
  btnEl.classList.toggle('active', isNowFav);
  const dot = btnEl.closest('.region-area-row')?.querySelector('.pfs-lookup-dot');
  if (dot) dot.classList.toggle('fav', isNowFav);
  showToast(isNowFav ? `★ "${area}" aggiunto ai preferiti` : `"${area}" rimosso dai preferiti`, 'info', 1500);
  // Sidebar now shows favorites list (updated by toggleFavorite)
  initPfsLookupSidebar(_allAreas);
}

export async function initPfsLookup(configPfsAreas) {
  window._pfsConfigAreas = configPfsAreas || [];
  const id = getWebDeviceId();
  
  // 1. Forza i default se non presenti (una sola volta)
  const MIGRATION_KEY = 'tw_pfs_defaults_seeded_v3';
  if (!localStorage.getItem(MIGRATION_KEY)) {
    let current = getFavorites();
    let changed = false;
    DEFAULT_FAVORITES.forEach(f => {
      if (!current.includes(f)) { current.push(f); changed = true; }
    });
    if (changed) setFavorites(current);
    localStorage.setItem(MIGRATION_KEY, 'true');
  }

  // 2. Setup Real-time Sync con Firestore
  if (id) {
    if (_favsListener) _favsListener();
    _favsListener = onSnapshot(doc(db, 'settings', 'devices_names'), (snap) => {
      if (snap.exists()) {
        const remote = snap.data()[id]?.pfsAreas;
        if (Array.isArray(remote)) {
          // Se il remote è diverso dal locale, sincronizza
          const local = getFavorites();
          if (JSON.stringify(local) !== JSON.stringify(remote)) {
            localStorage.setItem(FAV_KEY, JSON.stringify(remote));
            // Ricalcola _allAreas e rinfresca la sidebar solo con i favoriti
            _allAreas = [...remote];
            initPfsLookupSidebar(_allAreas);
          }
        }
      }
    });
  }

  // Sidebar shows exclusively favorites (from Firestore or local fallback)
  const favs = getFavorites();
  _allAreas = [...favs];
  
  window._pfsLookupConfig = _allAreas;
  initPfsLookupSidebar(_allAreas);
  try { await registerWebUser(); } catch(e) { console.warn('registerWebUser fallito:', e); }

  // Pre-fetch Piemonte (hot region) to speed up favorites
  try { await fetchRegionJson('Piemonte'); } catch(e) { /* fallback silenzioso */ }
  // Refresh sidebar once data is ready
  initPfsLookupSidebar(_allAreas);
}
