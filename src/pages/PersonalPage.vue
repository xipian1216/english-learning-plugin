<script setup lang="ts">
import { onMounted } from 'vue'

import { formatAddedAt } from '../modules/word-book/api'
import { useWordBook } from '../modules/word-book/composables'

const { entries, loading, totalWords, latestWord, loadWordBook } = useWordBook()

onMounted(() => {
  void loadWordBook()
})
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

      <button class="refresh-button" type="button" @click="loadWordBook">Refresh</button>
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
  </main>
</template>
