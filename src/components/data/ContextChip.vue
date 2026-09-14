<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'

withDefaults(defineProps<{ label: string; icon?: 'inventory' | 'building' | 'layers' }>(), { icon: 'inventory' })
</script>

<template>
  <span class="chip">
    <AppIcon :name="icon" size="sm" />
    {{ label }}
  </span>
</template>
