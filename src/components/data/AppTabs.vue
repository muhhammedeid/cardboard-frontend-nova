<script setup lang="ts">
export interface TabItem {
  id: string
  label: string
  badge?: string | number
}

defineProps<{ tabs: readonly TabItem[]; activeId: string; label?: string }>()
defineEmits<{ (event: 'update:activeId', value: string): void }>()
</script>

<template>
  <div class="tabs" role="tablist" :aria-label="label ?? 'أقسام'">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tabs__tab"
      type="button"
      role="tab"
      :aria-selected="tab.id === activeId"
      :data-tab="tab.id"
      @click="$emit('update:activeId', tab.id)"
    >
      {{ tab.label }}
      <span v-if="tab.badge !== undefined && tab.badge !== ''" class="badge badge--plain badge--neutral">{{ tab.badge }}</span>
    </button>
  </div>
</template>
