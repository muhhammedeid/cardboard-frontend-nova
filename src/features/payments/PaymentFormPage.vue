<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect, { type SelectOption } from '@/components/base/AppSelect.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import FactsList from '@/components/data/FactsList.vue'
import FormField from '@/components/base/FormField.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import { useToastStore } from '@/app/stores/toasts'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import type { PaymentDetail, PaymentInput, SupplierOption } from '@/services/contracts'

const route = useRoute()
const router = useRouter()
const toasts = useToastStore()
const api = useServices().payments

const recordId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEdit = computed(() => Boolean(recordId.value))

const suppliers = ref<SupplierOption[]>([])
const modes = ref<string[]>([])
const supplierLookupFailed = ref(false)
const modeLookupFailed = ref(false)
const schemaFailed = ref(false)
const contextFailed = ref(false)
const outstanding = ref<number | null>(null)
const saved = ref<PaymentDetail | null>(null)
const loading = ref(true)
const busy = ref(false)
const formError = ref('')
/** Create capability comes from the server schema; never assumed. */
const canCreate = ref(false)

// `supplier` and `amount` may arrive prefilled from a supply's «إجراء دفعة على هذه التوريدة».
const form = reactive<PaymentInput>({ supplier: String(route.query.supplier ?? ''), amount: Number(route.query.amount ?? 0) || 0, modeOfPayment: '', postingDate: '', referenceNo: '', referenceDate: '', notes: '' })

const supplierOptions = computed<SelectOption[]>(() =>
  suppliers.value.map((option) => ({
    value: option.supplier,
    label: option.supplierName || option.supplier,
    disabled: option.disabled,
  })),
)
const modeOptions = computed<SelectOption[]>(() => modes.value.map((mode) => ({ value: mode, label: mode })))
const canSave = computed(() => (isEdit.value ? Boolean(saved.value?.capabilities.canEdit) : canCreate.value))
const canSubmit = computed(() => (isEdit.value ? Boolean(saved.value?.capabilities.canSubmit) : canCreate.value))
/** Supplier with no outstanding invoice cannot be paid (server rejects it). */
const noOutstanding = ref(false)

async function loadContext(): Promise<void> {
  if (!form.supplier) return
  contextFailed.value = false
  try {
    const value = (await api.context(form.supplier)).currentSupplierOutstanding ?? null
    outstanding.value = value
    noOutstanding.value = value === 0
  } catch {
    outstanding.value = null
    noOutstanding.value = false
    contextFailed.value = true
  }
}

function fill(value: PaymentDetail): void {
  Object.assign(form, {
    supplier: value.supplier,
    amount: value.amount,
    modeOfPayment: value.modeOfPayment,
    postingDate: value.postingDate,
    referenceNo: value.referenceNo ?? '',
    referenceDate: value.referenceDate ?? '',
    notes: value.notes ?? '',
  })
  saved.value = value
  outstanding.value = value.currentSupplierOutstanding ?? null
}

async function save(submit = false): Promise<void> {
  formError.value = ''
  if (submit && !canSubmit.value) {
    formError.value = 'اعتماد الدفعة يتطلب صلاحية إضافية على الخادم.'
    return
  }
  if (!form.supplier || !form.amount || !form.modeOfPayment || !form.postingDate) {
    formError.value = 'المورد والمبلغ وطريقة الدفع والتاريخ مطلوبة.'
    return
  }
  busy.value = true
  try {
    const value = isEdit.value ? await api.update(recordId.value, { ...form }) : await api.create({ ...form })
    saved.value = submit ? await api.submit(value.name) : value
    toasts.push(submit ? `تم اعتماد الدفعة ${saved.value.name}.` : `تم حفظ الدفعة ${saved.value.name} كمسودة.`, 'success')
    await router.replace(`/payments/${saved.value.name}`)
  } catch (value) {
    formError.value = errorMessage(value, submit ? 'تعذر اعتماد الدفعة.' : 'تعذر حفظ الدفعة.')
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  const [schemaResult, supplierResult, modeResult] = await Promise.allSettled([api.schema(), api.lookupSuppliers(), api.lookupModes()])
  if (schemaResult.status === 'fulfilled') {
    form.postingDate = form.postingDate || schemaResult.value.defaultPostingDate
    form.modeOfPayment = form.modeOfPayment || (schemaResult.value.defaultModeOfPayment ?? '')
    canCreate.value = schemaResult.value.capabilities.canCreate
  } else {
    schemaFailed.value = true
  }
  if (supplierResult.status === 'fulfilled') suppliers.value = supplierResult.value
  else supplierLookupFailed.value = true
  if (modeResult.status === 'fulfilled') modes.value = modeResult.value
  else modeLookupFailed.value = true

  if (recordId.value) {
    try {
      fill(await api.get(recordId.value))
    } catch (value) {
      formError.value = errorMessage(value, 'تعذر تحميل الدفعة.')
    }
  }
  loading.value = false
  await loadContext()
})
</script>

