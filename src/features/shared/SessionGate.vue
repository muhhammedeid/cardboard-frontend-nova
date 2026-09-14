<script setup lang="ts">
import { computed } from 'vue'

import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import { useSessionStore } from '@/app/stores/session'

const session = useSessionStore()

/** The Desk login lives on the same origin; come back to the same screen after. */
const loginUrl = computed(() => {
  const target = `${window.location.pathname}${window.location.search}`
  return `${window.location.origin}/login?redirect-to=${encodeURIComponent(target)}`
})

function signIn(): void {
  window.location.assign(loginUrl.value)
}

function retry(): void {
  void session.load(true)
}
</script>

<template>
  <div class="session-gate state state--error" role="alert" data-testid="session-gate">
    <span class="state__glyph"><AppIcon name="alert" size="lg" /></span>
    <h2>{{ session.isSignedOut ? 'انتهت جلسة الدخول' : 'تعذر الوصول إلى الخادم' }}</h2>
    <p v-if="session.isSignedOut">
      سجّل الدخول مرة أخرى للمتابعة؛ ستعود إلى نفس الشاشة بعد الدخول. لم يُنفَّذ أي إجراء على البيانات.
    </p>
    <p v-else>لم يستجب الخادم للطلب. تحقق من الشبكة أو من حالة الخدمة ثم أعد المحاولة.</p>
    <div class="state__actions">
      <AppButton v-if="session.isSignedOut" variant="primary" icon="check" @click="signIn">تسجيل الدخول</AppButton>
      <AppButton v-else variant="secondary" icon="refresh" @click="retry">إعادة المحاولة</AppButton>
    </div>
  </div>
</template>
