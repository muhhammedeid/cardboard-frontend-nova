<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppIcon from '@/components/base/AppIcon.vue'
import { isAreaActive, menuGroups, settingsMenu } from '@/app/navigation/menu'

const props = withDefaults(defineProps<{ variant?: 'rail' | 'drawer' }>(), { variant: 'rail' })
const emit = defineEmits<{ (event: 'navigate'): void }>()

const route = useRoute()
const settingsActive = computed(() => isAreaActive(route.path, settingsMenu))
</script>

<template>
  <nav class="app-rail" :data-variant="props.variant" aria-label="التنقل الرئيسي">
    <div class="app-rail__brand">
      <span class="app-rail__mark" aria-hidden="true"><AppIcon name="layers" size="lg" /></span>
      <span class="app-rail__identity">
        <strong>إدارة الكرتون</strong>
        <span>تشغيل التوريد والمخزون</span>
      </span>
    </div>

    <div class="app-rail__scroll">
      <div v-for="group in menuGroups" :key="group.key" class="app-rail__group">
        <p class="app-rail__group-label">{{ group.label }}</p>
        <RouterLink
          v-for="item in group.items"
          :key="item.area"
          class="app-rail__link"
          :to="item.to"
          :data-area="item.area"
          :aria-current="isAreaActive(route.path, item) ? 'page' : undefined"
          @click="emit('navigate')"
        >
          <AppIcon :name="item.icon" size="md" />
          <span class="app-rail__label">{{ item.label }}</span>
        </RouterLink>
      </div>
    </div>

    <div class="app-rail__footer">
      <RouterLink
        class="app-rail__link"
        :to="settingsMenu.to"
        :data-area="settingsMenu.area"
        :aria-current="settingsActive ? 'page' : undefined"
        @click="emit('navigate')"
      >
        <AppIcon :name="settingsMenu.icon" size="md" />
        <span class="app-rail__label">{{ settingsMenu.label }}</span>
      </RouterLink>
    </div>
  </nav>
</template>
