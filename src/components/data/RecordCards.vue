<script setup lang="ts" generic="T extends object">
import AppIcon from '@/components/base/AppIcon.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import CodeValue from '@/components/base/CodeValue.vue'
import StatusBadge from './StatusBadge.vue'
import type { RecordCardFact } from './table-column'

const props = withDefaults(
  defineProps<{
    items: readonly T[]
    itemKey: string
    titleKey: string
    subtitleKey?: string
    facts?: readonly RecordCardFact[]
    clickable?: boolean
    emptyLabel?: string
  }>(),
  { clickable: true, facts: () => [] },
)

const emit = defineEmits<{ (event: 'row-click', row: T): void }>()

const cellValue = (row: T, key: string): unknown => (row as unknown as Record<string, unknown>)[key]
const keyOf = (row: T, key: string): string => String(cellValue(row, key) ?? '')
const asText = (input: unknown): string | number | null | undefined =>
  typeof input === 'string' || typeof input === 'number' || input === null || input === undefined ? input : String(input)

function activate(row: T): void {
  if (props.clickable) emit('row-click', row)
}
</script>

<template>
  <div class="record-cards">
    <p v-if="!items.length" class="muted">{{ emptyLabel ?? 'لا توجد بيانات للعرض.' }}</p>
    <template v-else>
      <component
        :is="clickable ? 'button' : 'article'"
        v-for="row in items"
        :key="keyOf(row, itemKey)"
        class="record-card"
        type="button"
        @click="activate(row)"
      >
        <div class="record-card__head">
          <div class="record-card__title">
            <strong>{{ cellValue(row, titleKey) }}</strong>
            <span v-if="subtitleKey" class="mono">{{ cellValue(row, subtitleKey) }}</span>
          </div>
          <slot name="badge" :row="row"><AppIcon name="chevronLeft" size="sm" /></slot>
        </div>
        <dl class="record-card__facts">
          <div v-for="fact in facts" :key="fact.key" class="record-card__fact">
            <dt>{{ fact.label }}</dt>
            <dd class="num">
              <MoneyValue v-if="fact.kind === 'money'" :value="asText(cellValue(row, fact.key))" />
              <QuantityValue v-else-if="fact.kind === 'quantity'" :value="asText(cellValue(row, fact.key))" :unit="fact.unit ?? 'Kg'" />
              <StatusBadge v-else-if="fact.kind === 'status'" :value="String(cellValue(row, fact.key) ?? '')" />
              <CodeValue v-else-if="fact.kind === 'code'" :value="asText(cellValue(row, fact.key))" />
              <template v-else>{{ cellValue(row, fact.key) ?? '—' }}</template>
            </dd>
          </div>
        </dl>
      </component>
    </template>
  </div>
</template>
