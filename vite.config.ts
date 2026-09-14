import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/**
 * Frappe site the SPA is wired to.
 *
 * Multi-site benches select the site (and therefore the installed apps and the
 * session) from the request's Host header. That header must reach Frappe
 * untouched, which constrains this config in two verified ways:
 *
 *   1. `changeOrigin: true` rewrites the outgoing Host to the target host
 *      (127.0.0.1:8000). Frappe then resolves no site and EVERY app-owned method
 *      answers "is not whitelisted" (403).
 *   2. An explicit `headers: { Host: ... }` override is not applied by the proxy
 *      in this version, so the browser's own host is what Frappe sees.
 *
 * Consequence: open the app on the site host — http://cardboard.localhost:5173 —
 * which also makes the browser own the same host as the Frappe session cookie.
 */
const SITE_HOST = 'cardboard.localhost'
const SITE_ORIGIN = 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [SITE_HOST],
    proxy: {
      '/api': {
        target: SITE_ORIGIN,
        changeOrigin: false,
      },
    },
  },
})
