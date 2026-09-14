<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'
import CodeValue from '@/components/base/CodeValue.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'

export interface TimelineEntry {
  id: string
  type: 'supply' | 'payment' | 'event'
  title: string
  date: string
  amount?: number
  amountKind?: 'money' | 'quantity'
  unit?: string
  meta?: string
}

defineProps<{ entries: readonly TimelineEntry[] }>()
</script>

<template>
  <ol class="timeline">
    <li v-for="entry in entries" :key="`${entry.type}-${entry.id}`" class="timeline__item">
      <span class="timeline__marker" :class="`timeline__marker--${entry.type === 'payment' ? 'out' : 'in'}`" aria-hidden="true">
        <AppIcon :name="entry.type === 'payment' ? 'payments' : entry.type === 'supply' ? 'inbound' : 'clock'" size="sm" />
      </span>
      <div class="timeline__body">
        <strong>{{ entry.title }}</strong>
        <span>
          <CodeValue :value="entry.id" />
          <template v-if="entry.date"> · <bdi dir="ltr">{{ entry.date }}</bdi></template>
          <template v-if="entry.meta"> · {{ entry.meta }}</template>
        </span>
      </div>
      <div class="timeline__value">
        <QuantityValue v-if="entry.amountKind === 'quantity'" :value="entry.amount ?? 0" :unit="entry.unit ?? 'Kg'" />
        <MoneyValue v-else-if="entry.amount !== undefined" :value="entry.amount" />
        <span v-else class="faint">—</span>
      </div>
    </li>
  </ol>
</template>
