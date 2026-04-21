// ── Tecnici management ──
import { db, collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from './firebase.js';
import { APPALTI, currentAppalto, currentDate, currentUser } from './state.js';
import { escapeHtml, showToast, showConfirm, showRenameModal } from './utils.js';
import { getHiddenTecnici, saveHiddenTecnici, resetHiddenCache, preloadCounts, getCountListeners, loadAppalto } from './data.js';

// ── DEVICE NAME RESOLVER ──
const BRAND_FILES = {
  'samsung':  'samsung_global_en',
  'xiaomi':   'xiaomi',
  'redmi':    'xiaomi',
  'poco':     'xiaomi',
  'huawei':   'huawei_global_en',
  'honor':    'honor_global_en',
  'oneplus':  'oneplus_en',
  'oppo':     'oppo_global_en',
  'realme':   'realme_global_en',
  'vivo':     'vivo_global_en',
  'motorola': 'motorola_global_en',
  'nokia':    'nokia_global_en',
  'sony':     'sony_global_en',
  'apple':    'apple_all_en',
  'iphone':   'apple_all_en',
  'google':   'google_en',
  'asus':     'asus_global_en',
  'lg':       'lg_global_en',
};
const BASE_URL = 'https://raw.githubusercontent.com/KHwang9883/MobileModels/master/brands/';
const _brandCache = {};

async function loadBrandModels(brandKey) {
  if (_brandCache[brandKey]) return _brandCache[brandKey];
  try {
    const res = await fetch(BASE_URL + BRAND_FILES[brandKey] + '.md');
    if (!res.ok) { _brandCache[brandKey] = new Map(); return _brandCache[brandKey]; }
    const text = await res.text();
    const map = new Map();
    const entries = text.split(/[·\n]/);
    for (const entry of entries) {
      const parts = entry.split(/[：:]/);
      if (parts.length < 2) continue;
      const modelsPart = parts[0];
      const namePart = parts.slice(1).join(':').trim();
      const cleanName = namePart.replace(/\s+(Global|China|Japan.*|US.*|Canada|South Korea|India.*)$/i, '').trim();
      const modelRegex = /`([^`]+)`/g;
      let match;
      let found = false;
      while ((match = modelRegex.exec(modelsPart)) !== null) {
        found = true;
        map.set(match[1].trim().toUpperCase(), cleanName);
      }
      if (!found) {
        const fallbackMatch = modelsPart.match(/([A-Za-z0-9\-_]+)\s*$/);
        if (fallbackMatch) map.set(fallbackMatch[1].trim().toUpperCase(), cleanName);
      }
    }
    _brandCache[brandKey] = map;
    return map;
  } catch { _brandCache[brandKey] = new Map(); return _brandCache[brandKey]; }
}

export async function resolveDeviceName(raw) {
  if (!raw || raw === '—') return raw;
  const parts = raw.trim().split(/\s+/);
  const manufacturer = parts[0].toLowerCase();
  const model = parts.slice(1).join(' ').toUpperCase();
  const brandKey = Object.keys(BRAND_FILES).find(k => manufacturer.includes(k));
  if (!brandKey) return raw;
  const map = await loadBrandModels(brandKey);
  const name = map.get(model);
  return name ? `${parts[0]} ${name}` : raw;
}

function clearCountListeners() {
  const listeners = getCountListeners();
  for (let key in listeners) {
    if (listeners[key]) listeners[key]();
    delete listeners[key];
  }
}

// ── SHOW TECNICI PAGE ──
export async function showTecnici() {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  const el = document.getElementById('nav-Tecnici');
  if (el) el.classList.add('active');
  const content = document.getElementById('content');
  if (currentUser.role !== 'admin') {
    content.innerHTML = `<div class="state-box fade-in"><h2>Accesso Negato</h2><p>Non hai i permessi per visualizzare questa pagina.</p></div>`;
    return;
  }
  content.innerHTML = `<div class="state-box"><div class="loader-spinner"></div><p>Caricamento tecnici…</p></div>`;

  try {
    const allTecnici = new Map();
    for (const appalto of APPALTI) {
      const snap = await getDocs(collection(db, appalto));
      snap.docs.filter(d => !/_\d{4}-\d{2}-\d{2}$/.test(d.id)).forEach(d => {
        const data = d.data();
        const name = data.tecnico || d.id;
        if (!allTecnici.has(name)) allTecnici.set(name, { docIds: {}, dispositivo: data.dispositivo || '—', versione: data.versione_app || '', appalti: [], ultimo: data.ultimo_aggiornamento || '—' });
        allTecnici.get(name).appalti.push(appalto);
        allTecnici.get(name).docIds[appalto] = d.id;
      });
    }
    if (allTecnici.size === 0) { content.innerHTML = `<div class="state-box fade-in"><p>Nessun tecnico trovato.</p></div>`; return; }
    let cards = '';
    const hidden = await getHiddenTecnici();
    for (const [name, info] of allTecnici) {
      const visible = !hidden.includes(name);
      const friendlyDevice = await resolveDeviceName(info.dispositivo);
      const versionBadge = info.versione ? ` · <span style="color:var(--accent)">${info.versione}</span>` : '';
      const escapedName = name.replace(/'/g, "\\'");
      const docIdsJson = JSON.stringify(info.docIds).replace(/'/g, "&#39;").replace(/"/g, '&quot;');
      cards += `<div class="toggle-wrap">
        <div class="toggle-info">
          <span class="toggle-name">${name}</span>
          <span class="toggle-device">📱 ${friendlyDevice}${versionBadge} · ${info.appalti.join(', ')} · ${info.ultimo}</span>
        </div>
        <div class="tecnici-actions">
          <button class="btn-tecnico-action btn-rename" onclick="renameTecnico('${escapedName}', '${docIdsJson}')" title="Rinomina">✏️ Rinomina</button>
          <button class="btn-tecnico-action btn-delete" onclick="deleteTecnico('${escapedName}', '${docIdsJson}')" title="Elimina definitivamente">🗑️ Elimina</button>
          <label class="toggle">
            <input type="checkbox" ${visible ? 'checked' : ''} onchange="toggleTecnico('${escapedName}', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>`;
    }
    content.innerHTML = `<div class="tecnici-panel fade-in">
      <div class="tecnici-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div class="content-title">Tecnici</div>
        <div class="tecnici-note" style="width:100%;">⚠ I tecnici disattivati vengono nascosti dalla tabella e dai conteggi. Il loro sync continua normalmente.</div>
      </div>${cards}</div>`;
  } catch(e) { content.innerHTML = `<div class="state-box fade-in"><p>Errore caricamento tecnici.</p></div>`; console.error(e); }
}

