<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'
import type { IconName } from '@/components/base/icons'

withDefaults(
  defineProps<{
    label: string
    helper?: string
    tone?: 'primary' | 'money' | 'weight' | 'success' | 'warning' | 'danger' | 'info'
    icon?: IconName
    interactive?: boolean
    compact?: boolean
  }>(),
  { tone: 'primary', interactive: false, compact: false },
)
</script>

<template>
  <article class="metric" :class="[`metric--${tone}`, interactive ? 'metric--interactive' : '']">
    <header class="metric__head">
      <span v-if="icon" class="metric__glyph"><AppIcon :name="icon" size="sm" /></span>
      <span>{{ label }}</span>
    </header>
    <p class="metric__value" :class="compact ? 'metric__value--sm' : ''"><slot name="value" /></p>
    <div v-if="helper || $slots.meta" class="metric__meta">
      <span v-if="helper">{{ helper }}</span>
      <slot name="meta" />
    </div>
  </article>
</template>
