import { defineStore } from 'pinia'

import { FrontendError } from '@/services/api/errors'
import { useServices } from '@/services'

/** `unreachable` is deliberately distinct from `anonymous`: a network outage must
 *  never look like a signed-out operator. */
export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous' | 'unreachable'

export const useSessionStore = defineStore('session', {
  state: () => ({ user: '' as string, status: 'unknown' as SessionStatus, loaded: false }),
  getters: {
    initials(state): string {
      const name = state.user.trim()
      if (!name) return '؟'
      const parts = name.split(/[\s@.]+/).filter(Boolean)
      return parts.slice(0, 2).map((part) => part.charAt(0)).join('')
    },
    isSignedOut(state): boolean {
      return state.status === 'anonymous'
    },
    isUnreachable(state): boolean {
      return state.status === 'unreachable'
    },
  },
  actions: {
    async load(force = false): Promise<void> {
      if (this.loaded && !force) return
      this.status = 'unknown'
      try {
        this.user = (await useServices().session.context()).user
        this.status = this.user ? 'authenticated' : 'anonymous'
      } catch (error) {
        this.user = ''
        this.status = error instanceof FrontendError && error.kind === 'authentication' ? 'anonymous' : 'unreachable'
      } finally {
        this.loaded = true
      }
    },
  },
})
