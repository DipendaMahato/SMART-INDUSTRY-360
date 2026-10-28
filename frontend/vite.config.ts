import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    port: 5173,
    strictPort: false, // Auto-pick next port if 5173 is busy
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Suppress ECONNRESET noise on startup
            if ((err as any).code !== 'ECONNRESET') {
              console.error('[proxy /api error]', err.message);
            }
          });
        },
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Suppress transient WS reset errors on initial connect
            if ((err as any).code !== 'ECONNRESET') {
              console.error('[proxy /ws error]', err.message);
            }
          });
        },
      },
    },
  },
})

