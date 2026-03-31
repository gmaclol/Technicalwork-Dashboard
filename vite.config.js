import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Fundamental for GitHub Pages relative paths
  build: {
    outDir: 'docs',
    emptyOutDir: true,
    assetsInlineLimit: 4096, // 4kb
  },
  server: {
    port: 8000
  }
});
