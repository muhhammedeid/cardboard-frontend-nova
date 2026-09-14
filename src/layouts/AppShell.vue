<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import AppIcon from '@/components/base/AppIcon.vue'
import AppDrawer from '@/components/feedback/AppDrawer.vue'
import SessionGate from '@/features/shared/SessionGate.vue'
import AppSidebar from '@/components/navigation/AppSidebar.vue'
import TopBar from '@/components/navigation/TopBar.vue'
import { mobileMenu, isAreaActive } from '@/app/navigation/menu'
import { useNavigationStore } from '@/app/stores/navigation'
import { useSessionStore } from '@/app/stores/session'
import { findReportDefinition } from '@/features/reports/report-registry'

const route = useRoute()
const navigation = useNavigationStore()
const session = useSessionStore()

/** Report routes own their title/description in the registry, so the shell
 *  header and the rendered report can never drift apart. */
const activeReport = computed(() => (route.name === 'report-detail' ? findReportDefinition(String(route.params.reportKey)) : undefined))
const pageTitle = computed(() => activeReport.value?.title ?? String(route.meta.label ?? 'إدارة الكرتون'))
const pageSubtitle = computed(() => activeReport.value?.description ?? (route.meta.subtitle ? String(route.meta.subtitle) : ''))
/** A signed-out session or an unreachable server blocks every operational screen. */
const blocked = computed(() => session.isSignedOut || session.isUnreachable)

onMounted(() => {
  void session.load()
})
</script>

<template>
  <SessionGate v-if="blocked" />

  <div v-else class="app-shell" :data-collapsed="navigation.railCollapsed ? 'true' : 'false'" data-testid="app-shell">
    <AppSidebar />

    <main class="app-main">
      <TopBar :title="pageTitle" :subtitle="pageSubtitle" show-menu-button @open-drawer="navigation.openDrawer()" />

      <div class="app-content">
        <div class="app-content__inner">
          <RouterView v-slot="{ Component }">
            <component :is="Component" />
          </RouterView>
        </div>
      </div>

      <nav class="app-mobile-bar" aria-label="اختصارات سريعة">
        <RouterLink
          v-for="item in mobileMenu"
          :key="item.area"
          class="mobile-bar__item"
          :to="item.to"
          :aria-current="isAreaActive(route.path, item) ? 'page' : undefined"
        >
          <AppIcon :name="item.icon" size="md" />
          {{ item.label }}
        </RouterLink>
      </nav>
    </main>

    <AppDrawer v-model:open="navigation.drawerOpen" title="التنقل الرئيسي">
      <AppSidebar variant="drawer" @navigate="navigation.closeDrawer()" />
    </AppDrawer>
  </div>
</template>
