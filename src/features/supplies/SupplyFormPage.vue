<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppBadge from '@/components/data/AppBadge.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect, { type SelectOption } from '@/components/base/AppSelect.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import FactsList from '@/components/data/FactsList.vue'
import FormField from '@/components/base/FormField.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import { useToastStore } from '@/app/stores/toasts'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import { todayIso } from '@/services/formatting'
import type { Lookup, SupplyCreateCapabilities, SupplyDetail, SupplyInput, SupplyPreview } from '@/services/contracts'

type LoadState = 'loading' | 'loaded' | 'empty' | 'error'

const route = useRoute()
const router = useRouter()
const toasts = useToastStore()
const api = useServices().supplies

const recordId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEdit = computed(() => Boolean(recordId.value))

const suppliers = ref<Lookup[]>([])
const items = ref<Lookup[]>([])
const supplierState = ref<LoadState>('loading')
const itemState = ref<LoadState>('loading')
const saved = ref<SupplyDetail | null>(null)
const preview = ref<SupplyPreview | null>(null)
const previewError = ref('')
const capabilities = ref<SupplyCreateCapabilities | null>(null)
const loadError = ref('')
const formError = ref('')
const loadingRecord = ref(false)
const busy = ref(false)
const capturing = ref<'gross' | 'tare' | ''>('')

const form = reactive<SupplyInput>({
  postingDate: todayIso(),
  supplier: '',
  item: '',
  grossWeight: 0,
  tareWeight: 0,
  ratePerKg: 0,
  discountType: 'No Discount',
  discountValue: 0,
  vehicleNo: '',
  driverName: '',
  notes: '',
})

const discountOptions: readonly SelectOption[] = [
  { value: 'No Discount', label: 'بدون خصم' },
  { value: 'Kg', label: 'كجم' },
  { value: 'Percentage', label: 'نسبة مئوية' },
]

const supplierOptions = computed<SelectOption[]>(() => suppliers.value.map((option) => ({ value: option.name, label: option.label })))
const itemOptions = computed<SelectOption[]>(() => items.value.map((option) => ({ value: option.name, label: option.label })))
const canSave = computed(() => (isEdit.value ? Boolean(saved.value?.capabilities.canEdit) : Boolean(capabilities.value?.canCreate)))
const canSubmit = computed(() => (isEdit.value ? Boolean(saved.value?.capabilities.canSubmit) : Boolean(capabilities.value?.canSubmit)))
const derived = computed<SupplyPreview | null>(
  () =>
    preview.value ??
    (saved.value
      ? {
          netWeight: saved.value.netWeight,
          discountWeight: saved.value.discountWeight,
          payableWeight: saved.value.payableWeight,
          displayPayableWeight: saved.value.displayPayableWeight,
          totalAmount: saved.value.totalAmount,
        }
      : null),
)

let previewSequence = 0

async function loadSuppliers(): Promise<void> {
  supplierState.value = 'loading'
  try {
    suppliers.value = await api.lookupSuppliers()
    supplierState.value = suppliers.value.length ? 'loaded' : 'empty'
  } catch {
    suppliers.value = []
    supplierState.value = 'error'
  }
}

async function loadItems(): Promise<void> {
  itemState.value = 'loading'
  try {
    items.value = await api.lookupItems()
    itemState.value = items.value.length ? 'loaded' : 'empty'
  } catch {
    items.value = []
    itemState.value = 'error'
  }
}

function fill(value: SupplyDetail): void {
  Object.assign(form, {
    postingDate: value.postingDate,
    supplier: value.supplier,
    item: value.item,
    grossWeight: value.grossWeight,
    tareWeight: value.tareWeight,
    ratePerKg: value.ratePerKg,
    discountType: value.discountType,
    discountValue: value.discountValue,
    vehicleNo: value.vehicleNo ?? '',
    driverName: value.driverName ?? '',
    weightTicket: value.weightTicket ?? '',
    supplierReceipt: value.supplierReceipt ?? '',
    notes: value.notes ?? '',
  })
  saved.value = value
}

/** Derived weights/values always come from the backend preview endpoint. */
async function refreshPreview(): Promise<void> {
  if (!form.supplier || !form.item) {
    preview.value = null
    previewError.value = ''
    return
  }
  const sequence = ++previewSequence
  try {
    const value = await api.preview({ ...form })
    if (sequence === previewSequence) {
      preview.value = value
      previewError.value = ''
    }
  } catch (value) {
    if (sequence === previewSequence) {
      preview.value = null
      previewError.value = errorMessage(value, 'تعذر تحديث القيم المحتسبة.')
    }
  }
}

