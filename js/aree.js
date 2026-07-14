import { db, doc, updateDoc, deleteField, setDoc } from './firebase.js';
import { escapeHtml, showToast, showConfirm, showRenameModal } from './utils.js';
import { currentUser, subscribeToDevicesNames, unsubscribeFromDevicesNames } from './state.js';

export function stopAreeListener() {
  unsubscribeFromDevicesNames('aree_dashboard');
}

export async function showAreeDashboard() {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  const el = document.getElementById('nav-aree');
  if (el) el.classList.add('active');

  const content = document.getElementById('content');
  
  if (currentUser.role !== 'admin') {
    content.innerHTML = `<div class="state-box fade-in"><h2>Accesso Negato</h2><p>Non hai i permessi per visualizzare questa pagina.</p></div>`;
    return;
  }

  content.innerHTML = `<div class="state-box"><div class="loader-spinner"></div><p>Caricamento aree preferite…</p></div>`;

  stopAreeListener();

  subscribeToDevicesNames('aree_dashboard', (data) => {
    // Preserve focus and selection
    const activeId = document.activeElement ? document.activeElement.id : null;
    const selectionStart = activeId ? document.activeElement.selectionStart : null;
    const selectionEnd = activeId ? document.activeElement.selectionEnd : null;
    const activeValue = activeId ? document.activeElement.value : null;

    if (!data || Object.keys(data).length === 0) {
      content.innerHTML = `<div class="state-box fade-in"><p>Nessun dato trovato.</p></div>`;
      return;
    }
    
    // Sort devices by name, supportando il formato legacy (stringa) e il nuovo (oggetto)
    const allDevices = Object.keys(data).map(deviceId => {
      const val = data[deviceId];
      let nameStr = deviceId;
      let areas = [];
      let type = 'android';
      let banned = false;
      if (typeof val === 'string') {
        nameStr = val;
      } else if (val && typeof val === 'object') {
        nameStr = val.name || val.baseName || deviceId;
        areas = val.pfsAreas || [];
        type = val.type || 'android';
        banned = val.banned || false;
      }
      return { id: deviceId, name: nameStr, pfsAreas: areas, type, banned };
    }).filter(d => !d.banned).sort((a, b) => a.name.localeCompare(b.name));

    const androidDevices = allDevices.filter(d => d.type !== 'web');
    const webDevices = allDevices.filter(d => d.type === 'web');

    if (allDevices.length === 0) {
      content.innerHTML = `<div class="state-box fade-in"><p>Nessun utente configurato.</p></div>`;
      return;
    }

    const buildDeviceCard = (dev, isWeb) => {
      const areasString = dev.pfsAreas.join(', ');
      const typeBadge = isWeb 
        ? `<span class="tecnico-type-badge tecnico-type-web" title="Dashboard Web">🌐 WEB</span>`
        : `<span class="tecnico-type-badge tecnico-type-android">📱 Android</span>`;
      
      return `
        <div class="toggle-wrap" style="flex-direction:column; align-items:stretch; gap:12px;">
          <div class="toggle-info" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="toggle-name" style="${dev.name === dev.id ? 'color: var(--text-muted); font-style: italic;' : ''}">
                ${dev.name === dev.id ? 'Utente senza nome' : escapeHtml(dev.name)} ${typeBadge}
              </span>
              <span class="toggle-device" style="font-size:0.85rem; margin-left: 8px; opacity: 0.7;">ID: ${escapeHtml(dev.id)}</span>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn-outline" onclick="renameDevice('${escapeHtml(dev.id)}', '${escapeHtml(dev.name)}')" style="width: auto; padding: 6px 16px; font-size: 0.85rem; border-color: var(--accent); color: var(--accent);">✏️ Rinomina</button>
              <button class="btn-outline" onclick="savePfsAreas('${escapeHtml(dev.id)}')" style="width: auto; padding: 6px 16px; font-size: 0.85rem; border-color: var(--accent); color: var(--accent);">💾 Salva Aree</button>
              <button class="btn-outline" onclick="deleteDeviceAreas('${escapeHtml(dev.id)}')" style="width: auto; padding: 6px 16px; font-size: 0.85rem; border-color: var(--red); color: var(--red);">🗑️ Elimina</button>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <label for="areas-${dev.id}" style="font-size:0.85rem; color:var(--text-muted); font-weight: 600;">Aree preferite (separate da virgola):</label>
            <input type="text" id="areas-${escapeHtml(dev.id)}" value="${escapeHtml(areasString)}" class="rename-field" placeholder="Es. Grugliasco, Torino, TOH_1">
          </div>
        </div>
      `;
    };

    let devicesHtml = '';
    
    // Android group
    for (const dev of androidDevices) {
      devicesHtml += buildDeviceCard(dev, false);
    }
    
    // Web group divider
    if (webDevices.length > 0) {
      devicesHtml += `
        <div class="tecnici-divider">
          <span class="tecnici-divider-line"></span>
          <span class="tecnici-divider-label">🌐 Dashboard Web (${webDevices.length})</span>
          <span class="tecnici-divider-line"></span>
        </div>
      `;
      for (const dev of webDevices) {
        devicesHtml += buildDeviceCard(dev, true);
      }
    }

    content.innerHTML = `
      <div class="content-header fade-in">
        <div>
          <div class="content-title">Aree Preferite</div>
          <div class="content-subtitle">Gestisci le aree di lavoro preferite per ciascun dispositivo</div>
        </div>
      </div>
      <div class="tecnici-panel fade-in">
        <div class="tecnici-note">
          Queste sono le aree (comuni, province o PFS) preferite di ogni tecnico (quelle con la stellina attiva).
          Modificando queste aree e salvando, l'app del tecnico si aggiornerà in tempo reale.
        </div>
        <div style="display:flex; flex-direction:column; gap:16px; margin-top:20px;">
          ${devicesHtml}
        </div>
      </div>
    `;

    // Restore focus and selection
    if (activeId) {
      const el = document.getElementById(activeId);
      if (el) {
        el.focus();
        if (activeValue !== null) el.value = activeValue;
        try { el.setSelectionRange(selectionStart, selectionEnd); } catch(e){}
      }
    }
  }, (e) => {
    console.error(e);
    content.innerHTML = `<div class="state-box fade-in"><p>Errore caricamento aree preferite.</p></div>`;
  });
}

