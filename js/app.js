import { db, rtdb, ref, onValue, set, update, onDisconnect, serverTimestamp, doc, onSnapshot, enableNetwork, disableNetwork } from './firebase.js';
import { APPALTI, currentUser, currentAppalto, currentDate, setCurrentAppalto, setCurrentDate, loadConfig, invalidateConfigCache } from './state.js';
import { preloadCounts, loadAppalto, filterMaterials, toggleSnapshotDropdown, pickSnapshotDate, closeSnapshotDropdown, selectAppalto, onDateChange, loadGeo, addMaterialRow, editMaterialRow, deleteMaterialRow, scrollCellIntoViewCenter, scrollTechHeaderNeighbor, forceListUpdateFromGithub, toggleDrawer, closeDrawer } from './data.js';
import { escapeHtml, showConfirm, showToast } from './utils.js';
import { exportToExcel, printTable } from './export.js';
import { showTecnici, deleteTecnico, renameTecnico, toggleTecnico, renameWebTecnico, deleteWebTecnico, showBanned } from './tecnici.js';
import { showPfsDashboard, toggleAllPfs, updatePfsToolbar, deletePfsItem, deleteSelectedPfs } from './pfs.js';
import { showAreeDashboard, savePfsAreas, deleteDeviceAreas, renameDevice } from './aree.js';
import { initPfsLookup, initPfsLookupSidebar, pfsLookupSearch, pfsLookupSelectArea, pfsLookupToggleStar, pfsItemToggle, pfsSubmitAddress, pfsCopyAddress, pfsToggleRegion, pfsRegionSearch, pfsRegionToggleStar, getWebDeviceId, stopPfsLookupListener, showPfsRegionBrowser } from './pfsLookup.js';
import { doLogin, doLogout, checkSession } from './auth.js';

// ── OFFLINE BANNER ──
function updateOnlineStatus() {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  if (navigator.onLine) banner.classList.remove('show');
  else banner.classList.add('show');
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ── THEME ──
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('tw_theme', theme); } catch(e) {}
}
export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}
(function initTheme() {
  let theme;
  try { theme = localStorage.getItem('tw_theme'); } catch(e) {}
  applyTheme(theme || 'dark');
})();

// ── BUILD SIDEBAR (after config load) ──
async function buildSidebar() {
  await loadConfig();
  const sbContainer = document.getElementById('sidebar-appalti');
  if (sbContainer) {
    sbContainer.innerHTML = APPALTI.map((a, idx) => `
      <a href="#/appalti/${a}/live" class="sidebar-item" id="nav-${a}" role="button" tabindex="0" onclick="closeDrawer()">
        <div class="sidebar-item-left">
          <div class="dot-indicator"></div>
          ${escapeHtml(a)}
        </div>
        <span class="sidebar-count" id="cnt-${a}">—</span>
      </a>
    `).join('');
  }
  await preloadCounts();

  const config = JSON.parse(localStorage.getItem('tw_config') || '{}');
  const pfsAreas = config.pfs_areas || [];
  await initPfsLookup(pfsAreas);

  handleHashChange();
}

// ── PRESENCE SYSTEM (Realtime Database) ──
let _connectedRefUnsub = null;
let _selfStateUnsub    = null;
let _presenceUnsub     = null;
let _devicesUnsub      = null;
let _deviceNamesCache  = {};
let _visibilityHandler = null;
let _lastHiddenTime    = 0;

