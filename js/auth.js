// ── Authentication ──
import { USERS, APPALTI, currentUser, setCurrentUser } from './state.js';
import { showConfirm } from './utils.js';
import { preloadCounts, selectAppalto } from './data.js';

async function hashPassword(pass) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pass));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function doLogin() {
  const user = document.getElementById('inp-user').value.trim();
  const pass = document.getElementById('inp-pass').value;
  const err  = document.getElementById('login-error');

  const hashed = await hashPassword(pass);
  if (USERS[user] && USERS[user].hash === hashed) {
    setCurrentUser({ name: user, role: USERS[user].role });
    localStorage.setItem('tw_session', JSON.stringify({ name: user, role: USERS[user].role }));
    showApp();
  } else {
    err.style.display = 'block';
    setTimeout(() => err.style.display = 'none', 3000);
  }
}

export function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  const appEl = document.getElementById('app');
  appEl.style.display = 'flex';
  document.getElementById('tb-user').textContent = currentUser.name + ' — Esci';
  
  const navAdmin = document.getElementById('nav-tecnici-wrapper');
  const btnUpdateSidebar = document.getElementById('btn-update-lists-sidebar');
  if (currentUser.role === 'admin') {
    navAdmin.style.display = 'block';
    if (btnUpdateSidebar) btnUpdateSidebar.style.display = 'flex';
  } else {
    navAdmin.style.display = 'none';
    if (btnUpdateSidebar) btnUpdateSidebar.style.display = 'none';
  }

  preloadCounts();
  if (!window.location.hash || window.location.hash === '#/') {
    window.location.hash = `#/appalti/${APPALTI[0]}/live`;
  } else {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
}

export function doLogout() {
  showConfirm({
    title: 'Disconnessione',
    msg: 'Sei sicuro di voler uscire dalla dashboard?',
    icon: '👋',
    okLabel: 'Esci',
    okAccent: true
  }).then(confirmed => {
    if (!confirmed) return;
    setCurrentUser(null);
    localStorage.removeItem('tw_session');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    document.getElementById('inp-pass').value = '';
  });
}

export function checkSession() {
  try {
    const saved = localStorage.getItem('tw_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && USERS[parsed.name] && parsed.role === USERS[parsed.name].role) {
        setCurrentUser(parsed);
        window.addEventListener('load', showApp);
      }
    }
  } catch { localStorage.removeItem('tw_session'); }
}
