<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'

withDefaults(
  defineProps<{ title?: string; message?: string }>(),
  {
    title: 'لا تملك صلاحية الوصول',
    message: 'هذا الإجراء يتطلب صلاحية إضافية على الخادم. راجع مسؤول النظام إذا كنت تعتقد أن هذا خطأ.',
  },
)
</script>

<template>
  <div class="state state--permission" role="alert">
    <span class="state__glyph"><AppIcon name="lock" size="lg" /></span>
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <div v-if="$slots.actions" class="state__actions"><slot name="actions" /></div>
  </div>
</template>
