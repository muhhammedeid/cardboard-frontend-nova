<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from './AppIcon.vue'
import type { IconName } from './icons'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'quiet'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    busy?: boolean
    icon?: IconName
    iconOnly?: boolean
    block?: boolean
    loadingLabel?: string
  }>(),
  { variant: 'secondary', size: 'md', type: 'button', disabled: false, busy: false, iconOnly: false, block: false },
)

const classes = computed(() => [
  'btn',
  `btn--${props.variant}`,
  props.size !== 'md' ? `btn--${props.size}` : '',
  props.iconOnly ? 'btn--icon' : '',
  props.block ? 'btn--block' : '',
])
</script>

<template>
  <button :class="classes" :type="type" :disabled="disabled || busy" :aria-busy="busy || undefined">
    <AppIcon v-if="busy" name="refresh" size="sm" />
    <AppIcon v-else-if="icon" :name="icon" size="sm" />
    <span v-if="iconOnly" class="sr-only"><slot>{{ loadingLabel ?? 'إجراء' }}</slot></span>
    <slot v-else />
  </button>
</template>
