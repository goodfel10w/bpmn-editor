import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SelectedElement, ChatMessage, ChatMessageRole } from '../types'
import { ZOOM } from '../constants'

/**
 * Main editor store for managing application state
 */
export const useEditorStore = defineStore('editor', () => {
  // =========================================================================
  // State
  // =========================================================================

  /** Whether the diagram has unsaved changes */
  const isDirty = ref(false)

  /** Current filename (null for new diagrams) */
  const currentFileName = ref<string | null>(null)

  /** Currently selected BPMN element */
  const selectedElement = ref<SelectedElement | null>(null)

  /** Current zoom level */
  const zoom = ref(ZOOM.DEFAULT_LEVEL)

  /** Whether the element palette is visible */
  const showPalette = ref(true)

  /** Whether the properties panel is visible */
  const showProperties = ref(true)

  /** Whether the chat panel is visible */
  const showChat = ref(false)

  /** Whether undo is available */
  const canUndo = ref(false)

  /** Whether redo is available */
  const canRedo = ref(false)

  /** Whether a loading operation is in progress */
  const isLoading = ref(false)

  /** Chat message history */
  const chatMessages = ref<ChatMessage[]>([])

  /** Whether AI is processing a request */
  const isAiProcessing = ref(false)

  // =========================================================================
  // Computed
  // =========================================================================

  /** Whether any element is selected */
  const hasSelection = computed(() => selectedElement.value !== null)

  /** Zoom level as percentage */
  const zoomPercent = computed(() => Math.round(zoom.value * 100))

  // =========================================================================
  // Actions
  // =========================================================================

  /** Mark the diagram as having unsaved changes */
  function markDirty(): void {
    isDirty.value = true
  }

  /** Mark the diagram as saved (no unsaved changes) */
  function markClean(): void {
    isDirty.value = false
  }

  /** Set the current filename */
  function setFileName(name: string | null): void {
    currentFileName.value = name
  }

  /** Set the selected element */
  function setSelectedElement(element: SelectedElement | null): void {
    selectedElement.value = element
  }

  /** Clear the current selection */
  function clearSelection(): void {
    selectedElement.value = null
  }

  /** Set the zoom level */
  function setZoom(value: number): void {
    zoom.value = value
  }

  /** Toggle the palette visibility */
  function togglePalette(): void {
    showPalette.value = !showPalette.value
  }

  /** Toggle the properties panel visibility */
  function toggleProperties(): void {
    showProperties.value = !showProperties.value
  }

  /** Toggle the chat panel visibility */
  function toggleChat(): void {
    showChat.value = !showChat.value
  }

  /** Add a chat message */
  function addChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): void {
    chatMessages.value.push({
      id: Date.now(),
      timestamp: new Date(),
      ...message
    } as ChatMessage)
  }

  /** Clear all chat messages */
  function clearChatMessages(): void {
    chatMessages.value = []
  }

  /** Set AI processing state */
  function setAiProcessing(processing: boolean): void {
    isAiProcessing.value = processing
  }

  /** Update undo/redo availability */
  function setUndoRedo(undo: boolean, redo: boolean): void {
    canUndo.value = undo
    canRedo.value = redo
  }

  /** Set loading state */
  function setLoading(loading: boolean): void {
    isLoading.value = loading
  }

  /** Reset all state to initial values */
  function reset(): void {
    isDirty.value = false
    currentFileName.value = null
    selectedElement.value = null
    zoom.value = ZOOM.DEFAULT_LEVEL
    canUndo.value = false
    canRedo.value = false
    chatMessages.value = []
    isAiProcessing.value = false
  }

  return {
    // State
    isDirty,
    currentFileName,
    selectedElement,
    zoom,
    showPalette,
    showProperties,
    showChat,
    canUndo,
    canRedo,
    isLoading,
    chatMessages,
    isAiProcessing,
    // Computed
    hasSelection,
    zoomPercent,
    // Actions
    markDirty,
    markClean,
    setFileName,
    setSelectedElement,
    clearSelection,
    setZoom,
    togglePalette,
    toggleProperties,
    toggleChat,
    addChatMessage,
    clearChatMessages,
    setAiProcessing,
    setUndoRedo,
    setLoading,
    reset
  }
})
