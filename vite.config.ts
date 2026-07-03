import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Relative base is required: TV apps are loaded from the local filesystem
  // (file:// on Tizen, app:// style resolution on webOS), not from a web root.
  base: './',
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  build: {
    // Chrome 68 covers LG webOS 5.x+ and Samsung Tizen 5.5+ (2020+ TVs).
    // TODO: add @vitejs/plugin-legacy if pre-2020 TVs (no ES modules) must be supported.
    target: 'chrome68',
    outDir: 'dist',
    assetsInlineLimit: 8192,
  },
  server: {
    port: 5173,
  },
});
