<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect, { type SelectOption } from '@/components/base/AppSelect.vue'
import FormField from '@/components/base/FormField.vue'
import AppBadge from '@/components/data/AppBadge.vue'
import AppPagination from '@/components/data/AppPagination.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import RecordCards from '@/components/data/RecordCards.vue'
import SkeletonBlock from '@/components/feedback/SkeletonBlock.vue'
import type { TableColumn } from '@/components/data/table-column'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import type { SupplierListItem } from '@/services/contracts'

const router = useRouter()
const api = useServices().suppliers

const columns: readonly TableColumn[] = [
  { key: 'supplierName', label: 'اسم المورد' },
  { key: 'name', label: 'كود المورد' },
  { key: 'supplierGroup', label: 'المجموعة' },
  { key: 'disabled', label: 'الحالة' },
]

const statusOptions: readonly SelectOption[] = [
  { value: 'enabled', label: 'نشط' },
  { value: 'disabled', label: 'غير نشط' },
]

const filters = ref({ search: '', status: '' })
const rows = ref<SupplierListItem[]>([])
const page = ref(1)
const pageSize = 25
const total = ref(0)
const hasMore = ref(false)
const loading = ref(true)
const error = ref('')

async function load(next = 1): Promise<void> {
  loading.value = true
  error.value = ''
  page.value = next
  try {
    const result = await api.list({
      page: next,
      pageSize,
      search: filters.value.search || undefined,
      status: (filters.value.status || undefined) as 'enabled' | 'disabled' | undefined,
    })
    rows.value = result.data
    total.value = result.total
    hasMore.value = result.hasMore
  } catch (value) {
    rows.value = []
    total.value = 0
    hasMore.value = false
    error.value = errorMessage(value, 'تعذر تحميل الموردين.')
  } finally {
    loading.value = false
  }
}

function reset(): void {
  filters.value = { search: '', status: '' }
  void load()
}

onMounted(() => load())
</script>

<template>
  <section class="stack">
    <PageHeader title="الموردون" subtitle="ملفات الموردين التشغيلية. الأرصدة والكشوف تُعرض داخل ملف المورد." icon="suppliers" eyebrow="السجلات">
      <template #actions>
        <AppButton variant="primary" icon="plus" @click="router.push('/suppliers/new')">مورد جديد</AppButton>
      </template>
    </PageHeader>

    <FilterBar label="فلاتر الموردين">
      <div class="filter-bar__grow">
        <FormField label="بحث"><AppInput v-model="filters.search" placeholder="اسم المورد أو الكود" @enter="load(1)" /></FormField>
      </div>
      <FormField label="الحالة"><AppSelect v-model="filters.status" :options="statusOptions" placeholder="الكل" /></FormField>
      <template #actions>
        <AppButton variant="primary" icon="search" :busy="loading" @click="load(1)">بحث</AppButton>
        <AppButton variant="ghost" icon="refresh" @click="reset">إعادة تعيين</AppButton>
      </template>
    </FilterBar>

    <SkeletonBlock v-if="loading && !rows.length" :lines="5" variant="card" />
    <ErrorState v-else-if="error" :message="error" @retry="load(page)" />
    <EmptyState v-else-if="!rows.length" icon="suppliers" title="لا يوجد موردون" message="لا توجد نتائج مطابقة للبحث الحالي.">
      <template #actions>
        <AppButton variant="secondary" icon="plus" @click="router.push('/suppliers/new')">إضافة مورد</AppButton>
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
        @row-click="(row) => router.push(`/suppliers/${row.name}`)"
      >
        <template #cell-supplierName="{ row }"><span class="table__cell-strong">{{ row.supplierName }}</span></template>
        <template #cell-name="{ row }"><span class="table__code">{{ row.name }}</span></template>
        <template #cell-supplierGroup="{ row }">{{ row.supplierGroup || '—' }}</template>
        <template #cell-disabled="{ row }">
          <AppBadge :tone="row.disabled ? 'danger' : 'success'">{{ row.disabled ? 'غير نشط' : 'نشط' }}</AppBadge>
        </template>
      </DataTable>

      <div class="app-mobile-only">
        <RecordCards
          :items="rows"
          item-key="name"
          title-key="supplierName"
          subtitle-key="name"
          :facts="[
            { key: 'supplierGroup', label: 'المجموعة' },
            { key: 'disabled', label: 'الحالة' },
          ]"
          @row-click="(row) => router.push(`/suppliers/${row.name}`)"
        >
          <template #badge="{ row }">
            <AppBadge :tone="row.disabled ? 'danger' : 'success'">{{ row.disabled ? 'غير نشط' : 'نشط' }}</AppBadge>
          </template>
        </RecordCards>
      </div>

      <AppPagination :page="page" :page-size="pageSize" :total="total" :has-more="hasMore" :busy="loading" @change="load" />
    </template>
  </section>
</template>
