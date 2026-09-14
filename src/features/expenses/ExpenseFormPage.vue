<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect, { type SelectOption } from '@/components/base/AppSelect.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import FactsList from '@/components/data/FactsList.vue'
import FormField from '@/components/base/FormField.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import { useToastStore } from '@/app/stores/toasts'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import type { ExpenseDetail, ExpenseInput, ExpenseOption } from '@/services/contracts'

const route = useRoute()
const router = useRouter()
const toasts = useToastStore()
const api = useServices().expenses

const recordId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEdit = computed(() => Boolean(recordId.value))

const categories = ref<ExpenseOption[]>([])
const sources = ref<ExpenseOption[]>([])
const categoryFailed = ref(false)
const sourceFailed = ref(false)
const schemaFailed = ref(false)
const saved = ref<ExpenseDetail | null>(null)
const loading = ref(true)
const busy = ref(false)
const formError = ref('')

const form = reactive<ExpenseInput>({
  postingDate: '',
  expenseCategory: '',
  amount: 0,
  paymentSource: '',
  paymentMode: '',
  supplierOrParty: '',
  description: '',
  referenceNo: '',
  referenceDate: '',
})

const categoryOptions = computed<SelectOption[]>(() => categories.value.map((option) => ({ value: option.name, label: option.displayName })))
const sourceOptions = computed<SelectOption[]>(() => sources.value.map((option) => ({ value: option.name, label: option.displayName })))
/** Create capability comes from the server schema; never assumed. */
const canCreate = ref(false)
const canSave = computed(() => (isEdit.value ? Boolean(saved.value?.capabilities.canEdit) : canCreate.value))
const canSubmit = computed(() => (isEdit.value ? Boolean(saved.value?.capabilities.canSubmit) : canCreate.value))

async function loadCategories(): Promise<void> {
  try {
    categories.value = await api.categories()
    categoryFailed.value = false
  } catch {
    categories.value = []
    categoryFailed.value = true
  }
}

async function loadSources(): Promise<void> {
  try {
    sources.value = await api.sources()
    sourceFailed.value = false
  } catch {
    sources.value = []
    sourceFailed.value = true
  }
}

function fill(value: ExpenseDetail): void {
  Object.assign(form, {
    postingDate: value.postingDate,
    expenseCategory: value.expenseCategory,
    amount: value.amount,
    paymentSource: value.paymentSource ?? '',
    paymentMode: value.paymentMode ?? '',
    supplierOrParty: value.supplierOrParty ?? '',
    description: value.description ?? '',
    referenceNo: value.referenceNo ?? '',
    referenceDate: value.referenceDate ?? '',
  })
  saved.value = value
}

async function save(submit = false): Promise<void> {
  formError.value = ''
  if (submit && !canSubmit.value) {
    formError.value = 'اعتماد المصروف يتطلب صلاحية إضافية على الخادم.'
    return
  }
  if (!form.expenseCategory || !form.paymentSource || !form.amount || !form.postingDate) {
    formError.value = 'التاريخ والفئة والمبلغ ومصدر الدفع مطلوبة.'
    return
  }
  busy.value = true
  try {
    const value = isEdit.value ? await api.update(recordId.value, { ...form }) : await api.create({ ...form })
    saved.value = submit ? await api.submit(value.name) : value
    toasts.push(submit ? `تم اعتماد المصروف ${saved.value.name}.` : `تم حفظ المصروف ${saved.value.name} كمسودة.`, 'success')
    await router.replace(`/expenses/${saved.value.name}`)
  } catch (value) {
    formError.value = errorMessage(value, submit ? 'تعذر اعتماد المصروف.' : 'تعذر حفظ المصروف.')
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  // Independent lookups: one failure must not hide the other select.
  const [schemaResult] = await Promise.allSettled([api.schema(), loadCategories(), loadSources()])
  if (schemaResult.status === 'fulfilled') {
    form.postingDate = schemaResult.value.defaultPostingDate
    canCreate.value = schemaResult.value.capabilities.canCreate
  } else {
    schemaFailed.value = true
  }

  if (recordId.value) {
    try {
      fill(await api.get(recordId.value))
    } catch (value) {
      formError.value = errorMessage(value, 'تعذر تحميل المصروف.')
    }
  }
  loading.value = false
})
</script>

