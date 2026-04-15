<script setup lang="ts">
import { onMounted, ref } from 'vue'

import {
  clearAuthSession,
  fetchCurrentUser,
  getAuthSession,
  type AuthUser,
} from '../modules/auth/api'
import {
  fetchWordDetail,
  formatAddedAt,
  type WordBookEntry,
  type WordDetailResponse,
} from '../modules/word-book/api'
import { useWordBook } from '../modules/word-book/composables'

const { entries, loading, totalWords, latestWord, loadWordBook } = useWordBook()
const currentUser = ref<AuthUser | null>(null)
const userLoading = ref(true)
const selectedEntry = ref<WordBookEntry | null>(null)
const detailLoading = ref(false)
const detailError = ref('')
const wordDetail = ref<WordDetailResponse | null>(null)

onMounted(() => {
  void initializePage()
  void loadCurrentUser()
})

function refreshPageData() {
  void initializePage()
  void loadCurrentUser()
}

async function initializePage() {
  await loadWordBook()

  if (entries.value.length === 0) {
    selectedEntry.value = null
    wordDetail.value = null
    detailError.value = ''
    return
  }

  if (!selectedEntry.value) {
    const firstEntry = entries.value[0]

    if (!firstEntry) {
      return
    }

    await selectEntry(firstEntry)
    return
  }

  const nextSelectedEntry =
    entries.value.find((entry) => entry.addedAt === selectedEntry.value?.addedAt) ??
    entries.value[0]

  if (!nextSelectedEntry) {
    return
  }

  await selectEntry(nextSelectedEntry)
}

async function loadCurrentUser() {
  userLoading.value = true

  try {
    const session = await getAuthSession()

    if (!session) {
      currentUser.value = null
      return
    }

    currentUser.value = session.user
    currentUser.value = await fetchCurrentUser()
  } catch {
    currentUser.value = null
  } finally {
    userLoading.value = false
  }
}

async function logout() {
  await clearAuthSession()
  currentUser.value = null
  selectedEntry.value = null
  wordDetail.value = null
  detailError.value = ''
}

async function selectEntry(entry: WordBookEntry) {
  selectedEntry.value = entry
  detailError.value = ''

  if (!currentUser.value) {
    wordDetail.value = null
    return
  }

  detailLoading.value = true

  try {
    wordDetail.value = await fetchWordDetail(entry)
  } catch (error) {
    wordDetail.value = null
    detailError.value = error instanceof Error ? error.message : '单词详情加载失败'
  } finally {
    detailLoading.value = false
  }
}
</script>

