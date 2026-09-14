<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'
import type { IconName } from '@/components/base/icons'

withDefaults(defineProps<{ title?: string; message?: string; icon?: IconName }>(), {
  title: 'لا توجد بيانات',
  message: 'لا توجد نتائج مطابقة للفلاتر الحالية.',
  icon: 'inbox',
})
</script>

<template>
  <div class="state">
    <span class="state__glyph"><AppIcon :name="icon" size="lg" /></span>
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <div v-if="$slots.actions" class="state__actions"><slot name="actions" /></div>
  </div>
</template>
