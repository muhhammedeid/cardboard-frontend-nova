<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/base/AppButton.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppSelect, { type SelectOption } from '@/components/base/AppSelect.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import FormField from '@/components/base/FormField.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import { useToastStore } from '@/app/stores/toasts'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import type { CreateSupplierRequest, SupplierSchema, SupplierType } from '@/services/contracts'

const router = useRouter()
const toasts = useToastStore()
const api = useServices().suppliers

const schema = ref<SupplierSchema | null>(null)
const schemaError = ref('')
const busy = ref(false)
const formError = ref('')
const duplicateHint = ref(false)

const form = ref<CreateSupplierRequest>({ supplierName: '', supplierType: 'Company', taxId: '', supplierDetails: '' })

const typeOptions: readonly SelectOption[] = [
  { value: 'Company', label: 'شركة' },
  { value: 'Individual', label: 'فرد' },
  { value: 'Partnership', label: 'شراكة' },
]

const requiredFields = computed(() => new Set(schema.value?.requiredFields ?? ['supplier_name']))
const readOnlyFields = computed(() => schema.value?.readOnlyFields ?? [])

async function loadSchema(): Promise<void> {
  schemaError.value = ''
  try {
    const value = await api.schema()
    schema.value = value
    form.value.supplierType = value.supplierTypeDefault
  } catch (value) {
    schemaError.value = errorMessage(value, 'تعذر تحميل حقول إنشاء المورد.')
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
  try {
    const created = await api.create({
      supplierName: form.value.supplierName.trim(),
      supplierType: form.value.supplierType as SupplierType,
      taxId: form.value.taxId || undefined,
      supplierDetails: form.value.supplierDetails || undefined,
    })
    toasts.push(`تم إنشاء المورد ${created.name}.`, 'success')
    await router.replace(`/suppliers/${created.name}`)
  } catch (value) {
    formError.value = errorMessage(value, 'تعذر حفظ المورد.')
    duplicateHint.value = value instanceof Error && /duplicate/i.test(value.message)
  } finally {
    busy.value = false
  }
}

onMounted(loadSchema)
</script>

<template>
  <section class="stack">
    <PageHeader title="مورد جديد" subtitle="الحقول المتاحة والمحجوزة يحددها الخادم عبر مخطط الإنشاء." eyebrow="السجلات" icon="suppliers">
      <template #actions>
        <AppButton variant="ghost" icon="arrowRight" @click="router.push('/suppliers')">قائمة الموردين</AppButton>
      </template>
    </PageHeader>

    <p v-if="formError" class="readonly-note readonly-note--warning" role="alert">
      {{ formError }}
      <span v-if="duplicateHint"> تأكد من عدم وجود مورد بنفس الاسم؛ الأسماء المكررة يرفضها الخادم.</span>
    </p>

    <AppPanel title="بيانات المورد" :description="schema?.defaultSupplierGroup ? `المجموعة الافتراضية: ${schema.defaultSupplierGroup}` : undefined">
      <form class="form-grid" @submit.prevent="save">
        <FormField
          label="اسم المورد"
          :required="requiredFields.has('supplier_name')"
          hint="الاسم كما سيظهر في التوريدات والكشوف."
        >
          <AppInput v-model="form.supplierName" required placeholder="مثال: مصنع النور للكرتون" />
        </FormField>
        <FormField label="نوع المورد">
          <AppSelect v-model="form.supplierType" :options="typeOptions" />
        </FormField>
        <FormField label="الرقم الضريبي" hint="اختياري — يُستخدم في الطباعة والمطابقة المحاسبية.">
          <AppInput v-model="form.taxId" />
        </FormField>
        <div class="form-grid__wide">
          <FormField label="ملاحظات المورد"><AppTextarea v-model="form.supplierDetails" :rows="3" /></FormField>
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
      <p class="field__hint">تعديل بيانات المورد الرئيسية غير متاح من هذه الواجهة (تحديث المورد مؤجل في عقد الخادم).</p>
    </AppPanel>

    <p v-if="schemaError" class="readonly-note readonly-note--warning">{{ schemaError }} يمكنك المتابعة بالحقول الأساسية.</p>

    <div class="form-actions">
      <AppButton variant="primary" icon="check" :busy="busy" @click="save">حفظ المورد</AppButton>
      <AppButton variant="ghost" @click="router.push('/suppliers')">إلغاء</AppButton>
    </div>
  </section>
</template>
