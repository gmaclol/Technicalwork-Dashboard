import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  base: './', // Fundamental for GitHub Pages relative paths
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [], // Rimuove i log solo in produzione
  },
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    assetsInlineLimit: 4096, // 4kb
    cssCodeSplit: true, // Spezza il CSS per caricarlo più velocemente
    rollupOptions: {
      output: {
        // manualChunks rimosso perché Firebase viene caricato via CDN/URL
      }
    }
  },
  server: {
    port: 8000,
    strictPort: true
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
          { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
          { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
          { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
          { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
        ],
        "apple_touch_icon": "icons/icon-192.png"
      }
    })
  ]
}));
