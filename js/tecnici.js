// ── Tecnici management ──
import { db, collection, getDocs, doc, setDoc, deleteDoc, updateDoc, onSnapshot, deleteField, rtdb, ref, onValue } from './firebase.js';
import { APPALTI, currentAppalto, currentDate, currentUser, subscribeToDevicesNames, unsubscribeFromDevicesNames } from './state.js';
import { escapeHtml, showToast, showConfirm, showRenameModal } from './utils.js';
import { getHiddenTecnici, saveHiddenTecnici, resetHiddenCache, preloadCounts, getCountListeners, loadAppalto, setHiddenCache, getHiddenTecniciSync, resetLastRenderedKey } from './data.js';

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

let _tecniciListeners = [];
let _bannedListeners = [];

export function stopTecniciListeners() {
  _tecniciListeners.forEach(unsub => { if (typeof unsub === 'function') unsub(); });
  _tecniciListeners = [];
  unsubscribeFromDevicesNames('tecnici_web');
}

export function stopBannedListeners() {
  _bannedListeners.forEach(unsub => { if (typeof unsub === 'function') unsub(); });
  _bannedListeners = [];
  unsubscribeFromDevicesNames('tecnici_banned');
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

  stopTecniciListeners();

  let appaltiData  = {};
  let webDevices   = {}; // from settings/devices_names (type:'web')
  let statusData   = {}; // from RTDB /status
  let loadedCount  = 0;

  async function renderTecnici() {
    if (loadedCount < APPALTI.length) return;

    try {
      const allTecnici = new Map();
      
      APPALTI.forEach(appalto => {
        const docs = appaltiData[appalto] || [];
        docs.forEach(d => {
          const data = d.data;
          const name = data.tecnico || d.id;
          if (!allTecnici.has(name)) {
            allTecnici.set(name, {
              docIds: {},
              deviceId: d.id,
              dispositivo: data.dispositivo || '—',
              versione: data.versione_app || '',
              batteria: data.batteria || null,
              gpsAttivo: data.gps_attivo !== undefined ? data.gps_attivo : null,
              appalti: [],
              ultimo: data.ultimo_aggiornamento || '—',
              type: data.type || 'android',
              os: data.os || null,
              browser: data.browser || null,
              cores: data.cores || null,
              memory: data.memory || null,
            });
          }
          allTecnici.get(name).appalti.push(appalto);
          allTecnici.get(name).docIds[appalto] = d.id;
          // Prendi i dati più recenti di telemetria se disponibili
          if (data.batteria) allTecnici.get(name).batteria = data.batteria;
          if (data.gps_attivo !== undefined) allTecnici.get(name).gpsAttivo = data.gps_attivo;
        });
      });

      if (allTecnici.size === 0) { 
        content.innerHTML = `<div class="state-box fade-in"><p>Nessun tecnico trovato.</p></div>`; 
        return; 
      }
      
      let cards = '';
      const hidden = getHiddenTecniciSync();
 
      // ── Separate Android vs Web tecnici ──
      // Escludi i bannati leggendoli da webDevices (che contiene tutti i device registrati)
      const bannedDeviceIds = Object.keys(webDevices).filter(id => webDevices[id]?.banned);
      
      const androidTecnici = [...allTecnici.entries()].filter(([, info]) => info.type !== 'web' && !bannedDeviceIds.includes(info.deviceId));
      // Web users come directly from webDevices (settings/devices_names) e integrano RTDB presence
      const webTecniciEntries = Object.entries(webDevices)
        .filter(([, info]) => (info?.type === 'web' || info?.os || info?.browser) && !info?.banned)
        .map(([deviceId, info]) => {
          const status = statusData[deviceId] || {};
          const isOnline = status.state === 'online' || (status.connections && Object.keys(status.connections).length > 0);
          
          let lastSessionStr = '—';
          if (isOnline) {
            lastSessionStr = '<span style="color: var(--green); font-weight: bold;">🟢 Online ora</span>';
          } else if (status.last_changed) {
            lastSessionStr = new Date(status.last_changed).toLocaleString('it-IT', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
          } else if (info.updatedAt) {
            lastSessionStr = new Date(info.updatedAt).toLocaleString('it-IT', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
          }

          return [deviceId, {
            docIds:      {},
            dispositivo: '—',
            versione:    '',
            appalti:     info.pfsAreas || [],
            ultimo:      lastSessionStr,
            type:    'web',
            os:      info.os || null,
            browser: info.browser || null,
            cores:   info.cores || null,
            memory:  info.memory || null,
            webName: info.name || info.baseName || deviceId, // display name (renameable)
            deviceId,
            isOnline
          }];
        });

      async function buildCard([name, info]) {
        const visible      = !hidden.some(h => h.toLowerCase() === name.toLowerCase());
        const friendlyDevice = await resolveDeviceName(info.dispositivo);
        const versionBadge   = info.versione ? ` · <span style="color:var(--accent)">${info.versione}</span>` : '';
        const escapedName    = name.replace(/'/g, "\\'");
        const docIdsJson     = JSON.stringify(info.docIds).replace(/'/g, "&#39;").replace(/"/g, '&quot;');

        const typeBadge = `<span class="tecnico-type-badge tecnico-type-android">📱 Android</span>`;
        const deviceIcon = '📱';

        // Telemetria (Batteria e GPS)
        let telemetryStr = '';
        if (info.batteria) {
          telemetryStr += ` · 🔋 ${info.batteria}`;
        }
        if (info.gpsAttivo !== null) {
          telemetryStr += info.gpsAttivo ? ' · 📡 GPS Attivo' : ' · 📡 GPS Disattivato';
        }

        return `<div class="toggle-wrap">
          <div class="toggle-info">
            <span class="toggle-name">${name} ${typeBadge}</span>
            <span class="toggle-device">${deviceIcon} ${friendlyDevice}${versionBadge}${telemetryStr}${info.appalti.length ? ' · ' + info.appalti.join(', ') : ''} · Ultimo sync: ${info.ultimo}</span>
          </div>
          <div class="tecnici-actions">
            <button class="btn-tecnico-action btn-rename" onclick="renameTecnico('${escapedName}', '${docIdsJson}')" title="Rinomina">✏️ Rinomina</button>
            <button class="btn-tecnico-action" onclick="toggleBanTecnico('${info.deviceId}', true)" title="Blocca questo dispositivo" style="color: #D32F2F; border-color: #D32F2F;">🚫 Blocca</button>
            <button class="btn-tecnico-action btn-delete" onclick="deleteTecnico('${escapedName}', '${docIdsJson}')" title="Elimina definitivamente">🗑️ Elimina</button>
            <label class="toggle">
              <input type="checkbox" ${visible ? 'checked' : ''} onchange="toggleTecnico('${escapedName}', this.checked)">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>`;
      }

      // Build android group
      for (const entry of androidTecnici) {
        cards += await buildCard(entry);
      }

      // Divider + web group from devices_names
      if (webTecniciEntries.length > 0) {
        cards += `
          <div class="tecnici-divider">
            <span class="tecnici-divider-line"></span>
            <span class="tecnici-divider-label">🖥️ Dashboard Web (${webTecniciEntries.length})</span>
            <span class="tecnici-divider-line"></span>
          </div>`;
        for (const entry of webTecniciEntries) {
          cards += await buildWebCard(entry);
        }
      }

      content.innerHTML = `<div class="tecnici-panel fade-in">
        <div class="tecnici-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div class="content-title">Tecnici</div>
          <div class="tecnici-note" style="width:100%;">⚠ I tecnici disattivati vengono nascosti dalla tabella e dai conteggi. Il loro sync continua normalmente.</div>
        </div>${cards}</div>`;
    } catch(e) {
      console.error(e);
    }
  }

  // ── Web card builder (from devices_names) ──
  async function buildWebCard([deviceId, info]) {
    const details = [info.os, info.browser, info.cores ? `${info.cores} core` : null, info.memory ? `${info.memory}GB RAM` : null].filter(Boolean).join(' · ');
    const typeBadge = `<span class="tecnico-type-badge tecnico-type-web" title="${details || 'Dashboard Web'}">🖥 WEB</span>`;
    const displayName = info.webName || info.baseName || deviceId;
    const escapedId   = deviceId.replace(/'/g, "\\'");
    const escapedDisplayName = displayName.replace(/'/g, "\\'");
    const statusLabel = info.isOnline ? info.ultimo : `Ultima sessione: ${info.ultimo}`;

    return `<div class="toggle-wrap">
      <div class="toggle-info">
        <span class="toggle-name">${displayName} ${typeBadge}</span>
        <span class="toggle-device">🖥️ ${details || 'Web Dashboard'} · PFS: ${info.appalti.length ? info.appalti.join(', ') : 'nessuna stella'} · ${statusLabel}</span>
        <span style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono)">${deviceId}</span>
      </div>
      <div class="tecnici-actions">
        <button class="btn-tecnico-action btn-rename" onclick="renameWebTecnico('${escapedId}', '${escapedDisplayName}')" title="Rinomina">✏️ Rinomina</button>
        <button class="btn-tecnico-action btn-delete" onclick="deleteWebTecnico('${escapedId}')" title="Rimuovi dal registro">🗑️ Rimuovi</button>
      </div>
    </div>`;
  }

  APPALTI.forEach(appalto => {
    const unsub = onSnapshot(collection(db, appalto), (snap) => {
      appaltiData[appalto] = snap.docs
        .filter(d => !/_\d{4}-\d{2}-\d{2}$/.test(d.id))
        .map(d => ({ id: d.id, data: d.data() }));
      
      if (loadedCount < APPALTI.length) loadedCount++;
      renderTecnici();
    }, (e) => {
      console.error(`Errore caricamento tecnici per ${appalto}:`, e);
      if (loadedCount < APPALTI.length) loadedCount++;
      renderTecnici();
    });
    _tecniciListeners.push(unsub);
  });

  // Listen to presence status from Realtime Database
  const unsubStatus = onValue(ref(rtdb, '/status'), (snap) => {
    statusData = snap.val() || {};
    renderTecnici();
  }, (e) => {
    console.error("Errore caricamento status presenza:", e);
  });
  _tecniciListeners.push(unsubStatus);

  // Listen to web users from devices_names via global subscription
  subscribeToDevicesNames('tecnici_web', (data) => {
    webDevices = data;
    renderTecnici(); // re-render with updated web users
  });

  // Listen to hidden_tecnici in real time
  const unsubHidden = onSnapshot(doc(db, 'settings', 'hidden_tecnici'), (snap) => {
    if (snap.exists()) {
      setHiddenCache(snap.data().hidden || []);
    } else {
      setHiddenCache([]);
    }
    renderTecnici();
  }, () => {});
  _tecniciListeners.push(unsubHidden);
}

// ── RENAME WEB TECNICO ──
export async function renameWebTecnico(deviceId, currentName) {
  const newName = await showRenameModal({
    title: 'Rinomina utente web',
    defaultValue: currentName,
    icon: '✏️'
  });
  if (!newName || newName === currentName) return;
  
  // ⚡ Optimistic DOM update: aggiorna immediatamente il card nella lista
  const content = document.getElementById('content');
  if (content) {
    content.querySelectorAll('.toggle-name').forEach(el => {
      const firstChild = el.firstChild;
      if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
        if (firstChild.textContent.trim() === currentName) {
          firstChild.textContent = newName + ' ';
        }
      }
    });
    // Aggiorna anche il pulsante per permettere un secondo rename immediato
    content.querySelectorAll('.btn-rename').forEach(btn => {
      const onclick = btn.getAttribute('onclick') || '';
      if (onclick.includes(`'${deviceId}'`) && onclick.includes(`'${currentName.replace(/'/g, "\\'")}'`)) {
        btn.setAttribute('onclick', onclick.replace(
          `'${currentName.replace(/'/g, "\\'")}'`,
          `'${newName.replace(/'/g, "\\'")}'`
        ));
      }
    });
  }
  
  try {
    await updateDoc(doc(db, 'settings', 'devices_names'), { [`${deviceId}.name`]: newName });
    showToast(`✅ Rinominato in "${newName}"`, 'success');
  } catch(e) { showToast('Errore rinomina', 'error'); console.error(e); }
}

// ── DELETE WEB TECNICO ──
export async function deleteWebTecnico(deviceId) {
  const ok = await showConfirm({
    title: `Rimuovere "${deviceId}"?`,
    msg: 'Questo utente web verrà rimosso dal registro. Potrà ri-registrarsi al prossimo login.',
    icon: '🖥️',
    okLabel: 'Rimuovi'
  });
  if (!ok) return;
  try {
    await updateDoc(doc(db, 'settings', 'devices_names'), { [deviceId]: deleteField() });
    showToast('Utente web rimosso', 'success');
  } catch(e) { showToast('Errore rimozione', 'error'); console.error(e); }
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
    let hidden = getHiddenTecniciSync();
    hidden = hidden.filter(n => n !== name);
    await saveHiddenTecnici(hidden);
    showToast(`Tecnico "${name}" eliminato.`, 'success');
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
    icon: '\u270F\uFE0F'
  });
  if (!newName || newName === oldName) return;
  const trimmed = newName;
  try {
    const docIds = JSON.parse(docIdsJsonStr.replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
    
    // ⚡ Optimistic DOM update: rename the card immediately so the UI feels instant
    const content = document.getElementById('content');
    if (content) {
      content.querySelectorAll('.toggle-name').forEach(el => {
        // The toggle-name contains the tech name as a text node followed by the type badge
        const firstChild = el.firstChild;
        if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
          if (firstChild.textContent.trim() === oldName) {
            firstChild.textContent = trimmed + ' ';
          }
        }
      });
      // Also update the rename button's onclick to use the new name
      content.querySelectorAll('.btn-rename').forEach(btn => {
        const onclick = btn.getAttribute('onclick') || '';
        if (onclick.includes(`'${oldName.replace(/'/g, "\\'")}'`) || onclick.includes(`'${oldName}'`)) {
          btn.setAttribute('onclick', onclick
            .replace(new RegExp(`'${oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "\\\\'")}'`, 'g'), `'${trimmed.replace(/'/g, "\\'")}'`)
          );
        }
      });
    }
    
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
    let hidden = getHiddenTecniciSync();
    if (hidden.includes(oldName)) {
      hidden = hidden.map(n => n === oldName ? trimmed : n);
      await saveHiddenTecnici(hidden);
    }
    // Force full re-render on next appalto page visit
    resetLastRenderedKey();
    showToast(`Tecnico "${oldName}" rinominato in "${trimmed}".`, 'success');
  } catch(e) {
    showToast('Errore durante la rinomina: ' + e.message, 'error', 5000);
    console.error(e);
  }
}

// ── TOGGLE TECNICO VISIBILITY ──
export async function toggleTecnico(name, visible) {
  let hidden = getHiddenTecniciSync();
  if (visible) { hidden = hidden.filter(n => n !== name); }
  else { if (!hidden.includes(name)) hidden.push(name); }
  try {
    await saveHiddenTecnici(hidden);
    showToast(visible ? `Tecnico "${name}" attivato` : `Tecnico "${name}" disattivato`, 'success');
  } catch(e) {
    showToast('Errore durante la modifica della visibilità', 'error');
    console.error(e);
  }
}

// 🔥 KILLSWITCH / BANNED LOGIC 🔥
export function showBanned() {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  const el = document.getElementById('nav-Banned');
  if (el) el.classList.add('active');
  
  const content = document.getElementById('content');
  if (currentUser.role !== 'admin') {
    content.innerHTML = `<div class="state-box fade-in"><h2>Accesso Negato</h2><p>Non hai i permessi per visualizzare questa pagina.</p></div>`;
    return;
  }
  
  content.innerHTML = `
    <div class="tecnici-panel fade-in">
      <div class="tecnici-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div class="content-title">Dispositivi Bloccati (Killswitch)</div>
        <div class="tecnici-note" style="width:100%;">⚠ I dispositivi bloccati non possono usare l'app o accedere ai dati aziendali.</div>
      </div>
      <div class="table-responsive" style="margin-top:20px;">
        <table class="tecnici-table" style="width:100%; text-align:left; border-collapse:collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border);">
              <th style="padding: 12px 8px;">Stato</th>
              <th style="padding: 12px 8px;">Utente</th>
              <th style="padding: 12px 8px;">Dispositivo</th>
              <th style="padding: 12px 8px;">ID univoco</th>
              <th style="padding: 12px 8px;">Azioni</th>
            </tr>
          </thead>
          <tbody id="banned-table-body">
            <tr><td colspan="5" style="text-align:center; padding: 20px;"><div class="loader-spinner" style="display:inline-block; vertical-align:middle; width:16px; height:16px; border-width:2px;"></div> Caricamento...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  stopBannedListeners();

  // Listen to devices_names via global subscription
  subscribeToDevicesNames('tecnici_banned', (data) => {
    renderBannedListWithData(data);
  });
}

window.toggleBanTecnico = async function(deviceId, isBanned) {
  if (!deviceId || deviceId === 'undefined') {
    showToast('Impossibile bloccare: ID dispositivo sconosciuto', 'error');
    return;
  }
  
  const action = isBanned ? 'bloccare' : 'sbloccare';
  const ok = await showConfirm({
    title: `Conferma Killswitch`,
    msg: `Vuoi davvero ${action} il dispositivo con ID ${deviceId}?`,
    icon: isBanned ? '🚫' : '✅',
    okLabel: 'Conferma'
  });
  
  if (!ok) return;
  
  try {
    try {
      await updateDoc(doc(db, 'settings', 'devices_names'), {
        [`${deviceId}.banned`]: isBanned,
        [`${deviceId}.updatedAt`]: Date.now()
      });
    } catch(e) {
      await setDoc(doc(db, 'settings', 'devices_names'), {
        [deviceId]: { banned: isBanned, updatedAt: Date.now() }
      }, { merge: true });
    }
    showToast(`Dispositivo ${isBanned ? 'bloccato' : 'sbloccato'} con successo`, 'success');
  } catch(e) {
    console.error(e);
    showToast(`Errore: ${e.message}`, 'error');
  }
};

window.renderBannedListWithData = async function(devices) {
  const tbody = document.getElementById('banned-table-body');
  if (!tbody) return;
  
  let html = '';
  let count = 0;
  
  for (const [deviceId, info] of Object.entries(devices)) {
    if (info && info.banned) {
      count++;
      const name = info.name || info.webName || info.baseName || "Sconosciuto";
      const osBrowser = [info.os, info.browser].filter(Boolean).join(' - ') || 'App Android';
      
      html += `
        <tr>
          <td><span class="tecnico-type-badge" style="background:#D32F2F; color:white;">🚫 BLOCCATO</span></td>
          <td>
            <div id="name-${deviceId}" style="font-weight:bold;">${name}</div>
            <div id="count-${deviceId}" style="font-size:11px; color:var(--text-muted); margin-top:4px;">Conteggio dati in corso...</div>
          </td>
          <td>${osBrowser}</td>
          <td style="font-family:monospace; font-size:12px; color:var(--text-muted);">${deviceId}</td>
          <td>
            <button class="btn-tecnico-action" onclick="toggleBanTecnico('${deviceId}', false)" style="color: #4CAF50; border-color: #4CAF50;">✅ Sblocca</button>
            <button class="btn-tecnico-action btn-delete" id="btn-del-${deviceId}" onclick="deleteBannedData('${deviceId}', '${name.replace(/'/g, "\\'")}')" title="Elimina definitivamente i dati" style="margin-left: 8px;">🗑️ Elimina Dati</button>
          </td>
        </tr>
      `;
    }
  }
  
  if (count === 0) {
    html = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Nessun dispositivo bloccato al momento.</td></tr>`;
  }
  
  tbody.innerHTML = html;
  
  for (const [deviceId, info] of Object.entries(devices)) {
    if (info && info.banned && !info.deleted) {
      countBannedUserDocs(deviceId);
    } else if (info && info.banned && info.deleted) {
      const countEl = document.getElementById(`count-${deviceId}`);
      const btnDel = document.getElementById(`btn-del-${deviceId}`);
      if (countEl) countEl.innerHTML = `Dati eliminati`;
      if (btnDel) btnDel.style.display = 'none';
    }
  }
};

window.renderBannedList = async function() {
  const snap = await getDoc(doc(db, 'settings', 'devices_names'));
  const devices = snap.exists() ? snap.data() : {};
  renderBannedListWithData(devices);
};

window.deleteBannedData = async function(deviceId, name) {
  const ok = await showConfirm({
    title: `Eliminare i dati di "${name}"?`,
    msg: `Verranno cancellati TUTTI i dati caricati (inclusi snapshot) da tutti gli appalti. L'utente rimarrà bloccato, ma i suoi dati spariranno. Sei sicuro?`,
    icon: '🗑️',
    okLabel: 'Elimina definitivamente'
  });
  
  if (!ok) return;
  
  try {
    showToast('Rimozione in corso...', 'info');
    
    for (const appalto of APPALTI) {
      try { await deleteDoc(doc(db, appalto, deviceId)); } catch(e) {}
      
      try {
        const snap = await getDocs(collection(db, appalto));
        const snapshotDocs = snap.docs.filter(d => d.id.startsWith(deviceId + '_') && /_\d{4}-\d{2}-\d{2}$/.test(d.id));
        for (const sDoc of snapshotDocs) {
          await deleteDoc(doc(db, appalto, sDoc.id));
        }
      } catch(e) {}
    }
    
    try {
      const pfsSnap = await getDocs(collection(db, 'pfs_logs'));
      const userLogs = pfsSnap.docs.filter(d => d.data().deviceId === deviceId);
      for (const log of userLogs) await deleteDoc(doc(db, 'pfs_logs', log.id));
    } catch(e) {}
    
    await updateDoc(doc(db, 'settings', 'devices_names'), {
      [`${deviceId}.banned`]: true,
      [`${deviceId}.deleted`]: true,
      [`${deviceId}.updatedAt`]: Date.now()
    });
    
    showToast(`Dati di "${name}" eliminati con successo.`, 'success');
  } catch(e) {
    console.error(e);
    showToast('Errore durante l\'eliminazione: ' + e.message, 'error', 5000);
  }
};

// Funzione asincrona per contare i documenti di un utente bloccato
window.countBannedUserDocs = async function(deviceId) {
  try {
    let totalDocs = 0;
    let foundAppalti = [];
    let detectedName = null;
    let detectedBattery = null;
    let detectedGps = null;
    
    for (const appalto of APPALTI) {
      try {
        const snap = await getDocs(collection(db, appalto));
        // Cerca doc principale e snapshot (che iniziano per deviceId + "_")
        const docs = snap.docs.filter(d => d.id === deviceId || d.id.startsWith(deviceId + '_'));
        if (docs.length > 0) {
          totalDocs += docs.length;
          foundAppalti.push(appalto);
          const docData = docs[0].data();
          if (docData) {
            if (!detectedName && docData.tecnico) detectedName = docData.tecnico;
            if (!detectedBattery && docData.batteria) detectedBattery = docData.batteria;
            if (detectedGps === null && docData.gps_attivo !== undefined) detectedGps = docData.gps_attivo;
          }
        }
      } catch(e) {}
    }
    
    // Log PFS
    try {
      const pfsSnap = await getDocs(collection(db, 'pfs_logs'));
      const userLogs = pfsSnap.docs.filter(d => d.data().deviceId === deviceId);
      if (userLogs.length > 0) {
        totalDocs += userLogs.length;
        foundAppalti.push("PFS");
        if (!detectedName) detectedName = userLogs[0].data().tecnico;
      }
    } catch(e) {}

    // Update Name if it was "Sconosciuto"
    if (detectedName) {
      const nameEl = document.getElementById(`name-${deviceId}`);
      if (nameEl && nameEl.innerText === 'Sconosciuto') {
        nameEl.innerText = detectedName;
      }
      
      // Update delete button data with detected name
      const btnDel = document.getElementById(`btn-del-${deviceId}`);
      if (btnDel) {
        btnDel.setAttribute('onclick', `deleteBannedData('${deviceId}', '${detectedName.replace(/'/g, "\\'")}')`);
      }
    }

    // Aggiungi Telemetria sotto il nome se disponibile
    if (detectedBattery || detectedGps !== null) {
      const nameEl = document.getElementById(`name-${deviceId}`);
      if (nameEl) {
        let telStr = '<div style="font-size:11px; font-weight:normal; color:var(--text-muted); margin-top:2px;">';
        if (detectedBattery) telStr += `🔋 ${detectedBattery}`;
        if (detectedGps !== null) {
          if (detectedBattery) telStr += ' · ';
          telStr += detectedGps ? '📡 GPS Attivo' : '📡 GPS Disattivato';
        }
        telStr += '</div>';
        // Aggiungi solo se non è già presente
        if (!nameEl.innerHTML.includes('🔋') && !nameEl.innerHTML.includes('📡')) {
          nameEl.innerHTML += telStr;
        }
      }
    }
    
    const countEl = document.getElementById(`count-${deviceId}`);
    const btnDel = document.getElementById(`btn-del-${deviceId}`);
    if (countEl) {
      if (totalDocs > 0) {
        const appaltiText = foundAppalti.length > 0 ? ` (${foundAppalti.join(', ')})` : '';
        countEl.innerHTML = `<span style="color:#D32F2F">⚠️ ${totalDocs} documenti salvati${appaltiText}</span>`;
      } else {
        countEl.innerHTML = `Nessun dato salvato`;
        if (btnDel) btnDel.style.display = 'none'; // Nascondi il tasto elimina se non ci sono dati
      }
    }
  } catch(e) {
    console.error(e);
  }
};

