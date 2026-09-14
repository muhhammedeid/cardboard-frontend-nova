<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect, { type SelectOption } from '@/components/base/AppSelect.vue'
import FormField from '@/components/base/FormField.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import type { TableColumn } from '@/components/data/table-column'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import type { InventoryMovementReport, Lookup } from '@/services/contracts'

const router = useRouter()
const services = useServices()

const fromDate = ref('')
const toDate = ref('')
const selectedItem = ref('')
const items = ref<Lookup[]>([])
const itemLookupFailed = ref(false)
const report = ref<InventoryMovementReport | null>(null)
const loading = ref(true)
const error = ref('')

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

const itemOptions = computed<SelectOption[]>(() => items.value.map((option) => ({ value: option.name, label: option.label })))

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    report.value = await services.reports.movement({
      fromDate: fromDate.value || undefined,
      toDate: toDate.value || undefined,
      ...(selectedItem.value ? { cardboardItem: selectedItem.value } : {}),
    })
  } catch (value) {
    report.value = null
    error.value = errorMessage(value, 'تعذر تحميل حركة المخزون.')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // The ALL-items report stays available when the optional selector cannot load.
  try {
    items.value = await services.supplies.lookupItems()
  } catch {
    items.value = []
    itemLookupFailed.value = true
  }
  await load()
})
</script>

<template>
  <section class="stack">
    <PageHeader
      title="حركة المخزون"
      subtitle="الوارد والصادر خلال الفترة. هذه حركة وليست رصيدًا حاليًا أو تاريخيًا."
      icon="reports"
      eyebrow="المخزون"
    >
      <template #actions>
        <AppButton variant="secondary" icon="inventory" @click="router.push('/inventory')">الرصيد الحالي</AppButton>
        <AppButton variant="ghost" icon="clock" @click="router.push('/inventory/history')">الرصيد التاريخي</AppButton>
      </template>
    </PageHeader>

    <FilterBar label="فلاتر حركة المخزون">
      <FormField label="من تاريخ"><AppInput v-model="fromDate" type="date" /></FormField>
      <FormField label="إلى تاريخ"><AppInput v-model="toDate" type="date" /></FormField>
      <FormField
        label="نوع الكرتون"
        :hint="itemLookupFailed ? 'تعذر تحميل الأنواع — التقرير معروض لكل الأنواع.' : undefined"
      >
        <AppSelect v-model="selectedItem" :options="itemOptions" placeholder="كل الأنواع" :disabled="itemLookupFailed" />
      </FormField>
      <template #actions>
        <AppButton variant="primary" icon="refresh" :busy="loading" @click="load">تحديث التقرير</AppButton>
      </template>
    </FilterBar>

    <ErrorState v-if="error" :message="error" @retry="load" />
    <LoadingState v-else-if="loading && !report" message="جارٍ تحميل حركة المخزون…" />

    <template v-else-if="report">
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
          <div class="metric__meta">فرق الحركة كما يعتمده الخادم.</div>
        </div>
      </section>

      <EmptyState
        v-if="!report.byItem.length && !report.byDate.length"
        icon="reports"
        title="لا توجد حركة"
        message="لا توجد حركة مخزون مطابقة للفلاتر الحالية."
      />

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
    </template>
  </section>
</template>
