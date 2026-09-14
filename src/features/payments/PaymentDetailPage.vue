<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/base/AppButton.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import FactsList from '@/components/data/FactsList.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import StatusBadge from '@/components/data/StatusBadge.vue'
import AppDialog from '@/components/feedback/AppDialog.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import { useToastStore } from '@/app/stores/toasts'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import type { PaymentDetail } from '@/services/contracts'

const route = useRoute()
const router = useRouter()
const toasts = useToastStore()
const api = useServices().payments

const record = ref<PaymentDetail | null>(null)
const error = ref('')
const busy = ref(false)
const confirmCancel = ref(false)
const recordId = computed(() => String(route.params.id))

async function load(): Promise<void> {
  error.value = ''
  try {
    record.value = await api.get(recordId.value)
  } catch (value) {
    error.value = errorMessage(value, 'تعذر تحميل تفاصيل الدفعة.')
  }
}

async function submit(): Promise<void> {
  if (!record.value) return
  busy.value = true
  try {
    record.value = await api.submit(record.value.name)
    toasts.push(`تم اعتماد الدفعة ${record.value.name}.`, 'success')
  } catch (value) {
    toasts.push(errorMessage(value, 'تعذر اعتماد الدفعة.'), 'error')
  } finally {
    busy.value = false
  }
}

async function cancel(): Promise<void> {
  if (!record.value) return
  busy.value = true
  try {
    record.value = await api.cancel(record.value.name)
    toasts.push(`تم إلغاء الدفعة ${record.value.name}.`, 'success')
  } catch (value) {
    toasts.push(errorMessage(value, 'تعذر إلغاء الدفعة.'), 'error')
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="stack">
    <PageHeader :title="`دفعة ${recordId}`" eyebrow="المدفوعات" icon="payments" :subtitle="record?.supplierName">
      <template #actions>
        <StatusBadge v-if="record" :value="record.status" />
        <AppButton v-if="record?.capabilities.canEdit" variant="secondary" icon="settings" @click="router.push(`/payments/${recordId}/edit`)">تحرير المسودة</AppButton>
        <AppButton v-if="record?.capabilities.canSubmit" variant="primary" icon="check" :busy="busy" @click="submit">اعتماد</AppButton>
        <AppButton v-if="record?.capabilities.canCancel" variant="danger-ghost" icon="close" :busy="busy" @click="confirmCancel = true">إلغاء الدفعة</AppButton>
        <AppButton variant="ghost" icon="arrowRight" @click="router.push('/payments')">القائمة</AppButton>
      </template>
    </PageHeader>

    <ErrorState v-if="error" :message="error" @retry="load" />
    <LoadingState v-else-if="!record" message="جارٍ تحميل تفاصيل الدفعة…" />

    <template v-else>
      <section class="metric-grid">
        <div class="metric metric--money">
          <header class="metric__head">المبلغ المدفوع</header>
          <p class="metric__value"><MoneyValue :value="record.amount" /></p>
          <div class="metric__meta">{{ record.modeOfPayment }}</div>
        </div>
        <div class="metric metric--info">
          <header class="metric__head">الرصيد المستحق الحالي</header>
          <p class="metric__value"><MoneyValue :value="record.currentSupplierOutstanding ?? null" /></p>
          <div class="metric__meta">قيمة معتمدة من الخادم وقت القراءة.</div>
        </div>
        <div class="metric metric--warning">
          <header class="metric__head">المتبقي المتوقع</header>
          <p class="metric__value"><MoneyValue :value="record.expectedRemainingOutstanding ?? null" /></p>
          <div class="metric__meta">{{ record.paymentStatus ?? 'حالة الربط المحاسبي غير متاحة' }}</div>
        </div>
      </section>

      <AppPanel title="بيانات الدفعة">
        <FactsList
          :facts="[
            { label: 'رقم الدفعة', value: record.name, kind: 'code' },
            { label: 'التاريخ', value: record.postingDate },
            { label: 'المورد', value: record.supplierName },
            { label: 'كود المورد', value: record.supplier, kind: 'code' },
            { label: 'طريقة الدفع', value: record.modeOfPayment },
            { label: 'المرجع', value: record.referenceNo ?? null, kind: 'code' },
            { label: 'تاريخ المرجع', value: record.referenceDate ?? null },
            { label: 'ملاحظات', value: record.notes ?? null, wide: true },
          ]"
        />
      </AppPanel>

      <AppPanel v-if="record.supplier" title="ملف المورد" plain>
        <div class="row">
          <AppButton variant="secondary" icon="suppliers" @click="router.push(`/suppliers/${record.supplier}`)">فتح ملف المورد</AppButton>
          <AppButton variant="ghost" icon="payments" @click="router.push({ path: '/payments/new', query: { supplier: record.supplier } })">دفعة أخرى لنفس المورد</AppButton>
        </div>
      </AppPanel>
    </template>

    <AppDialog v-model:open="confirmCancel" title="إلغاء الدفعة" tone="danger" confirm-label="تأكيد الإلغاء" @confirm="cancel">
      <p>سيتم إلغاء الدفعة <bdi dir="ltr">{{ recordId }}</bdi> وقيود الدفع المرتبطة بها حسب سلوك النظام الأصلي.</p>
    </AppDialog>
  </section>
</template>