watch(
  () => [form.supplier, form.item, form.grossWeight, form.tareWeight, form.discountType, form.discountValue, form.ratePerKg],
  () => {
    void refreshPreview()
  },
)

async function save(submit = false): Promise<void> {
  formError.value = ''
  if (submit && !canSubmit.value) {
    formError.value = 'اعتماد التوريدة يتطلب صلاحية إضافية على الخادم.'
    return
  }
  if (!submit && !canSave.value) {
    formError.value = 'لا تملك صلاحية حفظ التوريدة.'
    return
  }
  busy.value = true
  try {
    const value = isEdit.value ? await api.update(recordId.value, { ...form }) : await api.create({ ...form })
    const result = submit ? await api.submit(value.name) : value
    saved.value = result
    toasts.push(submit ? `تم اعتماد التوريدة ${result.name}.` : `تم حفظ التوريدة ${result.name} كمسودة.`, 'success')
    await router.replace(`/supplies/${result.name}`)
  } catch (value) {
    formError.value = errorMessage(value, submit ? 'تعذر اعتماد التوريدة.' : 'تعذر حفظ التوريدة.')
  } finally {
    busy.value = false
  }
}

async function capture(field: 'gross' | 'tare'): Promise<void> {
  if (!saved.value) {
    formError.value = 'احفظ المسودة أولًا قبل قراءة قيمة الميزان.'
    return
  }
  capturing.value = field
  formError.value = ''
  try {
    fill(await api.capture(saved.value.name, field))
    await refreshPreview()
  } catch (value) {
    formError.value = errorMessage(value, 'تعذر قراءة الميزان.')
  } finally {
    capturing.value = ''
  }
}

onMounted(async () => {
  await Promise.allSettled([loadSuppliers(), loadItems()])
  try {
    capabilities.value = await api.getCreateCapabilities()
  } catch (value) {
    loadError.value = errorMessage(value, 'تعذر تحميل صلاحيات التوريدة.')
  }
  if (!recordId.value) return
  loadingRecord.value = true
  try {
    fill(await api.get(recordId.value))
    await refreshPreview()
  } catch (value) {
    loadError.value = errorMessage(value, 'تعذر تحميل التوريدة.')
  } finally {
    loadingRecord.value = false
  }
})
</script>

