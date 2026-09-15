<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppBadge from '@/components/data/AppBadge.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import FormField from '@/components/base/FormField.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import DataTable from '@/components/data/DataTable.vue'
import DistributionBars from '@/components/data/DistributionBars.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import FilterBar from '@/components/data/FilterBar.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import RecordCards from '@/components/data/RecordCards.vue'
import type { TableColumn } from '@/components/data/table-column'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import { todayIso } from '@/services/formatting'
import type { InventoryOverview } from '@/services/contracts'

const route = useRoute()
const router = useRouter()
const api = useServices().inventory

const historyMode = computed(() => route.path === '/inventory/history')
const selectedDate = ref(String(route.query.date ?? todayIso()))
/** The backend rejects a future date, so the picker cannot offer one. */
const today = todayIso()
const overview = ref<InventoryOverview | null>(null)
const loading = ref(false)
const error = ref('')

const columns: readonly TableColumn[] = [
  { key: 'itemCode', label: 'كود الصنف' },
  { key: 'itemName', label: 'الصنف' },
  { key: 'quantity', label: 'الرصيد', align: 'end' },
  { key: 'stockValue', label: 'قيمة المخزون', align: 'end' },
]

const stateMessage = computed(() => {
  if (!overview.value) return ''
  if (overview.value.state === 'no_items') return 'لا توجد أصناف كرتون مهيأة في مجموعة الأصناف المضبوطة على الخادم.'
  if (overview.value.state === 'no_stock') return 'لا يوجد رصيد مخزون في التاريخ المحدد.'
  return ''
})

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    overview.value = await api.getOverview({ selectedDate: selectedDate.value })
  } catch (value) {
    overview.value = null
    error.value = errorMessage(value, 'تعذر تحميل بيانات المخزون.')
  } finally {
    loading.value = false
  }
}

watch(selectedDate, () => {
  void load()
})

onMounted(load)
</script>

<template>
  <section class="stack">
    <PageHeader
      :title="historyMode ? 'الرصيد التاريخي' : 'المخزون'"
      icon="inventory"
      eyebrow="المخزون"
    >
      <template #actions>
        <AppButton variant="secondary" icon="calendar" @click="router.push({ path: '/inventory/movement' })">حركة المخزون</AppButton>
        <AppButton v-if="!historyMode" variant="secondary" icon="clock" @click="router.push({ path: '/inventory/history', query: { date: selectedDate } })">
          رصيد تاريخي
        </AppButton>
        <AppButton v-else variant="ghost" icon="arrowRight" @click="router.push('/inventory')">الرصيد الحالي</AppButton>
      </template>
    </PageHeader>

    <FilterBar :label="historyMode ? 'تاريخ الرصيد' : 'تاريخ العرض'">
      <FormField :label="historyMode ? 'تاريخ الرصيد' : 'تاريخ العرض'" hint="الرصيد يُعرض كما في نهاية اليوم المختار؛ لا يمكن اختيار تاريخ مستقبلي.">
        <AppInput v-model="selectedDate" type="date" :max="today" />
      </FormField>
      <template #actions>
        <AppButton variant="primary" icon="refresh" :busy="loading" @click="load">تحديث</AppButton>
      </template>
    </FilterBar>

    <ErrorState v-if="error" :message="error" @retry="load" />
    <LoadingState v-else-if="loading && !overview" message="جارٍ تحميل بيانات المخزون…" />

    <template v-else-if="overview">
      <section class="metric-grid">
        <div class="metric metric--weight">
          <header class="metric__head">إجمالي الكمية</header>
          <p class="metric__value">
            <QuantityValue :value="overview.summary.quantity" :unit="overview.summary.uom ?? ''" />
          </p>
          <div class="metric__meta">
            <span>{{ overview.rows.length }} صنف</span>
          </div>
        </div>
        <div class="metric metric--money">
          <header class="metric__head">قيمة المخزون</header>
          <p class="metric__value"><MoneyValue :value="overview.summary.stockValue" /></p>
        </div>
        <div class="metric metric--info">
          <header class="metric__head">تاريخ اللقطة</header>
          <p class="metric__value metric__value--sm">
            <bdi dir="ltr">{{ overview.selectedDate }}</bdi>
          </p>
          <div class="metric__meta">
            <AppBadge :tone="overview.isToday ? 'success' : 'primary'">{{ overview.isToday ? 'حالي' : 'نهاية اليوم' }}</AppBadge>
            <span>{{ overview.warehouseName }}</span>
          </div>
        </div>
      </section>

      <EmptyState v-if="overview.state !== 'ok'" icon="inventory" title="لا يوجد رصيد لعرضه" :message="stateMessage" />

      <template v-else>
        <AppPanel title="الكمية المتاحة لكل صنف">
          <DistributionBars
            :rows="overview.rows.map((row) => ({ label: row.itemName, amount: row.quantity, kind: 'quantity' as const }))"
          />
        </AppPanel>

        <DataTable class="app-desktop-only" :columns="columns" :rows="overview.rows" row-key="itemCode" :busy="loading">
          <template #cell-itemCode="{ row }"><span class="table__code">{{ row.itemCode }}</span></template>
          <template #cell-quantity="{ row }"><QuantityValue :value="row.quantity" :unit="row.stockUom" /></template>
          <template #cell-stockValue="{ row }"><MoneyValue :value="row.stockValue" /></template>
        </DataTable>

        <div class="app-mobile-only">
          <RecordCards
            :items="overview.rows"
            item-key="itemCode"
            title-key="itemName"
            subtitle-key="itemCode"
            :facts="[
              { key: 'quantity', label: 'الرصيد', kind: 'quantity' },
              { key: 'stockValue', label: 'قيمة المخزون', kind: 'money' },
            ]"
            :clickable="false"
          />
        </div>
      </template>
    </template>
  </section>
</template>
