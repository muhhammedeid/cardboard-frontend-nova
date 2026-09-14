<script setup lang="ts">
import CodeValue from '@/components/base/CodeValue.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import type { ValueKind } from './table-column'

export interface FactItem {
  label: string
  value?: string | number | null
  kind?: ValueKind
  unit?: string
  wide?: boolean
}

const props = withDefaults(defineProps<{ facts: readonly FactItem[] }>(), {})
const text = (value: FactItem['value']): string | number | null | undefined =>
  typeof value === 'string' || typeof value === 'number' || value === null || value === undefined ? value : String(value)
const kindOf = (fact: FactItem): ValueKind => fact.kind ?? 'text'
void props
</script>

<template>
  <dl class="facts">
    <div v-for="fact in facts" :key="fact.label" class="fact" :class="fact.wide ? 'fact--wide' : ''">
      <dt>{{ fact.label }}</dt>
      <dd>
        <MoneyValue v-if="kindOf(fact) === 'money'" :value="text(fact.value)" />
        <QuantityValue v-else-if="kindOf(fact) === 'quantity'" :value="text(fact.value)" :unit="fact.unit ?? 'Kg'" />
        <CodeValue v-else-if="kindOf(fact) === 'code'" :value="text(fact.value)" />
        <code v-else-if="kindOf(fact) === 'count'" class="num">{{ text(fact.value) ?? '—' }}</code>
        <template v-else>{{ text(fact.value) ?? '—' }}</template>
      </dd>
    </div>
  </dl>
</template>
