import { getAuthSession } from '../auth/api'
import { buildApiUrl } from '../../shared/config'

export type WordBookEntry = {
  text: string
  sourceUrl: string
  sourceTitle: string
  addedAt: string
}

export type WordDetailSense = {
  part_of_speech: string
  definition_en: string | null
  definition_zh: string | null
  short_definition: string | null
}

export type WordDetailExample = {
  sentence_en: string
  sentence_zh: string | null
}

export type WordDetailCollocation = {
  phrase: string
  translation_zh: string | null
  note: string | null
}

export type WordDetailEntry = {
  word: string
  phonetic: string | null
  audio_url: string | null
  cefr_level: string | null
  senses: WordDetailSense[]
  examples: WordDetailExample[]
  collocations: WordDetailCollocation[]
}

export type WordDetailSource = {
  provider: string
  cached: boolean
}

export type WordDetailResponse = {
  query_text: string
  normalized_text: string
  lemma: string
  source_language: string
  target_language: string
  entry: WordDetailEntry
  source: WordDetailSource
}

type WordDetailPayload = {
  text: string
  source_language?: string
  target_language?: string
  context_sentence?: string
  source_url?: string
  source_title?: string
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T | null
}

type StorageItems = Record<string, unknown>
type ExtensionStorage = {
  get(
    keys: string | string[] | Record<string, unknown> | null,
    callback: (items: StorageItems) => void,
  ): void
  set(items: StorageItems, callback?: () => void): void
}

const STORAGE_KEY = 'wordBook'
const DEFAULT_SOURCE_LANGUAGE = 'en'
const DEFAULT_TARGET_LANGUAGE = 'zh-CHS'

const extensionStorage = (
  globalThis as typeof globalThis & {
    chrome?: {
      storage?: {
        local?: ExtensionStorage
      }
    }
  }
).chrome?.storage?.local

export function normalizeSelectionText(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

export async function getWordBook() {
  const data = await storageGet<WordBookEntry[]>(STORAGE_KEY)
  return Array.isArray(data) ? data : []
}

export async function addWordToBook(entry: Omit<WordBookEntry, 'addedAt'>) {
  const normalizedText = normalizeSelectionText(entry.text)

  if (!normalizedText) {
    return
  }

  const current = await getWordBook()
  const alreadySaved = current.some(
    (item) => item.text.toLowerCase() === normalizedText.toLowerCase(),
  )

  if (alreadySaved) {
    return
  }

  const nextEntry: WordBookEntry = {
    ...entry,
    text: normalizedText,
    addedAt: new Date().toISOString(),
  }

  await storageSet(STORAGE_KEY, [nextEntry, ...current])
}

export async function fetchWordDetail(entry: WordBookEntry) {
  const session = await getAuthSession()

  if (!session) {
    throw new Error('请先登录后再查看单词详情')
  }

  const payload: WordDetailPayload = {
    text: entry.text,
    source_language: DEFAULT_SOURCE_LANGUAGE,
    target_language: DEFAULT_TARGET_LANGUAGE,
    source_url: entry.sourceUrl,
    source_title: entry.sourceTitle,
  }

  return requestWordDetail(payload, session.accessToken)
}

export function formatAddedAt(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function storageGet<T>(key: string) {
  return new Promise<T | undefined>((resolve) => {
    if (!extensionStorage) {
      resolve(undefined)
      return
    }

    extensionStorage.get([key], (items: StorageItems) => {
      resolve(items[key] as T | undefined)
    })
  })
}

function storageSet<T>(key: string, value: T) {
  return new Promise<void>((resolve) => {
    if (!extensionStorage) {
      resolve()
      return
    }

    extensionStorage.set({ [key]: value }, () => {
      resolve()
    })
  })
}

async function requestWordDetail(payload: WordDetailPayload, accessToken: string) {
  const response = await fetch(buildApiUrl('/word-details'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })

  const result = (await response.json()) as ApiEnvelope<WordDetailResponse>

  if (!response.ok || result.code !== 0 || !result.data) {
    throw new Error(mapWordDetailError(result.code, result.message))
  }

  return result.data
}

function mapWordDetailError(code: number, message: string) {
  if (code === 40001) {
    return '单词查询参数有误，请重试'
  }

  if (code === 40100) {
    return '登录已失效，请重新登录后查看单词详情'
  }

  if (code === 40400) {
    return '暂未查询到该单词的详细信息'
  }

  if (code === 50010 || code === 50011) {
    return '词典服务暂时不可用，请稍后再试'
  }

  return message || '单词详情加载失败，请稍后重试'
}
