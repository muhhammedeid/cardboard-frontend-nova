<script setup lang="ts">
import AppButton from '@/components/base/AppButton.vue'

/**
 * One edit affordance for every row-bearing table, so the pages differ only in
 * where they send the operator. `editable` is the page's gate (a draft status for
 * transactional documents); the backend still authorizes the write.
 */
const props = withDefaults(defineProps<{ editable?: boolean; label?: string }>(), {
  editable: true,
  label: 'تحرير',
})

defineEmits<{ (event: 'edit'): void }>()
</script>

<template>
  <AppButton
    v-if="props.editable"
    variant="ghost"
    size="sm"
    icon="settings"
    icon-only
    :title="props.label"
    :aria-label="props.label"
    @click="$emit('edit')"
  >
    {{ props.label }}
  </AppButton>
</template>
