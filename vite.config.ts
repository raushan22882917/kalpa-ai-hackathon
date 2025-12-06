import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': '{}',
    'process': JSON.stringify({
      env: {}
    }),
  },
  resolve: {
    alias: {
      // Prevent importing server code
      '@server': path.resolve(__dirname, './server'),
    },
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Exclude server code from client bundle
        if (id.includes('/server/') || id.includes('\\server\\') || id.startsWith('server/')) {
          return true;
        }
        return false;
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    host: 'localhost',
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      port: 5173,
      clientPort: 5173,
    },
    headers: {
      // Allow Firebase Auth popups to work properly
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
    watch: {
      usePolling: false,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
