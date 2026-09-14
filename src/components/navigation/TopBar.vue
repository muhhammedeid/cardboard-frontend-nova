<script setup lang="ts">
import { computed } from 'vue'

import AppIcon from '@/components/base/AppIcon.vue'
import ContextChip from '@/components/data/ContextChip.vue'
import QuickCreateMenu from './QuickCreateMenu.vue'
import AccountMenu from './AccountMenu.vue'
import ThemeToggle from './ThemeToggle.vue'
import { useContextStore } from '@/app/stores/context'

const props = defineProps<{ title: string; subtitle?: string; showMenuButton?: boolean }>()
const emit = defineEmits<{ (event: 'open-drawer'): void }>()

const context = useContextStore()
void context.load()

const contextLabel = computed(() => context.label)
</script>

<template>
  <header class="app-topbar">
    <div class="app-topbar__title">
      <div class="row">
        <button v-if="props.showMenuButton" class="btn btn--secondary btn--icon app-mobile-only" type="button" aria-label="فتح القائمة" @click="emit('open-drawer')">
          <AppIcon name="menu" size="md" />
        </button>
        <div>
          <h1>{{ title }}</h1>
          <p v-if="subtitle">{{ subtitle }}</p>
        </div>
      </div>
    </div>
    <div class="app-topbar__actions">
      <ContextChip v-if="contextLabel" class="app-desktop-only" :label="contextLabel" />
      <QuickCreateMenu />
      <ThemeToggle />
      <AccountMenu />
    </div>
  </header>
</template>
