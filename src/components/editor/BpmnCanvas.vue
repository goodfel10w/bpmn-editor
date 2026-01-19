<script setup lang="ts">
import { ref, provide, onMounted, type Ref, type ShallowRef } from 'vue'
import { useBpmnModeler } from '../../composables/useBpmnModeler'
import { useEditorStore } from '../../stores/editorStore'
import { useNotifications } from '../../composables/useNotifications'
import { validateFile } from '../../utils/validation'
import { BLANK_DIAGRAM } from '../../utils/bpmnTemplates'
import type BpmnModeler from 'bpmn-js/lib/Modeler'

const store = useEditorStore()
const { error: showError, success: showSuccess } = useNotifications()

const canvasRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)

const {
  modeler,
  isReady,
  importXML,
  exportXML,
  exportSVG,
  createNewDiagram,
  zoomIn,
  zoomOut,
  zoomFit,
  zoomReset,
  undo,
  redo,
  updateElementProperty,
  deleteSelectedElements
} = useBpmnModeler(canvasRef)

// Define the type for what we're providing
interface BpmnModelerContext {
  modeler: ShallowRef<BpmnModeler | null>
  importXML: (xml: string) => Promise<void>
  exportXML: () => Promise<string | null>
  exportSVG: () => Promise<string | null>
  createNewDiagram: () => void
  zoomIn: () => void
  zoomOut: () => void
  zoomFit: () => void
  zoomReset: () => void
  undo: () => void
  redo: () => void
  updateElementProperty: (elementId: string, property: string, value: unknown) => void
  deleteSelectedElements: () => void
}

// Provide modeler functions to child components
provide<BpmnModelerContext>('bpmnModeler', {
  modeler,
  importXML,
  exportXML,
  exportSVG,
  createNewDiagram,
  zoomIn,
  zoomOut,
  zoomFit,
  zoomReset,
  undo,
  redo,
  updateElementProperty,
  deleteSelectedElements
})

// Drag and drop handling
function handleDragOver(e: DragEvent): void {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave(): void {
  isDragging.value = false
}

async function handleDrop(e: DragEvent): Promise<void> {
  e.preventDefault()
  isDragging.value = false

  const file = e.dataTransfer?.files[0]
  if (!file) return

  // Validate file
  const validation = validateFile(file)
  if (!validation.valid) {
    showError('Invalid File', validation.errors.join(', '))
    return
  }

  const reader = new FileReader()
  reader.onload = async (event): Promise<void> => {
    try {
      const content = event.target?.result
      if (typeof content === 'string') {
        await importXML(content)
        store.setFileName(file.name)
        store.markClean()
        showSuccess('File Loaded', `Successfully loaded ${file.name}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      showError('Failed to Load', `Could not load BPMN file: ${message}`)
    }
  }
  reader.onerror = (): void => {
    showError('Read Error', 'Failed to read the file')
  }
  reader.readAsText(file)
}

// Load sample diagram on mount
onMounted(async () => {
  try {
    const response = await fetch('/sample.bpmn')
    if (response.ok) {
      const xml = await response.text()
      await importXML(xml)
      store.setFileName('sample.bpmn')
      store.markClean()
    }
  } catch {
    // If sample doesn't exist, create blank diagram
    await importXML(BLANK_DIAGRAM)
    store.markClean()
  }
})

// Expose methods to parent
defineExpose({
  importXML,
  exportXML,
  exportSVG,
  createNewDiagram,
  zoomIn,
  zoomOut,
  zoomFit,
  zoomReset,
  undo,
  redo,
  updateElementProperty
})
</script>

<template>
  <div
    class="bpmn-canvas-container"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div ref="canvasRef" class="bpmn-canvas"></div>

    <div v-if="isDragging" class="drop-overlay">
      <div class="drop-message">
        <svg class="drop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span>Drop BPMN file here</span>
      </div>
    </div>

    <div v-if="store.isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<style scoped>
.bpmn-canvas-container {
  position: relative;
  flex: 1;
  min-width: 0;
  background-color: var(--gray-50);
  overflow: hidden;
}

.bpmn-canvas {
  width: 100%;
  height: 100%;
}

.drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(59, 130, 246, 0.1);
  border: 2px dashed var(--primary-500);
  z-index: 10;
}

.drop-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6);
  background-color: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.drop-icon {
  width: 48px;
  height: 48px;
  color: var(--primary-500);
}

.drop-message span {
  font-size: 16px;
  font-weight: 500;
  color: var(--gray-700);
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 20;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
