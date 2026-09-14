<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'
import type { IconName } from '@/components/base/icons'

withDefaults(defineProps<{ title: string; subtitle?: string; eyebrow?: string; icon?: IconName }>(), {})
</script>

<template>
  <header class="page-header">
    <div class="page-header__identity">
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <h1>
        <span v-if="icon" class="icon-tile"><AppIcon :name="icon" size="sm" /></span>
        {{ title }}
      </h1>
      <p v-if="subtitle">{{ subtitle }}</p>
      <slot name="meta" />
    </div>
    <div v-if="$slots.actions" class="page-header__actions"><slot name="actions" /></div>
  </header>
</template>
