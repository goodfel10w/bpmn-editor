import { onMounted, onUnmounted } from 'vue'
import { KEYBOARD } from '../constants'

/**
 * Keyboard shortcut handler configuration
 */
interface ShortcutHandlers {
  onNew?: () => void
  onOpen?: () => void
  onSave?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onDelete?: () => void
}

/**
 * Composable for managing keyboard shortcuts
 * Registers global keyboard event listeners for common editor operations
 *
 * @param handlers - Object containing callback functions for each shortcut
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  /**
   * Check if the user is typing in an input element
   */
  function isInputFocused(): boolean {
    const activeElement = document.activeElement
    if (!activeElement) return false

    const tagName = activeElement.tagName.toLowerCase()
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      activeElement.getAttribute('contenteditable') === 'true'
    )
  }

  /**
   * Check if the event matches a shortcut definition
   */
  function matchesShortcut(
    event: KeyboardEvent,
    shortcut: { key: string; ctrl: boolean }
  ): boolean {
    const ctrlOrMeta = event.ctrlKey || event.metaKey
    return event.key.toLowerCase() === shortcut.key.toLowerCase() && ctrlOrMeta === shortcut.ctrl
  }

  /**
   * Handle keydown events
   */
  function handleKeydown(event: KeyboardEvent): void {
    // Don't intercept when typing in inputs
    if (isInputFocused()) return

    // Ctrl+N: New diagram
    if (matchesShortcut(event, KEYBOARD.CTRL_N)) {
      event.preventDefault()
      handlers.onNew?.()
      return
    }

    // Ctrl+O: Open file
    if (matchesShortcut(event, KEYBOARD.CTRL_O)) {
      event.preventDefault()
      handlers.onOpen?.()
      return
    }

    // Ctrl+S: Save
    if (matchesShortcut(event, KEYBOARD.CTRL_S)) {
      event.preventDefault()
      handlers.onSave?.()
      return
    }

    // Ctrl+Z: Undo
    if (matchesShortcut(event, KEYBOARD.CTRL_Z)) {
      event.preventDefault()
      handlers.onUndo?.()
      return
    }

    // Ctrl+Y: Redo
    if (matchesShortcut(event, KEYBOARD.CTRL_Y)) {
      event.preventDefault()
      handlers.onRedo?.()
      return
    }

    // Delete key: Delete selected elements
    if (event.key === KEYBOARD.DELETE.key || event.key === KEYBOARD.BACKSPACE.key) {
      // Don't prevent default for backspace in case user is typing
      handlers.onDelete?.()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
}