<template>
  <section class="stack">
    <PageHeader
      :title="isEdit ? `توريدة ${recordId}` : 'توريدة جديدة'"
      eyebrow="التوريدات"
      icon="inbound"
    >
      <template #actions>
        <AppBadge v-if="saved" tone="primary">{{ saved.status === 'Draft' ? 'مسودة' : saved.status === 'Submitted' ? 'معتمد' : 'ملغي' }}</AppBadge>
        <AppButton variant="ghost" icon="arrowRight" @click="router.push('/supplies')">قائمة التوريدات</AppButton>
      </template>
    </PageHeader>

    <ErrorState v-if="loadError" :message="loadError" @retry="router.go(0)" />
    <LoadingState v-else-if="loadingRecord" message="جارٍ تحميل التوريدة…" />

    <template v-else>
      <p v-if="formError" class="readonly-note readonly-note--warning" role="alert">{{ formError }}</p>

      <AppPanel title="بيانات التوريدة">
        <div class="form-grid">
          <FormField
            label="المورد"
            required
            :status="supplierState === 'loading' ? 'جارٍ تحميل الموردين…' : supplierState === 'empty' ? 'لا يوجد موردون متاحون.' : undefined"
            :error="supplierState === 'error' ? 'تعذر تحميل الموردين. أعد المحاولة.' : undefined"
          >
            <div class="row">
              <AppSelect v-model="form.supplier" :options="supplierOptions" placeholder="اختر المورد" :busy="supplierState === 'loading'" :invalid="supplierState === 'error'" />
              <AppButton variant="ghost" icon="refresh" icon-only :disabled="supplierState === 'loading'" @click="loadSuppliers">إعادة تحميل الموردين</AppButton>
            </div>
          </FormField>

          <FormField label="التاريخ" required><AppInput v-model="form.postingDate" type="date" /></FormField>

          <FormField
            label="نوع الكرتون"
            required
            :status="itemState === 'loading' ? 'جارٍ تحميل أنواع الكرتون…' : itemState === 'empty' ? 'لا توجد أنواع كرتون متاحة.' : undefined"
            :error="itemState === 'error' ? 'تعذر تحميل أنواع الكرتون. أعد المحاولة.' : undefined"
          >
            <div class="row">
              <AppSelect v-model="form.item" :options="itemOptions" placeholder="اختر نوع الكرتون" :busy="itemState === 'loading'" :invalid="itemState === 'error'" />
              <AppButton variant="ghost" icon="refresh" icon-only :disabled="itemState === 'loading'" @click="loadItems">إعادة تحميل الأنواع</AppButton>
            </div>
          </FormField>
        </div>
      </AppPanel>

      <AppPanel title="الأوزان والقيمة">
        <div class="form-grid">
          <FormField label="الوزن القائم (كجم)">
            <div class="row">
              <AppInput v-model.number="form.grossWeight" type="number" min="0" inputmode="decimal" />
              <AppButton v-if="saved?.capabilities.canCaptureGross" variant="secondary" icon="scale" :busy="capturing === 'gross'" @click="capture('gross')">قراءة الميزان</AppButton>
            </div>
          </FormField>
          <FormField label="وزن السيارة (كجم)">
            <div class="row">
              <AppInput v-model.number="form.tareWeight" type="number" min="0" inputmode="decimal" />
              <AppButton v-if="saved?.capabilities.canCaptureTare" variant="secondary" icon="scale" :busy="capturing === 'tare'" @click="capture('tare')">قراءة الميزان</AppButton>
            </div>
          </FormField>
          <FormField label="نوع الخصم"><AppSelect v-model="form.discountType" :options="discountOptions" /></FormField>
          <FormField v-if="form.discountType !== 'No Discount'" label="قيمة الخصم">
            <AppInput v-model.number="form.discountValue" type="number" min="0" inputmode="decimal" />
          </FormField>
          <FormField label="سعر الكيلو (ج.م)"><AppInput v-model.number="form.ratePerKg" type="number" min="0" inputmode="decimal" /></FormField>
        </div>

        <p v-if="previewError" class="readonly-note readonly-note--warning" role="alert">{{ previewError }}</p>

        <div v-if="derived" class="panel panel--plain" aria-live="polite">
          <FactsList
            :facts="[
              { label: 'الوزن الصافي', value: derived.netWeight, kind: 'quantity' },
              { label: 'وزن الخصم', value: derived.discountWeight, kind: 'quantity' },
              { label: 'الوزن المحتسب', value: derived.displayPayableWeight, kind: 'quantity' },
              { label: 'الإجمالي', value: derived.totalAmount, kind: 'money' },
            ]"
          />
          <p class="field__hint">القيم أعلاه معتمدة من الخادم (معاينة) ولا تُحسب في الواجهة.</p>
        </div>
      </AppPanel>

      <AppPanel title="بيانات النقل والملاحظات">
        <div class="form-grid">
          <FormField label="رقم السيارة"><AppInput v-model="form.vehicleNo" /></FormField>
          <FormField label="اسم السائق"><AppInput v-model="form.driverName" /></FormField>
          <FormField label="رقم كارتة الميزان"><AppInput v-model="form.weightTicket" /></FormField>
          <FormField label="إيصال المورد"><AppInput v-model="form.supplierReceipt" /></FormField>
          <div class="form-grid__wide"><FormField label="ملاحظات"><AppTextarea v-model="form.notes" :rows="3" /></FormField></div>
        </div>
      </AppPanel>

      <div class="form-actions">
        <AppButton v-if="canSave" variant="primary" icon="check" :busy="busy" @click="save(false)">حفظ كمسودة</AppButton>
        <AppButton v-if="canSubmit" variant="secondary" icon="check" :busy="busy" @click="save(true)">اعتماد التوريدة</AppButton>
        <p v-if="!canSave && !canSubmit" class="field__hint">لا تملك صلاحية حفظ أو اعتماد التوريدة على الخادم.</p>
        <AppButton variant="ghost" @click="router.push('/supplies')">إلغاء</AppButton>
        <span v-if="derived" class="push row faint">
          المحتسب <QuantityValue :value="derived.displayPayableWeight" unit="Kg" /> · القيمة <MoneyValue :value="derived.totalAmount" />
        </span>
      </div>
    </template>
  </section>
</template>
