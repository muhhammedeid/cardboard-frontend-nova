<script setup lang="ts">
import QuantityValue from '@/components/base/QuantityValue.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import type { TableColumn } from '@/components/data/table-column'
import type { InventoryMovementReport } from '@/services/contracts/reports'

const props = defineProps<{ report: InventoryMovementReport }>()

const dateColumns: readonly TableColumn[] = [
  { key: 'date', label: 'التاريخ' },
  { key: 'inbound', label: 'وارد', align: 'end' },
  { key: 'outbound', label: 'صادر', align: 'end' },
  { key: 'net', label: 'الصافي', align: 'end' },
]

const itemColumns: readonly TableColumn[] = [
  { key: 'itemCode', label: 'كود الصنف' },
  { key: 'itemName', label: 'الصنف' },
  { key: 'inbound', label: 'وارد', align: 'end' },
  { key: 'outbound', label: 'صادر', align: 'end' },
  { key: 'net', label: 'الصافي', align: 'end' },
]

const empty = () => props.report.byItem.length === 0 && props.report.byDate.length === 0
</script>

<template>
  <section class="stack">
    <section class="metric-grid">
      <div class="metric metric--weight">
        <header class="metric__head">وارد</header>
        <p class="metric__value"><QuantityValue :value="report.inbound" unit="كجم" /></p>
        <div class="metric__meta">توريدات معتمدة خلال الفترة.</div>
      </div>
      <div class="metric metric--primary">
        <header class="metric__head">صادر</header>
        <p class="metric__value"><QuantityValue :value="report.outbound" unit="كجم" /></p>
        <div class="metric__meta">مبيعات معتمدة خلال الفترة.</div>
      </div>
      <div class="metric metric--info">
        <header class="metric__head">الصافي</header>
        <p class="metric__value"><QuantityValue :value="report.net" unit="كجم" /></p>
        <div class="metric__meta">
          من <bdi dir="ltr">{{ report.fromDate }}</bdi> إلى <bdi dir="ltr">{{ report.toDate }}</bdi>
        </div>
      </div>
    </section>

    <EmptyState v-if="empty()" icon="reports" title="لا توجد حركة" message="لا توجد حركة مخزون في الفترة المحددة." />

    <template v-else>
      <AppPanel title="الحركة حسب التاريخ" description="تجميع يومي من الخادم.">
        <DataTable :columns="dateColumns" :rows="report.byDate" row-key="date" empty-label="لا توجد حركة يومية.">
          <template #cell-date="{ row }"><bdi dir="ltr">{{ row.date }}</bdi></template>
          <template #cell-inbound="{ row }"><QuantityValue :value="row.inbound" unit="Kg" /></template>
          <template #cell-outbound="{ row }"><QuantityValue :value="row.outbound" unit="Kg" /></template>
          <template #cell-net="{ row }"><QuantityValue :value="row.net" unit="Kg" /></template>
        </DataTable>
      </AppPanel>

      <AppPanel title="الحركة حسب الصنف" description="تجميع حسب نوع الكرتون.">
        <DataTable :columns="itemColumns" :rows="report.byItem" row-key="itemCode" empty-label="لا توجد حركة للأصناف.">
          <template #cell-itemCode="{ row }"><span class="table__code">{{ row.itemCode }}</span></template>
          <template #cell-inbound="{ row }"><QuantityValue :value="row.inbound" unit="Kg" /></template>
          <template #cell-outbound="{ row }"><QuantityValue :value="row.outbound" unit="Kg" /></template>
          <template #cell-net="{ row }"><QuantityValue :value="row.net" unit="Kg" /></template>
        </DataTable>
      </AppPanel>
    </template>
  </section>
</template>
