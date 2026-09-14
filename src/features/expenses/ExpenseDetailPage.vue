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
import type { ExpenseDetail } from '@/services/contracts'

const route = useRoute()
const router = useRouter()
const toasts = useToastStore()
const api = useServices().expenses

const record = ref<ExpenseDetail | null>(null)
const error = ref('')
const busy = ref(false)
const confirmCancel = ref(false)
const recordId = computed(() => String(route.params.id))

async function load(): Promise<void> {
  error.value = ''
  try {
    record.value = await api.get(recordId.value)
  } catch (value) {
    error.value = errorMessage(value, 'تعذر تحميل تفاصيل المصروف.')
  }
}

async function submit(): Promise<void> {
  if (!record.value) return
  busy.value = true
  try {
    record.value = await api.submit(record.value.name)
    toasts.push(`تم اعتماد المصروف ${record.value.name}.`, 'success')
  } catch (value) {
    toasts.push(errorMessage(value, 'تعذر اعتماد المصروف.'), 'error')
  } finally {
    busy.value = false
  }
}

async function cancel(): Promise<void> {
  if (!record.value) return
  busy.value = true
  try {
    record.value = await api.cancel(record.value.name)
    toasts.push(`تم إلغاء المصروف ${record.value.name}.`, 'success')
  } catch (value) {
    toasts.push(errorMessage(value, 'تعذر إلغاء المصروف.'), 'error')
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="stack">
    <PageHeader :title="`مصروف ${recordId}`" eyebrow="المصروفات" icon="expenses" :subtitle="record?.expenseCategoryName">
      <template #actions>
        <StatusBadge v-if="record" :value="record.status" />
        <AppButton v-if="record?.capabilities.canEdit" variant="secondary" icon="settings" @click="router.push(`/expenses/${recordId}/edit`)">تحرير المسودة</AppButton>
        <AppButton v-if="record?.capabilities.canSubmit" variant="primary" icon="check" :busy="busy" @click="submit">اعتماد</AppButton>
        <AppButton v-if="record?.capabilities.canCancel" variant="danger-ghost" icon="close" :busy="busy" @click="confirmCancel = true">إلغاء المصروف</AppButton>
        <AppButton variant="ghost" icon="arrowRight" @click="router.push('/expenses')">القائمة</AppButton>
      </template>
    </PageHeader>

    <ErrorState v-if="error" :message="error" @retry="load" />
    <LoadingState v-else-if="!record" message="جارٍ تحميل تفاصيل المصروف…" />

    <template v-else>
      <section class="metric-grid">
        <div class="metric metric--money">
          <header class="metric__head">قيمة المصروف</header>
          <p class="metric__value"><MoneyValue :value="record.amount" /></p>
          <div class="metric__meta">{{ record.expenseCategoryName }}</div>
        </div>
        <div class="metric metric--info">
          <header class="metric__head">الحالة المحاسبية</header>
          <p class="metric__value metric__value--sm">{{ record.accountingStatus ?? 'غير متاحة' }}</p>
          <div class="metric__meta">تُدار بالكامل على الخادم.</div>
        </div>
      </section>

      <AppPanel title="بيانات المصروف">
        <FactsList
          :facts="[
            { label: 'رقم المصروف', value: record.name, kind: 'code' },
            { label: 'التاريخ', value: record.postingDate },
            { label: 'الفئة', value: record.expenseCategoryName },
            { label: 'مصدر الدفع', value: record.paymentSourceName ?? null },
            { label: 'طريقة الدفع', value: record.paymentMode ?? null },
            { label: 'الجهة / المورد', value: record.supplierOrParty ?? null },
            { label: 'رقم المرجع', value: record.referenceNo ?? null, kind: 'code' },
            { label: 'الوصف', value: record.description ?? null, wide: true },
          ]"
        />
      </AppPanel>
    </template>

    <AppDialog v-model:open="confirmCancel" title="إلغاء المصروف" tone="danger" confirm-label="تأكيد الإلغاء" @confirm="cancel">
      <p>سيتم إلغاء المصروف <bdi dir="ltr">{{ recordId }}</bdi> وقيد اليومية المرتبط به حسب سلوك النظام الأصلي.</p>
    </AppDialog>
  </section>
</template>