function initPresence() {
  if (!currentUser) return;

  const uid = getWebDeviceId() || `WEB-${currentUser.name}`;
  const userStatusRef = ref(rtdb, `/status/${uid}`);
  const connectedRef = ref(rtdb, '.info/connected');

  const conId = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  const myConRef = ref(rtdb, `/status/${uid}/connections/${conId}`);

  _connectedRefUnsub = onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      onDisconnect(myConRef).remove().then(() => {
        onDisconnect(userStatusRef).update({
          state: 'offline',
          last_changed: serverTimestamp()
        });

        set(myConRef, true);
        update(userStatusRef, {
          state: 'online',
          last_changed: serverTimestamp(),
          name: currentUser.name,
          type: 'web'
        });
      });
    }
  });

  _selfStateUnsub = onValue(userStatusRef, (snap) => {
    const data = snap.val();
    if (!data) return;
    const connections = data.connections || {};
    if (data.state === 'offline' || Object.keys(connections).length === 0) {
      set(myConRef, true);
      update(userStatusRef, {
        state: 'online',
        last_changed: serverTimestamp(),
        name: currentUser.name,
        type: 'web'
      });
    }
  });

  _visibilityHandler = () => {
    if (document.hidden) {
      _lastHiddenTime = Date.now();
      set(myConRef, null);
      update(userStatusRef, { state: 'offline', last_changed: serverTimestamp() });
    } else {
      if (_lastHiddenTime && (Date.now() - _lastHiddenTime > 60000)) {
        disableNetwork(db).then(() => enableNetwork(db));
      }
    }
  };
  document.addEventListener('visibilitychange', _visibilityHandler);

  // Admin online indicator
  if (currentUser.role === 'admin') {
    const onlineEl  = document.getElementById('topbar-online');
    const countEl   = document.getElementById('online-count');
    if (!onlineEl || !countEl) return;

    onlineEl.style.display = 'flex';

    if (onlineEl.dataset.tooltipBound !== 'true') {
      onlineEl.dataset.tooltipBound = 'true';
      const tooltipEl = document.getElementById('online-tooltip');
      if (tooltipEl) {
        const showTooltip = (e) => {
          e.preventDefault();
          tooltipEl.classList.add('show');
        };
        const hideTooltip = () => {
          tooltipEl.classList.remove('show');
        };
        onlineEl.addEventListener('pointerdown', showTooltip);
        onlineEl.addEventListener('pointerup', hideTooltip);
        onlineEl.addEventListener('pointerleave', hideTooltip);
        onlineEl.addEventListener('contextmenu', e => e.preventDefault());
      }
    }

    if (_devicesUnsub) _devicesUnsub();
    _devicesUnsub = onSnapshot(doc(db, 'settings', 'devices_names'), (snap) => {
      if (snap.exists()) _deviceNamesCache = snap.data();
    });

    if (_presenceUnsub) _presenceUnsub();
    _presenceUnsub = onValue(ref(rtdb, '/status'), (snap) => {
      const data = snap.val() || {};
      const active = Object.keys(data).map(k => {
        let u = data[k];
        const isOnline = u && (u.state === 'online' || (u.connections && Object.keys(u.connections).length > 0));
        if (!isOnline) return null;
        const deviceName = _deviceNamesCache && _deviceNamesCache[k] ? (_deviceNamesCache[k].name || _deviceNamesCache[k].baseName || k) : k;
        const info = _deviceNamesCache && _deviceNamesCache[k] ? _deviceNamesCache[k] : {};
        const icon = info.type === 'web' ? '🖥' : '📱';
        return { id: k, name: deviceName, icon };
      }).filter(Boolean);

      const userCount = active.length;
      countEl.textContent = userCount;
      const tooltipText = active.map(u => `${u.icon} ${u.name}`).join('\n');
      onlineEl.title = tooltipText;
      const tooltipEl = document.getElementById('online-tooltip');
      if (tooltipEl) tooltipEl.textContent = tooltipText || 'Nessun utente online';

      if (userCount > 0) {
        onlineEl.classList.add('has-online');
        countEl.style.display = 'inline';
      } else {
        onlineEl.classList.remove('has-online');
        countEl.style.display = 'none';
      }
    });
  }
}

function stopPresence() {
  if (_connectedRefUnsub) { _connectedRefUnsub(); _connectedRefUnsub = null; }
  if (_selfStateUnsub) { _selfStateUnsub(); _selfStateUnsub = null; }
  if (_presenceUnsub) { _presenceUnsub(); _presenceUnsub = null; }
  if (_devicesUnsub) { _devicesUnsub(); _devicesUnsub = null; }
  if (_visibilityHandler) {
    document.removeEventListener('visibilitychange', _visibilityHandler);
    _visibilityHandler = null;
  }
  const onlineEl = document.getElementById('topbar-online');
  if (onlineEl) onlineEl.style.display = 'none';
  if (currentUser) {
    const uid = getWebDeviceId() || `WEB-${currentUser.name}`;
    update(ref(rtdb, `/status/${uid}`), {
      state: 'offline',
      last_changed: serverTimestamp()
    });
  }
}

