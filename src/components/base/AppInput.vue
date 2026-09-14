<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string | number | undefined
    type?: 'text' | 'date' | 'number' | 'search' | 'email' | 'tel'
    placeholder?: string
    min?: string | number
    step?: string | number
    disabled?: boolean
    readonly?: boolean
    invalid?: boolean
    autocomplete?: string
    inputmode?: 'text' | 'numeric' | 'decimal'
  }>(),
  { type: 'text', disabled: false, readonly: false, invalid: false },
)

defineEmits<{ (event: 'update:modelValue', value: string | number): void; (event: 'enter'): void }>()
</script>

<template>
  <input
    class="input"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :min="min"
    :step="step"
    :disabled="disabled"
    :readonly="readonly"
    :autocomplete="autocomplete"
    :inputmode="inputmode"
    :aria-invalid="invalid ? 'true' : undefined"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    @keyup.enter="$emit('enter')"
  />
</template>
