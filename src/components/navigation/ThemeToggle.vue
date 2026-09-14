<script setup lang="ts">
import { computed, inject, ref } from 'vue'

import AppIcon from '@/components/base/AppIcon.vue'
import type { ThemeController, ThemePreference } from '@/app/theme/theme'

const controller = inject<ThemeController>('nova.theme')
const preference = ref<ThemePreference>(controller?.preference ?? 'system')

const options: Array<{ value: ThemePreference; label: string; icon: 'sun' | 'moon' | 'monitor' }> = [
  { value: 'light', label: 'نهاري', icon: 'sun' },
  { value: 'dark', label: 'داكن', icon: 'moon' },
  { value: 'system', label: 'تلقائي', icon: 'monitor' },
]

const current = computed(() => preference.value)

function select(value: ThemePreference): void {
  preference.value = value
  controller?.set(value)
}
</script>

<template>
  <div class="segmented" role="group" aria-label="مظهر الواجهة">
    <button
      v-for="option in options"
      :key="option.value"
      class="segmented__option"
      type="button"
      :aria-pressed="current === option.value"
      :title="`المظهر ${option.label}`"
      :data-theme-option="option.value"
      @click="select(option.value)"
    >
      <AppIcon :name="option.icon" size="sm" />
      <span class="app-desktop-only">{{ option.label }}</span>
    </button>
  </div>
</template>
