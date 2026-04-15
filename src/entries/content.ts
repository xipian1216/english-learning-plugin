// IMPORTANT:
// This file must remain a classic content script with no imports.
// Browser extension content_scripts are executed as classic scripts by default.
// If imports are added here again, the generated bundle may stop working on pages.
const TOOL_ID = 'english-learning-helper-selection-tool'
const TOOL_LABEL = 'Add to word book'
const TOOL_HEIGHT = 40
const TOOL_GAP = 10
const VIEWPORT_PADDING = 12
const STORAGE_KEY = 'wordBook'

type WordBookEntry = {
  text: string
  sourceUrl: string
  sourceTitle: string
  addedAt: string
}

type StorageItems = Record<string, unknown>
type ExtensionStorage = {
  get(keys: string | string[] | Record<string, unknown> | null, callback: (items: StorageItems) => void): void
  set(items: StorageItems, callback?: () => void): void
}

let activeSelection = ''
let hideTimer: number | null = null
let suppressSelectionUntil = 0

const toolButton = document.createElement('button')
toolButton.id = TOOL_ID
toolButton.type = 'button'
toolButton.textContent = TOOL_LABEL
toolButton.hidden = true
applyToolButtonStyles(toolButton)

toolButton.addEventListener('mousedown', (event) => {
  event.preventDefault()
})

toolButton.addEventListener('click', async (event) => {
  event.preventDefault()

  if (!activeSelection) {
    hideToolButton()
    return
  }

  const selection = activeSelection
  toolButton.textContent = 'Saving...'
  toolButton.disabled = true

  try {
    await addWordToBook({
      text: selection,
      sourceUrl: window.location.href,
      sourceTitle: document.title,
    })

    toolButton.textContent = 'Saved'
    toolButton.style.background = 'linear-gradient(135deg, #39a86b 0%, #2f8f5b 100%)'
    suppressSelectionUntil = Date.now() + 800
    window.setTimeout(() => {
      clearSelection()
      hideToolButton()
    }, 600)
  } catch (error) {
    console.error('Failed to save selected word.', error)
    toolButton.textContent = 'Retry'
    toolButton.style.background = 'linear-gradient(135deg, #d95f4a 0%, #b84535 100%)'
    toolButton.disabled = false
  }
})

document.body.appendChild(toolButton)

document.addEventListener('mouseup', () => {
  window.setTimeout(() => {
    updateToolFromSelection()
  }, 0)
})

document.addEventListener('selectionchange', () => {
  if (!window.getSelection()?.toString().trim()) {
    scheduleHide()
  }
})

window.addEventListener('scroll', () => {
  if (toolButton.hidden) {
    return
  }

  updateToolFromSelection()
}, { passive: true })

window.addEventListener('resize', () => {
  if (toolButton.hidden) {
    return
  }

  updateToolFromSelection()
})

function updateToolFromSelection() {
  if (Date.now() < suppressSelectionUntil) {
    return
  }

  const selection = window.getSelection()

  if (!selection || selection.rangeCount === 0) {
    hideToolButton()
    return
  }

  const text = normalizeSelectionText(selection.toString())

  if (!text) {
    hideToolButton()
    return
  }

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()

  if (!rect.width && !rect.height) {
    hideToolButton()
    return
  }

  activeSelection = text
  toolButton.textContent = TOOL_LABEL
  toolButton.disabled = false
  toolButton.hidden = false
  toolButton.style.display = 'block'
  toolButton.style.background = 'linear-gradient(135deg, #ff8a3d 0%, #db5c34 100%)'
  positionToolButton(rect)

  if (hideTimer) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }
}

function positionToolButton(rect: DOMRect) {
  const centerX = rect.left + rect.width / 2
  const preferredTop = rect.top - TOOL_HEIGHT - TOOL_GAP
  const fallbackTop = rect.bottom + TOOL_GAP
  const top = preferredTop > VIEWPORT_PADDING ? preferredTop : fallbackTop
  const left = clamp(centerX, VIEWPORT_PADDING, window.innerWidth - VIEWPORT_PADDING)

  toolButton.style.top = `${top}px`
  toolButton.style.left = `${left}px`
}

function scheduleHide() {
  if (hideTimer) {
    window.clearTimeout(hideTimer)
  }

  hideTimer = window.setTimeout(() => {
    hideToolButton()
  }, 120)
}

function hideToolButton() {
  activeSelection = ''
  toolButton.hidden = true
  toolButton.disabled = false
  toolButton.textContent = TOOL_LABEL
  toolButton.style.display = 'none'
  toolButton.style.background = 'linear-gradient(135deg, #ff8a3d 0%, #db5c34 100%)'

  if (hideTimer) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function clearSelection() {
  const selection = window.getSelection()

  if (!selection) {
    return
  }

  selection.removeAllRanges()
}

function applyToolButtonStyles(button: HTMLButtonElement) {
  button.style.position = 'fixed'
  button.style.zIndex = '2147483647'
  button.style.top = '0'
  button.style.left = '0'
  button.style.transform = 'translate(-50%, 0)'
  button.style.border = '0'
  button.style.borderRadius = '999px'
  button.style.padding = '10px 14px'
  button.style.fontFamily = "'Trebuchet MS', 'Segoe UI', sans-serif"
  button.style.fontSize = '13px'
  button.style.fontWeight = '700'
  button.style.color = '#fff'
  button.style.background = 'linear-gradient(135deg, #ff8a3d 0%, #db5c34 100%)'
  button.style.boxShadow = '0 12px 30px rgba(66, 36, 15, 0.28)'
  button.style.cursor = 'pointer'
  button.style.display = 'none'
}

function normalizeSelectionText(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

async function addWordToBook(entry: Omit<WordBookEntry, 'addedAt'>) {
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

async function getWordBook() {
  const data = await storageGet<WordBookEntry[]>(STORAGE_KEY)
  return Array.isArray(data) ? data : []
}

function getExtensionStorage() {
  return (
    globalThis as typeof globalThis & {
      chrome?: {
        storage?: {
          local?: ExtensionStorage
        }
      }
    }
  ).chrome?.storage?.local
}

function storageGet<T>(key: string) {
  return new Promise<T | undefined>((resolve) => {
    const extensionStorage = getExtensionStorage()

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
    const extensionStorage = getExtensionStorage()

    if (!extensionStorage) {
      resolve()
      return
    }

    extensionStorage.set({ [key]: value }, () => {
      resolve()
    })
  })
}
