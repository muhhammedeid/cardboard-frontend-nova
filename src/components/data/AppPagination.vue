<script setup lang="ts">
import { computed } from 'vue'

import AppButton from '@/components/base/AppButton.vue'
import BidiValue from '@/components/base/BidiValue.vue'

const props = defineProps<{ page: number; pageSize: number; total: number; hasMore: boolean; busy?: boolean }>()
const emit = defineEmits<{ (event: 'change', page: number): void }>()

const from = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const to = computed(() => Math.min(props.page * props.pageSize, props.total))
</script>

<template>
  <nav class="pagination" aria-label="ترقيم الصفحات">
    <p>
      عرض <BidiValue :value="`${from}–${to}`" /> من <BidiValue :value="total" />
      <span class="faint" v-if="total">
        · صفحة <BidiValue :value="page" />
      </span>
    </p>
    <div class="pagination__controls">
      <AppButton size="sm" icon="chevronRight" :disabled="busy || page <= 1" @click="emit('change', page - 1)">السابق</AppButton>
      <AppButton size="sm" :disabled="busy || !hasMore" @click="emit('change', page + 1)">
        التالي
      </AppButton>
    </div>
  </nav>
</template>
