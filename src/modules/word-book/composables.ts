import { computed, ref } from 'vue'

import { getWordBook, type WordBookEntry } from './api'

export function useWordBook() {
  const entries = ref<WordBookEntry[]>([])
  const loading = ref(true)

  const totalWords = computed(() => entries.value.length)
  const latestWord = computed(() => entries.value[0]?.text ?? 'No words yet')

  async function loadWordBook() {
    loading.value = true
    entries.value = await getWordBook()
    loading.value = false
  }

  return {
    entries,
    loading,
    totalWords,
    latestWord,
    loadWordBook,
  }
}
