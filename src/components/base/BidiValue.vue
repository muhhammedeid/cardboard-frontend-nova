<script setup lang="ts">
/**
 * Bidi-safe value isolation: mixed Arabic text with Latin codes, numbers,
 * currencies and units must never reorder. Every raw value renders inside one
 * <bdi dir="ltr"> node.
 */
withDefaults(defineProps<{ value: string | number; direction?: 'ltr' | 'auto' }>(), { direction: 'ltr' })
</script>

<template>
  <bdi :dir="direction"><slot>{{ value }}</slot></bdi>
</template>
