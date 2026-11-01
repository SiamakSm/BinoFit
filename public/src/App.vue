<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import { useAuth } from './composables/useAuth'
import { useUnread } from './composables/useUnread'

const route = useRoute()
const showNav = computed(() => route.meta.tab === true)

// Surveille les nouveaux messages tant que l'utilisateur est connecté (quel que soit l'écran).
const { user } = useAuth()
const { startUnreadPolling, stopUnreadPolling } = useUnread()
watch(
  () => user.value?.uid,
  (uid) => (uid ? startUnreadPolling() : stopUnreadPolling()),
  { immediate: true },
)
</script>

<template>
  <div :class="{ 'has-tabbar': showNav }">
    <router-view />
    <BottomNav v-if="showNav" />
  </div>
</template>

<style scoped>
.has-tabbar {
  min-height: 100svh;
  padding-bottom: calc(96px + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 1024px) {
  .has-tabbar {
    padding-top: 96px;
    padding-bottom: 0;
  }
}
</style>