<template>
  <section class="stack">
    <PageHeader
      :title="isEdit ? `تحرير المصروف ${recordId}` : 'مصروف جديد'"
      subtitle="الفئات ومصادر الدفع تُجلب من الخادم؛ القيد المحاسبي يُنشأ عند الاعتماد."
      eyebrow="المصروفات"
      icon="expenses"
    >
      <template #actions>
        <AppButton variant="ghost" icon="arrowRight" @click="router.push('/expenses')">قائمة المصروفات</AppButton>
      </template>
    </PageHeader>

    <LoadingState v-if="loading" message="جارٍ تحميل بيانات المصروف…" />

    <template v-else>
      <p v-if="formError" class="readonly-note readonly-note--warning" role="alert">{{ formError }}</p>
      <p v-if="schemaFailed" class="readonly-note readonly-note--warning">تعذر تحميل التاريخ الافتراضي من الخادم؛ حدّد التاريخ يدويًا.</p>

      <AppPanel title="بيانات المصروف">
        <div class="form-grid">
          <FormField label="التاريخ" required><AppInput v-model="form.postingDate" type="date" /></FormField>
          <FormField
            label="فئة المصروف"
            required
            :error="categoryFailed ? 'تعذر تحميل فئات المصروفات.' : undefined"
            hint="حساب مصروف فرعي مُهيأ على الخادم."
          >
            <div class="row">
              <AppSelect v-model="form.expenseCategory" :options="categoryOptions" placeholder="اختر الفئة" :disabled="categoryFailed" />
              <AppButton variant="ghost" icon="refresh" icon-only @click="loadCategories">إعادة تحميل الفئات</AppButton>
            </div>
          </FormField>
          <FormField label="المبلغ (ج.م)" required><AppInput v-model.number="form.amount" type="number" min="0.01" step="0.01" inputmode="decimal" /></FormField>
          <FormField
            label="مصدر الدفع"
            required
            :error="sourceFailed ? 'تعذر تحميل مصادر الدفع.' : undefined"
            hint="حساب نقدي أو بنكي فرعي مُهيأ على الخادم."
          >
            <div class="row">
              <AppSelect v-model="form.paymentSource" :options="sourceOptions" placeholder="اختر مصدر الدفع" :disabled="sourceFailed" />
              <AppButton variant="ghost" icon="refresh" icon-only @click="loadSources">إعادة تحميل المصادر</AppButton>
            </div>
          </FormField>
          <FormField label="طريقة الدفع" hint="وصف حر مثل: نقدي أو تحويل بنكي."><AppInput v-model="form.paymentMode" /></FormField>
          <FormField label="الجهة / المورد"><AppInput v-model="form.supplierOrParty" /></FormField>
          <FormField label="رقم المرجع"><AppInput v-model="form.referenceNo" /></FormField>
          <FormField label="تاريخ المرجع"><AppInput v-model="form.referenceDate" type="date" /></FormField>
          <div class="form-grid__wide"><FormField label="الوصف"><AppTextarea v-model="form.description" :rows="3" /></FormField></div>
        </div>
      </AppPanel>

      <AppPanel v-if="saved" title="الحالة المحاسبية" description="يأتي من الخادم بعد الحفظ." plain>
        <FactsList
          :facts="[
            { label: 'رقم المصروف', value: saved.name, kind: 'code' },
            { label: 'الحالة', value: saved.accountingStatus ?? null },
          ]"
        />
      </AppPanel>

      <div class="form-actions">
        <AppButton v-if="canSave" variant="primary" icon="check" :busy="busy" @click="save(false)">حفظ كمسودة</AppButton>
        <AppButton v-if="canSubmit" variant="secondary" icon="check" :busy="busy" @click="save(true)">اعتماد المصروف</AppButton>
        <p v-if="!canSave && !canSubmit" class="field__hint">لا تملك صلاحية إنشاء مصروف على الخادم (can_create غير متاح).</p>
        <AppButton variant="ghost" @click="router.push('/expenses')">إلغاء</AppButton>
      </div>
    </template>
  </section>
</template>
