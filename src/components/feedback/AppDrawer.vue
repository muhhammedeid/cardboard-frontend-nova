<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

import AppButton from '@/components/base/AppButton.vue'

const open = defineModel<boolean>('open', { default: false })
const props = withDefaults(defineProps<{ title: string; side?: 'start' | 'end' }>(), { side: 'start' })

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="open" class="drawer" role="dialog" aria-modal="true" :aria-label="props.title">
    <aside class="drawer__panel">
      <header class="drawer__head">
        <h2>{{ title }}</h2>
        <AppButton variant="ghost" icon="close" icon-only @click="open = false">إغلاق</AppButton>
      </header>
      <div class="stack"><slot /></div>
    </aside>
    <button class="drawer__scrim" type="button" aria-label="إغلاق" @click="open = false" />
  </div>
</template>
