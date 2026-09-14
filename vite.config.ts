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
 *
 * Frappe keeps serving its own routes from the same origin in production
 * (`/api`, `/login`, `/app`, `/printview`, `/files`, `/assets`), so the SPA must
 * (a) forward those paths in dev and (b) not claim Frappe's `/assets` directory —
 * hence `assetsDir: 'nova'`. See docs/DEPLOYMENT.md.
 */
const SITE_HOST = 'cardboard.localhost'
const SITE_ORIGIN = 'http://127.0.0.1:8000'
const backendRoute = { target: SITE_ORIGIN, changeOrigin: false } as const

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    assetsDir: 'nova',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [SITE_HOST],
    proxy: {
      '/api': { ...backendRoute },
      // The session gate sends a signed-out operator here.
      '/login': { ...backendRoute },
      // Desk links returned by the app-owned form actions.
      '/app': { ...backendRoute },
      // The printed weighing ticket.
      '/printview': { ...backendRoute },
      '/files': { ...backendRoute },
      '/private': { ...backendRoute },
      // Frappe's own stylesheets/scripts: without this the login page (and any Desk
      // page) reached through the dev origin renders unstyled, because Vite answers
      // /assets/... with the SPA shell. Nova keeps nothing in public/assets, and the
      // production bundle lives under /nova/ (see build.assetsDir).
      '/assets': { ...backendRoute },
    },
  },
})
