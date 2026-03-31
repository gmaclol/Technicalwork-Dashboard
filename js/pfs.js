// ── PFS Dashboard ──
import { db, collection, getDocs, doc, deleteDoc } from './firebase.js';
import { escapeHtml, showToast, showConfirm } from './utils.js';

import { currentUser } from './state.js';

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

  try {
    const snapSignals = await getDocs(collection(db, 'pfs_segnalati'));
    const snapLogs = await getDocs(collection(db, 'pfs_logs'));

    const signals = snapSignals.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a,b) => (b.orario || "").localeCompare(a.orario || ""));
    const logs = snapLogs.docs.map(d => ({ id: d.id, ...d.data() }))
                 .sort((a,b) => (b.orario || "").localeCompare(a.orario || ""));

    let html = `<div class="tecnici-panel fade-in">
      <div class="content-header" style="padding:0; margin-bottom: 32px; background:transparent; border:none">
        <div>
          <div class="content-title">Gestione PFS</div>
          <div class="content-subtitle">Elimina o gestisci segnalazioni ed accessi</div>
        </div>
      </div>
      <div id="pfs-delete-toolbar" class="delete-toolbar">
        <span id="pfs-delete-count" style="font-size:14px; font-weight:600; color:var(--red)">0 selezionati</span>
        <button class="btn-bulk-delete" onclick="deleteSelectedPfs()">Elimina Selezionati</button>
      </div>`;

    // Table 1: Signals
    html += `<div style="margin-bottom:48px">
      <h3 style="margin-bottom:16px; color:var(--red); font-size:18px; display:flex; align-items:center; gap:10px">
        <span style="width:8px; height:8px; border-radius:50%; background:var(--red)"></span>
        Nuovi Indirizzi
      </h3>
      <div class="table-scroll" style="padding:0; margin-top:0">
        <table style="font-size:13px">
          <thead>
            <tr>
              <th style="width:50px; padding:12px">
                <label class="pfs-check-wrapper">
                  <input type="checkbox" onclick="toggleAllPfs('sig', this.checked)">
                  <span class="pfs-check-custom"></span>
                </label>
              </th>
              <th class="th-inner">PFS / Indirizzo</th>
              <th class="th-inner">Tecnico</th>
              <th class="th-inner">Orario</th>
              <th class="th-inner" style="text-align:right">Azioni</th>
            </tr>
          </thead>
          <tbody id="pfs-sig-body">`;

    if (signals.length === 0) {
      html += `<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted)">Nessuna segnalazione.</td></tr>`;
    } else {
      signals.forEach(s => {
        const mapUrl = s.lat && s.lng ? `https://www.google.com/maps?q=${s.lat},${s.lng}` : null;
        html += `<tr data-id="${escapeHtml(s.id)}" data-coll="pfs_segnalati">
          <td style="padding:12px">
            <label class="pfs-check-wrapper">
              <input type="checkbox" class="sig-check" onclick="updatePfsToolbar()">
              <span class="pfs-check-custom"></span>
            </label>
          </td>
          <td class="td-material">
            <div style="font-weight:700">${escapeHtml(s.nome_pfs)}</div>
            <div style="font-size:11px; opacity:0.7; font-weight:400">${escapeHtml(s.nuovo_indirizzo)}</div>
          </td>
          <td>${escapeHtml(s.tecnico)}</td>
          <td style="font-family:var(--font-mono); font-size:11px">${escapeHtml(s.orario)}</td>
          <td style="text-align:right">
            <div style="display:flex; justify-content:flex-end; gap:8px">
              ${mapUrl ? `<a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="tech-location" title="Mappa" style="background:var(--accent-glow)">📍</a>` : ''}
              <button class="btn-delete-row" onclick="deletePfsItem('${escapeHtml(s.id)}', 'pfs_segnalati')" title="Elimina">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
      });
    }
    html += `</tbody></table></div></div>`;

    // Table 2: Logs
    html += `<div>
      <h3 style="margin-bottom:16px; color:var(--accent); font-size:18px; display:flex; align-items:center; gap:10px">
        <span style="width:8px; height:8px; border-radius:50%; background:var(--accent)"></span>
        Log Accessi (Accuracy)
      </h3>
      <div class="table-scroll" style="padding:0; margin-top:0">
        <table style="font-size:12px">
          <thead>
            <tr>
              <th style="width:50px; padding:12px">
                <label class="pfs-check-wrapper">
                  <input type="checkbox" onclick="toggleAllPfs('log', this.checked)">
                  <span class="pfs-check-custom"></span>
                </label>
              </th>
              <th class="th-inner">Log PFS</th>
              <th class="th-inner">Posizione Rilevata</th>
              <th class="th-inner">Tecnico / Orario</th>
              <th class="th-inner" style="text-align:right">Azioni</th>
            </tr>
          </thead>
          <tbody id="pfs-log-body">`;

    if (logs.length === 0) {
      html += `<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted)">Nessun log.</td></tr>`;
    } else {
      logs.slice(0, 100).forEach(l => {
        const mapUrl = `https://www.google.com/maps?q=${l.lat},${l.lng}`;
        html += `<tr data-id="${escapeHtml(l.id)}" data-coll="pfs_logs">
          <td style="padding:12px">
            <label class="pfs-check-wrapper">
              <input type="checkbox" class="log-check" onclick="updatePfsToolbar()">
              <span class="pfs-check-custom"></span>
            </label>
          </td>
          <td class="td-material">
            <div style="font-weight:700">${escapeHtml(l.nome_pfs)}</div>
            <div style="font-size:10px; opacity:0.6">${escapeHtml(l.indirizzo_pfs || '')}</div>
          </td>
          <td style="color:var(--text-muted)">${l.lat.toFixed(5)}, ${l.lng.toFixed(5)}</td>
          <td>
            <div style="font-weight:600">${escapeHtml(l.tecnico)}</div>
            <div style="font-size:10px; opacity:0.6">${escapeHtml(l.orario)}</div>
          </td>
          <td style="text-align:right">
             <div style="display:flex; justify-content:flex-end; gap:8px">
              <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="tech-location" style="background:var(--accent-glow)" title="Controlla">📍</a>
              <button class="btn-delete-row" onclick="deletePfsItem('${escapeHtml(l.id)}', 'pfs_logs')" title="Elimina">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
      });
    }
    html += `</tbody></table></div></div></div>`;

    content.innerHTML = html;
  } catch (e) {
    content.innerHTML = `<div class="state-box fade-in"><p>Errore caricamento dati PFS.</p></div>`;
    console.error(e);
  }
}

export function toggleAllPfs(type, checked) {
  document.querySelectorAll('.' + type + '-check').forEach(cb => cb.checked = checked);
  updatePfsToolbar();
}

export function updatePfsToolbar() {
  const all = document.querySelectorAll('.sig-check:checked, .log-check:checked');
  const toolbar = document.getElementById('pfs-delete-toolbar');
  const countLabel = document.getElementById('pfs-delete-count');
  if (all.length > 0) {
    toolbar.style.display = 'flex';
    countLabel.textContent = `${all.length} elementi selezionati`;
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
      const row = cb.closest('tr');
      const id = row.dataset.id;
      const coll = row.dataset.coll;
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
