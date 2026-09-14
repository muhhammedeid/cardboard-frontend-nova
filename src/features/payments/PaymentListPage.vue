<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect, { type SelectOption } from '@/components/base/AppSelect.vue'
import FormField from '@/components/base/FormField.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import AppPagination from '@/components/data/AppPagination.vue'
import DataTable from '@/components/data/DataTable.vue'
import RowEditAction from '@/components/data/RowEditAction.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import RecordCards from '@/components/data/RecordCards.vue'
import SkeletonBlock from '@/components/feedback/SkeletonBlock.vue'
import StatusBadge from '@/components/data/StatusBadge.vue'
import type { TableColumn } from '@/components/data/table-column'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import type { PaymentListItem, PaymentStatus, SupplierOption } from '@/services/contracts'

const router = useRouter()
const api = useServices().payments

const columns: readonly TableColumn[] = [
  { key: 'postingDate', label: 'التاريخ' },
  { key: 'name', label: 'رقم الدفعة' },
  { key: 'supplierName', label: 'المورد' },
  { key: 'modeOfPayment', label: 'طريقة الدفع' },
  { key: 'amount', label: 'المبلغ', align: 'end' },
  { key: 'status', label: 'الحالة' },
]

const statusOptions: readonly SelectOption[] = [
  { value: 'Draft', label: 'مسودة' },
  { value: 'Submitted', label: 'معتمد' },
  { value: 'Cancelled', label: 'ملغي' },
]

const filters = ref({ fromDate: '', toDate: '', supplier: '', modeOfPayment: '', status: '', search: '' })
const suppliers = ref<SupplierOption[]>([])
const modes = ref<string[]>([])
const supplierLookupFailed = ref(false)
const modeLookupFailed = ref(false)
const rows = ref<PaymentListItem[]>([])
const page = ref(1)
const pageSize = 25
const total = ref(0)
const hasMore = ref(false)
const loading = ref(true)
const error = ref('')

const supplierOptions = computed<SelectOption[]>(() =>
  suppliers.value.map((option) => ({ value: option.supplier, label: option.supplierName })),
)
const modeOptions = computed<SelectOption[]>(() => modes.value.map((mode) => ({ value: mode, label: mode })))

async function loadLookups(): Promise<void> {
  const [supplierResult, modeResult] = await Promise.allSettled([api.lookupSuppliers(), api.lookupModes()])
  if (supplierResult.status === 'fulfilled') {
    suppliers.value = supplierResult.value
    supplierLookupFailed.value = false
  } else {
    suppliers.value = []
    supplierLookupFailed.value = true
  }
  if (modeResult.status === 'fulfilled') {
    modes.value = modeResult.value
    modeLookupFailed.value = false
  } else {
    modes.value = []
    modeLookupFailed.value = true
  }
}

async function load(next = 1): Promise<void> {
  loading.value = true
  error.value = ''
  page.value = next
  try {
    const result = await api.list({
      fromDate: filters.value.fromDate || undefined,
      toDate: filters.value.toDate || undefined,
      supplier: filters.value.supplier || undefined,
      modeOfPayment: filters.value.modeOfPayment || undefined,
      status: (filters.value.status || undefined) as PaymentStatus | undefined,
      search: filters.value.search || undefined,
      page: next,
      pageSize,
    })
    rows.value = result.data
    total.value = result.total
    hasMore.value = result.hasMore
  } catch (value) {
    rows.value = []
    total.value = 0
    hasMore.value = false
    error.value = errorMessage(value, 'تعذر تحميل الدفعات.')
  } finally {
    loading.value = false
  }
}

function reset(): void {
  filters.value = { fromDate: '', toDate: '', supplier: '', modeOfPayment: '', status: '', search: '' }
  void load()
}

onMounted(async () => {
  await loadLookups()
  await load()
})
</script>

