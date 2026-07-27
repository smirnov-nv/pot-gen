/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Bind-mounted sources on macOS/Windows do not deliver inotify events into the
// container, so HMR silently dies without polling. See docs/development.md.
const usePolling = process.env['VITE_USE_POLLING'] !== '0';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
      '@store': fileURLToPath(new URL('./src/store', import.meta.url)),
    },
  },
  server: {
    // 0.0.0.0: the dev server lives in a container, localhost would only be
    // reachable from inside it.
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: usePolling ? { usePolling: true, interval: 300 } : undefined,
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
  },
});