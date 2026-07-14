import { db, collection, doc, deleteDoc, onSnapshot } from './firebase.js';
import { escapeHtml, showToast, showConfirm } from './utils.js';

import { currentUser } from './state.js';

let _pfsListeners = [];
let _globalPfsListener = null;
let _unseenPfsCount = 0;

export function clearUnseenPfsCount() {
  _unseenPfsCount = 0;
  const badge = document.getElementById('cnt-pfs');
  if (badge) {
    badge.style.display = 'none';
    badge.textContent = '0';
  }
}

export function requestNotificationPermission() {
  if ('Notification' in window) {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }
}

export function startGlobalPfsNotifications() {
  if (_globalPfsListener) return;
  
  requestNotificationPermission();

  let isInitialLoad = true;
  _globalPfsListener = onSnapshot(collection(db, 'pfs_segnalati'), (snapshot) => {
    if (isInitialLoad) {
      isInitialLoad = false;
      return;
    }
    
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        const title = 'Nuovo PFS Segnalato';
        const tech = data.tecnico || 'Tecnico';
        const bodyText = `${tech} ha segnalato il PFS ${data.nome_pfs}\nIndirizzo: ${data.nuovo_indirizzo}`;
        
        // Show System Notification se la finestra è in background
        if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
          const notification = new Notification(title, {
            body: bodyText,
            icon: 'icon-192.png'
          });
          notification.onclick = () => {
            window.focus();
            window.location.hash = '#/admin/pfs';
            notification.close();
          };
        } else {
          // Mostra Toast in-app (asHtml = true), escapando prima i campi utente!
          const safeTech = escapeHtml(tech);
          const safeNome = escapeHtml(data.nome_pfs);
          const safeIndirizzo = escapeHtml(data.nuovo_indirizzo);
          showToast(`🚨 <b>${title}</b><br>${safeTech}: ${safeNome}<br><small>${safeIndirizzo}</small>`, 'info', 10000, true);
        }

        // Se non siamo sulla tab PFS, incrementa il badge
        if (window.location.hash !== '#/admin/pfs') {
          _unseenPfsCount++;
          const badge = document.getElementById('cnt-pfs');
          if (badge) {
            badge.style.display = 'inline-flex';
            badge.textContent = _unseenPfsCount;
          }
        }
      }
    });
  });
}

export function stopGlobalPfsNotifications() {
  if (_globalPfsListener) {
    _globalPfsListener();
    _globalPfsListener = null;
  }
}

export function stopPfsListeners() {
  _pfsListeners.forEach(unsub => unsub());
  _pfsListeners = [];
}

// Parse "HH:mm dd/MM/yyyy" → Date timestamp (cross-day safe sort)
function parseOrario(str) {
  if (!str) return 0;
  try {
    const s = String(str).trim();
    const parts = s.split(/\s+/);
    if (parts.length < 2) return 0;
    
    let timePart, datePart;
    if (parts[0].includes(':')) {
       timePart = parts[0];
       datePart = parts[1];
    } else {
       datePart = parts[0];
       timePart = parts[1];
    }

    const [hh, mm, ss] = timePart.split(':');
    const [dd, mo, yyyy] = datePart.split('/');
    
    const dateObj = new Date(yyyy, mo - 1, dd, hh, mm, ss || 0);
    const time = dateObj.getTime();
    return isNaN(time) ? 0 : time;
  } catch { 
    return 0; 
  }
}