<template>
  <section class="stack">
    <PageHeader title="المدفوعات" subtitle="دفعات الموردين؛ الترحيل المحاسبي يبقى على الخادم." icon="payments" eyebrow="السجلات">
      <template #actions>
        <AppButton variant="primary" icon="plus" @click="router.push('/payments/new')">دفعة مورد جديدة</AppButton>
      </template>
    </PageHeader>

    <FilterBar label="فلاتر الدفعات">
      <FormField label="من تاريخ"><AppInput v-model="filters.fromDate" type="date" /></FormField>
      <FormField label="إلى تاريخ"><AppInput v-model="filters.toDate" type="date" /></FormField>
      <FormField label="المورد" :hint="supplierLookupFailed ? 'تعذر تحميل الموردين — الفلتر معطّل مؤقتًا.' : undefined">
        <AppSelect v-model="filters.supplier" :options="supplierOptions" placeholder="كل الموردين" :disabled="supplierLookupFailed" />
      </FormField>
      <FormField label="طريقة الدفع" :hint="modeLookupFailed ? 'تعذر تحميل طرق الدفع — الفلتر معطّل مؤقتًا.' : undefined">
        <AppSelect v-model="filters.modeOfPayment" :options="modeOptions" placeholder="كل الطرق" :disabled="modeLookupFailed" />
      </FormField>
      <FormField label="الحالة"><AppSelect v-model="filters.status" :options="statusOptions" placeholder="كل الحالات" /></FormField>
      <div class="filter-bar__grow">
        <FormField label="بحث"><AppInput v-model="filters.search" placeholder="رقم الدفعة أو المورد" @enter="load(1)" /></FormField>
      </div>
      <template #actions>
        <AppButton variant="primary" icon="filter" :busy="loading" @click="load(1)">تطبيق</AppButton>
        <AppButton variant="ghost" icon="refresh" @click="reset">إعادة تعيين</AppButton>
      </template>
    </FilterBar>

    <SkeletonBlock v-if="loading && !rows.length" :lines="5" variant="card" />
    <ErrorState v-else-if="error" :message="error" @retry="load(page)" />
    <EmptyState v-else-if="!rows.length" icon="payments" title="لا توجد دفعات" message="لا توجد دفعات مطابقة للفلاتر الحالية.">
      <template #actions>
        <AppButton variant="secondary" icon="plus" @click="router.push('/payments/new')">تسجيل دفعة</AppButton>
      </template>
    </EmptyState>

    <template v-else>
      <DataTable
        class="app-desktop-only"
        :columns="columns"
        :rows="rows"
        row-key="name"
        clickable
        :busy="loading"
        @row-click="(row) => router.push(`/payments/${row.name}`)"
      >
        <template #cell-name="{ row }"><span class="table__code">{{ row.name }}</span></template>
        <template #cell-supplierName="{ row }"><span class="table__cell-strong">{{ row.supplierName }}</span></template>
        <template #cell-amount="{ row }"><MoneyValue :value="row.amount" /></template>
        <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
        <template #actions="{ row }">
          <RowEditAction :editable="row.docstatus === 0" label="تحرير الدفعة" @edit="router.push(`/payments/${row.name}/edit`)" />
        </template>
      </DataTable>

      <div class="app-mobile-only">
        <RecordCards
          :items="rows"
          item-key="name"
          title-key="supplierName"
          subtitle-key="name"
          :facts="[
            { key: 'postingDate', label: 'التاريخ' },
            { key: 'modeOfPayment', label: 'طريقة الدفع' },
            { key: 'amount', label: 'المبلغ', kind: 'money' },
            { key: 'status', label: 'الحالة', kind: 'status' },
          ]"
          @row-click="(row) => router.push(`/payments/${row.name}`)"
        >
          <template #badge="{ row }"><StatusBadge :value="row.status" /></template>
        </RecordCards>
      </div>

      <AppPagination :page="page" :page-size="pageSize" :total="total" :has-more="hasMore" :busy="loading" @change="load" />
    </template>
  </section>
</template>
