<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import MoneyValue from '@/components/base/MoneyValue.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import SkeletonBlock from '@/components/feedback/SkeletonBlock.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import type { TableColumn } from '@/components/data/table-column'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import type { OutstandingReport } from '@/services/contracts/reports'

const api = useServices().reports

const report = ref<OutstandingReport | null>(null)
const error = ref('')
const loading = ref(true)

const columns: readonly TableColumn[] = [
  { key: 'supplierName', label: 'المورد' },
  { key: 'outstanding', label: 'المديونية المستحقة', align: 'end' },
  { key: 'supplyValue', label: 'إجمالي قيمة التوريدات', align: 'end' },
  { key: 'paidAmount', label: 'إجمالي المدفوع', align: 'end' },
]

const totalSupplyValue = computed(() =>
  report.value?.suppliers.reduce((total, row) => total + Number(row.supplyValue ?? 0), 0) ?? null,
)
const totalPaid = computed(() =>
  report.value?.suppliers.reduce((total, row) => total + Number(row.paidAmount ?? 0), 0) ?? null,
)

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    report.value = await api.outstandingReport()
  } catch (value) {
    error.value = errorMessage(value, 'تعذر تحميل تقرير المديونية.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="stack">
    <SkeletonBlock v-if="loading && !report" :lines="5" variant="card" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <template v-else-if="report">
      <section class="metric-grid">
        <div class="metric metric--warning">
          <header class="metric__head">إجمالي المديونية المستحقة</header>
          <p class="metric__value"><MoneyValue :value="report.totalOutstanding" /></p>
          <div class="metric__meta"><span>{{ report.suppliers.length }} مورد</span></div>
        </div>
        <div class="metric metric--money">
          <header class="metric__head">إجمالي قيمة التوريدات المعتمدة</header>
          <p class="metric__value"><MoneyValue :value="totalSupplyValue" /></p>
          <div class="metric__meta">مستندات معتمدة فقط.</div>
        </div>
        <div class="metric metric--success">
          <header class="metric__head">إجمالي المدفوع للموردين</header>
          <p class="metric__value"><MoneyValue :value="totalPaid" /></p>
          <div class="metric__meta">دفعات معتمدة داخل النطاق.</div>
        </div>
      </section>

      <EmptyState
        v-if="!report.suppliers.length"
        icon="suppliers"
        title="لا أرصدة مستحقة"
        message="لا توجد مديونية مستحقة على أي مورد في نطاق الإعداد الحالي."
      />
      <AppPanel v-else title="تفصيل المديونية حسب المورد" plain>
        <DataTable class="app-desktop-only" :columns="columns" :rows="report.suppliers" row-key="supplier" :busy="loading">
          <template #cell-supplierName="{ row }"><span class="table__cell-strong">{{ row.supplierName }}</span></template>
          <template #cell-outstanding="{ row }"><MoneyValue :value="row.outstanding" /></template>
          <template #cell-supplyValue="{ row }"><MoneyValue :value="row.supplyValue" /></template>
          <template #cell-paidAmount="{ row }"><MoneyValue :value="row.paidAmount" /></template>
        </DataTable>

        <div class="app-mobile-only stack">
          <div v-for="row in report.suppliers" :key="row.supplier" class="panel">
            <header class="row row--between">
              <span class="table__cell-strong">{{ row.supplierName }}</span>
              <span class="table__code">{{ row.supplier }}</span>
            </header>
            <dl class="facts">
              <div class="facts-row"><dt>المديونية المستحقة</dt><dd><MoneyValue :value="row.outstanding" /></dd></div>
              <div class="facts-row"><dt>قيمة التوريدات</dt><dd><MoneyValue :value="row.supplyValue" /></dd></div>
              <div class="facts-row"><dt>المدفوع</dt><dd><MoneyValue :value="row.paidAmount" /></dd></div>
              <div class="facts-row"><dt>الوزن</dt><dd>{{ row.suppliedWeight }} كجم</dd></div>
              <div class="facts-row"><dt>الحركات</dt><dd>توريدات {{ row.supplyCount }} · دفعات {{ row.paymentCount }}</dd></div>
            </dl>
          </div>
        </div>
      </AppPanel>

      <p class="field__hint">الفكرة: المستحق الحالي لقطة معتمدة من الخادم، والإجماليات مبنية على مستندات معتمدة فقط.</p>
    </template>
  </section>
</template>
