<script setup lang="ts">
import { computed, ref } from 'vue'

import AppButton from '@/components/base/AppButton.vue'
import AppIcon from '@/components/base/AppIcon.vue'
import AppInput from '@/components/base/AppInput.vue'
import { useSessionStore } from '@/app/stores/session'
import { login } from '@/services/api/auth'
import { errorMessage } from '@/services/api/errors'

const session = useSessionStore()

const email = ref('')
const password = ref('')
const busy = ref(false)
const failure = ref('')

/** The Desk login stays reachable: OTP and email-link sign-in live there. */
const deskLoginUrl = computed(() => {
  const target = `${window.location.pathname}${window.location.search}`
  return `${window.location.origin}/login?redirect-to=${encodeURIComponent(target)}`
})

async function signIn(): Promise<void> {
  if (busy.value) return
  busy.value = true
  failure.value = ''
  try {
    await login({ email: email.value, password: password.value })
    // The backend answered with a session cookie: re-read the context so the shell
    // renders the screen the operator was on instead of this gate.
    await session.load(true)
    if (session.isSignedOut) failure.value = 'لم تُثبَّت الجلسة بعد الدخول. أعد المحاولة.'
  } catch (error) {
    failure.value = errorMessage(error, 'تعذر إتمام تسجيل الدخول. حاول مرة أخرى.')
  } finally {
    busy.value = false
  }
}

function openDeskLogin(): void {
  window.location.assign(deskLoginUrl.value)
}

function retry(): void {
  void session.load(true)
}
</script>

<template>
  <div class="session-gate state state--error" role="alert" data-testid="session-gate">
    <span class="state__glyph"><AppIcon name="alert" size="lg" /></span>
    <h2>{{ session.isUnreachable ? 'تعذر الوصول إلى الخادم' : 'انتهت جلسة الدخول' }}</h2>
    <p v-if="session.isUnreachable">لم يستجب الخادم للطلب. تحقق من الشبكة أو من حالة الخدمة ثم أعد المحاولة.</p>
    <p v-else>
      سجّل الدخول مرة أخرى للمتابعة؛ ستعود إلى نفس الشاشة بعد الدخول. لم يُنفَّذ أي إجراء على البيانات.
    </p>

    <form v-if="!session.isUnreachable" class="session-gate__form" @submit.prevent="signIn">
      <label class="session-gate__field">
        <span>البريد الإلكتروني</span>
        <AppInput
          v-model="email"
          type="email"
          autocomplete="username"
          :disabled="busy"
          placeholder="name@example.com"
        />
      </label>
      <label class="session-gate__field">
        <span>كلمة المرور</span>
        <AppInput v-model="password" type="password" autocomplete="current-password" :disabled="busy" />
      </label>
      <p v-if="failure" class="session-gate__failure" role="alert" data-testid="session-gate-error">
        {{ failure }}
      </p>
      <div class="state__actions">
        <AppButton type="submit" variant="primary" icon="check" :busy="busy">تسجيل الدخول</AppButton>
        <AppButton variant="secondary" icon="external" :disabled="busy" @click="openDeskLogin">
          الدخول عبر صفحة النظام
        </AppButton>
      </div>
    </form>

    <div v-else class="state__actions">
      <AppButton variant="secondary" icon="refresh" @click="retry">إعادة المحاولة</AppButton>
    </div>
  </div>
</template>
