<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/base/AppButton.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import FactsList from '@/components/data/FactsList.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import StatusBadge from '@/components/data/StatusBadge.vue'
import AppDialog from '@/components/feedback/AppDialog.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import { useToastStore } from '@/app/stores/toasts'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import type { SupplyDetail } from '@/services/contracts'

const route = useRoute()
const router = useRouter()
const toasts = useToastStore()
const api = useServices().supplies

const record = ref<SupplyDetail | null>(null)
const error = ref('')
const busy = ref(false)
const confirmCancel = ref(false)
const recordId = computed(() => String(route.params.id))

async function load(): Promise<void> {
  error.value = ''
  try {
    record.value = await api.get(recordId.value)
  } catch (value) {
    error.value = errorMessage(value, 'تعذر تحميل تفاصيل التوريدة.')
  }
}

async function submit(): Promise<void> {
  if (!record.value) return
  busy.value = true
  try {
    record.value = await api.submit(record.value.name)
    toasts.push(`تم اعتماد التوريدة ${record.value.name}.`, 'success')
  } catch (value) {
    toasts.push(errorMessage(value, 'تعذر اعتماد التوريدة.'), 'error')
  } finally {
    busy.value = false
  }
}

async function cancel(): Promise<void> {
  if (!record.value) return
  busy.value = true
  try {
    record.value = await api.cancel(record.value.name)
    toasts.push(`تم إلغاء التوريدة ${record.value.name}.`, 'success')
  } catch (value) {
    toasts.push(errorMessage(value, 'تعذر إلغاء التوريدة.'), 'error')
  } finally {
    busy.value = false
  }
}

