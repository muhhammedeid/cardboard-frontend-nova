<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppSelect, { type SelectOption } from '@/components/base/AppSelect.vue'
import FactsList from '@/components/data/FactsList.vue'
import FormField from '@/components/base/FormField.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import ErrorState from '@/components/feedback/ErrorState.vue'
import LoadingState from '@/components/feedback/LoadingState.vue'
import PermissionState from '@/components/feedback/PermissionState.vue'
import { useToastStore } from '@/app/stores/toasts'
import { useServices } from '@/services'
import { errorMessage } from '@/services/api/errors'
import type { OperationalSettings, SettingsLookups } from '@/services/contracts'

const toasts = useToastStore()
const api = useServices().settings

const settings = reactive<OperationalSettings>({
  company: '',
  default_warehouse: '',
  cardboard_item_group: '',
  default_supplier_group: '',
  default_mode_of_payment: '',
  capabilities: { can_read: false, can_edit: false },
})
const lookups = ref<SettingsLookups | null>(null)
const lookupsFailed = ref(false)
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const saved = ref(false)

const canEdit = computed(() => settings.capabilities.can_edit)
const companyOptions = computed<SelectOption[]>(() => (lookups.value?.companies ?? []).map((o) => ({ value: o.name, label: o.displayName })))
const warehouseOptions = computed<SelectOption[]>(() => (lookups.value?.warehouses ?? []).map((o) => ({ value: o.name, label: o.displayName })))
const itemGroupOptions = computed<SelectOption[]>(() => (lookups.value?.itemGroups ?? []).map((o) => ({ value: o.name, label: o.displayName })))
const supplierGroupOptions = computed<SelectOption[]>(() => (lookups.value?.supplierGroups ?? []).map((o) => ({ value: o.name, label: o.displayName })))
const modeOptions = computed<SelectOption[]>(() => (lookups.value?.modesOfPayment ?? []).map((o) => ({ value: o.name, label: o.displayName })))

async function loadLookups(company?: string): Promise<void> {
  try {
    lookups.value = await api.lookups(company)
    lookupsFailed.value = false
  } catch {
    lookups.value = null
    lookupsFailed.value = true
  }
}

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    Object.assign(settings, await api.get())
    // Warehouse candidates are scoped to the configured company.
    await loadLookups(settings.company)
  } catch (value) {
    error.value = errorMessage(value, 'تعذر تحميل الإعدادات التشغيلية.')
    await loadLookups()
  } finally {
    loading.value = false
  }
}

watch(
  () => settings.company,
  (company) => {
    if (!loading.value) void loadLookups(company)
  },
)

