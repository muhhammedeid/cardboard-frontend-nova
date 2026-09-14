<script setup lang="ts">
withDefaults(defineProps<{ title?: string; description?: string; accent?: boolean; flush?: boolean; plain?: boolean }>(), {
  accent: false,
  flush: false,
  plain: false,
})
</script>

<template>
  <section class="panel" :class="[accent ? 'panel--accent' : '', flush ? 'panel--flush' : '', plain ? 'panel--plain' : '']">
    <header v-if="title || $slots.actions || $slots.heading" class="panel__head">
      <div class="panel__heading">
        <slot name="heading">
          <h2 v-if="title">{{ title }}</h2>
          <p v-if="description">{{ description }}</p>
        </slot>
      </div>
      <div v-if="$slots.actions" class="btn-group"><slot name="actions" /></div>
    </header>
    <div class="panel__body"><slot /></div>
    <footer v-if="$slots.footer" class="panel__foot"><slot name="footer" /></footer>
  </section>
</template>
