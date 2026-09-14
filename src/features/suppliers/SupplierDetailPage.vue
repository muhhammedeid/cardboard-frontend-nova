<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppBadge from '@/components/data/AppBadge.vue'
import AppButton from '@/components/base/AppButton.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import AppTabs, { type TabItem } from '@/components/data/AppTabs.vue'
import DataTable from '@/components/data/DataTable.vue'
import DataTimeline, { type TimelineEntry } from '@/components/data/DataTimeline.vue'
import FactsList from '@/components/data/FactsList.vue'
import MetricCard from '@/components/data/MetricCard.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import type { TableColumn } from '@/components/data/table-column'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import type { SupplierDetail, SupplierSummary } from '@/services/contracts'

const route = useRoute()
const router = useRouter()
const api = useServices().suppliers

const supplierId = computed(() => String(route.params.id))
const supplier = ref<SupplierDetail | null>(null)
const summary = ref<SupplierSummary | null>(null)
const statement = ref<SupplierSummary | null>(null)
const loading = ref(true)
const error = ref('')
const activeTab = ref('overview')

const tabs: readonly TabItem[] = [
  { id: 'overview', label: 'نظرة عامة' },
  { id: 'supplies', label: 'التوريدات' },
  { id: 'payments', label: 'الدفعات' },
  { id: 'statement', label: 'كشف الحساب' },
]

const supplyColumns: readonly TableColumn[] = [
  { key: 'postingDate', label: 'التاريخ' },
  { key: 'supply', label: 'رقم التوريدة' },
  { key: 'itemName', label: 'نوع الكرتون' },
  { key: 'payableWeight', label: 'الوزن المحتسب', align: 'end' },
  { key: 'value', label: 'القيمة', align: 'end' },
]

const paymentColumns: readonly TableColumn[] = [
  { key: 'postingDate', label: 'التاريخ' },
  { key: 'payment', label: 'رقم الدفعة' },
  { key: 'modeOfPayment', label: 'طريقة الدفع' },
  { key: 'amount', label: 'المبلغ', align: 'end' },
]

const statementEntries = computed<TimelineEntry[]>(() =>
  (statement.value?.paymentHistory ?? []).map((entry) => ({
    id: entry.payment,
    type: 'payment' as const,
    title: entry.modeOfPayment ? `دفعة · ${entry.modeOfPayment}` : 'دفعة مورد',
    date: entry.postingDate,
    amount: entry.amount,
  })),
)

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  const [detailResult, summaryResult] = await Promise.allSettled([api.get(supplierId.value), api.summary(supplierId.value)])
  if (detailResult.status === 'fulfilled') supplier.value = detailResult.value
  else error.value = errorMessage(detailResult.reason, 'تعذر تحميل ملف المورد.')
  if (summaryResult.status === 'fulfilled') summary.value = summaryResult.value
  loading.value = false
}

async function selectTab(id: string): Promise<void> {
  activeTab.value = id
  if (id !== 'statement') return
  try {
    statement.value = await api.statement(supplierId.value)
  } catch (value) {
    error.value = errorMessage(value, 'تعذر تحميل كشف الحساب.')
  }
}

onMounted(load)
</script>

