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
import type { SaleListItem, SaleLookup, SaleStatus } from '@/services/contracts'

const router = useRouter()
const api = useServices().sales

const columns: readonly TableColumn[] = [
  { key: 'postingDate', label: 'التاريخ' },
  { key: 'name', label: 'رقم البيع' },
  { key: 'buyerName', label: 'المشتري' },
  { key: 'itemName', label: 'نوع الكرتون' },
  { key: 'quantity', label: 'الكمية', align: 'end' },
  { key: 'informationalValue', label: 'القيمة التشغيلية', align: 'end' },
  { key: 'status', label: 'الحالة' },
]

const statusOptions: readonly SelectOption[] = [
  { value: 'Draft', label: 'مسودة' },
  { value: 'Submitted', label: 'معتمد' },
  { value: 'Cancelled', label: 'ملغي' },
]

const filters = ref({ fromDate: '', toDate: '', item: '', buyer: '', status: '', search: '' })
const items = ref<SaleLookup[]>([])
const buyers = ref<string[]>([])
const itemLookupFailed = ref(false)
const buyerLookupFailed = ref(false)
const rows = ref<SaleListItem[]>([])
const page = ref(1)
const pageSize = 25
const total = ref(0)
const hasMore = ref(false)
const loading = ref(true)
const error = ref('')

const itemOptions = computed<SelectOption[]>(() => items.value.map((option) => ({ value: option.name, label: option.label })))
const buyerOptions = computed<SelectOption[]>(() => buyers.value.map((buyer) => ({ value: buyer, label: buyer })))

async function loadLookups(): Promise<void> {
  const [itemResult, buyerResult] = await Promise.allSettled([api.lookupItems(), api.lookupBuyers()])
  if (itemResult.status === 'fulfilled') {
    items.value = itemResult.value
    itemLookupFailed.value = false
  } else {
    items.value = []
    itemLookupFailed.value = true
  }
  if (buyerResult.status === 'fulfilled') {
    buyers.value = buyerResult.value
    buyerLookupFailed.value = false
  } else {
    buyers.value = []
    buyerLookupFailed.value = true
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
      item: filters.value.item || undefined,
      buyer: filters.value.buyer || undefined,
      status: (filters.value.status || undefined) as SaleStatus | undefined,
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
    error.value = errorMessage(value, 'تعذر تحميل المبيعات.')
  } finally {
    loading.value = false
  }
}

function reset(): void {
  filters.value = { fromDate: '', toDate: '', item: '', buyer: '', status: '', search: '' }
  void load()
}

onMounted(async () => {
  await loadLookups()
  await load()
})
</script>

<template>
  <section class="stack">
    <PageHeader title="المبيعات" subtitle="بيع الكرتون بالكميات والقيمة التشغيلية المعتمدة من الخادم." icon="outbound" eyebrow="التشغيل">
      <template #actions>
        <AppButton variant="primary" icon="plus" @click="router.push('/sales/new')">بيع جديد</AppButton>
      </template>
    </PageHeader>

    <FilterBar label="فلاتر المبيعات">
      <FormField label="من تاريخ"><AppInput v-model="filters.fromDate" type="date" /></FormField>
      <FormField label="إلى تاريخ"><AppInput v-model="filters.toDate" type="date" /></FormField>
      <FormField label="نوع الكرتون" :hint="itemLookupFailed ? 'تعذر تحميل الأنواع — الفلتر معطّل مؤقتًا.' : undefined">
        <AppSelect v-model="filters.item" :options="itemOptions" placeholder="كل الأنواع" :disabled="itemLookupFailed" />
      </FormField>
      <FormField label="المشتري" :hint="buyerLookupFailed ? 'تعذر تحميل المشترين — الفلتر معطّل مؤقتًا.' : undefined">
        <AppSelect v-model="filters.buyer" :options="buyerOptions" placeholder="كل المشترين" :disabled="buyerLookupFailed" />
      </FormField>
      <FormField label="الحالة"><AppSelect v-model="filters.status" :options="statusOptions" placeholder="كل الحالات" /></FormField>
      <div class="filter-bar__grow">
        <FormField label="بحث"><AppInput v-model="filters.search" placeholder="رقم البيع أو المشتري أو النوع" @enter="load(1)" /></FormField>
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
      icon="outbound"
      title="لا توجد مبيعات"
      message="لا توجد مبيعات مطابقة للفلاتر الحالية."
    >
      <template #actions>
        <AppButton variant="secondary" icon="plus" @click="router.push('/sales/new')">تسجيل بيع</AppButton>
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
        @row-click="(row) => router.push(`/sales/${row.name}`)"
      >
        <template #cell-name="{ row }"><span class="table__code">{{ row.name }}</span></template>
        <template #cell-buyerName="{ row }">{{ row.buyerName || '—' }}</template>
        <template #cell-quantity="{ row }"><QuantityValue :value="row.quantity" unit="Kg" /></template>
        <template #cell-informationalValue="{ row }"><MoneyValue :value="row.informationalValue" /></template>
        <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
        <template #actions="{ row }">
          <RowEditAction :editable="row.docstatus === 0" label="تحرير البيع" @edit="router.push(`/sales/${row.name}/edit`)" />
        </template>
      </DataTable>

      <div class="app-mobile-only">
        <RecordCards
          :items="rows"
          item-key="name"
          title-key="buyerName"
          subtitle-key="name"
          :facts="[
            { key: 'postingDate', label: 'التاريخ' },
            { key: 'itemName', label: 'نوع الكرتون' },
            { key: 'quantity', label: 'الكمية', kind: 'quantity' },
            { key: 'informationalValue', label: 'القيمة', kind: 'money' },
          ]"
          @row-click="(row) => router.push(`/sales/${row.name}`)"
        >
          <template #badge="{ row }"><StatusBadge :value="row.status" /></template>
        </RecordCards>
      </div>

      <AppPagination :page="page" :page-size="pageSize" :total="total" :has-more="hasMore" :busy="loading" @change="load" />
    </template>
  </section>
</template>
