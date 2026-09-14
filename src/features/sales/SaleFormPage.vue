<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppBadge from '@/components/data/AppBadge.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect, { type SelectOption } from '@/components/base/AppSelect.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import FactsList from '@/components/data/FactsList.vue'
import FormField from '@/components/base/FormField.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import { useToastStore } from '@/app/stores/toasts'
import { useServices } from '@/services'
import { errorMessage, FrontendError } from '@/services/api/errors'
import { todayIso } from '@/services/formatting'
import type { SaleDetail, SaleInput, SaleLookup } from '@/services/contracts'

const route = useRoute()
const router = useRouter()
const toasts = useToastStore()
const api = useServices().sales

const recordId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEdit = computed(() => Boolean(recordId.value))

const items = ref<SaleLookup[]>([])
const itemLookupFailed = ref(false)
const saved = ref<SaleDetail | null>(null)
const loadingRecord = ref(false)
const busy = ref(false)
const loadError = ref('')
const formError = ref('')
/** Create capability comes from the server: a create form has no document to ask. */
const canCreate = ref(false)

const form = reactive<SaleInput>({ postingDate: todayIso(), item: '', quantity: 0, ratePerKg: 0, buyerName: '', notes: '' })
const itemOptions = computed<SelectOption[]>(() => items.value.map((option) => ({ value: option.name, label: option.label })))
const canEdit = computed(() => (isEdit.value ? Boolean(saved.value?.capabilities.canEdit) : canCreate.value))
const canSubmit = computed(() => (isEdit.value ? Boolean(saved.value?.capabilities.canSubmit) : canCreate.value))

async function loadItems(): Promise<void> {
  try {
    items.value = await api.lookupItems()
    itemLookupFailed.value = false
  } catch {
    items.value = []
    itemLookupFailed.value = true
  }
}

function fill(value: SaleDetail): void {
  Object.assign(form, {
    postingDate: value.postingDate,
    item: value.item,
    quantity: value.quantity,
    ratePerKg: value.ratePerKg,
    buyerName: value.buyerName ?? '',
    notes: value.notes ?? '',
  })
  saved.value = value
}

async function save(submit = false): Promise<void> {
  formError.value = ''
  if (submit && !canSubmit.value) {
    formError.value = 'اعتماد البيع يتطلب صلاحية إضافية على الخادم.'
    return
  }
  if (!submit && !canEdit.value) {
    formError.value = 'لا يمكن تحرير بيع غير مسودة.'
    return
  }
  busy.value = true
  try {
    const value = isEdit.value ? await api.update(recordId.value, { ...form }) : await api.create({ ...form })
    saved.value = submit ? await api.submit(value.name) : value
    toasts.push(submit ? `تم اعتماد البيع ${saved.value.name}.` : `تم حفظ البيع ${saved.value.name} كمسودة.`, 'success')
    await router.replace(`/sales/${saved.value.name}`)
  } catch (value) {
    formError.value =
      value instanceof FrontendError && value.code === 'insufficient_stock'
        ? 'الكمية تتجاوز المخزون المتاح على الخادم.'
        : errorMessage(value, submit ? 'تعذر اعتماد البيع.' : 'تعذر حفظ البيع.')
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  // Independent lookups: a failed capability answer must not hide the item select.
  const [capabilitiesResult] = await Promise.allSettled([api.getCreateCapabilities(), loadItems()])
  if (capabilitiesResult.status === 'fulfilled') canCreate.value = capabilitiesResult.value.canCreate
  if (!recordId.value) return
  loadingRecord.value = true
  try {
    fill(await api.get(recordId.value))
  } catch (value) {
    loadError.value = errorMessage(value, 'تعذر تحميل البيع.')
  } finally {
    loadingRecord.value = false
  }
})
</script>

<template>
  <section class="stack">
    <PageHeader
      :title="isEdit ? `تحرير البيع ${recordId}` : 'بيع جديد'"
      subtitle="القيمة التشغيلية والتحقق من المخزون يتمان على الخادم عند الحفظ والاعتماد."
      eyebrow="المبيعات"
      icon="outbound"
    >
      <template #actions>
        <AppBadge v-if="saved" tone="primary">{{ saved.status === 'Draft' ? 'مسودة' : saved.status === 'Submitted' ? 'معتمد' : 'ملغي' }}</AppBadge>
        <AppButton variant="ghost" icon="arrowRight" @click="router.push('/sales')">قائمة المبيعات</AppButton>
      </template>
    </PageHeader>

    <ErrorState v-if="loadError" :message="loadError" @retry="router.go(0)" />
    <LoadingState v-else-if="loadingRecord" message="جارٍ تحميل البيع…" />

    <template v-else>
      <p v-if="formError" class="readonly-note readonly-note--warning" role="alert">{{ formError }}</p>

      <AppPanel title="بيانات البيع" description="المشتري هنا نص حر كما في سجل البيع التشغيلي.">
        <div class="form-grid">
          <FormField label="التاريخ" required><AppInput v-model="form.postingDate" type="date" :max="todayIso()" /></FormField>
          <FormField
            label="نوع الكرتون"
            required
            :hint="itemLookupFailed ? 'تعذر تحميل الأنواع. أعد المحاولة.' : undefined"
          >
            <div class="row">
              <AppSelect v-model="form.item" :options="itemOptions" placeholder="اختر نوع الكرتون" :invalid="itemLookupFailed" />
              <AppButton variant="ghost" icon="refresh" icon-only @click="loadItems">إعادة تحميل الأنواع</AppButton>
            </div>
          </FormField>
          <FormField label="المشتري"><AppInput v-model="form.buyerName" placeholder="اسم المشتري" /></FormField>
          <FormField label="الكمية (كجم)" required><AppInput v-model.number="form.quantity" type="number" min="0" inputmode="decimal" /></FormField>
          <FormField label="سعر الكيلو (ج.م)" required><AppInput v-model.number="form.ratePerKg" type="number" min="0" inputmode="decimal" /></FormField>
        </div>
      </AppPanel>

      <AppPanel title="نتيجة البيع المعتمدة" description="تظهر بعد الحفظ؛ لا تُحسب القيمة في الواجهة.">
        <FactsList
          v-if="saved"
          :facts="[
            { label: 'رقم البيع', value: saved.name, kind: 'code' },
            { label: 'الكمية', value: saved.quantity, kind: 'quantity' },
            { label: 'القيمة التشغيلية', value: saved.informationalValue, kind: 'money' },
            { label: 'قيد المخزون', value: saved.stockEntry ?? null, kind: 'code' },
          ]"
        />
        <p v-else class="muted">احفظ المسودة لعرض القيم المعتمدة من الخادم.</p>
      </AppPanel>

      <AppPanel title="ملاحظات">
        <FormField label="ملاحظات"><AppTextarea v-model="form.notes" :rows="3" /></FormField>
      </AppPanel>

      <div class="form-actions">
        <AppButton v-if="canEdit" variant="primary" icon="check" :busy="busy" @click="save(false)">حفظ كمسودة</AppButton>
        <AppButton v-if="canSubmit" variant="secondary" icon="check" :busy="busy" @click="save(true)">اعتماد البيع</AppButton>
        <p v-if="!canEdit && !canSubmit" class="field__hint">
          {{ isEdit ? 'لا تملك صلاحية تحرير أو اعتماد هذا البيع.' : 'لا تملك صلاحية إنشاء بيع على الخادم (can_create غير مُمنوح).' }}
        </p>
        <AppButton variant="ghost" @click="router.push('/sales')">إلغاء</AppButton>
      </div>
    </template>
  </section>
</template>
