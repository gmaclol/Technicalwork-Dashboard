import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './', // Fundamental for GitHub Pages relative paths
  esbuild: {
    drop: ['console', 'debugger'], // Rimuove i log in produzione
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    assetsInlineLimit: 4096, // 4kb
    cssCodeSplit: true, // Spezza il CSS per caricarlo più velocemente
    rollupOptions: {
      output: {
        manualChunks: {
          // Separazione Firebase dal resto del codice per velocizzare l'avvio
          'vendor-firebase': ['firebase/app', 'firebase/firestore'],
        }
      }
    }
  },
  server: {
    port: 8000
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Caching API Github (liste materiali e config)
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'github-raw-content',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 24 ore
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Caching Google Fonts
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 anno
            }
          }
        ]
      },
      manifest: {
        "name": "TechnicalWork Dashboard",
        "short_name": "TW Dashboard",
        "description": "Dashboard di gestione materiali e tecnici per cantieri FTTH",
        "start_url": "./",
        "display": "standalone",
        "background_color": "#09090b",
        "theme_color": "#09090b",
        "icons": [
          { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
          { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
        ],
        "apple_touch_icon": "icons/icon-192.png"
      }
    })
  ]
});
