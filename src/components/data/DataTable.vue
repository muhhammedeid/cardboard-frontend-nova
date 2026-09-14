<script setup lang="ts" generic="T extends object">
import type { TableColumn } from './table-column'

const props = withDefaults(
  defineProps<{
    columns: readonly TableColumn[]
    rows: readonly T[]
    rowKey: string
    clickable?: boolean
    busy?: boolean
    emptyLabel?: string
  }>(),
  { clickable: false, busy: false, emptyLabel: 'لا توجد بيانات للعرض.' },
)

const emit = defineEmits<{ (event: 'row-click', row: T): void }>()

/** Contracts are interfaces (no implicit index signature), so cell lookup goes
 *  through one explicit widening helper instead of leaking `any` to callers. */
const cellValue = (row: T, key: string): unknown => (row as unknown as Record<string, unknown>)[key]
const keyOf = (row: T, key: string): string => String(cellValue(row, key) ?? '')

function activate(row: T): void {
  if (props.clickable) emit('row-click', row)
}
</script>

<template>
  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key" scope="col" :data-align="column.align" :style="column.width ? { inlineSize: column.width } : undefined">
            {{ column.label }}
          </th>
          <th v-if="$slots.actions" scope="col" data-align="end">إجراءات</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="busy">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)">
            <div class="skeleton-stack"><span class="skeleton skeleton--row" /><span class="skeleton skeleton--row" /><span class="skeleton skeleton--row" /></div>
          </td>
        </tr>
        <tr v-else-if="!rows.length">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="muted">{{ emptyLabel }}</td>
        </tr>
        <template v-else>
          <tr
            v-for="row in rows"
            :key="keyOf(row, rowKey)"
            :data-clickable="clickable ? 'true' : undefined"
            :tabindex="clickable ? 0 : undefined"
            @click="activate(row)"
            @keydown.enter="activate(row)"
          >
            <td v-for="column in columns" :key="column.key" :data-align="column.align">
              <slot :name="`cell-${column.key}`" :row="row" :value="cellValue(row, column.key)">
                {{ cellValue(row, column.key) ?? '—' }}
              </slot>
            </td>
            <td v-if="$slots.actions" data-align="end">
              <div class="table__row-actions" @click.stop><slot name="actions" :row="row" /></div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>
