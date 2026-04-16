export type WordBookEntry = {
  text: string
  sourceUrl: string
  sourceTitle: string
  addedAt: string
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
