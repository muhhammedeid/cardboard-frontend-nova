<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'

/**
 * One broken screen must not take the whole shell down. `onErrorCaptured` keeps
 * the failure local and offers a reload, so an operator never meets a blank page.
 */
const failure = ref('')

onErrorCaptured((error) => {
  failure.value = error instanceof Error ? error.message : String(error)
  return false
})

function reload(): void {
  window.location.reload()
}
</script>

<template>
  <div v-if="failure" class="state state--error" role="alert" data-testid="app-error-boundary">
    <span class="state__glyph"><AppIcon name="alert" size="lg" /></span>
    <h2>عطل غير متوقع في هذه الشاشة</h2>
    <p>تعذر عرض المحتوى. لم يُنفَّذ أي إجراء على البيانات؛ أعد تحميل الصفحة للمتابعة.</p>
    <div class="state__actions">
      <AppButton variant="secondary" icon="refresh" @click="reload">إعادة تحميل الصفحة</AppButton>
    </div>
  </div>
  <slot v-else />
</template>