<template>
  <section class="stack">
    <PageHeader
      :title="supplier?.supplierName ?? 'ملف المورد'"
      eyebrow="ملف المورد"
      icon="suppliers"
      :subtitle="supplier?.supplierGroup"
    >
      <template #meta>
        <div class="row faint">
          <span class="mono"><bdi dir="ltr">{{ supplierId }}</bdi></span>
          <AppBadge v-if="supplier" :tone="supplier.disabled ? 'danger' : 'success'">{{ supplier.disabled ? 'غير نشط' : 'نشط' }}</AppBadge>
        </div>
      </template>
      <template #actions>
        <AppButton variant="primary" icon="payments" @click="router.push({ path: '/payments/new', query: { supplier: supplierId } })">دفعة مورد</AppButton>
        <AppButton variant="secondary" icon="inbound" @click="router.push({ path: '/supplies/new', query: { supplier: supplierId } })">توريدة جديدة</AppButton>
        <AppButton variant="ghost" icon="arrowRight" @click="router.push('/suppliers')">القائمة</AppButton>
      </template>
    </PageHeader>

    <ErrorState v-if="error && !supplier" :message="error" @retry="load" />
    <LoadingState v-else-if="loading" message="جارٍ تحميل ملف المورد…" />

    <template v-else-if="supplier">
      <section class="metric-grid">
        <MetricCard label="الرصيد المستحق الحالي" helper="قيمة معتمدة من الخادم" tone="money" icon="payments">
          <template #value><MoneyValue :value="summary?.outstanding ?? null" /></template>
          <template #meta><span class="faint">{{ summary?.outstandingSemantics ? 'رصيد فواتير الشراء الحالي' : '' }}</span></template>
        </MetricCard>
        <MetricCard label="قيمة التوريدات خلال الفترة" helper="مجموع التوريدات المعتمدة" tone="weight" icon="inbound">
          <template #value><MoneyValue :value="summary?.supplyValue ?? null" /></template>
          <template #meta>
            <QuantityValue :value="summary?.suppliedPayableWeight ?? 0" unit="كجم" />
            <span class="faint">· {{ summary?.supplyCount ?? 0 }} توريدة</span>
          </template>
        </MetricCard>
        <MetricCard label="المدفوعات خلال الفترة" helper="دفعات المورد المسجلة" tone="success" icon="check">
          <template #value><MoneyValue :value="summary?.supplierPayments ?? null" /></template>
        </MetricCard>
      </section>

      <p v-if="error" class="readonly-note readonly-note--warning" role="alert">{{ error }}</p>

      <AppTabs :tabs="tabs" :active-id="activeTab" label="أقسام ملف المورد" @update:active-id="selectTab" />

      <AppPanel v-if="activeTab === 'overview'" title="بيانات المورد" description="حقول الاتصال للقراءة فقط وتأتي من بطاقة الجهة في ERPNext.">
        <FactsList
          :facts="[
            { label: 'الهاتف', value: supplier.mobileNo ?? null, kind: 'code' },
            { label: 'البريد الإلكتروني', value: supplier.emailId ?? null },
            { label: 'العنوان', value: supplier.primaryAddress ?? null, wide: true },
            { label: 'المجموعة', value: supplier.supplierGroup ?? null },
            { label: 'نوع المورد', value: supplier.supplierType === 'Company' ? 'شركة' : supplier.supplierType === 'Individual' ? 'فرد' : 'شراكة' },
            { label: 'الرقم الضريبي', value: supplier.taxId ?? null, kind: 'code' },
            { label: 'ملاحظات', value: supplier.supplierDetails ?? null, wide: true },
          ]"
        />
      </AppPanel>

      <template v-else-if="activeTab === 'supplies'">
        <DataTable :columns="supplyColumns" :rows="summary?.supplyHistory ?? []" row-key="supply" empty-label="لا توجد توريدات خلال الفترة.">
          <template #cell-supply="{ row }"><span class="table__code">{{ row.supply }}</span></template>
          <template #cell-payableWeight="{ row }"><QuantityValue :value="row.payableWeight" unit="Kg" /></template>
          <template #cell-value="{ row }"><MoneyValue :value="row.value" /></template>
        </DataTable>
      </template>

      <template v-else-if="activeTab === 'payments'">
        <DataTable :columns="paymentColumns" :rows="summary?.paymentHistory ?? []" row-key="payment" empty-label="لا توجد دفعات خلال الفترة.">
          <template #cell-payment="{ row }"><span class="table__code">{{ row.payment }}</span></template>
          <template #cell-modeOfPayment="{ row }">{{ row.modeOfPayment || '—' }}</template>
          <template #cell-amount="{ row }"><MoneyValue :value="row.amount" /></template>
        </DataTable>
      </template>

      <AppPanel v-else title="كشف الحساب" description="كشف مبني على بيانات الخادم المعتمدة.">
        <DataTimeline v-if="statementEntries.length" :entries="statementEntries" />
        <p v-else class="muted">لا توجد حركات في كشف الحساب خلال الفترة الافتراضية.</p>
      </AppPanel>
    </template>
  </section>
</template>
