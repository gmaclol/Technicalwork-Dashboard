import { db, doc, getDoc, updateDoc, deleteField } from './firebase.js';
import { showToast, showConfirm } from './utils.js';
import { currentUser } from './state.js';

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

  try {
    const docRef = doc(db, 'settings', 'devices_names');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      content.innerHTML = `<div class="state-box fade-in"><p>Nessun dato trovato.</p></div>`;
      return;
    }

    const data = snap.data();
    let devicesHtml = '';
    
    // Sort devices by name
    const sortedDevices = Object.keys(data).map(deviceId => ({
      id: deviceId,
      name: data[deviceId].name || deviceId,
      pfsAreas: data[deviceId].pfsAreas || []
    })).sort((a, b) => a.name.localeCompare(b.name));

    if (sortedDevices.length === 0) {
      content.innerHTML = `<div class="state-box fade-in"><p>Nessun tecnico configurato.</p></div>`;
      return;
    }

    for (const dev of sortedDevices) {
      const areasString = dev.pfsAreas.join(', ');
      
      devicesHtml += `
        <div class="toggle-wrap" style="flex-direction:column; align-items:stretch; gap:12px;">
          <div class="toggle-info" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="toggle-name">${dev.name}</span>
              <span class="toggle-device" style="font-size:0.85rem; margin-left: 8px;">ID: ${dev.id}</span>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn-outline" onclick="savePfsAreas('${dev.id}')" style="width: auto; padding: 6px 16px; font-size: 0.85rem; border-color: var(--accent); color: var(--accent);">💾 Salva</button>
              <button class="btn-outline" onclick="deleteDeviceAreas('${dev.id}')" style="width: auto; padding: 6px 16px; font-size: 0.85rem; border-color: var(--red); color: var(--red);">🗑️ Elimina</button>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <label for="areas-${dev.id}" style="font-size:0.85rem; color:var(--text-muted); font-weight: 600;">Aree preferite (separate da virgola):</label>
            <input type="text" id="areas-${dev.id}" value="${areasString.replace(/"/g, '&quot;')}" class="rename-field" placeholder="Es. Grugliasco, Torino, TOH_1">
          </div>
        </div>
      `;
    }

    content.innerHTML = `
      <div class="tecnici-panel fade-in">
        <div class="tecnici-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div class="content-title">Aree Preferite Tecnici</div>
          <div class="tecnici-note" style="width:100%;">
            Queste sono le aree (comuni, province o PFS) preferite di ogni tecnico (quelle con la stellina attiva).
            Modificando queste aree e salvando, l'app del tecnico si aggiornerà in tempo reale.
          </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:16px;">
          ${devicesHtml}
        </div>
      </div>
    `;
  } catch(e) {
    console.error(e);
    content.innerHTML = `<div class="state-box fade-in"><p>Errore caricamento aree preferite.</p></div>`;
  }
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
