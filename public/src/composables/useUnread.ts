import { computed, ref } from 'vue'
import { api } from '../services/api'
import { useAuth } from './useAuth'
import type { Conversation } from '../types/api'

/**
 * Messages non lus : un message est non lu si le dernier message d'une conversation
 * vient de l'autre personne et est plus récent que la dernière ouverture locale de la
 * conversation. Le suivi est local à l'appareil (localStorage) : aucun changement d'API ni de base.
 */

const STORAGE_KEY = 'binofit:lastSeen'
const POLL_MS = 15000

const conversations = ref<Conversation[]>([])
const lastSeen = ref<Record<string, string>>(readLastSeen())
let timer: number | undefined
let lastCount = 0

function readLastSeen(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function persistLastSeen() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lastSeen.value))
}

/** Id de la conversation ouverte à l'écran, s'il y en a une. */
function openConversationId(): string | null {
  const match = window.location.pathname.match(/^\/messages\/([^/]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function isUnread(c: Conversation, uid: string): boolean {
  const last = c.lastMessage
  if (!last || last.senderId === uid) return false
  const seen = lastSeen.value[c.id]
  return !seen || last.sentAt > seen
}

/** Marque une conversation comme lue jusqu'à son dernier message. */
function markSeen(conversation: Conversation) {
  const sentAt = conversation.lastMessage?.sentAt
  if (!sentAt) return
  if (lastSeen.value[conversation.id] === sentAt) return
  lastSeen.value = { ...lastSeen.value, [conversation.id]: sentAt }
  persistLastSeen()
}

function notify(count: number) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  if (!document.hidden) return
  new Notification('BINOFIT', {
    body: count === 1 ? 'Tu as reçu un nouveau message.' : `Tu as ${count} nouveaux messages.`,
    icon: '/favicon.png',
  })
}

/** Recharge les conversations et met à jour le compteur ; notifie si de nouveaux messages arrivent. */
async function refresh() {
  const { user } = useAuth()
  const uid = user.value?.uid
  if (!uid) return
  try {
    const list = await api.listConversations()
    conversations.value = list
    const openId = openConversationId()
    const open = list.find((c) => c.id === openId)
    if (open) markSeen(open)
    const count = list.filter((c) => isUnread(c, uid)).length
    if (count > lastCount) notify(count)
    lastCount = count
  } catch {
    // Pas de bruit en arrière-plan : la prochaine interrogation réessaiera.
  }
}

/** Nombre de conversations avec des messages non lus (affiché sur l'onglet Messages). */
const unreadCount = computed(() => {
  const { user } = useAuth()
  const uid = user.value?.uid ?? ''
  if (!uid) return 0
  return conversations.value.filter((c) => isUnread(c, uid)).length
})

/** Démarre l'interrogation périodique (à appeler une fois connecté). */
function startUnreadPolling() {
  if (timer !== undefined) return
  void refresh()
  timer = window.setInterval(refresh, POLL_MS)
  document.addEventListener('visibilitychange', onVisibility)
}

function stopUnreadPolling() {
  if (timer !== undefined) window.clearInterval(timer)
  timer = undefined
  document.removeEventListener('visibilitychange', onVisibility)
  conversations.value = []
  lastCount = 0
}

function onVisibility() {
  if (!document.hidden) void refresh()
}

/** Demande l'autorisation des notifications navigateur, une seule fois, après une action de l'utilisateur. */
function requestNotificationPermission() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'default') return
  void Notification.requestPermission()
}

export function useUnread() {
  return { unreadCount, refresh, markSeen, startUnreadPolling, stopUnreadPolling, requestNotificationPermission }
}
