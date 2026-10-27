import type { GeoPoint, User } from '../types/api'

/** Rayon de recherche par défaut, en km. */
export const DEFAULT_RADIUS_KM = 10

/** Centre de repli (Lyon) si le profil de l'utilisateur n'a pas de localisation. */
export const FALLBACK_CENTER: GeoPoint = { lat: 45.764, lng: 4.8357, city: 'Lyon' }

export interface SearchZone {
  label: string
  location: GeoPoint
}

/**
 * Zones proposées pour la localisation du profil.
 * Coordonnées approximatives, sans géocodage.
 */
export const SEARCH_ZONES: SearchZone[] = [
  { label: 'Lyon · Presqu’île', location: { lat: 45.7578, lng: 4.832, city: 'Lyon' } },
  { label: 'Lyon · Part-Dieu', location: { lat: 45.7606, lng: 4.8559, city: 'Lyon' } },
  { label: 'Lyon · Confluence', location: { lat: 45.741, lng: 4.82, city: 'Lyon' } },
  { label: 'Villeurbanne', location: { lat: 45.7665, lng: 4.8795, city: 'Villeurbanne' } },
  { label: 'Vénissieux', location: { lat: 45.6975, lng: 4.8862, city: 'Vénissieux' } },
  { label: 'Caluire-et-Cuire', location: { lat: 45.7975, lng: 4.8485, city: 'Caluire-et-Cuire' } },
]

/** Zone la plus proche d'un point (la première si aucun point). */
export function nearestZone(point?: GeoPoint): SearchZone {
  if (!point) return SEARCH_ZONES[0]!
  let best = SEARCH_ZONES[0]!
  let bestDist = Infinity
  for (const zone of SEARCH_ZONES) {
    const d = (zone.location.lat - point.lat) ** 2 + (zone.location.lng - point.lng) ** 2
    if (d < bestDist) {
      best = zone
      bestDist = d
    }
  }
  return best
}

/** Centre de recherche : la localisation du profil, sinon le repli. */
export function centerOf(me: User | null): GeoPoint {
  return me?.location ?? FALLBACK_CENTER
}