// ── DRAWER (imported from data.js — handles overlay too) ──
// toggleDrawer() and closeDrawer() are imported from data.js

// ── SCROLL LOCKING UTILITY ──
let _activeScrollLocks = 0;
window.lockScroll = function() {
  _activeScrollLocks++;
  if (_activeScrollLocks === 1) {
    document.body.classList.add('scroll-locked');
  }
};
window.unlockScroll = function() {
  _activeScrollLocks = Math.max(0, _activeScrollLocks - 1);
  if (_activeScrollLocks === 0) {
    document.body.classList.remove('scroll-locked');
  }
};

// ── DRAWER QoL: Escape key, swipe gesture, scroll lock, back button ──
(function initDrawerQoL() {
  // Escape closes drawer
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const sb = document.querySelector('.sidebar');
      if (sb && sb.classList.contains('open')) {
        e.preventDefault();
        closeDrawer();
        return;
      }
    }
  });

  // Tap overlay to close drawer instantly
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) {
    overlay.addEventListener('pointerdown', () => {
      closeDrawer();
    });
  }

  // Swipe-left to close drawer on mobile
  let _touchStartX = 0;
  let _touchStartY = 0;
  const SWIPE_THRESHOLD = 60;

  document.addEventListener('touchstart', e => {
    const sb = document.querySelector('.sidebar');
    if (!sb || !sb.classList.contains('open')) return;
    _touchStartX = e.touches[0].clientX;
    _touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const sb = document.querySelector('.sidebar');
    if (!sb || !sb.classList.contains('open')) return;
    const dx = e.changedTouches[0].clientX - _touchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - _touchStartY);
    // Swipe left (negative dx) and horizontal enough
    if (dx < -SWIPE_THRESHOLD && dy < SWIPE_THRESHOLD) {
      closeDrawer();
    }
  }, { passive: true });

  // Observe sidebar open/close to toggle body scroll lock
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    const observer = new MutationObserver(() => {
      if (sidebar.classList.contains('open')) {
        window.lockScroll();
      } else {
        window.unlockScroll();
      }
    });
    observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
  }

  // Back button closes drawer / modals before navigating
  window.addEventListener('popstate', () => {
    const sb = document.querySelector('.sidebar');
    if (sb && sb.classList.contains('open')) {
      closeDrawer();
    }
  });
})();

// ── HASH ROUTER ──
function handleHashChange() {
  const hash = window.location.hash || '#/appalti/Sertori/live';
  const path = hash.startsWith('#/') ? hash.slice(2) : hash.slice(1);
  const parts = path.split('/');
  const section = parts[0] || 'appalti';

  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));

  // Stop all view-specific listeners before routing
  stopPfsLookupListener();
  if (window._stopGlobalPfsNotifications) window._stopGlobalPfsNotifications();

  const tbAppalto = document.getElementById('tb-appalto');

  if (section === 'appalti') {
    const appalto = parts[1] || APPALTI[0];
    const dateKey = parts[2] || 'live';
    const navEl = document.getElementById('nav-' + appalto);
    if (navEl) navEl.classList.add('active');
    setCurrentAppalto(appalto);
    setCurrentDate(dateKey);
    loadAppalto(appalto, dateKey);
    if (tbAppalto) tbAppalto.textContent = appalto;
  } else {
    if (tbAppalto) tbAppalto.textContent = '—';
    if (section === 'admin') {
      const sub = parts[1] || 'tecnici';
      const navEl = document.getElementById('nav-' + sub);
      if (navEl) navEl.classList.add('active');
      if (sub === 'tecnici') showTecnici();
      else if (sub === 'pfs') showPfsDashboard();
      else if (sub === 'aree') showAreeDashboard();
      else if (sub === 'banned') showBanned();
    } else if (section === 'pfs-lookup') {
      const area = parts[1] || '';
      const navEl = document.getElementById('nav-pfs-lookup');
      if (navEl) navEl.classList.add('active');
      if (area) pfsLookupSelectArea(decodeURIComponent(area));
      else showPfsRegionBrowser();
    }
  }
}

