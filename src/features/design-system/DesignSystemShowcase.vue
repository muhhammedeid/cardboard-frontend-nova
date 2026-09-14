<script setup lang="ts">
import AppBadge from '@/components/data/AppBadge.vue'
import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppInput from '@/components/base/AppInput.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import AppSelect from '@/components/base/AppSelect.vue'
import AppTextarea from '@/components/base/AppTextarea.vue'
import DataTable from '@/components/data/DataTable.vue'
import FactsList from '@/components/data/FactsList.vue'
import FormField from '@/components/base/FormField.vue'
import MetricCard from '@/components/data/MetricCard.vue'
import MoneyValue from '@/components/base/MoneyValue.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import StatusBadge from '@/components/data/StatusBadge.vue'
import ThemeToggle from '@/components/navigation/ThemeToggle.vue'
import { ICONS } from '@/components/base/icons'
import type { IconName } from '@/components/base/icons'
import type { TableColumn } from '@/components/data/table-column'

const swatches: Array<{ name: string; token: string }> = [
  { name: 'Canvas', token: 'var(--canvas)' },
  { name: 'Surface', token: 'var(--surface)' },
  { name: 'Surface 2', token: 'var(--surface-2)' },
  { name: 'Border', token: 'var(--border)' },
  { name: 'Border strong', token: 'var(--border-strong)' },
  { name: 'Primary', token: 'var(--primary)' },
  { name: 'Primary soft', token: 'var(--primary-soft)' },
  { name: 'Accent (weight)', token: 'var(--accent)' },
  { name: 'Success', token: 'var(--success)' },
  { name: 'Warning', token: 'var(--warning)' },
  { name: 'Danger', token: 'var(--danger)' },
  { name: 'Info', token: 'var(--info)' },
]

const iconNames = Object.keys(ICONS) as IconName[]

const columns: readonly TableColumn[] = [
  { key: 'name', label: 'رقم السجل' },
  { key: 'supplierName', label: 'المورد' },
  { key: 'weight', label: 'الوزن', align: 'end' },
  { key: 'amount', label: 'القيمة', align: 'end' },
  { key: 'status', label: 'الحالة' },
]

const rows = [
  { name: 'CS-2026-0143', supplierName: 'مصنع النور للكرتون', weight: 5120, amount: 33280, status: 'Submitted' },
  { name: 'CS-2026-0142', supplierName: 'مؤسسة الشروق', weight: 1830, amount: 9150, status: 'Draft' },
  { name: 'CS-2026-0140', supplierName: 'مؤسسة الشروق', weight: 3260, amount: 21190, status: 'Cancelled' },
]

const selectOptions = [
  { value: 'a', label: 'خيار أول' },
  { value: 'b', label: 'خيار ثانٍ' },
]
</script>

