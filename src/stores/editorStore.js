import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useEditorStore = defineStore('editor', () => {
  // State
  const isDirty = ref(false)
  const currentFileName = ref(null)
  const selectedElement = ref(null)
  const zoom = ref(1)
  const showPalette = ref(true)
  const showProperties = ref(true)
  const canUndo = ref(false)
  const canRedo = ref(false)
  const isLoading = ref(false)

  // Computed
  const hasSelection = computed(() => selectedElement.value !== null)
  const zoomPercent = computed(() => Math.round(zoom.value * 100))

  // Actions
  function markDirty() {
    isDirty.value = true
  }

  function markClean() {
    isDirty.value = false
  }

  function setFileName(name) {
    currentFileName.value = name
  }

  function setSelectedElement(element) {
    selectedElement.value = element
  }

  function clearSelection() {
    selectedElement.value = null
  }

  function setZoom(value) {
    zoom.value = value
  }

  function togglePalette() {
    showPalette.value = !showPalette.value
  }

  function toggleProperties() {
    showProperties.value = !showProperties.value
  }

  function setUndoRedo(undo, redo) {
    canUndo.value = undo
    canRedo.value = redo
  }

  function setLoading(loading) {
    isLoading.value = loading
  }

  function reset() {
    isDirty.value = false
    currentFileName.value = null
    selectedElement.value = null
    zoom.value = 1
    canUndo.value = false
    canRedo.value = false
  }

  return {
    // State
    isDirty,
    currentFileName,
    selectedElement,
    zoom,
    showPalette,
    showProperties,
    canUndo,
    canRedo,
    isLoading,
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
    setUndoRedo,
    setLoading,
    reset
  }
})
