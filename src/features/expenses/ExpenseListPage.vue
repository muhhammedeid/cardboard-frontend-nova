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
import type { ExpenseItem, ExpenseOption, ExpenseStatus } from '@/services/contracts'

const router = useRouter()
const api = useServices().expenses

const columns: readonly TableColumn[] = [
  { key: 'postingDate', label: 'التاريخ' },
  { key: 'name', label: 'رقم المصروف' },
  { key: 'expenseCategoryName', label: 'الفئة' },
  { key: 'paymentSourceName', label: 'مصدر الدفع' },
  { key: 'amount', label: 'المبلغ', align: 'end' },
  { key: 'status', label: 'الحالة' },
]

const statusOptions: readonly SelectOption[] = [
  { value: 'Draft', label: 'مسودة' },
  { value: 'Submitted', label: 'معتمد' },
  { value: 'Cancelled', label: 'ملغي' },
]

const filters = ref({ fromDate: '', toDate: '', expenseCategory: '', status: '', search: '' })
const categories = ref<ExpenseOption[]>([])
const categoryLookupFailed = ref(false)
const rows = ref<ExpenseItem[]>([])
const page = ref(1)
const pageSize = 25
const total = ref(0)
const hasMore = ref(false)
const loading = ref(true)
const error = ref('')

const categoryOptions = computed<SelectOption[]>(() => categories.value.map((option) => ({ value: option.name, label: option.displayName })))

async function loadCategories(): Promise<void> {
  try {
    categories.value = await api.categories()
    categoryLookupFailed.value = false
  } catch {
    categories.value = []
    categoryLookupFailed.value = true
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
      expenseCategory: filters.value.expenseCategory || undefined,
      status: (filters.value.status || undefined) as ExpenseStatus | undefined,
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
    error.value = errorMessage(value, 'تعذر تحميل المصروفات.')
  } finally {
    loading.value = false
  }
}

function reset(): void {
  filters.value = { fromDate: '', toDate: '', expenseCategory: '', status: '', search: '' }
  void load()
}

onMounted(async () => {
  await Promise.allSettled([loadCategories(), load()])
})
</script>

<template>
  <section class="stack">
    <PageHeader title="المصروفات" subtitle="المصروفات التشغيلية؛ القيد المحاسبي يبقى على الخادم." icon="expenses" eyebrow="السجلات">
      <template #actions>
        <AppButton variant="primary" icon="plus" @click="router.push('/expenses/new')">مصروف جديد</AppButton>
      </template>
    </PageHeader>

    <FilterBar label="فلاتر المصروفات">
      <FormField label="من تاريخ"><AppInput v-model="filters.fromDate" type="date" /></FormField>
      <FormField label="إلى تاريخ"><AppInput v-model="filters.toDate" type="date" /></FormField>
      <FormField label="فئة المصروف" :hint="categoryLookupFailed ? 'تعذر تحميل الفئات — الفلتر معطّل مؤقتًا.' : undefined">
        <AppSelect v-model="filters.expenseCategory" :options="categoryOptions" placeholder="كل الفئات" :disabled="categoryLookupFailed" />
      </FormField>
      <FormField label="الحالة"><AppSelect v-model="filters.status" :options="statusOptions" placeholder="كل الحالات" /></FormField>
      <div class="filter-bar__grow">
        <FormField label="بحث"><AppInput v-model="filters.search" placeholder="رقم المصروف أو الوصف" @enter="load(1)" /></FormField>
      </div>
      <template #actions>
        <AppButton variant="primary" icon="filter" :busy="loading" @click="load(1)">تطبيق</AppButton>
        <AppButton variant="ghost" icon="refresh" @click="reset">إعادة تعيين</AppButton>
      </template>
    </FilterBar>

    <SkeletonBlock v-if="loading && !rows.length" :lines="5" variant="card" />
    <ErrorState v-else-if="error" :message="error" @retry="load(page)" />
    <EmptyState v-else-if="!rows.length" icon="expenses" title="لا توجد مصروفات" message="لا توجد مصروفات مطابقة للفلاتر الحالية.">
      <template #actions>
        <AppButton variant="secondary" icon="plus" @click="router.push('/expenses/new')">تسجيل مصروف</AppButton>
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
        @row-click="(row) => router.push(`/expenses/${row.name}`)"
      >
        <template #cell-name="{ row }"><span class="table__code">{{ row.name }}</span></template>
        <template #cell-expenseCategoryName="{ row }"><span class="table__cell-strong">{{ row.expenseCategoryName }}</span></template>
        <template #cell-paymentSourceName="{ row }">{{ row.paymentSourceName || '—' }}</template>
        <template #cell-amount="{ row }"><MoneyValue :value="row.amount" /></template>
        <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
        <template #actions="{ row }">
          <RowEditAction :editable="row.docstatus === 0" label="تحرير المصروف" @edit="router.push(`/expenses/${row.name}/edit`)" />
        </template>
      </DataTable>

      <div class="app-mobile-only">
        <RecordCards
          :items="rows"
          item-key="name"
          title-key="expenseCategoryName"
          subtitle-key="name"
          :facts="[
            { key: 'postingDate', label: 'التاريخ' },
            { key: 'paymentSourceName', label: 'مصدر الدفع' },
            { key: 'amount', label: 'المبلغ', kind: 'money' },
            { key: 'status', label: 'الحالة', kind: 'status' },
          ]"
          @row-click="(row) => router.push(`/expenses/${row.name}`)"
        >
          <template #badge="{ row }"><StatusBadge :value="row.status" /></template>
        </RecordCards>
      </div>

      <AppPagination :page="page" :page-size="pageSize" :total="total" :has-more="hasMore" :busy="loading" @change="load" />
    </template>
  </section>
</template>
