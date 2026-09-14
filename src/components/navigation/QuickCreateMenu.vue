<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { quickActions } from '@/app/navigation/menu'

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
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="menu">
    <AppButton variant="primary" icon="plus" :aria-expanded="open" aria-haspopup="menu" @click="open = !open">إجراء جديد</AppButton>
    <div v-if="open" class="menu__panel menu__panel--end" role="menu">
      <p class="menu__label">إنشاء سجل جديد</p>
      <RouterLink v-for="action in quickActions" :key="action.area" class="menu__item" role="menuitem" :to="action.to" @click="open = false">
        <AppIcon :name="action.icon" size="sm" />
        {{ action.label }}
      </RouterLink>
    </div>
  </div>
</template>
