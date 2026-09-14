import { defineStore } from 'pinia'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  tone: ToastTone
  message: string
}

let sequence = 0

/** Transient operator feedback; never used for business state. */
export const useToastStore = defineStore('toasts', {
  state: () => ({ items: [] as Toast[] }),
  actions: {
    push(message: string, tone: ToastTone = 'info'): void {
      const id = ++sequence
      this.items.push({ id, tone, message })
      window.setTimeout(() => this.dismiss(id), 6000)
    },
    dismiss(id: number): void {
      this.items = this.items.filter((item) => item.id !== id)
    },
  },
})
