<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'

withDefaults(defineProps<{ title?: string; message?: string }>(), {
  title: 'الصفحة غير موجودة',
  message: 'الرابط الذي فتحته غير معروف أو تم نقله.',
})
</script>

<template>
  <div class="state state--not-found">
    <span class="state__glyph"><AppIcon name="search" size="lg" /></span>
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <div v-if="$slots.actions" class="state__actions"><slot name="actions" /></div>
  </div>
</template>
