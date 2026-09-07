// ── Custom Service Worker Events (Notification Click & Android PWA Focus) ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = (event.notification.data && event.notification.data.url) || './';
  let targetUrl;
  try {
    targetUrl = new URL(rawUrl, self.location.href).href;
  } catch (e) {
    targetUrl = rawUrl;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se la PWA è già aperta in background, mettila in primo piano e aggiorna la pagina
      for (const client of clientList) {
        if ('focus' in client) {
          if (targetUrl && client.url) {
            try { client.navigate(targetUrl); } catch(e) {}
          }
          return client.focus();
        }
      }
      // Altrimenti apri una nuova finestra PWA
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
