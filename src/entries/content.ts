import { addWordToBook, normalizeSelectionText } from '../modules/word-book/api'

const TOOL_ID = 'english-learning-helper-selection-tool'
const TOOL_LABEL = 'Add to word book'
const TOOL_HEIGHT = 40
const TOOL_GAP = 10
const VIEWPORT_PADDING = 12

let activeSelection = ''
let hideTimer: number | null = null

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
    window.setTimeout(() => {
      hideToolButton()
    }, 600)
  } catch (error) {
    console.error('Failed to save selected word.', error)
    toolButton.textContent = 'Retry'
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

  if (hideTimer) {
    window.clearTimeout(hideTimer)
    hideTimer = null
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
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
