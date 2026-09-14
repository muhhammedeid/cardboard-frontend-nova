<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect, { type SelectOption } from '@/components/base/AppSelect.vue'
import FormField from '@/components/base/FormField.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import FactsList from '@/components/data/FactsList.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import NotFoundState from '@/components/feedback/NotFoundState.vue'
import PermissionState from '@/components/feedback/PermissionState.vue'
import { FrontendError } from '@/services/api/errors'
import { useServices } from '@/services'
import { findReportDefinition, type ReportKey } from './report-registry'
import { canLoadReport, reportFilterFields, resolveReportDatePreset, type ReportFilters } from './report-shell'

const route = useRoute()
const services = useServices()

const definition = computed(() => findReportDefinition(String(route.params.reportKey)))
const filters = ref<ReportFilters>({ ...resolveReportDatePreset('this-month') })
const supplierOptions = ref<SelectOption[]>([])
const supplierLookupFailed = ref(false)
const result = ref<unknown>(null)
const loading = ref(false)
const error = ref<FrontendError | null>(null)

const renderers: Record<ReportKey, ReturnType<typeof defineAsyncComponent>> = {
  'operations-summary': defineAsyncComponent(() => import('./components/OperationsSummaryReport.vue')),
  'current-inventory': defineAsyncComponent(() => import('./components/CurrentInventoryReport.vue')),
  'inventory-movement': defineAsyncComponent(() => import('./components/InventoryMovementReport.vue')),
  'expense-summary': defineAsyncComponent(() => import('./components/ExpenseSummaryReport.vue')),
  'supplier-summary': defineAsyncComponent(() => import('./components/SupplierSummaryReport.vue')),
  'supplier-statement': defineAsyncComponent(() => import('./components/SupplierStatementReport.vue')),
  supplies: defineAsyncComponent(() => import('./components/SuppliesReport.vue')),
  sales: defineAsyncComponent(() => import('./components/SalesReport.vue')),
}

const renderer = computed(() => (definition.value ? renderers[definition.value.key] : null))
const fields = computed(() => (definition.value ? reportFilterFields(definition.value) : []))
const unavailable = computed(() => Boolean(definition.value?.requiresSupplier) && !filters.value.supplier)

async function loadSupplierOptions(): Promise<void> {
  if (!definition.value?.requiresSupplier) return
  try {
    supplierOptions.value = (await services.suppliers.list({ page: 1, pageSize: 100 })).data.map((supplier) => ({
      value: supplier.name,
      label: supplier.supplierName,
    }))
    supplierLookupFailed.value = false
  } catch {
    supplierOptions.value = []
    supplierLookupFailed.value = true
  }
}

async function load(): Promise<void> {
  const current = definition.value
  if (!current || !canLoadReport(current, filters.value)) return
  loading.value = true
  error.value = null
  const filter = filters.value
  try {
    const calls: Record<ReportKey, () => Promise<unknown>> = {
      'operations-summary': () => services.reports.operations(filter),
      'current-inventory': () => services.reports.inventory({ selectedDate: filter.toDate, itemCode: filter.cardboardType }),
      'inventory-movement': () => services.reports.movement({ ...filter, cardboardItem: filter.cardboardType }),
      'expense-summary': () => services.reports.expenses(filter),
      'supplier-summary': () => services.reports.supplierSummary({ ...filter, supplier: filter.supplier ?? '' }),
      'supplier-statement': () => services.reports.supplierStatement({ ...filter, supplier: filter.supplier ?? '' }),
      supplies: () => services.reports.supplies({ ...filter, item: filter.cardboardType }),
      sales: () => services.reports.sales({ ...filter, item: filter.cardboardType }),
    }
    result.value = await calls[current.key]()
  } catch (value) {
    error.value = value instanceof FrontendError ? value : new FrontendError('unexpected', 'تعذر تحميل بيانات التقرير.')
  } finally {
    loading.value = false
  }
}

function preset(value: Parameters<typeof resolveReportDatePreset>[0]): void {
  Object.assign(filters.value, resolveReportDatePreset(value))
  void load()
}

watch(
  () => route.params.reportKey,
  async () => {
    result.value = null
    error.value = null
    filters.value = { ...resolveReportDatePreset('this-month') }
    await loadSupplierOptions()
    await load()
  },
)

onMounted(async () => {
  await loadSupplierOptions()
  await load()
})
</script>

<template>
  <section class="stack">
    <NotFoundState v-if="!definition" title="تقرير غير معروف" message="مفتاح التقرير غير مسجل في مركز التقارير." />

    <template v-else>
      <AppPanel title="هوية التقرير" plain>
        <FactsList
          :facts="[
            { label: 'التقرير', value: definition.title },
            { label: 'النطاق', value: definition.description, wide: true },
            { label: 'المفتاح', value: definition.key, kind: 'code' },
          ]"
        />
      </AppPanel>

      <section class="filter-bar" aria-label="فلاتر التقرير">
        <FormField v-for="field in fields" :key="field.key" :label="field.label" :required="field.required">
          <AppSelect
            v-if="field.key === 'supplier'"
            v-model="filters.supplier"
            :options="supplierOptions"
            placeholder="اختر المورد"
            :disabled="supplierLookupFailed"
          />
          <AppInput v-else v-model="filters[field.key]" type="date" />
        </FormField>
        <div v-if="definition.supportsDateRange" class="filter-bar__actions">
          <AppButton variant="secondary" size="sm" @click="preset('today')">اليوم</AppButton>
          <AppButton variant="secondary" size="sm" @click="preset('this-week')">هذا الأسبوع</AppButton>
          <AppButton variant="secondary" size="sm" @click="preset('this-month')">هذا الشهر</AppButton>
          <AppButton variant="secondary" size="sm" @click="preset('previous-month')">الشهر السابق</AppButton>
        </div>
        <p v-if="supplierLookupFailed" class="field__error">تعذر تحميل قائمة الموردين؛ لا يمكن تشغيل هذا التقرير الآن.</p>
        <div class="filter-bar__actions">
          <AppButton variant="primary" icon="refresh" :busy="loading" @click="load">تحديث التقرير</AppButton>
        </div>
      </section>

      <EmptyState
        v-if="unavailable"
        icon="suppliers"
        title="اختر موردًا"
        message="هذا التقرير يتطلب تحديد مورد أولًا لعرض بياناته."
      />
      <LoadingState v-else-if="loading" message="جارٍ تحميل بيانات التقرير…" />
      <PermissionState v-else-if="error?.kind === 'permission'" />
      <ErrorState v-else-if="error" :message="error.message" @retry="load" />
      <component :is="renderer" v-else-if="result && renderer" :report="result" />
      <EmptyState v-else icon="inbox" title="لا توجد بيانات للعرض" message="اضغط تحديث التقرير لتحميل النتائج." />
    </template>
  </section>
</template>
