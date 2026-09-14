<script setup lang="ts">
import AppButton from '@/components/base/AppButton.vue'
import PageHeader from '@/components/data/PageHeader.vue'
import NotFoundState from '@/components/feedback/NotFoundState.vue'
</script>

<template>
  <section class="stack">
    <PageHeader title="صفحة غير موجودة" eyebrow="تنقل" icon="search" />
    <NotFoundState message="المسار المطلوب غير معروف في هذه الواجهة. استخدم التنقل الجانبي للوصول إلى الشاشات المتاحة." />
    <div class="row">
      <AppButton variant="primary" icon="home" @click="$router.push('/')">العودة إلى الرئيسية</AppButton>
    </div>
  </section>
</template>
