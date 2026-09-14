<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'

withDefaults(defineProps<{ message?: string; detail?: string }>(), { message: 'جارٍ تحميل البيانات…' })
</script>

<template>
  <div class="state" role="status" aria-live="polite" aria-busy="true">
    <span class="state__glyph"><AppIcon name="refresh" size="lg" /></span>
    <h2>{{ message }}</h2>
    <p v-if="detail">{{ detail }}</p>
    <slot />
  </div>
</template>
