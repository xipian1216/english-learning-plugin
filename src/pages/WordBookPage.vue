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
  <main class="popup-shell">
    <section class="hero">
      <p class="eyebrow">Personal Page</p>
      <h1>Your vocabulary notebook</h1>
      <p class="subtitle">
        Select text on any webpage, tap the floating button, and the word will be saved here.
      </p>
      <div class="hero-actions">
        <a class="hero-link" href="/personal.html" target="_blank" rel="noreferrer">
          Open detailed personal page
        </a>
        <a class="hero-link hero-link--ghost" href="/auth.html" target="_blank" rel="noreferrer">
          Open login page
        </a>
      </div>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <p class="stat-label">Saved words</p>
        <strong class="stat-value">{{ totalWords }}</strong>
      </article>
      <article class="stat-card">
        <p class="stat-label">Latest addition</p>
        <strong class="stat-value stat-value--word">{{ latestWord }}</strong>
      </article>
    </section>

    <section class="wordbook-panel">
      <div class="panel-header">
        <div>
          <p class="section-kicker">Word Book</p>
          <h2>Collected from your reading</h2>
        </div>
        <button class="refresh-button" type="button" @click="loadWordBook">Refresh</button>
      </div>

      <p v-if="loading" class="empty-state">Loading your saved vocabulary...</p>
      <p v-else-if="entries.length === 0" class="empty-state">
        You have not collected any words yet. Try selecting a word on a page and click the add
        button.
      </p>

      <ul v-else class="word-list">
        <li v-for="entry in entries" :key="`${entry.text}-${entry.addedAt}`" class="word-item">
          <div class="word-main">
            <strong>{{ entry.text }}</strong>
            <span>{{ entry.sourceTitle || entry.sourceUrl }}</span>
          </div>
          <time>{{ formatAddedAt(entry.addedAt) }}</time>
        </li>
      </ul>
    </section>
  </main>
</template>
