import { defineStore } from 'pinia'

import { useServices } from '@/services'

/**
 * Read-only operational context for the shell (company / warehouse). Hidden
 * when the backend refuses the read — a permission failure is never rendered
 * as a zero or a placeholder value.
 */
export const useContextStore = defineStore('context', {
  state: () => ({ company: '' as string, warehouse: '' as string, loaded: false, failed: false }),
  getters: {
    label(state): string {
      if (state.warehouse) return `المخزن: ${state.warehouse}`
      if (state.company) return `الشركة: ${state.company}`
      return ''
    },
  },
  actions: {
    async load(): Promise<void> {
      if (this.loaded) return
      try {
        const settings = await useServices().settings.get()
        this.company = settings.company ?? ''
        this.warehouse = settings.default_warehouse ?? ''
      } catch {
        this.failed = true
      } finally {
        this.loaded = true
      }
    },
  },
})
