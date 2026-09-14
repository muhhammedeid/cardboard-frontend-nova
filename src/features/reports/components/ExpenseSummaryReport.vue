<script setup lang="ts">
import MoneyValue from '@/components/base/MoneyValue.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import DataTable from '@/components/data/DataTable.vue'
import DistributionBars from '@/components/data/DistributionBars.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import type { TableColumn } from '@/components/data/table-column'
import type { ExpenseSummaryReport } from '@/services/contracts/reports'

const props = defineProps<{ report: ExpenseSummaryReport }>()

const columns: readonly TableColumn[] = [
  { key: 'label', label: 'فئة المصروف' },
  { key: 'count', label: 'عدد المصروفات', align: 'end' },
  { key: 'amount', label: 'المبلغ', align: 'end' },
]
</script>

<template>
  <section class="stack">
    <section class="metric-grid">
      <div class="metric metric--warning">
        <header class="metric__head">إجمالي المصروفات</header>
        <p class="metric__value"><MoneyValue :value="report.totalAmount" /></p>
        <div class="metric__meta">
          من <bdi dir="ltr">{{ report.fromDate }}</bdi> إلى <bdi dir="ltr">{{ report.toDate }}</bdi>
        </div>
      </div>
      <div class="metric metric--info">
        <header class="metric__head">عدد المصروفات</header>
        <p class="metric__value metric__value--sm"><bdi dir="ltr">{{ report.count }}</bdi></p>
        <div class="metric__meta">حسب سجلات الخادم المعتمدة.</div>
      </div>
      <div class="metric">
        <header class="metric__head">عدد الفئات</header>
        <p class="metric__value metric__value--sm"><bdi dir="ltr">{{ report.categories.length }}</bdi></p>
        <div class="metric__meta">فئات مصروفات بها حركة في الفترة.</div>
      </div>
    </section>

    <EmptyState
      v-if="!props.report.categories.length"
      icon="expenses"
      title="لا توجد مصروفات"
      message="لا توجد مصروفات في الفترة المحددة."
    />

    <template v-else>
      <AppPanel title="التوزيع حسب الفئة" description="ترتيب بصري للقيم المعتمدة من الخادم.">
        <DistributionBars :rows="report.categories.map((row) => ({ label: row.label, count: row.count, amount: row.amount }))" />
      </AppPanel>
      <DataTable :columns="columns" :rows="props.report.categories" row-key="label">
        <template #cell-label="{ row }"><span class="table__cell-strong">{{ row.label }}</span></template>
        <template #cell-count="{ row }"><bdi dir="ltr">{{ row.count }}</bdi></template>
        <template #cell-amount="{ row }"><MoneyValue :value="row.amount" /></template>
      </DataTable>
    </template>
  </section>
</template>