<template>
  <main class="personal-shell">
    <section class="personal-hero">
      <div>
        <p class="eyebrow">Personal Center</p>
        <h1>Word book</h1>
        <p class="subtitle">
          Review the vocabulary you collected while reading and keep track of your learning habit.
        </p>
      </div>

      <button class="refresh-button" type="button" @click="refreshPageData">Refresh</button>
    </section>

    <section class="user-summary-card">
      <div>
        <p class="section-kicker">Current User</p>
        <h2>
          {{
            userLoading
              ? 'Loading user...'
              : currentUser?.display_name || currentUser?.email || 'Not signed in'
          }}
        </h2>
        <p class="session-meta">
          {{
            userLoading
              ? 'Checking current account information.'
              : currentUser?.email ||
                'Please sign in first to associate the word book with your account.'
          }}
        </p>
      </div>
      <div class="user-summary-actions">
        <a v-if="!userLoading && !currentUser" class="hero-link hero-link--ghost" href="/auth.html">
          Go to login
        </a>
        <button
          v-else-if="currentUser"
          class="secondary-button secondary-button--compact"
          type="button"
          @click="logout"
        >
          Logout
        </button>
      </div>
    </section>

    <section class="personal-stats-grid">
      <article class="stat-card stat-card--large">
        <p class="stat-label">Saved words</p>
        <strong class="stat-value">{{ totalWords }}</strong>
        <span class="stat-hint">Built from your browser reading history</span>
      </article>

      <article class="stat-card stat-card--large">
        <p class="stat-label">Latest addition</p>
        <strong class="stat-value stat-value--word">{{ latestWord }}</strong>
        <span class="stat-hint">The newest word saved to your notebook</span>
      </article>
    </section>

    <section class="wordbook-panel wordbook-panel--page">
      <div class="panel-header panel-header--stacked">
        <div>
          <p class="section-kicker">Vocabulary List</p>
          <h2>All saved entries</h2>
        </div>
        <p class="panel-note">This page currently focuses on word book display only.</p>
      </div>

      <p v-if="loading" class="empty-state">Loading your saved vocabulary...</p>
      <p v-else-if="entries.length === 0" class="empty-state">
        No words yet. Select text on a webpage and click the floating button to add your first one.
      </p>

      <ul v-else class="word-list word-list--page">
        <li
          v-for="entry in entries"
          :key="`${entry.text}-${entry.addedAt}`"
          class="word-item word-item--page"
          :class="{ 'word-item--active': selectedEntry?.addedAt === entry.addedAt }"
          @click="selectEntry(entry)"
        >
          <div class="word-main">
            <strong>{{ entry.text }}</strong>
            <span>{{ entry.sourceTitle || entry.sourceUrl }}</span>
          </div>

          <div class="word-meta">
            <time>{{ formatAddedAt(entry.addedAt) }}</time>
            <a :href="entry.sourceUrl" target="_blank" rel="noreferrer">Open source</a>
          </div>
        </li>
      </ul>
    </section>

    <section class="wordbook-panel wordbook-panel--page">
      <div class="panel-header panel-header--stacked">
        <div>
          <p class="section-kicker">Word Detail</p>
          <h2>{{ selectedEntry?.text || 'Select a word' }}</h2>
        </div>
        <p class="panel-note">
          Detailed explanations are loaded from the authenticated word detail API.
        </p>
      </div>

      <p v-if="!currentUser && !userLoading" class="empty-state">请先登录后查看单词详情。</p>
      <p v-else-if="detailLoading" class="empty-state">Loading word detail...</p>
      <p v-else-if="detailError" class="empty-state empty-state--error">{{ detailError }}</p>
      <p v-else-if="!wordDetail" class="empty-state">
        Select a saved word to view its detailed explanation.
      </p>

      <div v-else class="detail-layout">
        <section class="detail-card">
          <div class="detail-heading">
            <div>
              <p class="section-kicker">Entry</p>
              <h3>{{ wordDetail.entry.word }}</h3>
            </div>
            <div class="detail-meta">
              <span v-if="wordDetail.entry.phonetic">{{ wordDetail.entry.phonetic }}</span>
              <span v-if="wordDetail.entry.cefr_level">{{ wordDetail.entry.cefr_level }}</span>
            </div>
          </div>

          <ul class="detail-list">
            <li
              v-for="sense in wordDetail.entry.senses"
              :key="`${sense.part_of_speech}-${sense.short_definition}`"
            >
              <strong>{{ sense.part_of_speech }}</strong>
              <p>
                {{
                  sense.short_definition ||
                  sense.definition_zh ||
                  sense.definition_en ||
                  'No definition yet'
                }}
              </p>
              <small v-if="sense.definition_en">{{ sense.definition_en }}</small>
            </li>
          </ul>
        </section>

        <section class="detail-card">
          <p class="section-kicker">Examples</p>
          <ul class="detail-list">
            <li v-for="example in wordDetail.entry.examples" :key="example.sentence_en">
              <p>{{ example.sentence_en }}</p>
              <small v-if="example.sentence_zh">{{ example.sentence_zh }}</small>
            </li>
          </ul>
        </section>

        <section class="detail-card">
          <p class="section-kicker">Collocations</p>
          <ul class="detail-list">
            <li v-for="item in wordDetail.entry.collocations" :key="item.phrase">
              <strong>{{ item.phrase }}</strong>
              <p>{{ item.translation_zh || '暂无中文解释' }}</p>
              <small v-if="item.note">{{ item.note }}</small>
            </li>
          </ul>
        </section>
      </div>
    </section>
  </main>
</template>
