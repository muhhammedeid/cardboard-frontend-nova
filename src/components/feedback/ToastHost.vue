<script setup lang="ts">
import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { useToastStore } from '@/app/stores/toasts'

const toasts = useToastStore()
</script>

<template>
  <div class="toast-host" role="status" aria-live="polite">
    <div v-for="toast in toasts.items" :key="toast.id" class="toast" :class="`toast--${toast.tone}`">
      <AppIcon :name="toast.tone === 'error' ? 'alert' : toast.tone === 'success' ? 'check' : 'info'" size="sm" />
      <span>{{ toast.message }}</span>
      <AppButton variant="ghost" size="sm" icon="close" icon-only class="push" @click="toasts.dismiss(toast.id)">إغلاق</AppButton>
    </div>
  </div>
</template>