// ── DELETE TECNICO ──
export async function deleteTecnico(name, docIdsJsonStr) {
  const ok = await showConfirm({
    title: `Eliminare "${name}"?`,
    msg: 'Verranno cancellati TUTTI i dati di questo tecnico (inclusi gli snapshot) da tutti gli appalti. Questa azione è irreversibile.',
    icon: '🗑️',
    okLabel: 'Elimina definitivamente'
  });
  if (!ok) return;
  try {
    const docIds = JSON.parse(docIdsJsonStr.replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
    for (const [appalto, docId] of Object.entries(docIds)) {
      await deleteDoc(doc(db, appalto, docId));
      const snap = await getDocs(collection(db, appalto));
      const snapshotDocs = snap.docs.filter(d => d.id.startsWith(docId + '_') && /_\d{4}-\d{2}-\d{2}$/.test(d.id));
      for (const sDoc of snapshotDocs) {
        await deleteDoc(doc(db, appalto, sDoc.id));
      }
    }
    let hidden = await getHiddenTecnici();
    hidden = hidden.filter(n => n !== name);
    await saveHiddenTecnici(hidden);
    clearCountListeners();
    preloadCounts();
    showToast(`Tecnico "${name}" eliminato.`, 'success');
    showTecnici();
  } catch(e) {
    showToast('Errore durante l\'eliminazione: ' + e.message, 'error', 5000);
    console.error(e);
  }
}

// ── RENAME TECNICO ──
export async function renameTecnico(oldName, docIdsJsonStr) {
  const newName = await showRenameModal({
    title: `Rinomina tecnico`,
    defaultValue: oldName,
    icon: '✏️'
  });
  if (!newName || newName === oldName) return;
  const trimmed = newName;
  try {
    const docIds = JSON.parse(docIdsJsonStr.replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
    if (Object.keys(docIds).length > 0) {
      const deviceId = Object.values(docIds)[0];
      try { await setDoc(doc(db, 'settings', 'devices_names'), { [deviceId]: { name: trimmed, updatedAt: Date.now() } }, { merge: true }); } catch(e) {}
    }
    for (const [appalto, docId] of Object.entries(docIds)) {
      await updateDoc(doc(db, appalto, docId), { tecnico: trimmed });
      const snap = await getDocs(collection(db, appalto));
      const snapshotDocs = snap.docs.filter(d => d.id.startsWith(docId + '_') && /_\d{4}-\d{2}-\d{2}$/.test(d.id));
      for (const sDoc of snapshotDocs) {
        await updateDoc(doc(db, appalto, sDoc.id), { tecnico: trimmed });
      }
    }
    let hidden = await getHiddenTecnici();
    if (hidden.includes(oldName)) {
      hidden = hidden.map(n => n === oldName ? trimmed : n);
      await saveHiddenTecnici(hidden);
    }
    clearCountListeners();
    preloadCounts();
    showTecnici();
  } catch(e) {
    showToast('Errore durante la rinomina: ' + e.message, 'error', 5000);
    console.error(e);
  }
}

// ── TOGGLE TECNICO VISIBILITY ──
export async function toggleTecnico(name, visible) {
  let hidden = await getHiddenTecnici();
  if (visible) { hidden = hidden.filter(n => n !== name); }
  else { if (!hidden.includes(name)) hidden.push(name); }
  await saveHiddenTecnici(hidden);
  clearCountListeners();
  preloadCounts();
  showTecnici();
}