export async function showPfsDashboard() {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  const el = document.getElementById('nav-pfs');
  if (el) el.classList.add('active');
  const content = document.getElementById('content');
  if (currentUser.role !== 'admin') {
    content.innerHTML = `<div class="state-box fade-in"><h2>Accesso Negato</h2><p>Non hai i permessi per visualizzare questa pagina.</p></div>`;
    return;
  }
  content.innerHTML = `<div class="state-box"><div class="loader-spinner"></div><p>Caricamento dati PFS…</p></div>`;

  stopPfsListeners();
  clearUnseenPfsCount();

  let signals = [];
  let logs = [];
  let signalsLoaded = false;
  let logsLoaded = false;

  function renderIfReady() {
    if (!signalsLoaded || !logsLoaded) return;

    // Salva le checkbox selezionate prima del render
    const checkedSigs = Array.from(document.querySelectorAll('.sig-check:checked')).map(cb => cb.closest('.pfs-card').dataset.id);
    const checkedLogs = Array.from(document.querySelectorAll('.log-check:checked')).map(cb => cb.closest('.pfs-card').dataset.id);

    let html = `
      <div class="content-header fade-in">
        <div>
          <div class="content-title">Gestione PFS</div>
          <div class="content-subtitle">Elimina o gestisci segnalazioni ed accessi</div>
        </div>
      </div>
      <div class="tecnici-panel fade-in">
        <div id="pfs-delete-toolbar" class="delete-toolbar">
          <span id="pfs-delete-count" style="font-size:14px; font-weight:600; color:var(--red)">0 selezionati</span>
          <button class="btn-bulk-delete" onclick="deleteSelectedPfs()">Elimina Selezionati</button>
        </div>`;

    // ── Section 1: Signals ──
    html += `<div style="margin-bottom:48px">
      <h3 class="pfs-section-title pfs-section-red">
        <span class="pfs-section-dot" style="background:var(--red)"></span>
        Nuovi Indirizzi
        <span class="pfs-badge">${signals.length}</span>
        ${signals.length > 0 ? `<label class="pfs-check-wrapper" style="margin-left:8px" title="Seleziona tutti">
          <input type="checkbox" onclick="toggleAllPfs('sig', this.checked)">
          <span class="pfs-check-custom"></span>
        </label>` : ''}
      </h3>`;

    if (signals.length === 0) {
      html += `<div class="pfs-empty">Nessuna segnalazione.</div>`;
    } else {
      signals.forEach(s => {
        const mapUrl = s.lat && s.lng ? `https://www.google.com/maps?q=${s.lat},${s.lng}` : null;
        html += `<div class="pfs-card" data-id="${escapeHtml(s.id)}" data-coll="pfs_segnalati">
          <div class="pfs-card-check">
            <label class="pfs-check-wrapper">
              <input type="checkbox" class="sig-check" onclick="updatePfsToolbar()">
              <span class="pfs-check-custom"></span>
            </label>
          </div>
          <div class="pfs-card-body">
            <div class="pfs-card-title">${escapeHtml(s.nome_pfs)}</div>
            <div class="pfs-card-sub">${escapeHtml(s.nuovo_indirizzo)}</div>
            <div class="pfs-card-meta">
              <span class="pfs-meta-item">👷 ${escapeHtml(s.tecnico)}</span>
              <span class="pfs-meta-item pfs-meta-time">🕐 ${escapeHtml(s.orario)}</span>
              ${s.comune ? `<span class="pfs-meta-item">🏘️ ${escapeHtml(s.comune)}</span>` : ''}
            </div>
          </div>
          <div class="pfs-card-actions">
            ${mapUrl ? `<a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="pfs-action-btn pfs-action-map" title="Mappa">📍</a>` : ''}
            <button class="pfs-action-btn pfs-action-del" onclick="deletePfsItem('${escapeHtml(s.id)}', 'pfs_segnalati')" title="Elimina">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>`;
      });
    }
    html += `</div>`;

    // ── Section 2: Logs ──
    html += `<div>
      <h3 class="pfs-section-title pfs-section-accent">
        <span class="pfs-section-dot" style="background:var(--accent)"></span>
        Log Accessi (Accuracy)
        <span class="pfs-badge">${logs.length}</span>
        ${logs.length > 0 ? `<label class="pfs-check-wrapper" style="margin-left:8px" title="Seleziona tutti">
          <input type="checkbox" onclick="toggleAllPfs('log', this.checked)">
          <span class="pfs-check-custom"></span>
        </label>` : ''}
      </h3>`;

    if (logs.length === 0) {
      html += `<div class="pfs-empty">Nessun log.</div>`;
    } else {
      logs.slice(0, 100).forEach(l => {
        const mapUrl = `https://www.google.com/maps?q=${l.lat},${l.lng}`;
        html += `<div class="pfs-card" data-id="${escapeHtml(l.id)}" data-coll="pfs_logs">
          <div class="pfs-card-check">
            <label class="pfs-check-wrapper">
              <input type="checkbox" class="log-check" onclick="updatePfsToolbar()">
              <span class="pfs-check-custom"></span>
            </label>
          </div>
          <div class="pfs-card-body">
            <div class="pfs-card-title">${escapeHtml(l.nome_pfs)}</div>
            <div class="pfs-card-sub">${escapeHtml(l.indirizzo_pfs || '')}</div>
            <div class="pfs-card-meta">
              <span class="pfs-meta-item">👷 ${escapeHtml(l.tecnico)}</span>
              <span class="pfs-meta-item pfs-meta-time">🕐 ${escapeHtml(l.orario)}</span>
              <span class="pfs-meta-item pfs-meta-coords">📌 ${l.lat != null && l.lng != null ? `${l.lat.toFixed(5)}, ${l.lng.toFixed(5)}` : '—'}</span>
            </div>
          </div>
          <div class="pfs-card-actions">
            <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="pfs-action-btn pfs-action-map" title="Controlla">📍</a>
            <button class="pfs-action-btn pfs-action-del" onclick="deletePfsItem('${escapeHtml(l.id)}', 'pfs_logs')" title="Elimina">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>`;
      });
    }
    html += `</div></div>`;

    content.innerHTML = html;

    // Ripristina le checkbox selezionate
    checkedSigs.forEach(id => {
      const cb = document.querySelector(`.pfs-card[data-id="${id}"] .sig-check`);
      if (cb) cb.checked = true;
    });
    checkedLogs.forEach(id => {
      const cb = document.querySelector(`.pfs-card[data-id="${id}"] .log-check`);
      if (cb) cb.checked = true;
    });
    updatePfsToolbar();
  }

  const unsubSigs = onSnapshot(collection(db, 'pfs_segnalati'), (snap) => {
    signals = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a,b) => parseOrario(b.orario) - parseOrario(a.orario));
    signalsLoaded = true;
    renderIfReady();
  }, (e) => {
    console.error(e);
    content.innerHTML = `<div class="state-box fade-in"><p>Errore caricamento segnalazioni PFS.</p></div>`;
  });

  const unsubLogs = onSnapshot(collection(db, 'pfs_logs'), (snap) => {
    logs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                  .sort((a,b) => parseOrario(b.orario) - parseOrario(a.orario));
    logsLoaded = true;
    renderIfReady();
  }, (e) => {
    console.error(e);
    content.innerHTML = `<div class="state-box fade-in"><p>Errore caricamento log PFS.</p></div>`;
  });

  _pfsListeners.push(unsubSigs, unsubLogs);
}

