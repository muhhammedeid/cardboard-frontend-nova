<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'

const open = defineModel<boolean>('open', { default: false })
const props = withDefaults(defineProps<{ title: string; confirmLabel?: string; cancelLabel?: string; tone?: 'primary' | 'danger' }>(), {
  confirmLabel: 'تأكيد',
  cancelLabel: 'إلغاء',
  tone: 'primary',
})

const emit = defineEmits<{ (event: 'confirm'): void }>()

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

function confirm(): void {
  emit('confirm')
  open.value = false
}
</script>

<template>
  <div v-if="open" class="overlay" role="dialog" aria-modal="true" :aria-label="props.title" @click.self="open = false">
    <div class="dialog">
      <header class="dialog__head">
        <h2>{{ title }}</h2>
        <AppButton variant="ghost" icon="close" icon-only @click="open = false">إغلاق</AppButton>
      </header>
      <div class="panel__body"><slot /></div>
      <footer class="dialog__actions">
        <AppButton variant="ghost" @click="open = false">{{ cancelLabel }}</AppButton>
        <AppButton :variant="tone === 'danger' ? 'danger' : 'primary'" @click="confirm">
          <AppIcon v-if="tone === 'danger'" name="alert" size="sm" />
          {{ confirmLabel }}
        </AppButton>
      </footer>
    </div>
  </div>
</template>
