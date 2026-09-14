<script setup lang="ts">
import MoneyValue from '@/components/base/MoneyValue.vue'
import QuantityValue from '@/components/base/QuantityValue.vue'
import AppPanel from '@/components/data/AppPanel.vue'
import DataTimeline, { type TimelineEntry } from '@/components/data/DataTimeline.vue'
import EmptyState from '@/components/feedback/EmptyState.vue'
import FactsList from '@/components/data/FactsList.vue'
import { computed } from 'vue'
import type { SupplierStatementReport } from '@/services/contracts/reports'

const props = defineProps<{ report: SupplierStatementReport }>()

const entries = computed<TimelineEntry[]>(() =>
  props.report.entries.map((entry) => ({
    id: entry.name,
    type: entry.type,
    title: entry.type === 'supply' ? `توريدة · ${entry.label}` : `دفعة · ${entry.modeOfPayment ?? entry.label}`,
    date: entry.postingDate,
    amount: entry.amount,
    amountKind: 'money' as const,
    meta: entry.quantity !== undefined ? `${entry.quantity} كجم` : undefined,
  })),
)
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
        <div class="metric__meta">لقطة ختامية مستقلة عن حركة الفترة.</div>
      </div>
      <div class="metric metric--weight">
        <header class="metric__head">قيمة التوريدات خلال الفترة</header>
        <p class="metric__value"><MoneyValue :value="props.report.suppliedValue" /></p>
        <div class="metric__meta"><QuantityValue :value="props.report.suppliedPayableWeight" unit="كجم محتسب" /></div>
      </div>
      <div class="metric metric--success">
        <header class="metric__head">المدفوعات خلال الفترة</header>
        <p class="metric__value"><MoneyValue :value="props.report.paidAmount" /></p>
        <div class="metric__meta">{{ props.report.supplyCount }} توريدة · {{ props.report.entries.length }} حركة</div>
      </div>
    </section>

    <EmptyState
      v-if="!entries.length"
      icon="layers"
      title="لا توجد حركات"
      message="لا توجد توريدات أو مدفوعات في الفترة المحددة."
    />

    <AppPanel v-else title="حركات الفترة" description="توريدات ومدفوعات معتمدة مرتبة زمنيًا من الخادم.">
      <DataTimeline :entries="entries" />
    </AppPanel>
  </section>
</template>
