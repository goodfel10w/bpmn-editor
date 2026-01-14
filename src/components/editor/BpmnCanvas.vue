<script setup>
import { ref, provide, onMounted } from 'vue'
import { useBpmnModeler } from '../../composables/useBpmnModeler'
import { useEditorStore } from '../../stores/editorStore'
import { BLANK_DIAGRAM } from '../../utils/bpmnTemplates'

const store = useEditorStore()
const canvasRef = ref(null)
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

// Provide modeler functions to child components
provide('bpmnModeler', {
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
function handleDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

async function handleDrop(e) {
  e.preventDefault()
  isDragging.value = false

  const file = e.dataTransfer?.files[0]
  if (file && (file.name.endsWith('.bpmn') || file.name.endsWith('.xml'))) {
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        await importXML(event.target.result)
        store.setFileName(file.name)
        store.markClean()
      } catch (err) {
        alert('Failed to load BPMN file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }
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
