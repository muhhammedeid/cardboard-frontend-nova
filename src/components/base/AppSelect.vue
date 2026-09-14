<script setup lang="ts">
export interface SelectOption {
  value: string
  label: string
  /** Mirrors the server flag so an unavailable choice is visible before clicking. */
  disabled?: boolean
}

withDefaults(
  defineProps<{
    modelValue: string | number | undefined
    options: readonly SelectOption[]
    placeholder?: string
    disabled?: boolean
    invalid?: boolean
    busy?: boolean
  }>(),
  { disabled: false, invalid: false, busy: false },
)

defineEmits<{ (event: 'update:modelValue', value: string): void }>()
</script>

<template>
  <select
    class="select"
    :value="modelValue"
    :disabled="disabled || busy"
    :aria-busy="busy || undefined"
    :aria-invalid="invalid ? 'true' : undefined"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
  >
    <option v-if="placeholder !== undefined" value="">{{ placeholder }}</option>
    <option v-for="option in options" :key="option.value" :value="option.value" :disabled="option.disabled">
      {{ option.label }}
    </option>
  </select>
</template>
