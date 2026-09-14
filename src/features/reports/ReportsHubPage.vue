<script setup lang="ts">
import AppIcon from '@/components/base/AppIcon.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import { reportHubGroups, reportsForHubGroup } from './report-registry'
</script>

<template>
  <section class="stack">
    <PageHeader
      title="مركز التقارير"
      subtitle="تقارير تشغيلية تُبنى بالكامل على بيانات الخادم، مصنّفة حسب نطاق العمل."
      icon="reports"
      eyebrow="التقارير"
    />

    <section v-for="group in reportHubGroups" :key="group.key" class="page-section" :aria-labelledby="`report-group-${group.key}`">
      <div class="page-section__heading">
        <h2 :id="`report-group-${group.key}`">{{ group.title }}</h2>
        <p>{{ group.description }}</p>
      </div>
      <div class="report-grid">
        <RouterLink
          v-for="definition in reportsForHubGroup(group)"
          :key="definition.key"
          class="report-card"
          :to="`/reports/${definition.key}`"
          :data-report="definition.key"
        >
          <span class="icon-tile"><AppIcon :name="definition.icon" size="sm" /></span>
          <span class="report-card__content">
            <strong>{{ definition.title }}</strong>
            <span>{{ definition.description }}</span>
          </span>
          <AppIcon class="report-card__arrow" name="chevronLeft" size="sm" />
        </RouterLink>
      </div>
    </section>
  </section>
</template>

<style scoped>
.report-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
  gap: var(--space-3);
}

.report-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-1);
  color: inherit;
  transition: border-color var(--motion-fast) var(--ease), box-shadow var(--motion-base) var(--ease), transform var(--motion-base) var(--ease);
}

.report-card:hover,
.report-card:focus-visible {
  border-color: color-mix(in srgb, var(--primary) 38%, var(--border));
  box-shadow: var(--shadow-2);
  transform: translateY(-2px);
  outline: none;
}

.report-card__content {
  display: grid;
  gap: 0.15rem;
  min-inline-size: 0;
}

.report-card__content strong {
  color: var(--text-strong);
  font-size: var(--text-base);
}

.report-card__content span {
  color: var(--text-muted);
  font-size: var(--text-xs);
  line-height: 1.7;
}

.report-card__arrow {
  color: var(--text-faint);
}
</style>
