<script setup lang="ts">
withDefaults(defineProps<{ lines?: number; variant?: 'text' | 'card' }>(), { lines: 1, variant: 'text' })
const items = (count: number) => Array.from({ length: Math.max(count, 1) }, (_, index) => index)
</script>

<template>
  <div class="skeleton-stack">
    <span v-for="index in items(lines)" :key="index" class="skeleton" :class="variant === 'card' ? 'skeleton--card' : 'skeleton--line'" />
  </div>
</template>
