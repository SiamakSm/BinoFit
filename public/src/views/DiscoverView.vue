<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { MapPin, SlidersHorizontal } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import AthleteCard from '../components/AthleteCard.vue'
import { api } from '../services/api'
import { DEFAULT_RADIUS_KM, centerOf } from '../services/location'
import { fetchUser } from '../services/users'
import type { User, UserSearchResult } from '../types/api'

const { user } = useAuth()
const me = ref<User | null>(null)
const profiles = ref<UserSearchResult[]>([])
const loading = ref(true)
const errorMessage = ref('')

const greetingName = computed(
  () => me.value?.firstName ?? user.value?.email?.split('@')[0] ?? '',
)

async function load() {
  loading.value = true
  errorMessage.value = ''
  try {
    const uid = user.value?.uid
    me.value = uid ? await fetchUser(uid) : null
    const center = centerOf(me.value)
    const results = await api.searchUsers({
      lat: center.lat,
      lng: center.lng,
      maxKm: DEFAULT_RADIUS_KM,
    })
    profiles.value = results.filter((p) => p.id !== uid)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Impossible de charger les sportifs.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="screen">
    <div class="screen__inner">
      <header class="discover__head">
        <div class="brand">
          <div class="brand__mark">B</div>
          <div class="brand__name">BINO<span>FIT</span></div>
        </div>
        <div class="header-block">
          <h1>Salut {{ greetingName }} !</h1>
          <p>Des sportifs près de toi, prêts à bouger.</p>
        </div>
        <div class="discover__filters">
          <span class="pill">
            <MapPin :size="14" aria-hidden="true" />
            Rayon : {{ DEFAULT_RADIUS_KM }} km
          </span>
          <RouterLink :to="{ name: 'recherche' }" class="discover__filter-link">
            <SlidersHorizontal :size="14" aria-hidden="true" />
            Filtrer
          </RouterLink>
        </div>
        <p v-if="!me && !loading" class="field-hint">
          Ton profil n'est pas encore enregistré : recherche autour de Lyon.
        </p>
      </header>

      <div v-if="loading" class="state">
        <span class="spinner spinner--muted" aria-hidden="true"></span>
        <span>Recherche des sportifs…</span>
      </div>

      <div v-else-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
        <button type="button" class="btn-link" @click="load">Réessayer</button>
      </div>

      <p v-else-if="profiles.length === 0" class="state">
        Personne dans ce rayon pour l'instant.
      </p>

      <ul v-else class="athlete-list">
        <AthleteCard v-for="p in profiles" :key="p.id" :profile="p" />
      </ul>
    </div>
  </div>
</template>

<style scoped>
.discover__head {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.discover__filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.discover__filter-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-lime);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px 0;
  color: var(--color-text-muted);
  font-size: 14px;
  text-align: center;
}

.athlete-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
