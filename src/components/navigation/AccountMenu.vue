<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import AppIcon from '@/components/base/AppIcon.vue'
import { useSessionStore } from '@/app/stores/session'

const session = useSessionStore()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

function onDocumentClick(event: MouseEvent): void {
  if (!root.value?.contains(event.target as Node)) open.value = false
}
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
  void session.load()
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="menu">
    <button class="account-button" type="button" :aria-expanded="open" aria-haspopup="menu" aria-label="قائمة الحساب" @click="open = !open">
      <span class="account-button__avatar" aria-hidden="true">{{ session.initials }}</span>
      <span class="app-desktop-only truncate">{{ session.user || 'جلسة Frappe' }}</span>
      <AppIcon name="chevronDown" size="sm" />
    </button>
    <div v-if="open" class="menu__panel menu__panel--end" role="menu">
      <p class="menu__label">{{ session.user || 'جلسة Frappe' }}</p>
      <a class="menu__item" role="menuitem" href="/app" target="_blank" rel="noopener">
        <AppIcon name="external" size="sm" />
        فتح سطح المكتب (Desk)
      </a>
      <a class="menu__item" role="menuitem" href="/login?redirect-to=/">
        <AppIcon name="user" size="sm" />
        تبديل المستخدم
      </a>
      <div class="menu__separator" />
      <p class="menu__label">الجلسة تُدار من خادم Frappe</p>
    </div>
  </div>
</template>
