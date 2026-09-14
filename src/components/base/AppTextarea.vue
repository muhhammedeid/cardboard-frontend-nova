<script setup lang="ts">
withDefaults(defineProps<{ modelValue: string | undefined; rows?: number; placeholder?: string; disabled?: boolean }>(), {
  rows: 4,
  disabled: false,
})

defineEmits<{ (event: 'update:modelValue', value: string): void }>()
</script>

<template>
  <textarea
    class="textarea"
    :value="modelValue"
    :rows="rows"
    :placeholder="placeholder"
    :disabled="disabled"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
