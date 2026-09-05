// ── PWA Android Notifications & Homescreen Badging API ──
import { showToast, escapeHtml } from './utils.js';

let _unseenTecniciCount = 0;
let _unseenPfsCount = 0;
let _unseenBannedCount = 0;

/**
 * Richiede il permesso per le notifiche di sistema (Android / Browser)
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (e) {
    console.warn("Errore richiesta permesso notifiche:", e);
    return 'denied';
  }
}

/**
 * Aggiorna il badge numerico/pallino direttamente sull'icona dell'app
 * nella schermata Home di Android (Badging API per PWA / WebAPK).
 * I numeri si ACCUMULANO: nuovi tecnici + segnalazioni PFS + allarmi killswitch!
 */
export function updateHomescreenBadge() {
  const total = _unseenTecniciCount + _unseenPfsCount + _unseenBannedCount;
  try {
    if ('setAppBadge' in navigator) {
      if (total > 0) {
        navigator.setAppBadge(total).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  } catch (e) {
    // Badging API non supportata da questo browser/dispositivo
  }
}

/**
 * Invia una notifica di sistema Android (tendina notifiche, lockscreen, suono/vibrazione)
 * tramite il Service Worker della PWA.
 */
export async function sendSystemNotification(title, bodyText, targetUrl = '#/admin/tecnici', tag = 'tw-alert') {
  // Richiedi/verifica permesso
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') {
    if (Notification.permission !== 'denied') {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
      } catch (e) {
        return;
      }
    } else {
      return;
    }
  }

  const options = {
    body: bodyText,
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    vibrate: [250, 100, 250, 100, 250],
    tag: tag + '-' + Date.now(),
    renotify: true,
    data: { url: targetUrl }
  };

  // Su Android PWA, la modalità corretta e affidabile è ServiceWorkerRegistration.showNotification
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    } catch (e) {
      console.warn("ServiceWorker showNotification fallito, provo fallback:", e);
    }
  }

  // Fallback desktop o contesti senza Service Worker attivo
  try {
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      if (targetUrl) window.location.hash = targetUrl;
      notif.close();
    };
  } catch (e) {
    console.warn("Notification constructor fallback fallito:", e);
  }
}

/**
 * Notifica nuovo tecnico:
 * 1. Toast in-app
 * 2. Notifica di sistema Android (tendina / schermata di blocco)
 * 3. Badge sull'icona della Home screen di Android
 * 4. Badge sul menu sidebar
 */
export function notifyNewTecnico({ name, type, deviceId }) {
  const isWeb = type === 'web';
  const icon = isWeb ? '🖥️' : '📱';
  const title = `Nuovo Tecnico ${isWeb ? 'Dashboard Web' : 'App Android'}`;
  const body = `${icon} ${name} si è appena registrato.`;

  // 1. In-app Toast
  showToast(`${icon} Nuovo tecnico: <b>${escapeHtml(name)}</b>`, 'info', 7000, true);

  // 2. Incrementa contatore e aggiorna badge
  _unseenTecniciCount++;
  
  // Badge sidebar
  const badgeEl = document.getElementById('badge-nuovi-tecnici');
  if (badgeEl) {
    badgeEl.textContent = _unseenTecniciCount;
    badgeEl.style.display = 'inline-flex';
    badgeEl.classList.add('pulse');
    setTimeout(() => badgeEl.classList.remove('pulse'), 1000);
  }

  // 3. Badge sull'icona della Home screen di Android
  updateHomescreenBadge();

  // 4. Notifica di sistema Android se siamo in background o lockscreen (oppure sempre se PWA)
  sendSystemNotification(title, body, '#/admin/tecnici', 'tw-tecnico');
}

/**
 * Resetta il badge dei tecnici visti (chiamata quando l'admin apre la pagina Tecnici)
 */
export function clearTecniciBadge() {
  _unseenTecniciCount = 0;
  const badgeEl = document.getElementById('badge-nuovi-tecnici');
  if (badgeEl) {
    badgeEl.textContent = '0';
    badgeEl.style.display = 'none';
  }
  updateHomescreenBadge();
}

/**
 * Notifica per segnalazione PFS (per mantenere sincronizzati i badge)
 */
export function notifyPfsReport(tech, pfsName, address) {
  _unseenPfsCount++;
  const title = '🚨 Nuovo PFS Segnalato';
  const body = `${tech}: ${pfsName}\n${address}`;

  updateHomescreenBadge();
  sendSystemNotification(title, body, '#/admin/pfs', 'tw-pfs');
}

export function clearPfsBadge() {
  _unseenPfsCount = 0;
  const badgeEl = document.getElementById('cnt-pfs');
  if (badgeEl) {
    badgeEl.style.display = 'none';
    badgeEl.textContent = '0';
  }
  updateHomescreenBadge();
}

/**
 * Notifica tentativo di accesso da dispositivo bloccato (Killswitch)
 */
export function notifyBannedAccessAttempt({ name, deviceId }) {
  const displayName = name || deviceId;
  const title = '🚫 Tentativo Dispositivo Bloccato';
  const body = `"${displayName}" (ID: ${deviceId}) ha tentato di accedere o sincronizzare dati.`;

  // 1. In-app Toast
  showToast(`🚫 <b>Tentativo Killswitch</b><br>Dispositivo bloccato: <b>${escapeHtml(displayName)}</b>`, 'error', 9000, true);

  // 2. Incrementa contatore
  _unseenBannedCount++;

  // 3. Badge sidebar su "Bloccati"
  const badgeEl = document.getElementById('badge-banned');
  if (badgeEl) {
    badgeEl.textContent = _unseenBannedCount;
    badgeEl.style.display = 'inline-flex';
    badgeEl.classList.add('pulse');
    setTimeout(() => badgeEl.classList.remove('pulse'), 1000);
  }

  // 4. Aggiorna badge accumulato sulla schermata Home di Android
  updateHomescreenBadge();

  // 5. Notifica di sistema Android con vibrazione intensa
  sendSystemNotification(title, body, '#/admin/banned', 'tw-killswitch');
}

/**
 * Resetta il badge dei tentativi bloccati quando l'admin apre la sezione Bloccati
 */
export function clearBannedBadge() {
  _unseenBannedCount = 0;
  const badgeEl = document.getElementById('badge-banned');
  if (badgeEl) {
    badgeEl.textContent = '0';
    badgeEl.style.display = 'none';
  }
  updateHomescreenBadge();
}