export function toggleAllPfs(type, checked) {
  document.querySelectorAll('.' + type + '-check').forEach(cb => cb.checked = checked);
  updatePfsToolbar();
}

export function updatePfsToolbar() {
  const all = document.querySelectorAll('.sig-check:checked, .log-check:checked');
  const toolbar = document.getElementById('pfs-delete-toolbar');
  const countLabel = document.getElementById('pfs-delete-count');
  if (!toolbar) return;
  if (all.length > 0) {
    toolbar.style.display = 'flex';
    if (countLabel) countLabel.textContent = `${all.length} elementi selezionati`;
  } else {
    toolbar.style.display = 'none';
  }
}

export async function deletePfsItem(id, collectionName) {
  const ok = await showConfirm({
    title: 'Eliminare elemento?',
    msg: 'L\'operazione è irreversibile.',
    icon: '🗑️',
    okLabel: 'Elimina'
  });
  if (!ok) return;
  try {
    await deleteDoc(doc(db, collectionName, id));
    showToast('Elemento eliminato.', 'success');
    showPfsDashboard();
  } catch(e) {
    showToast('Errore: ' + e.message, 'error', 5000);
  }
}

export async function deleteSelectedPfs() {
  const selected = document.querySelectorAll('.sig-check:checked, .log-check:checked');
  const count = selected.length;
  const ok = await showConfirm({
    title: `Eliminare ${count} element${count === 1 ? 'o' : 'i'}?`,
    msg: 'L\'operazione è irreversibile e coinvolge tutti gli elementi selezionati.',
    icon: '🗑️',
    okLabel: `Elimina ${count} element${count === 1 ? 'o' : 'i'}`
  });
  if (!ok) return;

  const btn = document.querySelector('.btn-bulk-delete');
  if (btn) { btn.innerHTML = '<span class="btn-spinner" style="border-color:rgba(255,255,255,0.3);border-top-color:white"></span> Eliminazione…'; btn.disabled = true; }

  try {
    const promises = [];
    selected.forEach(cb => {
      const card = cb.closest('.pfs-card');
      const id = card.dataset.id;
      const coll = card.dataset.coll;
      promises.push(deleteDoc(doc(db, coll, id)));
    });
    await Promise.all(promises);
    showToast(`${count} element${count === 1 ? 'o eliminato' : 'i eliminati'}.`, 'success');
    showPfsDashboard();
  } catch(e) {
    showToast('Errore durante la cancellazione multipla: ' + e.message, 'error', 5000);
    if (btn) { btn.textContent = `Elimina Selezionati`; btn.disabled = false; }
  }
}
