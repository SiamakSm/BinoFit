<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { CalendarDays, Plus, Trash2 } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth'
import { api, ApiError } from '../services/api'
import { getProfileByEmail } from '../services/profileStore'
import { DAYS, DAY_LABELS, LEVEL_LABELS, SPORT_LABELS } from '../services/labels'
import { SEARCH_ZONES, nearestZone } from '../services/location'
import { fetchUser } from '../services/users'
import type { AvailabilitySlot, DayOfWeek, Level, Sport, User, UserUpdate } from '../types/api'

const router = useRouter()
const { user, logout } = useAuth()

const SPORTS = Object.keys(SPORT_LABELS) as Sport[]
const LEVELS = Object.keys(LEVEL_LABELS) as Level[]

const me = ref<User | null>(null)
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const saveError = ref('')
const saved = ref(false)

const firstName = ref('')
const lastName = ref('')
const bio = ref('')
const zoneIndex = ref(0)
const availability = ref<AvailabilitySlot[]>([])
const sportRows = reactive<Record<string, { on: boolean; level: Level }>>({})

const initialsText = computed(() => {
  const f = firstName.value.trim()[0] ?? ''
  const l = lastName.value.trim()[0] ?? ''
  return `${f}${l}`.toUpperCase() || '?'
})

function fillForm(profile: User | null) {
  const localProfile = user.value?.email ? getProfileByEmail(user.value.email) : null
  firstName.value = profile?.firstName ?? localProfile?.prenom ?? ''
  lastName.value = profile?.lastName ?? localProfile?.nom ?? ''
  bio.value = profile?.bio ?? ''
  zoneIndex.value = Math.max(0, SEARCH_ZONES.indexOf(nearestZone(profile?.location)))
  availability.value = profile?.availability.map((s) => ({ ...s })) ?? []

  for (const s of SPORTS) sportRows[s] = { on: false, level: 'intermediaire' }
  for (const practice of profile?.sports ?? []) {
    sportRows[practice.sport] = { on: true, level: practice.level }
  }
}

onMounted(async () => {
  try {
    me.value = user.value?.uid ? await fetchUser(user.value.uid) : null
    fillForm(me.value)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Impossible de charger ton profil.'
  } finally {
    loading.value = false
  }
})

function addSlot() {
  availability.value.push({ dayOfWeek: 'lundi', startTime: '18:00', endTime: '20:00' })
}

function removeSlot(index: number) {
  availability.value.splice(index, 1)
}

function setDay(index: number, day: DayOfWeek) {
  const slot = availability.value[index]
  if (slot) slot.dayOfWeek = day
}

async function save() {
  saveError.value = ''
  saved.value = false
  if (!user.value?.uid) return
  if (!firstName.value.trim() || !lastName.value.trim()) {
    saveError.value = 'Prénom et nom sont obligatoires.'
    return
  }
  const badSlot = availability.value.find((s) => s.startTime >= s.endTime)
  if (badSlot) {
    saveError.value = 'Chaque disponibilité doit finir après son début.'
    return
  }

  const zone = SEARCH_ZONES[zoneIndex.value] ?? SEARCH_ZONES[0]!
  const payload: UserUpdate = {
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    bio: bio.value.trim() || null,
    location: zone.location,
    sports: SPORTS.filter((s) => sportRows[s]?.on).map((s) => ({
      sport: s,
      level: sportRows[s]!.level,
    })),
    availability: availability.value,
  }

  saving.value = true
  try {
    me.value = await api.updateUser(user.value.uid, payload)
    saved.value = true
  } catch (error) {
    saveError.value = error instanceof ApiError ? error.message : 'Enregistrement impossible.'
  } finally {
    saving.value = false
  }
}

async function onLogout() {
  await logout()
  router.replace('/connexion')
}
</script>

