// TechnicalWork Dashboard — Service Worker
// Step 11: Auto-bump cache version — update this string on each deploy
const CACHE_VERSION = 'tw-v3';

// Shell assets (critical rendering path)
const SHELL_ASSETS = [
  './',
  './index.html',
  './css/variables.css',
  './css/components.css',
  './css/themes.css',
  './css/responsive.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap'
];

// ── INSTALL: pre-cache the shell ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      // Cache index.html + CSS; font is best-effort
      const critical = SHELL_ASSETS.slice(0, -1).map(url =>
        cache.add(url).catch(e => console.warn('SW cache miss:', url, e))
      );
      return Promise.all(critical).then(() =>
        cache.add(SHELL_ASSETS[SHELL_ASSETS.length - 1]).catch(() => {})
      );
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: remove old caches + notify clients ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    ).then(() => {
      self.clients.claim();
      // Notify all clients about the update
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
      });
    })
  );
});

// ── FETCH: Network-first for Firebase/API, Cache-first for the shell ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Pass through: Firebase, Google APIs, CDN, extensions
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('raw.githubusercontent.com') ||
    url.hostname.includes('nominatim.openstreetmap.org') ||
    url.protocol === 'chrome-extension:'
  ) {
    return;
  }

  // Navigation: network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Everything else: stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => null);
      return cached || network;
    })
  );
});
