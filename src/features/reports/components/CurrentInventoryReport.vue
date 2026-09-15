<script setup lang="ts">
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import DataTable from '@/components/data/DataTable.vue'
import DistributionBars from '@/components/data/DistributionBars.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import RecordCards from '@/components/data/RecordCards.vue'
import type { TableColumn } from '@/components/data/table-column'
import type { CurrentInventoryReport } from '@/services/contracts/reports'

const props = defineProps<{ report: CurrentInventoryReport }>()

const columns: readonly TableColumn[] = [
  { key: 'itemCode', label: 'كود الصنف' },
  { key: 'itemName', label: 'الصنف' },
  { key: 'quantity', label: 'الرصيد', align: 'end' },
  { key: 'stockValue', label: 'قيمة المخزون', align: 'end' },
]

const empty = () => props.report.rows.length === 0
</script>

<template>
  <section class="stack">
    <section class="metric-grid">
      <div class="metric metric--weight">
        <header class="metric__head">إجمالي الكمية</header>
        <p class="metric__value"><QuantityValue :value="report.summary.quantity" :unit="report.summary.uom ?? ''" /></p>
        <div class="metric__meta">{{ report.warehouseName }} · <bdi dir="ltr">{{ report.selectedDate }}</bdi></div>
      </div>
      <div class="metric metric--money">
        <header class="metric__head">قيمة المخزون</header>
        <p class="metric__value"><MoneyValue :value="report.summary.stockValue" /></p>
        <div class="metric__meta">{{ report.isToday ? 'رصيد حالي' : 'رصيد نهاية اليوم المختار' }}</div>
      </div>
      <div class="metric metric--info">
        <header class="metric__head">عدد الأصناف</header>
        <p class="metric__value metric__value--sm"><bdi dir="ltr">{{ report.rows.length }}</bdi></p>
        <div class="metric__meta">عملة التقارير: {{ report.currency }}</div>
      </div>
    </section>

    <EmptyState v-if="empty()" icon="inventory" title="لا يوجد رصيد" message="لا توجد أصناف أو رصيد في التاريخ المحدد." />

    <template v-else>
      <AppPanel title="الكمية المتاحة لكل صنف">
        <DistributionBars :rows="report.rows.map((row) => ({ label: row.itemName, amount: row.quantity, kind: 'quantity' as const }))" />
      </AppPanel>

      <DataTable class="app-desktop-only" :columns="columns" :rows="report.rows" row-key="itemCode">
        <template #cell-itemCode="{ row }"><span class="table__code">{{ row.itemCode }}</span></template>
        <template #cell-quantity="{ row }"><QuantityValue :value="row.quantity" :unit="row.uom" /></template>
        <template #cell-stockValue="{ row }"><MoneyValue :value="row.stockValue" /></template>
      </DataTable>

      <div class="app-mobile-only">
        <RecordCards
          :items="report.rows"
          item-key="itemCode"
          title-key="itemName"
          subtitle-key="itemCode"
          :clickable="false"
          :facts="[
            { key: 'quantity', label: 'الرصيد', kind: 'quantity' },
            { key: 'stockValue', label: 'القيمة', kind: 'money' },
          ]"
        />
      </div>
    </template>
  </section>
</template>
