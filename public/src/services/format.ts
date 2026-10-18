/** Formate une distance en km avec une virgule (ex. « 3,4 km »). */
export function formatDistance(km: number | undefined): string {
  if (km === undefined) return '—'
  return `${km.toString().replace('.', ',')} km`
}

/** Initiales d'une personne (ex. « AB »). */
export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

/** Date courte en français (ex. « sam. 24 oct. »). */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** Heure au format HH:mm. */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

/** Date et heure courtes (ex. « sam. 24 oct. · 18:00 »). */
export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`
}
