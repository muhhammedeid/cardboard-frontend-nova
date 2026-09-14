import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { router } from './app/router'
import { createThemeController } from './app/theme/theme'
import './styles/index.css'

// The theme bootstrap in index.html has already resolved data-theme before the
// first paint; the controller takes over for runtime switching from here.
const theme = createThemeController()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.provide('nova.theme', theme)
app.mount('#app')
