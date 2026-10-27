<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { api } from '../services/api'
import { formatTime, formatDate } from '../services/format'
import { getUserCached } from '../services/users'
import type { Conversation } from '../types/api'

const { user } = useAuth()

const conversations = ref<Conversation[]>([])
const names = reactive<Record<string, { firstName: string; lastName: string }>>({})
const loading = ref(true)
const errorMessage = ref('')

const uid = computed(() => user.value?.uid ?? '')

function otherId(c: Conversation): string {
  return c.participantIds.find((id) => id !== uid.value) ?? ''
}

function otherName(c: Conversation): string {
  const n = names[otherId(c)]
  return n ? `${n.firstName} ${n.lastName}` : '…'
}

function otherInitials(c: Conversation): string {
  const n = names[otherId(c)]
  return n ? `${n.firstName[0] ?? ''}${n.lastName[0] ?? ''}`.toUpperCase() : '?'
}

function previewTime(iso: string): string {
  const d = new Date(iso)
  const sameDay = d.toDateString() === new Date().toDateString()
  return sameDay ? formatTime(iso) : formatDate(iso)
}

onMounted(async () => {
  try {
    const list = await api.listConversations()
    conversations.value = list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    await Promise.all(
      [...new Set(list.map(otherId))].map(async (id) => {
        const profile = await getUserCached(id)
        if (profile) names[id] = { firstName: profile.firstName, lastName: profile.lastName }
      }),
    )
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Impossible de charger les messages.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="screen">
    <div class="screen__inner">
      <div class="header-block">
        <h1>Messages</h1>
      </div>

      <div v-if="loading" class="state">
        <span class="spinner spinner--muted" aria-hidden="true"></span>
        <span>Chargement…</span>
      </div>

      <div v-else-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>

      <p v-else-if="conversations.length === 0" class="state">
        Aucune conversation. Contacte un sportif depuis son profil.
      </p>

      <ul v-else class="convo-list">
        <li v-for="c in conversations" :key="c.id">
          <RouterLink :to="{ name: 'conversation', params: { id: c.id } }" class="convo">
            <div class="avatar convo__avatar">{{ otherInitials(c) }}</div>
            <div class="convo__body">
              <div class="convo__top">
                <strong>{{ otherName(c) }}</strong>
                <span class="convo__time">{{ previewTime(c.updatedAt) }}</span>
              </div>
              <p class="convo__preview">
                <template v-if="c.lastMessage">
                  {{ c.lastMessage.senderId === uid ? 'Toi : ' : '' }}{{ c.lastMessage.text }}
                </template>
                <template v-else>Pas encore de message</template>
              </p>
            </div>
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
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

.convo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.convo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  text-decoration: none;
  color: var(--color-text);
}

.convo__avatar {
  width: 48px;
  height: 48px;
  font-size: 16px;
  flex-shrink: 0;
  border: none;
}

.convo__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.convo__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.convo__time {
  font-size: 12px;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.convo__preview {
  font-size: 14px;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
