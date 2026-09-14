<script setup lang="ts">
import AppErrorBoundary from '@/components/feedback/AppErrorBoundary.vue'
import AppShell from '@/layouts/AppShell.vue'
import ToastHost from '@/components/feedback/ToastHost.vue'
</script>

<template>
  <AppErrorBoundary>
    <AppShell />
  </AppErrorBoundary>
  <ToastHost />
</template>
