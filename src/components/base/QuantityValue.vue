<script setup lang="ts">
import { computed } from 'vue'

import { formatQuantity } from '@/services/formatting'
import BidiValue from './BidiValue.vue'

const props = withDefaults(defineProps<{ value: string | number | null | undefined; unit?: string }>(), { unit: 'Kg' })
const text = computed(() => formatQuantity(props.value ?? null, props.unit))
</script>

<template>
  <BidiValue :value="text" />
</template>
