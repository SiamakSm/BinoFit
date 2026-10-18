<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { RouterLink } from 'vue-router'
import { LEVEL_LABELS, SPORT_LABELS } from '../services/labels'
import { formatDistance, initials } from '../services/format'
import type { UserSearchResult } from '../types/api'

defineProps<{ profile: UserSearchResult }>()
</script>

<template>
  <li class="athlete-card">
    <div class="athlete-card__top">
      <div class="avatar athlete-card__avatar">
        <img v-if="profile.avatarUrl" :src="profile.avatarUrl" :alt="profile.firstName" />
        <template v-else>{{ initials(profile.firstName, profile.lastName) }}</template>
      </div>
      <div class="athlete-card__who">
        <h2>{{ profile.firstName }}</h2>
        <div class="athlete-card__sports">
          <span v-if="profile.sports[0]" class="pill">
            {{ SPORT_LABELS[profile.sports[0].sport] }} · {{ LEVEL_LABELS[profile.sports[0].level] }}
          </span>
          <span v-if="profile.sports.length > 1" class="athlete-card__more">
            +{{ profile.sports.length - 1 }}
          </span>
        </div>
      </div>
      <div class="athlete-card__distance">
        <strong>{{ formatDistance(profile.distanceKm) }}</strong>
      </div>
    </div>
    <Button as-child variant="outline"><RouterLink :to="{ name: 'athlete', params: { id: profile.id } }">
      Voir le profil
    </RouterLink></Button>
  </li>
</template>

<style scoped>
.athlete-card {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
}

.athlete-card__top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.athlete-card__avatar {
  width: 56px;
  height: 56px;
  font-size: 18px;
  flex-shrink: 0;
  overflow: hidden;
  border: none;
}

.athlete-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.athlete-card__who {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.athlete-card__who h2 {
  font-size: 17px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.athlete-card__sports {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.athlete-card__sports .pill {
  font-size: 12px;
  padding: 4px 10px;
}

.athlete-card__more {
  color: var(--color-text-muted);
  font-size: 12px;
  font-weight: 600;
}

.athlete-card__distance {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.athlete-card__distance strong {
  color: var(--color-lime);
  font-size: 20px;
  font-weight: 800;
  white-space: nowrap;
}

.athlete-card > a {
  text-decoration: none;
}
</style>
