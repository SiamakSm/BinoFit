import { api, ApiError } from './api'
import type { User } from '../types/api'

/**
 * Récupère un profil. Renvoie `null` si le profil n'existe pas (404).
 */
export async function fetchUser(id: string): Promise<User | null> {
  try {
    return await api.getUser(id)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

const cache = new Map<string, Promise<User | null>>()

/**
 * Comme `fetchUser`, mais mis en cache pour la session (utile pour les noms dans les listes).
 */
export function getUserCached(id: string): Promise<User | null> {
  let pending = cache.get(id)
  if (!pending) {
    pending = fetchUser(id)
    cache.set(id, pending)
  }
  return pending
}
