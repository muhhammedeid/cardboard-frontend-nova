<script setup lang="ts">
import { computed } from 'vue'

type Tone = 'neutral' | 'primary' | 'weight' | 'success' | 'warning' | 'danger' | 'info'

const props = withDefaults(defineProps<{ tone?: Tone; dot?: boolean }>(), { tone: 'neutral', dot: true })
const classes = computed(() => ['badge', `badge--${props.tone}`, props.dot ? '' : 'badge--plain'])
</script>

<template>
  <span :class="classes"><slot /></span>
</template>
