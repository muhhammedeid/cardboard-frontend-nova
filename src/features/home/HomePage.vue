<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppBadge from '@/components/data/AppBadge.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import FormField from '@/components/base/FormField.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import DataTable from '@/components/data/DataTable.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import RecordCards from '@/components/data/RecordCards.vue'
import type { TableColumn } from '@/components/data/table-column'
import { useServices } from '@/services'
import { todayIso } from '@/services/formatting'
import type { InventoryOverview, OperationsSummary } from '@/services/contracts'

const router = useRouter()
const services = useServices()

const selectedDate = ref(todayIso())
const operations = ref<OperationsSummary | null>(null)
const inventory = ref<InventoryOverview | null>(null)
const operationsError = ref('')
const inventoryError = ref('')
const loading = ref(true)

const stockColumns: readonly TableColumn[] = [
  { key: 'itemName', label: 'الصنف' },
  { key: 'itemCode', label: 'الكود' },
  { key: 'quantity', label: 'الرصيد', align: 'end' },
  { key: 'stockValue', label: 'القيمة', align: 'end' },
]

const hasOperations = computed(() => {
  const value = operations.value
  if (!value) return false
  return [value.supplies.count, value.sales.count, value.expenses.count, value.supplierPayments.count].some((count) => count > 0)
})

async function refresh(): Promise<void> {
  loading.value = true
  operationsError.value = ''
  inventoryError.value = ''
  const [ops, stock] = await Promise.allSettled([
    services.reporting.getOperationsSummary({ fromDate: selectedDate.value, toDate: selectedDate.value }),
    services.inventory.getOverview({ selectedDate: selectedDate.value }),
  ])
  if (ops.status === 'fulfilled') operations.value = ops.value
  else {
    operations.value = null
    operationsError.value = 'تعذر تحميل مؤشرات التشغيل.'
  }
  if (stock.status === 'fulfilled') inventory.value = stock.value
  else {
    inventory.value = null
    inventoryError.value = 'تعذر تحميل ملخص المخزون.'
  }
  loading.value = false
}

onMounted(refresh)
</script>

