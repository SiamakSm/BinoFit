<script setup lang="ts">
import { Compass, Map as MapIcon, MessageCircle, User } from 'lucide-vue-next'

/** Onglets de la barre du bas. « Mes activités » s'ouvre depuis Profil. */
const tabs = [
  { to: '/decouvrir', label: 'Découvrir', icon: Compass },
  { to: '/carte', label: 'Carte', icon: MapIcon },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/profil', label: 'Profil', icon: User },
]
</script>

<template>
  <nav class="tabbar" aria-label="Navigation principale">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="tabbar__item"
      active-class="is-active"
    >
      <component :is="tab.icon" :size="22" :stroke-width="2" aria-hidden="true" />
      <span>{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10;
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: calc(68px + env(safe-area-inset-bottom, 0px));
  padding: 8px 8px env(safe-area-inset-bottom, 0px);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.tabbar__item {
  flex: 1;
  max-width: 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 0;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.15s ease;
}

.tabbar__item.is-active {
  color: var(--color-lime);
}
</style>
