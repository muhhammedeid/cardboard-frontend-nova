<script setup lang="ts">
import { computed } from 'vue'

import { formatMoney } from '@/services/formatting'
import BidiValue from './BidiValue.vue'

const props = withDefaults(defineProps<{ value: string | number | null | undefined; currency?: string; raw?: boolean }>(), {
  raw: false,
})
const text = computed(() => (props.raw ? String(props.value ?? '—') : formatMoney(props.value ?? null, props.currency)))
</script>

<template>
  <BidiValue :value="text" />
</template>