<template>
  <section class="stack">
    <PageHeader
      title="لوحة التشغيل"
      subtitle="ملخص اليوم من التوريدات والمبيعات والمدفوعات والمصروفات، مع رصيد المخزون المعتمد."
      icon="gauge"
      eyebrow="الرئيسية"
    >
      <template #actions>
        <AppButton variant="primary" icon="inbound" @click="router.push('/supplies/new')">توريدة جديدة</AppButton>
        <AppButton variant="secondary" icon="outbound" @click="router.push('/sales/new')">بيع جديد</AppButton>
        <AppButton variant="ghost" icon="refresh" :busy="loading" @click="refresh">تحديث</AppButton>
      </template>
    </PageHeader>

    <div class="metric-grid--tight row wrap">
      <FormField label="تاريخ المؤشرات" hint="المؤشرات والمخزون لنفس اليوم المختار.">
        <AppInput v-model="selectedDate" type="date" @enter="refresh" />
      </FormField>
    </div>

    <section class="page-section">
      <div class="page-section__heading">
        <h2>مؤشرات اليوم</h2>
        <p>القيم المعتمدة من الخادم للفترة المختارة.</p>
      </div>

      <div v-if="loading && !operations" class="metric-grid">
        <span v-for="index in 4" :key="index" class="skeleton skeleton--card" />
      </div>
      <EmptyState v-else-if="operationsError" icon="inbox" title="تعذر تحميل المؤشرات" :message="operationsError">
        <template #actions><AppButton variant="secondary" icon="refresh" @click="refresh">إعادة المحاولة</AppButton></template>
      </EmptyState>
      <EmptyState
        v-else-if="!hasOperations"
        icon="inbox"
        title="لا توجد عمليات مسجلة"
        message="لا توجد توريدات أو مبيعات أو مدفوعات أو مصروفات في التاريخ المختار."
      >
        <template #actions><AppButton variant="primary" icon="inbound" @click="router.push('/supplies/new')">تسجيل توريدة</AppButton></template>
      </EmptyState>

      <div v-else-if="operations" class="metric-grid">
        <button class="metric metric--interactive metric--weight" type="button" @click="router.push('/supplies')">
          <header class="metric__head">التوريدات</header>
          <p class="metric__value"><QuantityValue :value="operations.supplies.payableWeight" unit="كجم" /></p>
          <div class="metric__meta">
            <AppBadge tone="weight" :dot="false">{{ operations.supplies.count }} توريدة</AppBadge>
            <MoneyValue :value="operations.supplies.value" />
          </div>
        </button>
        <button class="metric metric--interactive" type="button" @click="router.push('/sales')">
          <header class="metric__head">المبيعات</header>
          <p class="metric__value"><QuantityValue :value="operations.sales.quantity" unit="كجم" /></p>
          <div class="metric__meta">
            <AppBadge tone="primary" :dot="false">{{ operations.sales.count }} بيع</AppBadge>
            <MoneyValue :value="operations.sales.value" />
          </div>
        </button>
        <button class="metric metric--interactive metric--success" type="button" @click="router.push('/payments')">
          <header class="metric__head">مدفوعات الموردين</header>
          <p class="metric__value"><MoneyValue :value="operations.supplierPayments.amount" /></p>
          <div class="metric__meta">
            <AppBadge tone="success" :dot="false">{{ operations.supplierPayments.count }} دفعة</AppBadge>
          </div>
        </button>
        <button class="metric metric--interactive metric--warning" type="button" @click="router.push('/expenses')">
          <header class="metric__head">المصروفات</header>
          <p class="metric__value"><MoneyValue :value="operations.expenses.amount" /></p>
          <div class="metric__meta">
            <AppBadge tone="warning" :dot="false">{{ operations.expenses.count }} مصروف</AppBadge>
          </div>
        </button>
      </div>
    </section>

    <section class="page-section">
      <div class="page-section__heading">
        <h2>المخزون</h2>
        <div class="row">
          <AppButton variant="ghost" icon="inventory" @click="router.push('/inventory')">تفاصيل المخزون</AppButton>
        </div>
      </div>

      <div v-if="loading && !inventory" class="skeleton skeleton--card" />
      <EmptyState v-else-if="inventoryError" icon="inventory" title="تعذر تحميل المخزون" :message="inventoryError">
        <template #actions><AppButton variant="secondary" icon="refresh" @click="refresh">إعادة المحاولة</AppButton></template>
      </EmptyState>
      <EmptyState
        v-else-if="inventory && inventory.state !== 'ok'"
        icon="inventory"
        title="لا يوجد رصيد لعرضه"
        :message="inventory.state === 'no_items' ? 'لا توجد أصناف كرتون مهيأة.' : 'لا يوجد رصيد في التاريخ المحدد.'"
      />

      <template v-else-if="inventory">
        <section class="metric-grid">
          <div class="metric metric--weight">
            <header class="metric__head">إجمالي الرصيد</header>
            <p class="metric__value"><QuantityValue :value="inventory.summary.quantity" :unit="inventory.summary.uom ?? ''" /></p>
            <div class="metric__meta">{{ inventory.warehouseName }}</div>
          </div>
          <div class="metric metric--money">
            <header class="metric__head">قيمة المخزون</header>
            <p class="metric__value"><MoneyValue :value="inventory.summary.stockValue" /></p>
            <div class="metric__meta">
              <AppBadge :tone="inventory.isToday ? 'success' : 'primary'">{{ inventory.isToday ? 'حالي' : 'نهاية اليوم' }}</AppBadge>
            </div>
          </div>
        </section>

        <AppPanel title="الأصناف" description="الرصيد والقيمة لكل صنف كرتون." :flush="false">
          <DataTable class="app-desktop-only" :columns="stockColumns" :rows="inventory.rows" row-key="itemCode">
            <template #cell-itemCode="{ row }"><span class="table__code">{{ row.itemCode }}</span></template>
            <template #cell-quantity="{ row }"><QuantityValue :value="row.quantity" :unit="row.stockUom" /></template>
            <template #cell-stockValue="{ row }"><MoneyValue :value="row.stockValue" /></template>
          </DataTable>
          <div class="app-mobile-only">
            <RecordCards
              :items="inventory.rows"
              item-key="itemCode"
              title-key="itemName"
              subtitle-key="itemCode"
              :clickable="false"
              :facts="[
                { key: 'quantity', label: 'الرصيد', kind: 'quantity' },
                { key: 'stockValue', label: 'القيمة', kind: 'money' },
              ]"
            />
          </div>
        </AppPanel>
      </template>
    </section>
  </section>
</template>
