<script setup lang="ts">
import { computed } from 'vue'

import { statusPresentation } from '@/services/formatting'

const props = defineProps<{ value: string; label?: string }>()
const presentation = computed(() => statusPresentation(props.value))
const text = computed(() => props.label ?? presentation.value.label)
</script>

<template>
  <span class="badge" :class="`badge--${presentation.tone}`" :data-status="value">{{ text }}</span>
</template>
