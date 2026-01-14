import { onMounted, onUnmounted } from 'vue'

export function useKeyboardShortcuts({ onNew, onOpen, onSave, onUndo, onRedo, onDelete }) {
  function isInputFocused() {
    const active = document.activeElement
    return active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.isContentEditable
  }

  function handleKeydown(e) {
    // Ctrl/Cmd + key combinations
    const isCtrlOrCmd = e.ctrlKey || e.metaKey

    if (isCtrlOrCmd) {
      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault()
          onNew?.()
          break
        case 'o':
          e.preventDefault()
          onOpen?.()
          break
        case 's':
          e.preventDefault()
          onSave?.()
          break
        case 'z':
          if (e.shiftKey) {
            e.preventDefault()
            onRedo?.()
          } else {
            e.preventDefault()
            onUndo?.()
          }
          break
        case 'y':
          e.preventDefault()
          onRedo?.()
          break
      }
    }

    // Delete/Backspace when not in an input
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputFocused()) {
      e.preventDefault()
      onDelete?.()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
}