async function save(): Promise<void> {
  busy.value = true
  saved.value = false
  error.value = ''
  try {
    const updated = await api.save({
      company: settings.company,
      default_warehouse: settings.default_warehouse,
      cardboard_item_group: settings.cardboard_item_group,
      default_supplier_group: settings.default_supplier_group,
      default_mode_of_payment: settings.default_mode_of_payment,
    })
    Object.assign(settings, updated)
    saved.value = true
    toasts.push('تم حفظ الإعدادات التشغيلية.', 'success')
  } catch (value) {
    error.value = errorMessage(value, 'تعذر حفظ الإعدادات التشغيلية.')
  } finally {
    busy.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="stack">
    <PageHeader
      title="الإعدادات التشغيلية"
      subtitle="تضبط هذه القيم نطاق الشركة والمخزن ومجموعات الأصناف والموردين وطريقة الدفع الافتراضية."
      icon="settings"
      eyebrow="الإعدادات"
    >
      <template #actions>
        <AppButton variant="ghost" icon="refresh" @click="load">إعادة التحميل</AppButton>
        <AppButton v-if="canEdit" variant="primary" icon="check" :busy="busy" @click="save">حفظ الإعدادات</AppButton>
      </template>
    </PageHeader>

    <LoadingState v-if="loading" message="جارٍ تحميل الإعدادات…" />

    <template v-else>
      <ErrorState v-if="error && !settings.capabilities.can_read" :message="error" @retry="load" />
      <PermissionState v-else-if="!settings.capabilities.can_edit" title="الإعدادات للقراءة فقط" message="لا تملك صلاحية تعديل Settings على الخادم." />

      <p v-else-if="error" class="readonly-note readonly-note--warning" role="alert">{{ error }}</p>

      <AppPanel
        title="نطاق التشغيل"
        description="القيم مستخرجة من قوائم الخادم المحدودة والمرخّصة."
      >
        <p v-if="lookupsFailed" class="readonly-note readonly-note--warning">
          تعذر تحميل القوائم المرشّحة من الخادم؛ الحقول معروضة كقيم نصية للقراءة فقط حتى تعود القوائم.
        </p>
        <div class="form-grid">
          <FormField label="الشركة" :hint="lookupsFailed ? undefined : 'شركات فرعية غير مجموعة.'">
            <AppSelect
              v-model="settings.company"
              :options="companyOptions"
              placeholder="اختر الشركة"
              :disabled="!canEdit || lookupsFailed"
            />
          </FormField>
          <FormField label="المخزن الافتراضي" hint="مخازن مُفعّلة غير مجموعة داخل الشركة المختارة.">
            <AppSelect
              v-model="settings.default_warehouse"
              :options="warehouseOptions"
              placeholder="اختر المخزن"
              :disabled="!canEdit || lookupsFailed"
            />
          </FormField>
          <FormField label="مجموعة أصناف الكرتون" hint="تحدد أي أصناف تظهر في التوريدات والمبيعات.">
            <AppSelect
              v-model="settings.cardboard_item_group"
              :options="itemGroupOptions"
              placeholder="اختر المجموعة"
              :disabled="!canEdit || lookupsFailed"
            />
          </FormField>
          <FormField label="مجموعة الموردين الافتراضية" hint="مجموعة ورقية (غير مجموعة أب) تُستخدم عند إنشاء مورد.">
            <AppSelect
              v-model="settings.default_supplier_group"
              :options="supplierGroupOptions"
              placeholder="اختر المجموعة"
              :disabled="!canEdit || lookupsFailed"
            />
          </FormField>
          <FormField label="طريقة الدفع الافتراضية" hint="طرق مُفعّلة ولها ربط حسابي صالح على الشركة.">
            <AppSelect
              v-model="settings.default_mode_of_payment"
              :options="modeOptions"
              placeholder="اختر طريقة الدفع"
              :disabled="!canEdit || lookupsFailed"
            />
          </FormField>
        </div>

        <div v-if="lookupsFailed" class="facts">
          <FactsList
            :facts="[
              { label: 'الشركة الحالية', value: settings.company ?? null },
              { label: 'المخزن الحالي', value: settings.default_warehouse ?? null },
              { label: 'مجموعة الأصناف', value: settings.cardboard_item_group ?? null },
              { label: 'مجموعة الموردين', value: settings.default_supplier_group ?? null },
              { label: 'طريقة الدفع', value: settings.default_mode_of_payment ?? null },
            ]"
          />
        </div>
      </AppPanel>

      <AppPanel title="ملاحظات على النطاق" plain>
        <ul class="stack-tight">
          <li class="row faint"><AppIcon name="info" size="sm" /> تغيير الشركة أو المخزن يؤثر على كل التوريدات والمبيعات الجديدة.</li>
          <li class="row faint"><AppIcon name="info" size="sm" /> التحقق من صحة القيم يتم على الخادم عند الحفظ.</li>
          <li class="row faint"><AppIcon name="info" size="sm" /> القوائم محدودة بالصلاحيات؛ قد تظهر أقل من 100 عنصر.</li>
        </ul>
      </AppPanel>

      <p v-if="saved" class="readonly-note" role="status">تم حفظ الإعدادات التشغيلية بنجاح.</p>
    </template>
  </section>
</template>
