<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'

export interface DistributionRow {
  label: string
  count?: number
  amount: number
  kind?: 'money' | 'quantity'
  unit?: string
}

const props = withDefaults(defineProps<{ rows: readonly DistributionRow[]; emptyLabel?: string }>(), {
  emptyLabel: 'لا يوجد توزيع مسجل.',
})

/**
 * Proportional bars are pure presentation of server-supplied values: the
 * widest returned row fills the track. No total, share, or business value is
 * derived here — the numbers printed are the ones the backend returned.
 */
function width(row: DistributionRow): string {
  const values = props.rows.map((item) => Math.abs(Number(item.amount) || 0))
  const max = Math.max(...values, 0)
  if (!max) return '0%'
  return `${Math.round(((Math.abs(Number(row.amount) || 0) / max) * 100 + Number.EPSILON) * 100) / 100}%`
}
</script>

<template>
  <div class="distribution">
    <p v-if="!rows.length" class="muted">{{ emptyLabel }}</p>
    <div v-for="row in rows" v-else :key="row.label" class="distribution__row">
      <div class="distribution__head">
        <span>
          {{ row.label }}
          <span v-if="row.count !== undefined" class="faint">· {{ row.count }}</span>
        </span>
        <strong>
          <QuantityValue v-if="row.kind === 'quantity'" :value="row.amount" :unit="row.unit ?? 'Kg'" />
          <MoneyValue v-else :value="row.amount" />
        </strong>
      </div>
      <div class="distribution__track" aria-hidden="true"><div class="distribution__fill" :style="{ inlineSize: width(row) }" /></div>
    </div>
    <p class="field__hint row" v-if="rows.length">
      <AppIcon name="info" size="sm" />
      الأشرطة تعرض ترتيب القيم المعتمدة من الخادم، وليست حسابًا في الواجهة.
    </p>
  </div>
</template>
