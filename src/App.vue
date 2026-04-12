<script setup lang="ts">
const checks = [
  {
    title: 'Manifest V3',
    detail: 'Chrome and Edge both support Chromium-based MV3 extensions.',
  },
  {
    title: 'Popup page',
    detail: 'The Vue app is bundled as the extension popup entry.',
  },
  {
    title: 'Background worker',
    detail: 'A placeholder service worker is included for future logic.',
  },
  {
    title: 'Content script',
    detail: 'A starter content script is injected on all pages for later expansion.',
  },
]
</script>

<template>
  <main class="popup-shell">
    <section class="hero">
      <p class="eyebrow">English Learning Extension</p>
      <h1>Chrome and Edge scaffold is ready</h1>
      <p class="subtitle">
        This popup confirms the project can be packaged as one Chromium extension for both browsers.
      </p>
    </section>

    <section class="checklist">
      <article v-for="item in checks" :key="item.title" class="card">
        <h2>{{ item.title }}</h2>
        <p>{{ item.detail }}</p>
      </article>
    </section>
  </main>
</template>
