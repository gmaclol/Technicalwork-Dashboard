import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, db, doc, getDoc } from './firebase.js';
import { APPALTI, currentUser, setCurrentUser } from './state.js';
import { showConfirm, showToast } from './utils.js';
import { preloadCounts } from './data.js';
import { startGlobalPfsNotifications, stopGlobalPfsNotifications } from './pfs.js';
import { startNewTecniciWatcher, stopNewTecniciWatcher, startBannedAccessWatcher, stopBannedAccessWatcher } from './tecnici.js';
import { notifyNewTecnico, notifyBannedAccessAttempt, requestNotificationPermission } from './notifications.js';

function showLoginError(msg) {
  const err = document.getElementById('login-error');
  if (err) {
    err.textContent = msg || 'Credenziali non valide.';
    err.style.display = 'block';
    setTimeout(() => { err.style.display = 'none'; }, 4000);
  }
}

export async function doLogin() {
  const userField = document.getElementById('inp-user');
  const passField = document.getElementById('inp-pass');
  const rawUser = userField ? userField.value.trim() : '';
  const pass = passField ? passField.value : '';

  if (!rawUser || !pass) {
    showLoginError('Inserisci sia username/email che password.');
    return;
  }

  // Supporto email completa oppure solo username rapido (es. "Stefano" o "Piero" -> "@technicalwork.it")
  let email = rawUser;
  if (!email.includes('@')) {
    email = `${email.toLowerCase()}@technicalwork.it`;
  }

  const btnLogin = document.querySelector('.login-btn');
  if (btnLogin) {
    btnLogin.disabled = true;
    btnLogin.textContent = 'Accesso in corso...';
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;

    // Recupera il ruolo da Firestore userRoles/{uid}
    const roleSnap = await getDoc(doc(db, 'userRoles', firebaseUser.uid));
    if (!roleSnap.exists()) {
      await signOut(auth);
      showLoginError('Utente non autorizzato. Contatta l\'amministratore.');
      return;
    }

    const roleData = roleSnap.data();
    if (!roleData || !roleData.role) {
      await signOut(auth);
      showLoginError('Ruolo utente non definito.');
      return;
    }

    setCurrentUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: roleData.name || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Utente'),
      role: roleData.role
    });

    // Pulisci vecchie chiavi legacy se presenti
    try { localStorage.removeItem('tw_session'); } catch(e) {}

    showApp();
  } catch (err) {
    console.error("Errore login Firebase Auth:", err);
    let msg = 'Credenziali non valide.';
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
      msg = 'Email/Username o password errati.';
    } else if (err.code === 'auth/too-many-requests') {
      msg = 'Troppi tentativi falliti. Riprova tra qualche minuto.';
    } else if (err.code === 'auth/network-request-failed') {
      msg = 'Errore di connessione a internet.';
    }
    showLoginError(msg);
  } finally {
    if (btnLogin) {
      btnLogin.disabled = false;
      btnLogin.textContent = 'Accedi';
    }
  }
}

export function showApp() {
  if (!currentUser) return;

  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) loginScreen.style.display = 'none';

  const appEl = document.getElementById('app');
  if (appEl) appEl.style.display = 'flex';

  const tbUser = document.getElementById('tb-user');
  if (tbUser) tbUser.textContent = (currentUser.name || 'Utente') + ' — Esci';
  
  const navAdmin = document.getElementById('nav-tecnici-wrapper');
  const adminSyncWrapper = document.getElementById('admin-sync-wrapper');
  const btnUpdateSidebar = document.getElementById('btn-update-lists-sidebar');
  if (currentUser.role === 'admin') {
    if (navAdmin) navAdmin.style.display = 'block';
    if (adminSyncWrapper) adminSyncWrapper.style.display = 'block';
    if (btnUpdateSidebar) btnUpdateSidebar.style.display = 'flex';
    // Avvia notifiche globali per l'admin
    startGlobalPfsNotifications();
  } else {
    if (navAdmin) navAdmin.style.display = 'none';
    if (adminSyncWrapper) adminSyncWrapper.style.display = 'none';
    if (btnUpdateSidebar) btnUpdateSidebar.style.display = 'none';
  }

  preloadCounts();

  // Avvia watcher nuovi tecnici e allarme killswitch dispositivi bloccati (solo admin)
  if (currentUser.role === 'admin') {
    requestNotificationPermission();
    startNewTecniciWatcher(notifyNewTecnico);
    startBannedAccessWatcher(notifyBannedAccessAttempt);
  }

  if (!window.location.hash || window.location.hash === '#/') {
    window.location.hash = `#/appalti/${APPALTI[0]}/live`;
  } else {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  // Registra presenza (funziona sia per login fresco che ripristino sessione)
  if (typeof window._initPresence === 'function') window._initPresence();
}

export function doLogout() {
  showConfirm({
    title: 'Disconnessione',
    msg: 'Sei sicuro di voler uscire dalla dashboard?',
    icon: '👋',
    okLabel: 'Esci',
    okAccent: true
  }).then(async confirmed => {
    if (!confirmed) return;

    // Pulisci presenza dashboard
    if (typeof window._stopPresence === 'function') window._stopPresence();

    // Ferma eventuali notifiche in background
    stopGlobalPfsNotifications();
    stopNewTecniciWatcher();
    stopBannedAccessWatcher();

    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Errore signOut:", e);
    }

    setCurrentUser(null);
    try { localStorage.removeItem('tw_session'); } catch(e) {}

    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.style.display = 'flex';

    const appEl = document.getElementById('app');
    if (appEl) appEl.style.display = 'none';

    const passField = document.getElementById('inp-pass');
    if (passField) passField.value = '';
  });
}

let _authObserverInitialized = false;

export function checkSession() {
  // Rimuovi traccia della vecchia sessione non sicura
  try { localStorage.removeItem('tw_session'); } catch(e) {}

  if (_authObserverInitialized) return;
  _authObserverInitialized = true;

  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const roleSnap = await getDoc(doc(db, 'userRoles', firebaseUser.uid));
        if (roleSnap.exists()) {
          const roleData = roleSnap.data();
          if (roleData && roleData.role) {
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: roleData.name || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Utente'),
              role: roleData.role
            });
            showApp();
            return;
          }
        }

        // Utente autenticato ma senza record in userRoles
        console.warn("Utente non autorizzato in userRoles:", firebaseUser.uid);
        await signOut(auth);
        setCurrentUser(null);
        showLoginError("Utente non autorizzato. Contatta l'amministratore.");
      } catch (err) {
        console.error("Errore recupero permessi utente:", err);
        await signOut(auth);
        setCurrentUser(null);
        showLoginError("Errore durante la verifica dei permessi.");
      }
    } else {
      setCurrentUser(null);
      const appEl = document.getElementById('app');
      if (appEl && appEl.style.display === 'flex') {
        appEl.style.display = 'none';
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.style.display = 'flex';
      }
    }
  });
}
