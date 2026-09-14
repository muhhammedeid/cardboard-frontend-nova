<script setup lang="ts">
withDefaults(defineProps<{ label: string; required?: boolean; hint?: string; error?: string; status?: string; for?: string }>(), {
  required: false,
})
</script>

<template>
  <label class="field">
    <span class="field__label">
      {{ label }}
      <span v-if="required" class="field__required" aria-hidden="true">*</span>
    </span>
    <slot />
    <p v-if="error" class="field__error" role="alert">{{ error }}</p>
    <p v-else-if="status" class="field__status" role="status">{{ status }}</p>
    <p v-else-if="hint" class="field__hint">{{ hint }}</p>
  </label>
</template>
