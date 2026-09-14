<script setup lang="ts">
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import RecordCards from '@/components/data/RecordCards.vue'
import StatusBadge from '@/components/data/StatusBadge.vue'
import type { TableColumn } from '@/components/data/table-column'
import type { SalesReport } from '@/services/contracts/reports'

const props = defineProps<{ report: SalesReport }>()

const columns: readonly TableColumn[] = [
  { key: 'postingDate', label: 'التاريخ' },
  { key: 'name', label: 'رقم البيع' },
  { key: 'buyerName', label: 'المشتري' },
  { key: 'itemName', label: 'نوع الكرتون' },
  { key: 'quantity', label: 'الكمية', align: 'end' },
  { key: 'informationalValue', label: 'القيمة التشغيلية', align: 'end' },
  { key: 'status', label: 'الحالة' },
]
</script>

<template>
  <section class="stack">
    <section class="metric-grid">
      <div class="metric metric--info">
        <header class="metric__head">عدد المبيعات في النتيجة</header>
        <p class="metric__value metric__value--sm"><bdi dir="ltr">{{ props.report.total }}</bdi></p>
        <div class="metric__meta">إجمالي السجلات المطابقة على الخادم.</div>
      </div>
      <div class="metric">
        <header class="metric__head">الفترة</header>
        <p class="metric__value metric__value--sm">
          <bdi dir="ltr">{{ props.report.fromDate || '—' }}</bdi>
          <span class="faint"> → </span>
          <bdi dir="ltr">{{ props.report.toDate || '—' }}</bdi>
        </p>
        <div class="metric__meta">صفحة <bdi dir="ltr">{{ props.report.page }}</bdi> بحجم <bdi dir="ltr">{{ props.report.pageSize }}</bdi></div>
      </div>
    </section>

    <EmptyState v-if="!props.report.rows.length" icon="outbound" title="لا توجد مبيعات" message="لا توجد مبيعات مطابقة للفلاتر المحددة." />

    <template v-else>
      <DataTable class="app-desktop-only" :columns="columns" :rows="props.report.rows" row-key="name">
        <template #cell-name="{ row }"><span class="table__code">{{ row.name }}</span></template>
        <template #cell-buyerName="{ row }">{{ row.buyerName || '—' }}</template>
        <template #cell-quantity="{ row }"><QuantityValue :value="row.quantity" unit="Kg" /></template>
        <template #cell-informationalValue="{ row }"><MoneyValue :value="row.informationalValue" /></template>
        <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      </DataTable>

      <div class="app-mobile-only">
        <RecordCards
          :items="props.report.rows"
          item-key="name"
          title-key="buyerName"
          subtitle-key="name"
          :clickable="false"
          :facts="[
            { key: 'postingDate', label: 'التاريخ' },
            { key: 'itemName', label: 'نوع الكرتون' },
            { key: 'quantity', label: 'الكمية', kind: 'quantity' },
            { key: 'informationalValue', label: 'القيمة', kind: 'money' },
          ]"
        >
          <template #badge="{ row }"><StatusBadge :value="row.status" /></template>
        </RecordCards>
      </div>
    </template>
  </section>
</template>
