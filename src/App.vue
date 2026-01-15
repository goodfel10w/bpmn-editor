<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from './stores/editorStore'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import { downloadFile, downloadBlob, svgToPng } from './utils/exportUtils'
import AppHeader from './components/layout/AppHeader.vue'
import AppToolbar from './components/layout/AppToolbar.vue'
import AppFooter from './components/layout/AppFooter.vue'
import BpmnCanvas from './components/editor/BpmnCanvas.vue'
import PropertiesPanel from './components/properties/PropertiesPanel.vue'
import ChatPanel from './components/chat/ChatPanel.vue'

const store = useEditorStore()
const canvasRef = ref(null)
const fileInputRef = ref(null)

// File operations
async function handleNew() {
  if (store.isDirty) {
    const confirmed = confirm('You have unsaved changes. Create new diagram anyway?')
    if (!confirmed) return
  }
  canvasRef.value?.createNewDiagram()
  store.setFileName(null)
  store.markClean()
}

function handleOpenTrigger() {
  fileInputRef.value?.click()
}

async function handleOpenFile(file) {
  if (store.isDirty) {
    const confirmed = confirm('You have unsaved changes. Open another file anyway?')
    if (!confirmed) return
  }

  const reader = new FileReader()
  reader.onload = async (event) => {
    try {
      await canvasRef.value?.importXML(event.target.result)
      store.setFileName(file.name)
      store.markClean()
    } catch (err) {
      alert('Failed to load BPMN file: ' + err.message)
    }
  }
  reader.readAsText(file)
}

async function handleSave() {
  const xml = await canvasRef.value?.exportXML()
  if (xml) {
    const filename = store.currentFileName || 'diagram.bpmn'
    downloadFile(xml, filename, 'application/xml')
    store.markClean()
  }
}

async function handleExportXML() {
  const xml = await canvasRef.value?.exportXML()
  if (xml) {
    const filename = (store.currentFileName?.replace(/\.[^.]+$/, '') || 'diagram') + '.bpmn'
    downloadFile(xml, filename, 'application/xml')
  }
}

async function handleExportSVG() {
  const svg = await canvasRef.value?.exportSVG()
  if (svg) {
    const filename = (store.currentFileName?.replace(/\.[^.]+$/, '') || 'diagram') + '.svg'
    downloadFile(svg, filename, 'image/svg+xml')
  }
}

async function handleExportPNG() {
  const svg = await canvasRef.value?.exportSVG()
  if (svg) {
    try {
      const blob = await svgToPng(svg, 2)
      const filename = (store.currentFileName?.replace(/\.[^.]+$/, '') || 'diagram') + '.png'
      downloadBlob(blob, filename)
    } catch (err) {
      alert('Failed to export PNG: ' + err.message)
    }
  }
}

// Edit operations
function handleUndo() {
  canvasRef.value?.undo()
}

function handleRedo() {
  canvasRef.value?.redo()
}

// Zoom operations
function handleZoomIn() {
  canvasRef.value?.zoomIn()
}

function handleZoomOut() {
  canvasRef.value?.zoomOut()
}

function handleZoomFit() {
  canvasRef.value?.zoomFit()
}

function handleZoomReset() {
  canvasRef.value?.zoomReset()
}

// Keyboard shortcuts
useKeyboardShortcuts({
  onNew: handleNew,
  onOpen: handleOpenTrigger,
  onSave: handleSave,
  onUndo: handleUndo,
  onRedo: handleRedo,
  onDelete: () => {
    // Delete is handled by bpmn-js directly
  }
})

// Warn before leaving with unsaved changes
function handleBeforeUnload(e) {
  if (store.isDirty) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<template>
  <div class="app-container">
    <AppHeader />
    <AppToolbar
      @new="handleNew"
      @open="(file) => file && handleOpenFile(file)"
      @save="handleSave"
      @export-xml="handleExportXML"
      @export-svg="handleExportSVG"
      @export-png="handleExportPNG"
      @undo="handleUndo"
      @redo="handleRedo"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @zoom-fit="handleZoomFit"
      @zoom-reset="handleZoomReset"
    />

    <main class="main-content">
      <BpmnCanvas ref="canvasRef" />
      <PropertiesPanel v-if="store.showProperties" />
      <ChatPanel v-if="store.showChat" />
    </main>

    <AppFooter />

    <!-- Hidden file input -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".bpmn,.xml"
      style="display: none"
      @change="(e) => e.target.files?.[0] && handleOpenFile(e.target.files[0])"
    />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
