import { db, collection, doc, deleteDoc, onSnapshot, rtdb, ref, onValue, set, update } from './firebase.js';
import { escapeHtml, showToast, showConfirm } from './utils.js';

import { currentUser } from './state.js';
import { notifyPfsReport, clearPfsBadge } from './notifications.js';

let _pfsListeners = [];
let _globalPfsListener = null;
let _unseenPfsCount = 0;

// ── SANITIZER PER CHIAVI FIREBASE RTDB ──
function sanitizeKey(str) {
  if (!str) return 'unknown';
  return String(str).trim().replace(/[.#$/\[\]]/g, '_');
}

// ── REGISTRAZIONE PERSISTENTE DEI CONTRIBUTI PFS (ZERO COSTO SU RTDB) ──
export function recordPfsContribution(techName, type, docId) {
  if (!techName || !docId || !rtdb) return;
  const safeName = sanitizeKey(techName);
  const safeId = sanitizeKey(docId);
  const typeKey = type === 'signal' ? 'signals' : 'logs';

  // Salva l'evento su RTDB: la chiave è l'id stesso del documento, operazione idempotente
  set(ref(rtdb, `/pfs_stats/${safeName}/${typeKey}/${safeId}`), 1).catch(() => {});
  update(ref(rtdb, `/pfs_stats/${safeName}`), {
    name: techName,
    last_activity: Date.now()
  }).catch(() => {});
}

export function clearUnseenPfsCount() {
  _unseenPfsCount = 0;
  clearPfsBadge();
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
        if (data.tecnico) {
          recordPfsContribution(data.tecnico, 'signal', change.doc.id);
        }
        const title = 'Nuovo PFS Segnalato';
        const tech = data.tecnico || 'Tecnico';
        const bodyText = `${tech} ha segnalato il PFS ${data.nome_pfs}\nIndirizzo: ${data.nuovo_indirizzo}`;
        
        const safeTech = escapeHtml(tech);
        const safeNome = escapeHtml(data.nome_pfs);
        const safeIndirizzo = escapeHtml(data.nuovo_indirizzo);

        // Mostra Toast in-app
        showToast(`🚨 <b>${title}</b><br>${safeTech}: ${safeNome}<br><small>${safeIndirizzo}</small>`, 'info', 10000, true);

        // Se non siamo sulla tab PFS, incrementa contatore, badge e manda notifica di sistema Android
        if (window.location.hash !== '#/admin/pfs') {
          notifyPfsReport(tech, data.nome_pfs, data.nuovo_indirizzo);
          const badge = document.getElementById('cnt-pfs');
          if (badge) {
            badge.style.display = 'inline-flex';
            badge.textContent = parseInt(badge.textContent || 0) + 1;
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
  let pfsStatsData = {};
  let signalsLoaded = false;
  let logsLoaded = false;
  let statsLoaded = false;

  function renderIfReady() {
    if (!signalsLoaded || !logsLoaded || !statsLoaded) return;

    const prevScroll = {
      content: content ? content.scrollTop : 0,
      panel: content?.querySelector('.tecnici-panel')?.scrollTop || 0,
      window: window.scrollY
    };

    // Salva le checkbox selezionate prima del render
    const checkedSigs = Array.from(document.querySelectorAll('.sig-check:checked')).map(cb => cb.closest('.pfs-card')?.dataset?.id).filter(Boolean);
    const checkedLogs = Array.from(document.querySelectorAll('.log-check:checked')).map(cb => cb.closest('.pfs-card')?.dataset?.id).filter(Boolean);

    // ── Costruzione Classifica PFS persistente ──
    const userMap = new Map();

    // 1. Carica storico da RTDB /pfs_stats (conserva i punti anche se le card vengono cancellate)
    if (pfsStatsData && typeof pfsStatsData === 'object') {
      Object.entries(pfsStatsData).forEach(([safeKey, val]) => {
        if (!val || typeof val !== 'object') return;
        const displayName = val.name || safeKey;
        const normKey = displayName.trim().toLowerCase();
        if (!userMap.has(normKey)) {
          userMap.set(normKey, { name: displayName, signalIds: new Set(), logIds: new Set() });
        }
        const entry = userMap.get(normKey);
        if (val.signals && typeof val.signals === 'object') {
          Object.keys(val.signals).forEach(id => entry.signalIds.add(id));
        }
        if (val.logs && typeof val.logs === 'object') {
          Object.keys(val.logs).forEach(id => entry.logIds.add(id));
        }
      });
    }

    // 2. Unisci dati live da Firestore (idempotente grazie al Set)
    signals.forEach(s => {
      const tech = (s.tecnico || '').trim();
      if (!tech) return;
      const normKey = tech.toLowerCase();
      if (!userMap.has(normKey)) {
        userMap.set(normKey, { name: tech, signalIds: new Set(), logIds: new Set() });
      }
      userMap.get(normKey).signalIds.add(sanitizeKey(s.id));
    });

    logs.forEach(l => {
      const tech = (l.tecnico || '').trim();
      if (!tech) return;
      const normKey = tech.toLowerCase();
      if (!userMap.has(normKey)) {
        userMap.set(normKey, { name: tech, signalIds: new Set(), logIds: new Set() });
      }
      userMap.get(normKey).logIds.add(sanitizeKey(l.id));
    });

    // 3. Array ordinato per punteggio totale decrescente
    const rankingList = Array.from(userMap.values()).map(u => ({
      name: u.name,
      signals: u.signalIds.size,
      logs: u.logIds.size,
      total: u.signalIds.size + u.logIds.size
    })).filter(u => u.total > 0).sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      if (b.signals !== a.signals) return b.signals - a.signals;
      return a.name.localeCompare(b.name);
    });

    const totalContributions = rankingList.reduce((acc, curr) => acc + curr.total, 0);

    let rankingHtml = `
      <div class="pfs-ranking-box">
        <div class="pfs-ranking-header">
          <div class="pfs-ranking-title-group">
            <span class="pfs-ranking-icon">🏆</span>
            <div>
              <div class="pfs-ranking-title">Classifica Contributi PFS</div>
              <div class="pfs-ranking-subtitle">Chi contribuisce di più al database PFS (segnalazioni e verifiche GPS)</div>
            </div>
          </div>
          <div class="pfs-ranking-stats">
            <span class="pfs-ranking-stat-pill">👥 ${rankingList.length} Tecnic${rankingList.length === 1 ? 'o' : 'i'}</span>
            <span class="pfs-ranking-stat-pill">📍 ${totalContributions} Contribut${totalContributions === 1 ? 'o' : 'i'} Total${totalContributions === 1 ? 'e' : 'i'}</span>
          </div>
        </div>`;

    if (rankingList.length === 0) {
      rankingHtml += `
        <div class="pfs-ranking-empty">
          <span>ℹ️ Nessun contributo registrato finora. Le segnalazioni di nuovi indirizzi e i log di accesso GPS verranno tracciati qui in tempo reale.</span>
        </div>`;
    } else if (rankingList.length >= 3) {
      const first = rankingList[0];
      const second = rankingList[1];
      const third = rankingList[2];
      const others = rankingList.slice(3);

      rankingHtml += `
        <div class="pfs-podium">
          <!-- 2° Posto (Argento) -->
          <div class="pfs-podium-card pfs-podium-2">
            <div class="pfs-podium-badge">🥈 2° Posizione</div>
            <div class="pfs-podium-medal">🥈</div>
            <div class="pfs-podium-name" title="${escapeHtml(second.name)}">${escapeHtml(second.name)}</div>
            <div class="pfs-podium-score">${second.total}</div>
            <div class="pfs-podium-label">Contributi</div>
            <div class="pfs-podium-breakdown">
              <span class="pfs-breakdown-tag sig" title="Segnalazioni nuovi indirizzi">📍 ${second.signals} segn.</span>
              <span class="pfs-breakdown-tag log" title="Log accessi e verifiche GPS">📱 ${second.logs} log</span>
            </div>
          </div>

          <!-- 1° Posto (Oro) -->
          <div class="pfs-podium-card pfs-podium-1">
            <div class="pfs-podium-badge">🥇 1° Posizione</div>
            <div class="pfs-podium-medal">🥇</div>
            <div class="pfs-podium-name" title="${escapeHtml(first.name)}">${escapeHtml(first.name)}</div>
            <div class="pfs-podium-score">${first.total}</div>
            <div class="pfs-podium-label">Contributi</div>
            <div class="pfs-podium-breakdown">
              <span class="pfs-breakdown-tag sig" title="Segnalazioni nuovi indirizzi">📍 ${first.signals} segn.</span>
              <span class="pfs-breakdown-tag log" title="Log accessi e verifiche GPS">📱 ${first.logs} log</span>
            </div>
          </div>

          <!-- 3° Posto (Bronzo) -->
          <div class="pfs-podium-card pfs-podium-3">
            <div class="pfs-podium-badge">🥉 3° Posizione</div>
            <div class="pfs-podium-medal">🥉</div>
            <div class="pfs-podium-name" title="${escapeHtml(third.name)}">${escapeHtml(third.name)}</div>
            <div class="pfs-podium-score">${third.total}</div>
            <div class="pfs-podium-label">Contributi</div>
            <div class="pfs-podium-breakdown">
              <span class="pfs-breakdown-tag sig" title="Segnalazioni nuovi indirizzi">📍 ${third.signals} segn.</span>
              <span class="pfs-breakdown-tag log" title="Log accessi e verifiche GPS">📱 ${third.logs} log</span>
            </div>
          </div>
        </div>`;

      if (others.length > 0) {
        rankingHtml += `
          <div class="pfs-ranking-others">
            <span class="pfs-ranking-others-label">Altri collaboratori:</span>
            ${others.map((u, i) => `
              <div class="pfs-rank-pill" title="${escapeHtml(u.name)}: ${u.signals} segnalazioni, ${u.logs} log">
                <span class="pfs-rank-pos">#${i + 4}</span>
                <span class="pfs-rank-name">${escapeHtml(u.name)}</span>
                <span class="pfs-rank-score">${u.total}</span>
              </div>
            `).join('')}
          </div>`;
      }
    } else {
      // 1 o 2 tecnici
      rankingHtml += `
        <div class="pfs-ranking-grid">
          ${rankingList.map((u, i) => {
            const isGold = i === 0;
            const medal = isGold ? '🥇' : '🥈';
            const badgeClass = isGold ? 'pfs-podium-1' : 'pfs-podium-2';
            const posLabel = isGold ? '1° Posizione' : '2° Posizione';
            return `
            <div class="pfs-podium-card ${badgeClass}">
              <div class="pfs-podium-badge">${medal} ${posLabel}</div>
              <div class="pfs-podium-medal">${medal}</div>
              <div class="pfs-podium-name" title="${escapeHtml(u.name)}">${escapeHtml(u.name)}</div>
              <div class="pfs-podium-score">${u.total}</div>
              <div class="pfs-podium-label">Contributi</div>
              <div class="pfs-podium-breakdown">
                <span class="pfs-breakdown-tag sig" title="Segnalazioni nuovi indirizzi">📍 ${u.signals} segn.</span>
                <span class="pfs-breakdown-tag log" title="Log accessi e verifiche GPS">📱 ${u.logs} log</span>
              </div>
            </div>`;
          }).join('')}
        </div>`;
    }

    rankingHtml += `</div>`;

    let sectionsHtml = '';

    // ── Section 1: Signals ──
    sectionsHtml += `<div style="margin-bottom:48px">
      <h3 class="pfs-section-title pfs-section-red">
        <span class="pfs-section-dot" style="background:var(--red)"></span>
        Nuovi Indirizzi
        <span class="pfs-badge">${signals.length}</span>
        ${signals.length > 0 ? `<label class="pfs-check-wrapper" style="margin-left:8px" title="Seleziona tutti">
          <input type="checkbox" onclick="toggleAllPfs('sig', this.checked)" aria-label="Seleziona tutte le segnalazioni">
          <span class="pfs-check-custom"></span>
        </label>` : ''}
      </h3>`;

    if (signals.length === 0) {
      sectionsHtml += `<div class="pfs-empty">Nessuna segnalazione.</div>`;
    } else {
      signals.forEach(s => {
        const mapUrl = s.lat && s.lng ? `https://www.google.com/maps?q=${s.lat},${s.lng}` : null;
        sectionsHtml += `<div class="pfs-card" data-id="${escapeHtml(s.id)}" data-coll="pfs_segnalati">
          <div class="pfs-card-check">
            <label class="pfs-check-wrapper">
              <input type="checkbox" class="sig-check" onclick="updatePfsToolbar()" aria-label="Seleziona segnalazione per ${escapeHtml(s.nome_pfs || 'PFS')}">
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
            ${mapUrl ? `<a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="pfs-action-btn pfs-action-map" title="Mappa" aria-label="Visualizza mappa per ${escapeHtml(s.nome_pfs)}">📍</a>` : ''}
            <button class="pfs-action-btn pfs-action-del" onclick="deletePfsItem('${escapeHtml(s.id)}', 'pfs_segnalati')" title="Elimina" aria-label="Elimina segnalazione per ${escapeHtml(s.nome_pfs)}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>`;
      });
    }
    sectionsHtml += `</div>`;

    // ── Section 2: Logs ──
    sectionsHtml += `<div>
      <h3 class="pfs-section-title pfs-section-accent">
        <span class="pfs-section-dot" style="background:var(--accent)"></span>
        Log Accessi (Accuracy)
        <span class="pfs-badge">${logs.length}</span>
        ${logs.length > 0 ? `<label class="pfs-check-wrapper" style="margin-left:8px" title="Seleziona tutti">
          <input type="checkbox" onclick="toggleAllPfs('log', this.checked)" aria-label="Seleziona tutti i log">
          <span class="pfs-check-custom"></span>
        </label>` : ''}
      </h3>`;

    if (logs.length === 0) {
      sectionsHtml += `<div class="pfs-empty">Nessun log.</div>`;
    } else {
      logs.forEach(l => {
        const mapUrl = l.lat != null && l.lng != null ? `https://www.google.com/maps?q=${l.lat},${l.lng}` : null;
        sectionsHtml += `<div class="pfs-card" data-id="${escapeHtml(l.id)}" data-coll="pfs_logs">
          <div class="pfs-card-check">
            <label class="pfs-check-wrapper">
              <input type="checkbox" class="log-check" onclick="updatePfsToolbar()" aria-label="Seleziona log per ${escapeHtml(l.nome_pfs || 'PFS')}">
              <span class="pfs-check-custom"></span>
            </label>
          </div>
          <div class="pfs-card-body">
            <div class="pfs-card-title">${escapeHtml(l.nome_pfs)}</div>
            <div class="pfs-card-sub">${l.lat != null && l.lng != null ? `Lat: ${l.lat.toFixed(5)}, Lng: ${l.lng.toFixed(5)}` : 'Coordinate non disponibili'}${l.accuracy != null ? ` (Precisione: ±${Math.round(l.accuracy)}m)` : ''}</div>
            <div class="pfs-card-meta">
              <span class="pfs-meta-item">📱 ${escapeHtml(l.tecnico)}</span>
              <span class="pfs-meta-item pfs-meta-time">🕐 ${escapeHtml(l.orario)}</span>
              ${l.comune ? `<span class="pfs-meta-item">🏘️ ${escapeHtml(l.comune)}</span>` : ''}
            </div>
          </div>
          <div class="pfs-card-actions">
            ${mapUrl ? `<a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="pfs-action-btn pfs-action-map" title="Controlla" aria-label="Visualizza mappa per ${escapeHtml(l.nome_pfs)}">📍</a>` : ''}
            <button class="pfs-action-btn pfs-action-del" onclick="deletePfsItem('${escapeHtml(l.id)}', 'pfs_logs')" title="Elimina" aria-label="Elimina log per ${escapeHtml(l.nome_pfs)}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>`;
      });
    }
    sectionsHtml += `</div>`;

    const existingContainer = document.getElementById('pfs-content-container');
    const existingRanking = document.getElementById('pfs-ranking-container');
    if (existingContainer && existingRanking) {
      existingRanking.innerHTML = rankingHtml;
      existingContainer.innerHTML = sectionsHtml;
    } else {
      content.innerHTML = `
        <div class="content-header fade-in">
          <div>
            <div class="content-title">Gestione PFS</div>
            <div class="content-subtitle">Elimina o gestisci segnalazioni ed accessi</div>
          </div>
        </div>
        <div class="tecnici-panel fade-in">
          <div id="pfs-ranking-container">
            ${rankingHtml}
          </div>
          <div id="pfs-delete-toolbar" class="delete-toolbar">
            <span id="pfs-delete-count" style="font-size:14px; font-weight:600; color:var(--red)">0 selezionati</span>
            <button class="btn-bulk-delete" onclick="deleteSelectedPfs()" aria-label="Elimina elementi selezionati">Elimina Selezionati</button>
          </div>
          <div id="pfs-content-container">
            ${sectionsHtml}
          </div>
        </div>`;
    }

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

    const restorePfsScroll = () => {
      if (prevScroll.content) content.scrollTop = prevScroll.content;
      const panel = content.querySelector('.tecnici-panel');
      if (panel && prevScroll.panel) panel.scrollTop = prevScroll.panel;
      if (prevScroll.window) window.scrollTo(0, prevScroll.window);
    };
    restorePfsScroll();
    requestAnimationFrame(restorePfsScroll);
  }

  const unsubSigs = onSnapshot(collection(db, 'pfs_segnalati'), (snap) => {
    signals = snap.docs.map(d => {
      const data = d.data();
      if (data.tecnico) recordPfsContribution(data.tecnico, 'signal', d.id);
      return { id: d.id, ...data };
    }).sort((a,b) => parseOrario(b.orario) - parseOrario(a.orario));
    signalsLoaded = true;
    renderIfReady();
  }, (e) => {
    console.error(e);
    content.innerHTML = `<div class="state-box fade-in"><p>Errore caricamento segnalazioni PFS.</p></div>`;
  });

  const unsubLogs = onSnapshot(collection(db, 'pfs_logs'), (snap) => {
    logs = snap.docs.map(d => {
      const data = d.data();
      if (data.tecnico) recordPfsContribution(data.tecnico, 'log', d.id);
      return { id: d.id, ...data };
    }).sort((a,b) => parseOrario(b.orario) - parseOrario(a.orario));
    logsLoaded = true;
    renderIfReady();
  }, (e) => {
    console.error(e);
    content.innerHTML = `<div class="state-box fade-in"><p>Errore caricamento log PFS.</p></div>`;
  });

  const unsubStats = onValue(ref(rtdb, '/pfs_stats'), (snap) => {
    pfsStatsData = snap.val() || {};
    statsLoaded = true;
    renderIfReady();
  }, (e) => {
    console.warn("Errore caricamento /pfs_stats RTDB:", e);
    statsLoaded = true;
    renderIfReady();
  });

  _pfsListeners.push(unsubSigs, unsubLogs, unsubStats);
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
  } catch(e) {
    showToast('Errore durante la cancellazione multipla: ' + e.message, 'error', 5000);
    if (btn) { btn.textContent = `Elimina Selezionati`; btn.disabled = false; }
  }
}
