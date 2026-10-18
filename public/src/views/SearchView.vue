<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import AthleteCard from '../components/AthleteCard.vue'
import { api } from '../services/api'
import { DAYS, DAY_LABELS, LEVEL_LABELS, SPORT_LABELS } from '../services/labels'
import { centerOf } from '../services/location'
import { fetchUser } from '../services/users'
import type { DayOfWeek, Level, Sport, User, UserSearchResult } from '../types/api'

const RADIUS_OPTIONS = [1, 3, 5, 10]
const SPORTS = Object.keys(SPORT_LABELS) as Sport[]
const LEVELS = Object.keys(LEVEL_LABELS) as Level[]

const router = useRouter()
const { user } = useAuth()

const me = ref<User | null>(null)
const maxKm = ref(10)
const sport = ref<Sport | null>(null)
const level = ref<Level | null>(null)
const availability = ref<DayOfWeek | null>(null)

const results = ref<UserSearchResult[]>([])
const loading = ref(true)
const errorMessage = ref('')
let requestId = 0

const hasFilters = computed(
  () => maxKm.value !== 10 || sport.value !== null || level.value !== null || availability.value !== null,
)

function resetFilters() {
  maxKm.value = 10
  sport.value = null
  level.value = null
  availability.value = null
}

async function search() {
  const id = ++requestId
  loading.value = true
  errorMessage.value = ''
  try {
    const center = centerOf(me.value)
    const list = await api.searchUsers({
      lat: center.lat,
      lng: center.lng,
      maxKm: maxKm.value,
      sport: sport.value ?? undefined,
      level: sport.value ? (level.value ?? undefined) : undefined,
      availability: availability.value ?? undefined,
    })
    if (id !== requestId) return
    const uid = user.value?.uid
    results.value = list.filter((p) => p.id !== uid)
  } catch (error) {
    if (id !== requestId) return
    errorMessage.value =
      error instanceof Error ? error.message : 'Impossible de lancer la recherche.'
  } finally {
    if (id === requestId) loading.value = false
  }
}

// Le niveau n'a de sens que pour un sport donné.
watch(sport, (value) => {
  if (!value) level.value = null
})

watch([maxKm, sport, level, availability], search)

onMounted(async () => {
  me.value = user.value?.uid ? await fetchUser(user.value.uid) : null
  await search()
})
</script>

<template>
  <div class="screen">
    <div class="screen__inner">
      <div class="search__top">
        <button type="button" class="icon-btn" aria-label="Retour" @click="router.back()">
          <ArrowLeft :size="18" aria-hidden="true" />
        </button>
        <button
          v-if="hasFilters"
          type="button"
          class="btn-link"
          @click="resetFilters"
        >
          Réinitialiser
        </button>
      </div>

      <div class="header-block">
        <h1>Rechercher</h1>
        <p>Les sportifs près de toi, filtrés comme tu veux.</p>
      </div>

      <section class="filter">
        <h2 class="filter__title">Distance</h2>
        <div class="chips" role="radiogroup" aria-label="Distance">
          <button
            v-for="km in RADIUS_OPTIONS"
            :key="km"
            type="button"
            class="chip"
            :class="{ 'is-active': maxKm === km }"
            :aria-checked="maxKm === km"
            role="radio"
            @click="maxKm = km"
          >
            {{ km }} km
          </button>
        </div>
      </section>

      <section class="filter">
        <h2 class="filter__title">Sport</h2>
        <div class="chips chips--scroll" role="radiogroup" aria-label="Sport">
          <button
            type="button"
            class="chip"
            :class="{ 'is-active': sport === null }"
            :aria-checked="sport === null"
            role="radio"
            @click="sport = null"
          >
            Tous
          </button>
          <button
            v-for="s in SPORTS"
            :key="s"
            type="button"
            class="chip"
            :class="{ 'is-active': sport === s }"
            :aria-checked="sport === s"
            role="radio"
            @click="sport = s"
          >
            {{ SPORT_LABELS[s] }}
          </button>
        </div>
      </section>

      <section class="filter">
        <h2 class="filter__title">Niveau</h2>
        <div class="chips" role="radiogroup" aria-label="Niveau">
          <button
            v-for="l in LEVELS"
            :key="l"
            type="button"
            class="chip"
            :class="{ 'is-active': level === l }"
            :aria-checked="level === l"
            :disabled="!sport"
            role="radio"
            @click="level = level === l ? null : l"
          >
            {{ LEVEL_LABELS[l] }}
          </button>
        </div>
        <p v-if="!sport" class="field-hint">Choisis un sport pour filtrer par niveau.</p>
      </section>

      <section class="filter">
        <h2 class="filter__title">Disponibilité</h2>
        <div class="chips chips--scroll" role="radiogroup" aria-label="Disponibilité">
          <button
            v-for="d in DAYS"
            :key="d"
            type="button"
            class="chip"
            :class="{ 'is-active': availability === d }"
            :aria-checked="availability === d"
            role="radio"
            @click="availability = availability === d ? null : d"
          >
            {{ DAY_LABELS[d] }}
          </button>
        </div>
      </section>

      <div v-if="loading" class="state">
        <span class="spinner spinner--muted" aria-hidden="true"></span>
        <span>Recherche en cours…</span>
      </div>

      <div v-else-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>

      <p v-else-if="results.length === 0" class="state">
        Aucun sportif ne correspond à ces filtres.
      </p>

      <template v-else>
        <p class="field-hint">{{ results.length }} sportif{{ results.length > 1 ? 's' : '' }}</p>
        <ul class="athlete-list">
          <AthleteCard v-for="p in results" :key="p.id" :profile="p" />
        </ul>
      </template>
    </div>
  </div>
</template>

<style scoped>
.search__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter__title {
  font-size: 15px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chips--scroll {
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  margin: 0 -20px;
  padding: 0 20px;
}

.chips--scroll::-webkit-scrollbar {
  display: none;
}

.chip {
  flex-shrink: 0;
  border: 1.5px solid var(--color-border);
  background: var(--color-surface-2);
  color: var(--color-text-muted);
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background 0.15s ease;
}

.chip:hover:not(:disabled) {
  border-color: var(--color-lime);
}

.chip.is-active {
  background: var(--color-lime);
  border-color: var(--color-lime);
  color: #0a0a0a;
}

.chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 0;
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
