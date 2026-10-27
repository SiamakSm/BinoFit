<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import AthleteCard from '../components/AthleteCard.vue'
import { useAuth } from '../composables/useAuth'
import { api } from '../services/api'
import { initials } from '../services/format'
import { DEFAULT_RADIUS_KM, centerOf } from '../services/location'
import { fetchUser } from '../services/users'
import type { UserSearchResult } from '../types/api'

const { user } = useAuth()

const mapEl = ref<HTMLElement | null>(null)
const selected = ref<UserSearchResult | null>(null)
const loading = ref(true)
const errorMessage = ref('')
let map: L.Map | null = null

function pinIcon(p: UserSearchResult) {
  return L.divIcon({
    className: 'binofit-pin-wrap',
    html: `<div class="binofit-pin">${initials(p.firstName, p.lastName)}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

onMounted(async () => {
  try {
    const uid = user.value?.uid
    const me = uid ? await fetchUser(uid) : null
    const center = centerOf(me)
    if (!mapEl.value) return

    map = L.map(mapEl.value, { zoomControl: false }).setView([center.lat, center.lng], 13)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map)
    L.circle([center.lat, center.lng], {
      radius: DEFAULT_RADIUS_KM * 1000,
      color: '#4CC800',
      weight: 1,
      fillColor: '#4CC800',
      fillOpacity: 0.06,
    }).addTo(map)

    const results = await api.searchUsers({
      lat: center.lat,
      lng: center.lng,
      maxKm: DEFAULT_RADIUS_KM,
    })
    for (const p of results) {
      if (p.id === uid) continue
      L.marker([p.location.lat, p.location.lng], { icon: pinIcon(p), title: p.firstName })
        .on('click', () => {
          selected.value = p
        })
        .addTo(map)
    }

    await nextTick()
    map.invalidateSize()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Impossible de charger la carte.'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
})
</script>

<template>
  <div class="screen">
    <div class="screen__inner">
      <div class="header-block">
        <h1>Carte</h1>
        <p>Les sportifs autour de toi, dans un rayon de {{ DEFAULT_RADIUS_KM }} km.</p>
      </div>

      <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>

      <div class="map-box">
        <div ref="mapEl" class="map"></div>
        <div v-if="loading" class="map-box__loading">
          <span class="spinner spinner--muted" aria-hidden="true"></span>
        </div>
      </div>

      <ul v-if="selected" class="preview">
        <AthleteCard :profile="selected" />
      </ul>
      <p v-else-if="!loading" class="field-hint">Touche un marqueur pour voir le profil.</p>
    </div>
  </div>
</template>

<style scoped>
.map-box {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.map {
  width: 100%;
  height: 52vh;
  min-height: 320px;
  background: var(--color-surface-2);
}

.map-box__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 10, 0.5);
  z-index: 500;
}

.preview {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>

<style>
/* Marqueurs Leaflet (HTML injecté par divIcon, donc hors du scope du composant). */
.binofit-pin-wrap {
  background: transparent;
  border: none;
}

.binofit-pin {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #4cc800;
  color: #0a0a0a;
  font-weight: 800;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #0a0a0a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
}
</style>
