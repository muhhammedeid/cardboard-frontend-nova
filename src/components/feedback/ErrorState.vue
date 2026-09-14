<script setup lang="ts">
import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'

withDefaults(defineProps<{ message?: string; retryLabel?: string; title?: string }>(), {
  title: 'تعذر إتمام الطلب',
  message: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
  retryLabel: 'إعادة المحاولة',
})

defineEmits<{ (event: 'retry'): void }>()
</script>

<template>
  <div class="state state--error" role="alert">
    <span class="state__glyph"><AppIcon name="alert" size="lg" /></span>
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <div class="state__actions">
      <AppButton variant="secondary" icon="refresh" @click="$emit('retry')">{{ retryLabel }}</AppButton>
      <slot name="actions" />
    </div>
  </div>
</template>