<template>
  <section class="stack">
    <PageHeader
      :title="isEdit ? `تحرير الدفعة ${recordId}` : 'دفعة مورد جديدة'"
      subtitle="إنشاء الدفعة يسجّل مسودة فقط؛ الترحيل المحاسبي يحدث عند الاعتماد على الخادم."
      eyebrow="المدفوعات"
      icon="payments"
    >
      <template #actions>
        <AppButton variant="ghost" icon="arrowRight" @click="router.push('/payments')">قائمة الدفعات</AppButton>
      </template>
    </PageHeader>

    <LoadingState v-if="loading" message="جارٍ تحميل بيانات الدفعة…" />

    <template v-else>
      <p v-if="formError" class="readonly-note readonly-note--warning" role="alert">{{ formError }}</p>
      <p v-if="schemaFailed" class="readonly-note readonly-note--warning">تعذر تحميل القيم الافتراضية من الخادم؛ أكمل الحقول يدويًا.</p>
      <p v-if="noOutstanding" class="readonly-note readonly-note--warning" role="status">
        لا توجد فواتير مستحقة لهذا المورد — يرفض الخادم الدفعة حتى توجد توريدة معتمدة برصيد مستحق.
      </p>

      <AppPanel title="بيانات الدفعة">
        <div class="form-grid">
          <FormField
            label="المورد"
            required
            :error="supplierLookupFailed ? 'تعذر تحميل قائمة الموردين.' : undefined"
            :hint="contextFailed ? 'تعذر تحميل رصيد المورد الحالي.' : undefined"
          >
            <div class="row">
              <AppSelect
                v-model="form.supplier"
                :options="supplierOptions"
                placeholder="اختر المورد"
                :disabled="supplierLookupFailed"
                @update:model-value="loadContext"
              />
              <AppButton variant="ghost" icon="refresh" size="sm" :disabled="!form.supplier" @click="loadContext">تحديث السياق</AppButton>
            </div>
          </FormField>
          <FormField label="المبلغ (ج.م)" required hint="لا يُسمح بتجاوز الرصيد المستحق إلا وفق قواعد الخادم.">
            <AppInput v-model.number="form.amount" type="number" min="0" step="0.01" inputmode="decimal" />
          </FormField>
          <FormField label="طريقة الدفع" required :error="modeLookupFailed ? 'تعذر تحميل طرق الدفع المعتمدة.' : undefined">
            <AppSelect v-model="form.modeOfPayment" :options="modeOptions" placeholder="اختر طريقة الدفع" :disabled="modeLookupFailed" />
          </FormField>
          <FormField label="التاريخ" required><AppInput v-model="form.postingDate" type="date" /></FormField>
          <FormField label="رقم المرجع"><AppInput v-model="form.referenceNo" placeholder="رقم التحويل أو الشيك" /></FormField>
          <FormField label="تاريخ المرجع"><AppInput v-model="form.referenceDate" type="date" /></FormField>
          <div class="form-grid__wide"><FormField label="ملاحظات"><AppTextarea v-model="form.notes" :rows="3" /></FormField></div>
        </div>
      </AppPanel>

      <AppPanel title="سياق المورد" description="الرصيد الحالي يأتي من خدمة الدفعات على الخادم." plain>
        <FactsList
          :facts="[
            { label: 'الرصيد المستحق الحالي', value: outstanding, kind: 'money' },
            { label: 'المتبقي المتوقع بعد الدفعة', value: saved?.expectedRemainingOutstanding ?? null, kind: 'money' },
          ]"
        />
        <p class="field__hint">المتبقي المتوقع يُحسب على الخادم ويظهر بعد حفظ الدفعة.</p>
      </AppPanel>

      <div class="form-actions">
        <AppButton v-if="canSave" variant="primary" icon="check" :busy="busy" @click="save(false)">حفظ كمسودة</AppButton>
        <AppButton v-if="canSubmit" variant="secondary" icon="check" :busy="busy" @click="save(true)">اعتماد الدفعة</AppButton>
        <p v-if="!canSave && !canSubmit" class="field__hint">لا تملك صلاحية إنشاء دفعة على الخادم (can_create غير متاح).</p>
        <AppButton variant="ghost" @click="router.push('/payments')">إلغاء</AppButton>
        <span v-if="outstanding !== null" class="push faint row">الرصيد الحالي <MoneyValue :value="outstanding" /></span>
      </div>
    </template>
  </section>
</template>
