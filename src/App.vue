<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from './stores/editorStore'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts'
import { useNotifications } from './composables/useNotifications'
import { downloadFile, downloadBlob, svgToPng, generateExportFilename } from './utils/exportUtils'
import { validateFile } from './utils/validation'
import { FILE_CONFIG, EXPORT_CONFIG } from './constants'
import AppHeader from './components/layout/AppHeader.vue'
import AppToolbar from './components/layout/AppToolbar.vue'
import AppFooter from './components/layout/AppFooter.vue'
import BpmnCanvas from './components/editor/BpmnCanvas.vue'
import PropertiesPanel from './components/properties/PropertiesPanel.vue'
import ChatPanel from './components/chat/ChatPanel.vue'
import NotificationContainer from './components/common/NotificationContainer.vue'

const store = useEditorStore()
const { confirm, error: showError, success: showSuccess } = useNotifications()

const canvasRef = ref<InstanceType<typeof BpmnCanvas> | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// File operations
async function handleNew(): Promise<void> {
  if (store.isDirty) {
    const confirmed = await confirm(
      'Unsaved Changes',
      'You have unsaved changes. Create new diagram anyway?'
    )
    if (!confirmed) return
  }
  canvasRef.value?.createNewDiagram()
  store.setFileName(null)
  store.markClean()
  showSuccess('New Diagram', 'Created a new blank diagram')
}

function handleOpenTrigger(): void {
  fileInputRef.value?.click()
}

async function handleOpenFile(file: File): Promise<void> {
  // Validate file
  const validation = validateFile(file)
  if (!validation.valid) {
    showError('Invalid File', validation.errors.join(', '))
    return
  }

  if (store.isDirty) {
    const confirmed = await confirm(
      'Unsaved Changes',
      'You have unsaved changes. Open another file anyway?'
    )
    if (!confirmed) return
  }

  const reader = new FileReader()
  reader.onload = async (event): Promise<void> => {
    try {
      const content = event.target?.result
      if (typeof content === 'string') {
        await canvasRef.value?.importXML(content)
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

async function handleSave(): Promise<void> {
  const xml = await canvasRef.value?.exportXML()
  if (xml) {
    const filename = store.currentFileName || FILE_CONFIG.DEFAULT_FILENAME
    downloadFile(xml, filename, EXPORT_CONFIG.MIME_TYPES.XML)
    store.markClean()
    showSuccess('Saved', `Diagram saved as ${filename}`)
  }
}

async function handleExportXML(): Promise<void> {
  const xml = await canvasRef.value?.exportXML()
  if (xml) {
    const filename = generateExportFilename(store.currentFileName, 'bpmn')
    downloadFile(xml, filename, EXPORT_CONFIG.MIME_TYPES.XML)
    showSuccess('Exported', `Exported as ${filename}`)
  }
}

async function handleExportSVG(): Promise<void> {
  const svg = await canvasRef.value?.exportSVG()
  if (svg) {
    const filename = generateExportFilename(store.currentFileName, 'svg')
    downloadFile(svg, filename, EXPORT_CONFIG.MIME_TYPES.SVG)
    showSuccess('Exported', `Exported as ${filename}`)
  }
}

async function handleExportPNG(): Promise<void> {
  const svg = await canvasRef.value?.exportSVG()
  if (svg) {
    try {
      const blob = await svgToPng(svg, EXPORT_CONFIG.PNG_SCALE)
      const filename = generateExportFilename(store.currentFileName, 'png')
      downloadBlob(blob, filename)
      showSuccess('Exported', `Exported as ${filename}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      showError('Export Failed', `Could not export PNG: ${message}`)
    }
  }
}

// Edit operations
function handleUndo(): void {
  canvasRef.value?.undo()
}

function handleRedo(): void {
  canvasRef.value?.redo()
}

// Zoom operations
function handleZoomIn(): void {
  canvasRef.value?.zoomIn()
}

function handleZoomOut(): void {
  canvasRef.value?.zoomOut()
}

function handleZoomFit(): void {
  canvasRef.value?.zoomFit()
}

function handleZoomReset(): void {
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
function handleBeforeUnload(e: BeforeUnloadEvent): void {
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
      @open="(file: File) => file && handleOpenFile(file)"
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
      :accept="FILE_CONFIG.ALLOWED_EXTENSIONS.join(',')"
      style="display: none"
      @change="(e: Event) => {
        const target = e.target as HTMLInputElement
        const file = target.files?.[0]
        if (file) handleOpenFile(file)
      }"
    />

    <!-- Notification system -->
    <NotificationContainer />
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