// ── EVENT LISTENERS ──
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const loginScreen = document.getElementById('login-screen');
  const confirmOverlay = document.getElementById('confirm-overlay');
  const renameOverlay = document.getElementById('rename-overlay');
  const loginVisible = loginScreen && loginScreen.style.display !== 'none';
  const anyModalOpen = (confirmOverlay && confirmOverlay.classList.contains('show'))
                    || (renameOverlay && renameOverlay.classList.contains('show'));
  if (loginVisible && !anyModalOpen) doLogin();
});

document.addEventListener('keydown', e => {
  const openDropdown = document.querySelector('.snapshot-dropdown.open');
  if (!openDropdown) return;
  const items = openDropdown.querySelectorAll('.snapshot-item');
  const activeItem = openDropdown.querySelector('.snapshot-item.active');
  let idx = Array.from(items).indexOf(activeItem);
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    idx = Math.min(idx + 1, items.length - 1);
    items[idx].classList.add('active');
    if (activeItem && activeItem !== items[idx]) activeItem.classList.remove('active');
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    idx = Math.max(idx - 1, 0);
    items[idx].classList.add('active');
    if (activeItem && activeItem !== items[idx]) activeItem.classList.remove('active');
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (activeItem) activeItem.click();
  } else if (e.key === 'Escape') {
    closeSnapshotDropdown();
  }
});

document.addEventListener('click', closeSnapshotDropdown);

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
window.addMaterialRow = addMaterialRow;
window.editMaterialRow = editMaterialRow;
window.deleteMaterialRow = deleteMaterialRow;
window.showTecnici = showTecnici;
window.deleteTecnico = deleteTecnico;
window.renameTecnico = renameTecnico;
window.toggleTecnico = toggleTecnico;
window.renameWebTecnico = renameWebTecnico;
window.deleteWebTecnico = deleteWebTecnico;
window.showPfsDashboard = showPfsDashboard;
window.showAreeDashboard = showAreeDashboard;
window.savePfsAreas = savePfsAreas;
window.deleteDeviceAreas = deleteDeviceAreas;
window.renameDevice = renameDevice;
window.toggleAllPfs = toggleAllPfs;
window.updatePfsToolbar = updatePfsToolbar;
window.deletePfsItem = deletePfsItem;
window.deleteSelectedPfs = deleteSelectedPfs;
window.showToast = showToast;
window.pfsLookupSearch         = pfsLookupSearch;
window.pfsLookupSelectArea     = pfsLookupSelectArea;
window.pfsLookupToggleStar     = pfsLookupToggleStar;
window.pfsLookupSidebarSearch  = (q) => initPfsLookupSidebar(window._pfsLookupConfig || [], q);
window.pfsItemToggle           = pfsItemToggle;
window.pfsSubmitAddress        = pfsSubmitAddress;
window.pfsCopyAddress          = pfsCopyAddress;
window.pfsToggleRegion         = pfsToggleRegion;
window.pfsRegionSearch         = pfsRegionSearch;
window.pfsRegionToggleStar     = pfsRegionToggleStar;
window._stopPresence           = stopPresence;
window._initPresence           = initPresence;
window.forceUpdateLists = async () => {
  const confirmed = await showConfirm({
    title: 'Forza Aggiornamento',
    msg: "Vuoi forzare l'aggiornamento delle liste di tutti gli appalti da GitHub? L'operazione ripulirà la cache locale.",
    icon: '🔄',
    okLabel: 'Forza Aggiornamento',
    okAccent: true
  });
  if (confirmed) {
    const btn = document.getElementById('btn-update-lists-sidebar');
    if (btn) btn.innerHTML = '<div class="loader-spinner" style="width:14px;height:14px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px"></div> Attendere...';
    invalidateConfigCache();
    await forceListUpdateFromGithub();
    window.location.reload();
  }
};

// AUTO-UPDATE PWA SEAMLESS
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// ENTRY POINT
document.addEventListener('DOMContentLoaded', () => { buildSidebar(); });
window.addEventListener('hashchange', handleHashChange);