<template>
  <section class="stack">
    <PageHeader title="نظام تصميم Nova" subtitle="مرجع تطويري داخلي لعناصر الواجهة والحالات. هذا المسار خارج تنقل المنتج." icon="sparkles" eyebrow="تطوير" />

    <AppPanel title="المظهر" description="بدّل بين نهاري وداكن وتلقائي؛ كل المكونات تعمل بالتوكنات الدلالية نفسها.">
      <div class="row wrap">
        <ThemeToggle />
        <AppBadge tone="primary">نهاري</AppBadge>
        <AppBadge tone="neutral">داكن</AppBadge>
        <AppBadge tone="info">تلقائي</AppBadge>
      </div>
    </AppPanel>

    <AppPanel title="الألوان الدلالية" description="التوكنات التي تعيد بناء نفس العناصر في المظهرين.">
      <div class="styleguide-grid">
        <div v-for="swatch in swatches" :key="swatch.name" class="swatch">
          <span class="swatch__tile" :style="{ background: swatch.token }" />
          <strong>{{ swatch.name }}</strong>
          <small class="mono">{{ swatch.token }}</small>
        </div>
      </div>
    </AppPanel>

    <AppPanel title="الأزرار" description="أحجام وحالات ونماذج أيقونية.">
      <div class="row wrap">
        <AppButton variant="primary" icon="check">إجراء أساسي</AppButton>
        <AppButton variant="secondary" icon="refresh">إجراء ثانوي</AppButton>
        <AppButton variant="ghost" icon="close">خفي</AppButton>
        <AppButton variant="danger" icon="alert">خطر</AppButton>
        <AppButton variant="danger-ghost" icon="alert">خطر هادئ</AppButton>
        <AppButton variant="quiet" icon="plus">هادئ</AppButton>
        <AppButton variant="primary" busy>جارٍ التنفيذ</AppButton>
        <AppButton variant="secondary" disabled>معطّل</AppButton>
        <AppButton variant="secondary" icon="print" icon-only>طباعة</AppButton>
        <AppButton variant="primary" size="sm" icon="plus">صغير</AppButton>
        <AppButton variant="primary" size="lg" icon="plus">كبير</AppButton>
      </div>
    </AppPanel>

    <AppPanel title="الحقول" description="حالات عادية، قراءة فقط، خطأ، وتعطيل.">
      <div class="form-grid">
        <FormField label="حقل نصي" required hint="نص مساعد أسفل الحقل.">
          <AppInput model-value="" placeholder="أدخل قيمة" />
        </FormField>
        <FormField label="تاريخ"><AppInput model-value="" type="date" /></FormField>
        <FormField label="قائمة"><AppSelect model-value="" :options="selectOptions" placeholder="اختر خيارًا" /></FormField>
        <FormField label="حقل بخطأ" error="هذا الحقل مطلوب على الخادم.">
          <AppInput model-value="" invalid />
        </FormField>
        <FormField label="قراءة فقط"><AppInput model-value="قيمة من الخادم" readonly /></FormField>
        <FormField label="معطّل"><AppInput model-value="" disabled placeholder="غير متاح" /></FormField>
        <div class="form-grid__wide"><FormField label="نص طويل"><AppTextarea model-value="" :rows="3" /></FormField></div>
      </div>
    </AppPanel>

    <AppPanel title="الشارات والحالات" description="اللون ليس الإشارة الوحيدة؛ كل شارة تحمل نصًا ونقطة.">
      <div class="row wrap">
        <StatusBadge value="Draft" />
        <StatusBadge value="Submitted" />
        <StatusBadge value="Cancelled" />
        <StatusBadge value="مدفوع" />
        <StatusBadge value="مدفوع جزئيًا" />
        <StatusBadge value="غير مدفوع" />
        <AppBadge tone="primary">معلومة</AppBadge>
        <AppBadge tone="weight">وزن</AppBadge>
        <AppBadge tone="success" :dot="false">بلا نقطة</AppBadge>
      </div>
    </AppPanel>

    <AppPanel title="بطاقات المؤشر والقيم" description="القيم المالية والأوزان معزولة اتجاهيًا.">
      <section class="metric-grid">
        <MetricCard label="قيمة التوريدات" helper="12 توريدة" tone="money" icon="inbound">
          <template #value><MoneyValue :value="313625" /></template>
        </MetricCard>
        <MetricCard label="الوزن المحتسب" helper="وزن صافي بعد الخصم" tone="weight" icon="scale">
          <template #value><QuantityValue :value="48250" unit="كجم" /></template>
        </MetricCard>
        <MetricCard label="مؤشر نجاح" helper="حالة معتمدة" tone="success" icon="check">
          <template #value>معتمد</template>
        </MetricCard>
        <MetricCard label="مؤشر تحذير" helper="متبقي مستحق" tone="warning" icon="alert">
          <template #value><MoneyValue :value="27280" /></template>
        </MetricCard>
      </section>
    </AppPanel>

    <AppPanel title="الجداول" description="رؤوس ثابتة، محاذاة رقمية، وصفوف قابلة للنقر.">
      <DataTable :columns="columns" :rows="rows" row-key="name" clickable>
        <template #cell-name="{ row }"><span class="table__code">{{ row.name }}</span></template>
        <template #cell-weight="{ row }"><QuantityValue :value="row.weight" unit="Kg" /></template>
        <template #cell-amount="{ row }"><MoneyValue :value="row.amount" /></template>
        <template #cell-status="{ row }"><StatusBadge :value="row.status" /></template>
      </DataTable>
    </AppPanel>

    <AppPanel title="قائمة الحقائق" description="لعرض تفاصيل السجل بمحاذاة منضبطة.">
      <FactsList
        :facts="[
          { label: 'رقم التوريدة', value: 'CS-2026-0143', kind: 'code' },
          { label: 'التاريخ', value: '2026-09-14' },
          { label: 'الوزن المحتسب', value: 5120, kind: 'quantity' },
          { label: 'القيمة', value: 33280, kind: 'money' },
          { label: 'ملاحظات', value: 'نص طويل يوضح سلوك النص في العمود الواسع.', wide: true },
        ]"
      />
    </AppPanel>

    <AppPanel title="الحالات الفارغة والتحميل" description="كل حالة مستقلة ولا تُستخدم بدلًا من الأخرى.">
      <div class="state-grid">
        <div class="state"><span class="state__glyph"><AppIcon name="inbox" size="lg" /></span><h2>لا توجد بيانات</h2><p>لا توجد نتائج مطابقة.</p></div>
        <div class="state state--error"><span class="state__glyph"><AppIcon name="alert" size="lg" /></span><h2>تعذر التحميل</h2><p>حدث خطأ من الخادم.</p></div>
        <div class="state state--permission"><span class="state__glyph"><AppIcon name="lock" size="lg" /></span><h2>صلاحية مطلوبة</h2><p>هذا الإجراء يتطلب صلاحية إضافية.</p></div>
        <div class="state"><span class="state__glyph"><AppIcon name="refresh" size="lg" /></span><h2>جارٍ التحميل</h2><p>يتم جلب البيانات من الخادم.</p></div>
      </div>
    </AppPanel>

    <AppPanel title="الأيقونات" description="مجموعة SVG واحدة بحجم واحد وسمك موحّد.">
      <div class="icon-grid">
        <span v-for="name in iconNames" :key="name" class="icon-tile" :title="name"><AppIcon :name="name" size="sm" /></span>
      </div>
    </AppPanel>
  </section>
</template>

<style scoped>
.state-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: var(--space-3);
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