async function print(): Promise<void> {
  if (!record.value) return
  busy.value = true
  try {
    const action = await api.print(record.value.name)
    window.open(action.url, '_blank', 'noopener')
  } catch (value) {
    toasts.push(errorMessage(value, 'تعذر تجهيز الطباعة.'), 'error')
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="stack">
    <PageHeader :title="`توريدة ${recordId}`" eyebrow="التوريدات" icon="inbound" :subtitle="record ? record.supplierName : undefined">
      <template #actions>
        <StatusBadge v-if="record" :value="record.status" />
        <AppButton v-if="record?.capabilities.canPrint" variant="secondary" icon="print" :busy="busy" @click="print">طباعة الكارتة</AppButton>
        <AppButton v-if="record?.capabilities.canEdit" variant="secondary" icon="settings" @click="router.push(`/supplies/${recordId}/edit`)">تحرير المسودة</AppButton>
        <AppButton v-if="record?.capabilities.canSubmit" variant="primary" icon="check" :busy="busy" @click="submit">اعتماد</AppButton>
        <AppButton v-if="record?.capabilities.canCancel" variant="danger-ghost" icon="close" :busy="busy" @click="confirmCancel = true">إلغاء التوريدة</AppButton>
        <AppButton variant="ghost" icon="arrowRight" @click="router.push('/supplies')">القائمة</AppButton>
      </template>
    </PageHeader>

    <ErrorState v-if="error" :message="error" @retry="load" />
    <LoadingState v-else-if="!record" message="جارٍ تحميل تفاصيل التوريدة…" />

    <template v-else>
      <section class="metric-grid">
        <div class="metric metric--weight">
          <header class="metric__head">الوزن المحتسب</header>
          <p class="metric__value"><QuantityValue :value="record.displayPayableWeight" unit="كجم" /></p>
          <div class="metric__meta"><span>الصافي <QuantityValue :value="record.netWeight" unit="كجم" /></span></div>
        </div>
        <div class="metric metric--money">
          <header class="metric__head">قيمة التوريدة</header>
          <p class="metric__value"><MoneyValue :value="record.totalAmount" /></p>
          <div class="metric__meta">سعر الكيلو <MoneyValue :value="record.ratePerKg" /></div>
        </div>
        <div class="metric" :class="record.paymentStatus === 'مدفوع' ? 'metric--success' : 'metric--warning'">
          <header class="metric__head">حالة الدفع</header>
          <p class="metric__value metric__value--sm">{{ record.paymentStatus ?? 'غير متاح' }}</p>
          <div class="metric__meta">
            <span v-if="record.integrationStatus">{{ record.integrationStatus }}</span>
          </div>
        </div>
      </section>

      <AppPanel title="بيانات التوريدة" description="المعرّف والمورد ونوع الكرتون من السجل المعتمد.">
        <FactsList
          :facts="[
            { label: 'رقم التوريدة', value: record.name, kind: 'code' },
            { label: 'التاريخ', value: record.postingDate },
            { label: 'المورد', value: record.supplierName },
            { label: 'كود المورد', value: record.supplier, kind: 'code' },
            { label: 'نوع الكرتون', value: record.itemName },
            { label: 'المخزن', value: record.warehouse },
          ]"
        />
      </AppPanel>

      <AppPanel title="الأوزان والقيمة" description="كل القيم أدناه محسوبة ومحفوظة على الخادم.">
        <FactsList
          :facts="[
            { label: 'الوزن القائم', value: record.grossWeight, kind: 'quantity' },
            { label: 'وزن السيارة', value: record.tareWeight, kind: 'quantity' },
            { label: 'الوزن الصافي', value: record.netWeight, kind: 'quantity' },
            { label: 'وزن الخصم', value: record.discountWeight, kind: 'quantity' },
            { label: 'الوزن المحتسب', value: record.displayPayableWeight, kind: 'quantity' },
            { label: 'نوع الخصم', value: record.discountType === 'No Discount' ? 'بدون خصم' : record.discountType === 'Kg' ? 'كجم' : 'نسبة مئوية' },
            { label: 'سعر الكيلو', value: record.ratePerKg, kind: 'money' },
            { label: 'الإجمالي', value: record.totalAmount, kind: 'money' },
          ]"
        />
      </AppPanel>

      <AppPanel v-if="record.vehicleNo || record.driverName || record.weightTicket || record.notes" title="النقل والملاحظات">
        <FactsList
          :facts="[
            { label: 'رقم السيارة', value: record.vehicleNo },
            { label: 'اسم السائق', value: record.driverName },
            { label: 'كارتة الميزان', value: record.weightTicket, kind: 'code' },
            { label: 'إيصال المورد', value: record.supplierReceipt, kind: 'code' },
            { label: 'ملاحظات', value: record.notes, wide: true },
          ]"
        />
      </AppPanel>

      <AppPanel v-if="record.paymentStatus" title="الربط المحاسبي" description="قيم الفاتورة والمتبقي تأتي من نظام ERPNext كما هي.">
        <FactsList
          :facts="[
            { label: 'حالة الدفع', value: record.paymentStatus },
            { label: 'فاتورة الشراء', value: record.purchaseInvoice ?? null, kind: 'code' },
            { label: 'إجمالي الفاتورة', value: record.invoiceTotal ?? null, kind: 'money' },
            { label: 'المدفوع من الفاتورة', value: record.invoicePaidAmount ?? null, kind: 'money' },
            { label: 'المتبقي على الفاتورة', value: record.purchaseInvoiceOutstanding ?? null, kind: 'money' },
          ]"
        />
      </AppPanel>
    </template>

    <AppDialog v-model:open="confirmCancel" title="إلغاء التوريدة" tone="danger" confirm-label="تأكيد الإلغاء" @confirm="cancel">
      <p>سيتم إلغاء التوريدة <bdi dir="ltr">{{ recordId }}</bdi> وإرجاع الأثر المخزني حسب سلوك ERPNext الأصلي.</p>
      <p class="field__hint">لا يمكن التراجع عن الإلغاء من هذه الشاشة.</p>
    </AppDialog>
  </section>
</template>
