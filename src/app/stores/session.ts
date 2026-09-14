import { defineStore } from 'pinia'

import { useServices } from '@/services'

export const useSessionStore = defineStore('session', {
  state: () => ({ user: '' as string, loaded: false }),
  getters: {
    initials(state): string {
      const name = state.user.trim()
      if (!name) return '؟'
      const parts = name.split(/[\s@.]+/).filter(Boolean)
      return parts.slice(0, 2).map((part) => part.charAt(0)).join('')
    },
  },
  actions: {
    async load(): Promise<void> {
      if (this.loaded) return
      try {
        this.user = (await useServices().session.context()).user
      } catch {
        this.user = ''
      } finally {
        this.loaded = true
      }
    },
  },
})
