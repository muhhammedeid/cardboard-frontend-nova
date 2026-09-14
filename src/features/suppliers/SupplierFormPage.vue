<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppBadge from '@/components/data/AppBadge.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect, { type SelectOption } from '@/components/base/AppSelect.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import FormField from '@/components/base/FormField.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import { useToastStore } from '@/app/stores/toasts'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import type { CreateSupplierRequest, SupplierSchema, SupplierType } from '@/services/contracts'

const route = useRoute()
const router = useRouter()
const toasts = useToastStore()
const api = useServices().suppliers

const recordId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEdit = computed(() => Boolean(recordId.value))

const schema = ref<SupplierSchema | null>(null)
const schemaError = ref('')
const busy = ref(false)
const loadingRecord = ref(false)
const loadError = ref('')
const formError = ref('')
const duplicateHint = ref(false)
/** The server decides whether this operator may change the supplier at all. */
const canEdit = ref(isEdit.value)
const canCreate = ref(false)

const form = ref<CreateSupplierRequest>({ supplierName: '', supplierType: 'Company', taxId: '', supplierDetails: '' })

const typeOptions: readonly SelectOption[] = [
  { value: 'Company', label: 'شركة' },
  { value: 'Individual', label: 'فرد' },
  { value: 'Partnership', label: 'شراكة' },
]

const requiredFields = computed(() => new Set(schema.value?.requiredFields ?? ['supplier_name']))
const readOnlyFields = computed(() => schema.value?.readOnlyFields ?? [])
const canSave = computed(() => (isEdit.value ? canEdit.value : canCreate.value))

async function loadSchema(): Promise<void> {
  schemaError.value = ''
  try {
    const value = await api.schema()
    schema.value = value
    if (!isEdit.value) form.value.supplierType = value.supplierTypeDefault
    canCreate.value = true
  } catch (value) {
    schemaError.value = errorMessage(value, 'تعذر تحميل حقول المورد.')
  }
}

async function loadRecord(): Promise<void> {
  loadingRecord.value = true
  loadError.value = ''
  try {
    const record = await api.get(recordId.value)
    form.value = {
      supplierName: record.supplierName,
      supplierType: record.supplierType,
      taxId: record.taxId ?? '',
      supplierDetails: record.supplierDetails ?? '',
    }
    canEdit.value = record.capabilities.canEdit
  } catch (value) {
    loadError.value = errorMessage(value, 'تعذر تحميل بيانات المورد.')
  } finally {
    loadingRecord.value = false
  }
}

async function save(): Promise<void> {
  formError.value = ''
  duplicateHint.value = false
  if (!form.value.supplierName.trim()) {
    formError.value = 'اسم المورد مطلوب.'
    return
  }
  busy.value = true
  const payload = {
    supplierName: form.value.supplierName.trim(),
    supplierType: form.value.supplierType as SupplierType,
    taxId: form.value.taxId || undefined,
    supplierDetails: form.value.supplierDetails || undefined,
  }
  try {
    if (isEdit.value) {
      const updated = await api.update(recordId.value, payload)
      toasts.push(`تم تحديث المورد ${updated.name}.`, 'success')
      await router.replace(`/suppliers/${updated.name}`)
    } else {
      const created = await api.create(payload)
      toasts.push(`تم إنشاء المورد ${created.name}.`, 'success')
      await router.replace(`/suppliers/${created.name}`)
    }
  } catch (value) {
    formError.value = errorMessage(value, 'تعذر حفظ المورد.')
    duplicateHint.value = value instanceof Error && /duplicate/i.test(value.message)
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  await Promise.allSettled([loadSchema(), isEdit.value ? loadRecord() : Promise.resolve()])
})
</script>

<template>
  <section class="stack">
    <PageHeader
      :title="isEdit ? `تحرير المورد ${recordId}` : 'مورد جديد'"
      :subtitle="isEdit ? 'تعديل البيانات المسجلة عند إنشاء المورد.' : 'الحقول المتاحة والمحجوزة يحددها الخادم عبر مخطط الإنشاء.'"
      eyebrow="السجلات"
      icon="suppliers"
    >
      <template #actions>
        <AppButton variant="ghost" icon="arrowRight" @click="router.push(isEdit ? `/suppliers/${recordId}` : '/suppliers')">
          {{ isEdit ? 'ملف المورد' : 'قائمة الموردين' }}
        </AppButton>
      </template>
    </PageHeader>

    <LoadingState v-if="loadingRecord" message="جارٍ تحميل بيانات المورد…" />

    <template v-else>
      <p v-if="loadError" class="readonly-note readonly-note--warning" role="alert">{{ loadError }}</p>
      <p v-if="formError" class="readonly-note readonly-note--warning" role="alert">
        {{ formError }}
        <span v-if="duplicateHint"> تأكد من عدم وجود مورد بنفس الاسم؛ الأسماء المكررة يرفضها الخادم.</span>
      </p>

      <AppPanel
        title="بيانات المورد"
        :description="schema?.defaultSupplierGroup ? `المجموعة الافتراضية: ${schema.defaultSupplierGroup}` : undefined"
      >
        <form class="form-grid" @submit.prevent="save">
          <FormField label="اسم المورد" :required="requiredFields.has('supplier_name')" hint="الاسم كما سيظهر في التوريدات والكشوف.">
            <AppInput v-model="form.supplierName" required placeholder="مثال: مصنع النور للكرتون" :readonly="!canSave" />
          </FormField>
          <FormField label="نوع المورد">
            <AppSelect v-model="form.supplierType" :options="typeOptions" :disabled="!canSave" />
          </FormField>
          <FormField label="الرقم الضريبي" hint="اختياري — يُستخدم في الطباعة والمطابقة المحاسبية.">
            <AppInput v-model="form.taxId" :readonly="!canSave" />
          </FormField>
          <div class="form-grid__wide">
            <FormField label="ملاحظات المورد"><AppTextarea v-model="form.supplierDetails" :rows="3" :readonly="!canSave" /></FormField>
          </div>
        </form>
      </AppPanel>

      <AppPanel v-if="schema" title="حقول يديرها الخادم" description="لا تُرسل من الواجهة إطلاقًا." plain>
        <ul class="stack-tight">
          <li v-for="field in readOnlyFields" :key="field" class="row faint">
            <AppBadge tone="neutral" :dot="false">محجوز</AppBadge>
            <span class="mono">{{ field }}</span>
          </li>
        </ul>
        <p class="field__hint">مجموعة المورد والحسابات والبنوك تُدار من بطاقة الجهة في ERPNext، وليست جزءًا من هذه الشاشة.</p>
      </AppPanel>

      <p v-if="schemaError" class="readonly-note readonly-note--warning">{{ schemaError }} يمكنك المتابعة بالحقول الأساسية.</p>

      <div class="form-actions">
        <AppButton v-if="canSave" variant="primary" icon="check" :busy="busy" @click="save">
          {{ isEdit ? 'حفظ التعديلات' : 'حفظ المورد' }}
        </AppButton>
        <p v-else class="field__hint">
          {{ isEdit ? 'لا تملك صلاحية تعديل هذا المورد (can_edit غير مُمنوح).' : 'لا تملك صلاحية إنشاء مورد على الخادم.' }}
        </p>
        <AppButton variant="ghost" @click="router.push('/suppliers')">إلغاء</AppButton>
      </div>
    </template>
  </section>
</template>
