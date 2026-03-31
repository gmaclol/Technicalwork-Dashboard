import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './', // Fundamental for GitHub Pages relative paths
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    assetsInlineLimit: 4096, // 4kb
  },
  server: {
    port: 8000
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        "name": "TechnicalWork Dashboard",
        "short_name": "TW Dashboard",
        "description": "Dashboard di gestione materiali e tecnici per cantieri FTTH",
        "start_url": "./",
        "display": "standalone",
        "background_color": "#020617",
        "theme_color": "#020617",
        "icons": [
          { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
          { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
        ]
      }
    })
  ]
});
