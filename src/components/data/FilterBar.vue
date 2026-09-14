<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), {})
</script>

<template>
  <section class="filter-bar" :aria-label="label ?? 'فلاتر'">
    <slot />
    <div class="filter-bar__actions"><slot name="actions" /></div>
  </section>
</template>