<template>
  <div class="screen">
    <div class="screen__inner">
      <div class="top-bar">
        <div class="brand">
          <div class="brand__mark">B</div>
          <div class="brand__name">BINO<span>FIT</span></div>
        </div>
        <button type="button" class="btn-link" @click="onLogout">Se déconnecter</button>
      </div>

      <div v-if="loading" class="state">
        <span class="spinner spinner--muted" aria-hidden="true"></span>
        <span>Chargement…</span>
      </div>

      <div v-else-if="loadError" class="alert alert-error">{{ loadError }}</div>

      <template v-else>
        <section class="profile-hero">
          <div class="avatar">
            <img v-if="me?.avatarUrl" :src="me.avatarUrl" :alt="firstName" />
            <template v-else>{{ initialsText }}</template>
          </div>
          <h1>{{ firstName || 'Mon profil' }} {{ lastName }}</h1>
          <p v-if="!me" class="field-hint">
            Ton profil n'est pas encore dans BINOFIT : enregistre-le pour apparaître dans les recherches.
          </p>
        </section>

        <RouterLink :to="{ name: 'activities' }" class="activities-link">
          <CalendarDays :size="18" aria-hidden="true" />
          <span>Mes activités</span>
        </RouterLink>

        <form @submit.prevent="save">
          <div class="form-row--split">
            <div class="form-row">
              <label for="firstName">Prénom</label>
              <input id="firstName" v-model="firstName" type="text" maxlength="60" required />
            </div>
            <div class="form-row">
              <label for="lastName">Nom</label>
              <input id="lastName" v-model="lastName" type="text" maxlength="60" required />
            </div>
          </div>

          <div class="form-row">
            <label for="bio">Bio</label>
            <textarea id="bio" v-model="bio" rows="3" maxlength="300" placeholder="Quelques mots sur toi"></textarea>
          </div>

          <div class="form-row">
            <label for="zone">Zone de recherche</label>
            <select id="zone" v-model="zoneIndex">
              <option v-for="(z, i) in SEARCH_ZONES" :key="z.label" :value="i">{{ z.label }}</option>
            </select>
          </div>

          <fieldset class="block">
            <legend>Sports pratiqués</legend>
            <div v-for="s in SPORTS" :key="s" class="sport-row" :class="{ 'is-on': sportRows[s]?.on }">
              <label class="sport-row__check">
                <input v-model="sportRows[s]!.on" type="checkbox" />
                <span>{{ SPORT_LABELS[s] }}</span>
              </label>
              <select
                v-if="sportRows[s]?.on"
                v-model="sportRows[s]!.level"
                :aria-label="`Niveau en ${SPORT_LABELS[s]}`"
              >
                <option v-for="l in LEVELS" :key="l" :value="l">{{ LEVEL_LABELS[l] }}</option>
              </select>
            </div>
          </fieldset>

          <fieldset class="block">
            <legend>Disponibilités</legend>
            <p v-if="availability.length === 0" class="field-hint">Aucune disponibilité ajoutée.</p>
            <div v-for="(slot, i) in availability" :key="i" class="slot">
              <select :value="slot.dayOfWeek" aria-label="Jour" @change="setDay(i, ($event.target as HTMLSelectElement).value as DayOfWeek)">
                <option v-for="d in DAYS" :key="d" :value="d">{{ DAY_LABELS[d] }}</option>
              </select>
              <input v-model="slot.startTime" type="time" aria-label="Début" />
              <input v-model="slot.endTime" type="time" aria-label="Fin" />
              <button type="button" class="icon-btn" aria-label="Supprimer" @click="removeSlot(i)">
                <Trash2 :size="16" aria-hidden="true" />
              </button>
            </div>
            <button type="button" class="btn btn-secondary add-slot" @click="addSlot">
              <Plus :size="16" aria-hidden="true" />
              Ajouter un créneau
            </button>
          </fieldset>

          <p v-if="saveError" class="alert alert-error">{{ saveError }}</p>
          <p v-if="saved" class="alert alert-success">Profil enregistré.</p>

          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 0;
  color: var(--color-text-muted);
  font-size: 14px;
}

.activities-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-weight: 700;
  text-decoration: none;
}

.activities-link svg {
  color: var(--color-lime);
}

textarea {
  appearance: none;
  width: 100%;
  background: var(--color-surface-2);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: 16px;
  padding: 13px 14px;
  font-family: inherit;
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: var(--color-lime);
  box-shadow: 0 0 0 3px var(--color-lime-soft);
}

.block {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  min-width: 0;
}

.block legend {
  font-size: 15px;
  font-weight: 800;
  color: var(--color-text);
  padding: 0 4px;
}

.sport-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
}

.sport-row__check {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.sport-row__check input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-lime);
}

.sport-row select {
  width: auto;
  padding: 8px 32px 8px 12px;
  font-size: 14px;
}

.slot {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr auto;
  gap: 6px;
  align-items: center;
}

.slot select,
.slot input {
  padding: 10px 8px;
  font-size: 14px;
  min-width: 0;
}

.slot .icon-btn {
  width: 36px;
  height: 36px;
}

.add-slot {
  width: 100%;
}

.add-slot svg {
  margin-right: 0;
}
</style>
