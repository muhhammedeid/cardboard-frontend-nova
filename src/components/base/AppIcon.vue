<script setup lang="ts">
import { computed } from 'vue'

import { ICONS, type IconName } from './icons'

const props = withDefaults(defineProps<{ name: IconName; size?: 'sm' | 'md' | 'lg' | 'xl' }>(), { size: 'md' })

const segments = computed<readonly string[]>(() => ICONS[props.name])
const sizeClass = computed(() => (props.size === 'md' ? 'app-icon' : `app-icon app-icon--${props.size}`))
</script>

<template>
  <svg :class="sizeClass" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path v-for="(segment, index) in segments" :key="index" :d="segment" />
  </svg>
</template>
