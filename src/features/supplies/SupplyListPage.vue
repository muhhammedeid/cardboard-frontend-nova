<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect, { type SelectOption } from '@/components/base/AppSelect.vue'
import FormField from '@/components/base/FormField.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import AppPagination from '@/components/data/AppPagination.vue'
import DataTable from '@/components/data/DataTable.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import RecordCards from '@/components/data/RecordCards.vue'
import RowEditAction from '@/components/data/RowEditAction.vue'
import StatusBadge from '@/components/data/StatusBadge.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import SkeletonBlock from '@/components/feedback/SkeletonBlock.vue'
import type { TableColumn } from '@/components/data/table-column'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import type { Lookup, SupplyListItem, SupplyStatus } from '@/services/contracts'

const router = useRouter()
const api = useServices().supplies

const columns: readonly TableColumn[] = [
  { key: 'postingDate', label: 'التاريخ' },
  { key: 'name', label: 'رقم التوريدة', align: 'start' },
  { key: 'supplierName', label: 'المورد' },
  { key: 'itemName', label: 'نوع الكرتون' },
  { key: 'payableWeight', label: 'الوزن المحتسب', align: 'end' },
  { key: 'totalAmount', label: 'القيمة', align: 'end' },
  { key: 'status', label: 'الحالة' },
]

const statusOptions: readonly SelectOption[] = [
  { value: 'Draft', label: 'مسودة' },
  { value: 'Submitted', label: 'معتمد' },
  { value: 'Cancelled', label: 'ملغي' },
]

const filters = ref({ dateFrom: '', dateTo: '', supplier: '', item: '', status: '', search: '' })
const suppliers = ref<Lookup[]>([])
const items = ref<Lookup[]>([])
const supplierLookupFailed = ref(false)
const itemLookupFailed = ref(false)
const rows = ref<SupplyListItem[]>([])
const page = ref(1)
const pageSize = 25
const total = ref(0)
const hasMore = ref(false)
const loading = ref(true)
const error = ref('')

const supplierOptions = computed<SelectOption[]>(() => suppliers.value.map((option) => ({ value: option.name, label: option.label })))
const itemOptions = computed<SelectOption[]>(() => items.value.map((option) => ({ value: option.name, label: option.label })))

async function loadSuppliers(): Promise<void> {
  try {
    suppliers.value = await api.lookupSuppliers()
    supplierLookupFailed.value = false
  } catch {
    suppliers.value = []
    supplierLookupFailed.value = true
  }
}

async function loadItems(): Promise<void> {
  try {
    items.value = await api.lookupItems()
    itemLookupFailed.value = false
  } catch {
    items.value = []
    itemLookupFailed.value = true
  }
}

async function load(next = 1): Promise<void> {
  loading.value = true
  error.value = ''
  page.value = next
  try {
    const result = await api.list({
      dateFrom: filters.value.dateFrom || undefined,
      dateTo: filters.value.dateTo || undefined,
      supplier: filters.value.supplier || undefined,
      item: filters.value.item || undefined,
      status: (filters.value.status || undefined) as SupplyStatus | undefined,
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
    error.value = errorMessage(value, 'تعذر تحميل التوريدات.')
  } finally {
    loading.value = false
  }
}

function reset(): void {
  filters.value = { dateFrom: '', dateTo: '', supplier: '', item: '', status: '', search: '' }
  void load()
}

function open(name: string): void {
  void router.push(`/supplies/${name}`)
}

onMounted(async () => {
  // Lookups load independently: one failure must not hide the other's options.
  await Promise.allSettled([loadSuppliers(), loadItems()])
  await load()
})
</script>

<template>
  <section class="stack">
    <PageHeader title="التوريدات" icon="inbound" eyebrow="التشغيل">
      <template #actions>
        <AppButton variant="primary" icon="plus" @click="router.push('/supplies/new')">توريدة جديدة</AppButton>
      </template>
    </PageHeader>

    <FilterBar label="فلاتر التوريدات">
      <FormField label="من تاريخ"><AppInput v-model="filters.dateFrom" type="date" /></FormField>
      <FormField label="إلى تاريخ"><AppInput v-model="filters.dateTo" type="date" /></FormField>
      <FormField label="المورد" :hint="supplierLookupFailed ? 'تعذر تحميل قائمة الموردين — الفلتر معطّل مؤقتًا.' : undefined">
        <AppSelect v-model="filters.supplier" :options="supplierOptions" placeholder="كل الموردين" :disabled="supplierLookupFailed" />
      </FormField>
      <FormField label="نوع الكرتون" :hint="itemLookupFailed ? 'تعذر تحميل أنواع الكرتون — الفلتر معطّل مؤقتًا.' : undefined">
        <AppSelect v-model="filters.item" :options="itemOptions" placeholder="كل الأنواع" :disabled="itemLookupFailed" />
      </FormField>
      <FormField label="الحالة"><AppSelect v-model="filters.status" :options="statusOptions" placeholder="كل الحالات" /></FormField>
      <div class="filter-bar__grow">
        <FormField label="بحث"><AppInput v-model="filters.search" placeholder="رقم التوريدة أو المورد أو النوع" @enter="load(1)" /></FormField>
      </div>
      <template #actions>
        <AppButton variant="primary" icon="filter" :busy="loading" @click="load(1)">تطبيق</AppButton>
        <AppButton variant="ghost" icon="refresh" @click="reset">إعادة تعيين</AppButton>
      </template>
    </FilterBar>

    <SkeletonBlock v-if="loading && !rows.length" :lines="5" variant="card" />
    <ErrorState v-else-if="error" :message="error" @retry="load(page)" />

    <EmptyState
      v-else-if="!rows.length"
      icon="inbound"
      title="لا توجد توريدات"
      message="لا توجد توريدات مطابقة للفلاتر الحالية. جرّب توسيع الفترة الزمنية أو إعادة التعيين."
    >
      <template #actions>
        <AppButton variant="secondary" icon="plus" @click="router.push('/supplies/new')">تسجيل توريدة</AppButton>
        <AppButton variant="ghost" @click="reset">إعادة تعيين الفلاتر</AppButton>
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
        @row-click="(row) => open(row.name)"
      >
        <template #cell-name="{ row }"><span class="table__code">{{ row.name }}</span></template>
        <template #cell-payableWeight="{ row }"><QuantityValue :value="row.payableWeight" unit="Kg" /></template>
        <template #cell-totalAmount="{ row }"><MoneyValue :value="row.totalAmount" /></template>
        <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
        <template #actions="{ row }">
          <RowEditAction
            :editable="row.docstatus === 0"
            label="تحرير التوريدة"
            @edit="router.push(`/supplies/${row.name}/edit`)"
          />
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
            { key: 'itemName', label: 'نوع الكرتون' },
            { key: 'payableWeight', label: 'الوزن المحتسب', kind: 'quantity' },
            { key: 'totalAmount', label: 'القيمة', kind: 'money' },
          ]"
          @row-click="(row) => open(row.name)"
        >
          <template #badge="{ row }"><StatusBadge :value="row.status" /></template>
        </RecordCards>
      </div>

      <AppPagination :page="page" :page-size="pageSize" :total="total" :has-more="hasMore" :busy="loading" @change="load" />
    </template>
  </section>
</template>
