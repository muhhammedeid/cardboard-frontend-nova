<script setup lang="ts">
import { computed } from 'vue'

import { displayOr } from '@/services/formatting'
import BidiValue from './BidiValue.vue'

const props = withDefaults(defineProps<{ value: string | number | null | undefined; placeholder?: string }>(), { placeholder: '—' })
const text = computed(() => displayOr(props.value, props.placeholder))
</script>

<template>
  <BidiValue :value="text" />
</template>
