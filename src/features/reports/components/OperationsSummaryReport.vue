<script setup lang="ts">
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import MetricCard from '@/components/data/MetricCard.vue'
import type { OperationsSummaryReport } from '@/services/contracts/reports'

defineProps<{ report: OperationsSummaryReport }>()
</script>

<template>
  <section class="stack">
    <section class="metric-grid">
      <MetricCard label="قيمة التوريدات" :helper="`${report.supplies.count} توريدة`" tone="weight" icon="inbound">
        <template #value><MoneyValue :value="report.supplies.value" /></template>
        <template #meta><QuantityValue :value="report.supplies.payableWeight" unit="كجم محتسب" /></template>
      </MetricCard>
      <MetricCard label="المبيعات" :helper="`${report.sales.count} بيع`" tone="primary" icon="outbound">
        <template #value><MoneyValue :value="report.sales.informationalValue" /></template>
        <template #meta>
          <QuantityValue :value="report.sales.quantity" unit="كجم" />
          <span class="faint">قيمة تشغيلية معلوماتية</span>
        </template>
      </MetricCard>
      <MetricCard label="مدفوعات الموردين" :helper="`${report.supplierPayments.count} دفعة`" tone="success" icon="payments">
        <template #value><MoneyValue :value="report.supplierPayments.amount" /></template>
      </MetricCard>
      <MetricCard label="المصروفات" :helper="`${report.expenses.count} مصروف`" tone="warning" icon="expenses">
        <template #value><MoneyValue :value="report.expenses.amount" /></template>
      </MetricCard>
    </section>
    <p class="field__hint">
      كل الأرقام أعلاه معتمدة من الخادم للفترة من <bdi dir="ltr">{{ report.fromDate }}</bdi> إلى
      <bdi dir="ltr">{{ report.toDate }}</bdi>.
    </p>
  </section>
</template>
