// ── App Entry Point ──
// Imports all modules and wires up global event handlers

import { APPALTI } from './state.js';
import { currentAppalto, currentDate, setCurrentAppalto, setCurrentDate } from './state.js';
import { showToast } from './utils.js';
import { doLogin, doLogout, checkSession } from './auth.js';
import {
  loadAppalto, selectAppalto, toggleDrawer, closeDrawer,
  onDateChange, closeSnapshotDropdown, toggleSnapshotDropdown, pickSnapshotDate,
  filterMaterials, scrollCellIntoViewCenter, scrollTechHeaderNeighbor, loadGeo,
  preloadCounts
} from './data.js';
import { showTecnici, deleteTecnico, renameTecnico, toggleTecnico } from './tecnici.js';
import { showPfsDashboard, toggleAllPfs, updatePfsToolbar, deletePfsItem, deleteSelectedPfs } from './pfs.js';
import { exportToExcel, printTable } from './export.js';

// ── THEME ──
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.content = theme === 'dark' ? '#020617' : '#f1f5f9';
  localStorage.setItem('tw_theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Init theme immediately
applyTheme(localStorage.getItem('tw_theme') || 'dark');

// ── OFFLINE BANNER ──
function updateOnlineStatus() {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  if (navigator.onLine) banner.classList.remove('show');
  else banner.classList.add('show');
}
window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ── PWA SERVICE WORKER (Step 11) ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      // Check for updates every 60 seconds
      setInterval(() => reg.update(), 60000);
    }).catch(() => {});
  });

  // Listen for SW update notifications
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type === 'SW_UPDATED') {
      showToast('Nuova versione disponibile — ricarica la pagina', 'info', 8000);
    }
  });
}

// ── BUILD SIDEBAR ON DOM READY ──
document.addEventListener('DOMContentLoaded', () => {
  const sbContainer = document.getElementById('sidebar-appalti');
  if (sbContainer) {
    sbContainer.innerHTML = APPALTI.map((a, idx) => `
      <a href="#/appalti/${a}/live" class="sidebar-item" id="nav-${a}" role="button" tabindex="0" onclick="closeDrawer()">
        <div class="sidebar-item-left">
          <div class="dot-indicator"></div>
          ${a}
        </div>
        <span class="sidebar-count" id="cnt-${a}">—</span>
      </a>
    `).join('');
  }
});

// ── HASH ROUTER (Step 3) ──
function handleHashChange() {
  const loginForm = document.getElementById('login-screen');
  if (loginForm && loginForm.style.display !== 'none') return; // Do not route if not logged in

  const hash = window.location.hash.slice(1);
  if (!hash || hash === '/') {
    window.location.hash = `#/appalti/${APPALTI[0]}/live`;
    return;
  }

  const parts = hash.split('/').filter(Boolean);
  const route = parts[0];

  if (route === 'admin') {
    const sub = parts[1];
    if (sub === 'tecnici') showTecnici();
    else if (sub === 'pfs') showPfsDashboard();
  } else if (route === 'appalti') {
    const appaltoName = parts[1] || APPALTI[0];
    const dateKey = parts[2] || 'live';
    
    // Highlight sidebar
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    const el = document.getElementById('nav-' + appaltoName);
    if (el) el.classList.add('active');

    setCurrentAppalto(appaltoName);
    setCurrentDate(dateKey);

    document.getElementById('tb-appalto').textContent = appaltoName;
    loadAppalto(appaltoName, dateKey);
  }
}
window.addEventListener('hashchange', handleHashChange);

// ── KEYBOARD EVENTS ──
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const loginVisible = document.getElementById('login-screen').style.display !== 'none';
  const anyModalOpen = document.getElementById('confirm-overlay').classList.contains('show')
                    || document.getElementById('rename-overlay').classList.contains('show');
  if (loginVisible && !anyModalOpen) doLogin();
});

// Snapshot dropdown keyboard navigation
document.addEventListener('keydown', e => {
  const openDropdown = document.querySelector('.snapshot-dropdown.open');
  if (!openDropdown) return;
  const options = Array.from(openDropdown.querySelectorAll('.snapshot-option'));
  if (!options.length) return;

  const currentIndex = options.findIndex(o => o === document.activeElement);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = options[(currentIndex + 1 + options.length) % options.length];
    next.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = options[(currentIndex - 1 + options.length) % options.length];
    prev.focus();
  } else if (e.key === 'Enter' && currentIndex >= 0) {
    e.preventDefault();
    const val = options[currentIndex].getAttribute('data-value');
    if (val) pickSnapshotDate(val);
  } else if (e.key === 'Escape') {
    closeSnapshotDropdown();
  }
});

document.addEventListener('click', closeSnapshotDropdown);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSnapshotDropdown();
});

// ── AUTO LOGIN CHECK ──
checkSession();

// ── REGISTER ALL GLOBAL HANDLERS (for HTML onclick) ──
window.doLogin = doLogin;
window.doLogout = doLogout;
window.toggleTheme = toggleTheme;
window.toggleDrawer = toggleDrawer;
window.closeDrawer = closeDrawer;
window.selectAppalto = selectAppalto;
window.loadAppalto = loadAppalto;
window.refreshData = () => loadAppalto(currentAppalto, currentDate);
window.onDateChange = onDateChange;
window.toggleSnapshotDropdown = toggleSnapshotDropdown;
window.pickSnapshotDate = pickSnapshotDate;
window.closeSnapshotDropdown = closeSnapshotDropdown;
window.filterMaterials = filterMaterials;
window.scrollCellIntoViewCenter = scrollCellIntoViewCenter;
window.scrollTechHeaderNeighbor = scrollTechHeaderNeighbor;
window.loadGeo = loadGeo;
window.exportToExcel = exportToExcel;
window.printTable = printTable;
window.showTecnici = showTecnici;
window.deleteTecnico = deleteTecnico;
window.renameTecnico = renameTecnico;
window.toggleTecnico = toggleTecnico;
window.showPfsDashboard = showPfsDashboard;
window.toggleAllPfs = toggleAllPfs;
window.updatePfsToolbar = updatePfsToolbar;
window.deletePfsItem = deletePfsItem;
window.deleteSelectedPfs = deleteSelectedPfs;
window.showToast = showToast;
