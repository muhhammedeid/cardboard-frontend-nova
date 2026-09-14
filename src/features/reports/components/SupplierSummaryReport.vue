<script setup lang="ts">
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import FactsList from '@/components/data/FactsList.vue'
import type { SupplierSummaryReport } from '@/services/contracts/reports'

const props = defineProps<{ report: SupplierSummaryReport }>()
</script>

<template>
  <section class="stack">
    <AppPanel title="هوية المورد" plain>
      <FactsList
        :facts="[
          { label: 'المورد', value: props.report.supplier.nameLabel },
          { label: 'كود المورد', value: props.report.supplier.name, kind: 'code' },
          { label: 'من تاريخ', value: props.report.fromDate },
          { label: 'إلى تاريخ', value: props.report.toDate },
        ]"
      />
    </AppPanel>

    <section class="metric-grid">
      <div class="metric metric--money">
        <header class="metric__head">الرصيد المستحق الحالي</header>
        <p class="metric__value"><MoneyValue :value="props.report.currentOutstanding" /></p>
        <div class="metric__meta">رصيد فواتير الشراء الحالي من الخادم.</div>
      </div>
      <div class="metric metric--weight">
        <header class="metric__head">قيمة التوريدات خلال الفترة</header>
        <p class="metric__value"><MoneyValue :value="props.report.suppliedValue" /></p>
        <div class="metric__meta"><QuantityValue :value="props.report.suppliedPayableWeight" unit="كجم محتسب" /></div>
      </div>
      <div class="metric metric--success">
        <header class="metric__head">المدفوعات خلال الفترة</header>
        <p class="metric__value"><MoneyValue :value="props.report.paidAmount" /></p>
        <div class="metric__meta">{{ props.report.supplyCount }} توريدة في الفترة.</div>
      </div>
    </section>
    <p class="field__hint">الرصيد المستحق لقطة حالية معتمدة، وليس مجموع حركة الفترة.</p>
  </section>
</template>
