<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/base/AppButton.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
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
import type { SaleDetail } from '@/services/contracts'

const route = useRoute()
const router = useRouter()
const toasts = useToastStore()
const api = useServices().sales

const record = ref<SaleDetail | null>(null)
const error = ref('')
const busy = ref(false)
const confirmCancel = ref(false)
const recordId = computed(() => String(route.params.id))

async function load(): Promise<void> {
  error.value = ''
  try {
    record.value = await api.get(recordId.value)
  } catch (value) {
    error.value = errorMessage(value, 'تعذر تحميل البيع.')
  }
}

async function submit(): Promise<void> {
  if (!record.value) return
  busy.value = true
  try {
    record.value = await api.submit(record.value.name)
    toasts.push(`تم اعتماد البيع ${record.value.name}.`, 'success')
  } catch (value) {
    toasts.push(errorMessage(value, 'تعذر اعتماد البيع.'), 'error')
  } finally {
    busy.value = false
  }
}

async function cancel(): Promise<void> {
  if (!record.value) return
  busy.value = true
  try {
    record.value = await api.cancel(record.value.name)
    toasts.push(`تم إلغاء البيع ${record.value.name}.`, 'success')
  } catch (value) {
    toasts.push(errorMessage(value, 'تعذر إلغاء البيع.'), 'error')
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="stack">
    <PageHeader :title="`بيع ${recordId}`" eyebrow="المبيعات" icon="outbound" :subtitle="record?.buyerName">
      <template #actions>
        <StatusBadge v-if="record" :value="record.status" />
        <AppButton v-if="record?.capabilities.canEdit" variant="secondary" icon="settings" @click="router.push(`/sales/${recordId}/edit`)">تحرير المسودة</AppButton>
        <AppButton v-if="record?.capabilities.canSubmit" variant="primary" icon="check" :busy="busy" @click="submit">اعتماد</AppButton>
        <AppButton v-if="record?.capabilities.canCancel" variant="danger-ghost" icon="close" :busy="busy" @click="confirmCancel = true">إلغاء البيع</AppButton>
        <AppButton variant="ghost" icon="arrowRight" @click="router.push('/sales')">القائمة</AppButton>
      </template>
    </PageHeader>

    <ErrorState v-if="error" :message="error" @retry="load" />
    <LoadingState v-else-if="!record" message="جارٍ تحميل البيع…" />

    <template v-else>
      <section class="metric-grid">
        <div class="metric metric--weight">
          <header class="metric__head">الكمية المباعة</header>
          <p class="metric__value"><QuantityValue :value="record.quantity" unit="كجم" /></p>
          <div class="metric__meta">سعر الكيلو <MoneyValue :value="record.ratePerKg" /></div>
        </div>
        <div class="metric metric--money">
          <header class="metric__head">القيمة التشغيلية</header>
          <p class="metric__value"><MoneyValue :value="record.informationalValue" /></p>
          <div class="metric__meta">قيمة معلوماتية بلا فاتورة مبيعات أو ذمة مدينة.</div>
        </div>
        <div class="metric metric--info">
          <header class="metric__head">قيد المخزون</header>
          <p class="metric__value metric__value--sm"><bdi dir="ltr">{{ record.stockEntry ?? '—' }}</bdi></p>
          <div class="metric__meta">أمر صرف مخزني أصلي من ERPNext عند الاعتماد.</div>
        </div>
      </section>

      <AppPanel title="بيانات البيع">
        <FactsList
          :facts="[
            { label: 'رقم البيع', value: record.name, kind: 'code' },
            { label: 'التاريخ', value: record.postingDate },
            { label: 'المشتري', value: record.buyerName ?? null },
            { label: 'نوع الكرتون', value: record.itemName },
            { label: 'الشركة', value: record.company },
            { label: 'المخزن', value: record.warehouse },
            { label: 'ملاحظات', value: record.notes ?? null, wide: true },
          ]"
        />
      </AppPanel>
    </template>

    <AppDialog v-model:open="confirmCancel" title="إلغاء البيع" tone="danger" confirm-label="تأكيد الإلغاء" @confirm="cancel">
      <p>سيتم إلغاء البيع <bdi dir="ltr">{{ recordId }}</bdi> وإرجاع الكمية إلى المخزون حسب سلوك ERPNext الأصلي.</p>
    </AppDialog>
  </section>
</template>
