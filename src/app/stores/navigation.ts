import { defineStore } from 'pinia'

export const useNavigationStore = defineStore('navigation', {
  state: () => ({ drawerOpen: false, railCollapsed: false }),
  actions: {
    openDrawer(): void {
      this.drawerOpen = true
    },
    closeDrawer(): void {
      this.drawerOpen = false
    },
    toggleRail(): void {
      this.railCollapsed = !this.railCollapsed
    },
  },
})