export async function savePfsAreas(deviceId) {
  const input = document.getElementById(`areas-${deviceId}`);
  if (!input) return;
  
  const rawValue = input.value;
  // Parse comma separated values, filtering out empty strings
  const areasArray = rawValue.split(',')
                             .map(s => s.trim())
                             .filter(s => s.length > 0);
  
  try {
    const docRef = doc(db, 'settings', 'devices_names');
    
    // Usa dot-notation per aggiornare solo pfsAreas e updatedAt
    // senza sovrascrivere il campo 'name' del dispositivo
    await updateDoc(docRef, {
      [`${deviceId}.pfsAreas`]: areasArray,
      [`${deviceId}.updatedAt`]: Date.now()
    });
    showToast('Aree preferite aggiornate con successo', 'success');
  } catch (e) {
    console.error(e);
    showToast('Errore durante il salvataggio: ' + e.message, 'error');
  }
}

export async function deleteDeviceAreas(deviceId) {
  const confirmed = await showConfirm({
    title: 'Elimina tecnico',
    msg: 'Vuoi eliminare completamente le preferenze e la scheda di questo tecnico? (Se il tecnico userà di nuovo l\'app, verrà ricreato automaticamente).',
    icon: '🗑️',
    okLabel: 'Elimina',
    okAccent: false
  });
  if (!confirmed) return;

  try {
    const docRef = doc(db, 'settings', 'devices_names');
    await updateDoc(docRef, {
      [deviceId]: deleteField()
    });
    showToast('Tecnico eliminato dalle aree preferite', 'success');
    showAreeDashboard(); // Ricarica la dashboard per far sparire la scheda
  } catch (e) {
    console.error(e);
    showToast('Errore: ' + e.message, 'error');
  }
}

export async function renameDevice(deviceId, currentName) {
  const newName = await showRenameModal({
    title: `Rinomina tecnico`,
    defaultValue: currentName === deviceId ? '' : currentName,
    icon: '✏️'
  });
  if (!newName || newName === currentName) return;

  try {
    const docRef = doc(db, 'settings', 'devices_names');
    await setDoc(docRef, {
      [deviceId]: { name: newName, updatedAt: Date.now() }
    }, { merge: true });
    showToast('Tecnico rinominato con successo', 'success');
    showAreeDashboard(); // Ricarica
  } catch (e) {
    console.error(e);
    showToast('Errore durante la rinomina: ' + e.message, 'error');
  }
}
