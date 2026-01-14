<script setup>
import { ref } from 'vue'
import { useEditorStore } from '../../stores/editorStore'

const store = useEditorStore()

const emit = defineEmits([
  'new',
  'open',
  'save',
  'export-xml',
  'export-svg',
  'export-png',
  'undo',
  'redo',
  'zoom-in',
  'zoom-out',
  'zoom-fit',
  'zoom-reset'
])

const fileInput = ref(null)
const showExportMenu = ref(false)

function triggerFileOpen() {
  fileInput.value?.click()
}

function handleFileSelect(event) {
  const file = event.target.files?.[0]
  if (file) {
    emit('open', file)
    event.target.value = ''
  }
}

function handleExport(format) {
  showExportMenu.value = false
  emit(`export-${format}`)
}
</script>

<template>
  <div class="app-toolbar">
    <div class="toolbar-group">
      <button class="btn btn-ghost" @click="emit('new')" title="New Diagram (Ctrl+N)">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <span>New</span>
      </button>

      <button class="btn btn-ghost" @click="triggerFileOpen" title="Open File (Ctrl+O)">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span>Open</span>
      </button>

      <input
        ref="fileInput"
        type="file"
        accept=".bpmn,.xml"
        style="display: none"
        @change="handleFileSelect"
      />

      <div class="dropdown">
        <button
          class="btn btn-ghost"
          @click="showExportMenu = !showExportMenu"
          title="Export"
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Export</span>
          <svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div v-if="showExportMenu" class="dropdown-menu" @mouseleave="showExportMenu = false">
          <button class="dropdown-item" @click="handleExport('xml')">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Export as BPMN
          </button>
          <button class="dropdown-item" @click="handleExport('svg')">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Export as SVG
          </button>
          <button class="dropdown-item" @click="handleExport('png')">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Export as PNG
          </button>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="toolbar-group">
      <button
        class="btn btn-ghost btn-icon"
        :disabled="!store.canUndo"
        @click="emit('undo')"
        title="Undo (Ctrl+Z)"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
      </button>

      <button
        class="btn btn-ghost btn-icon"
        :disabled="!store.canRedo"
        @click="emit('redo')"
        title="Redo (Ctrl+Y)"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
        </svg>
      </button>
    </div>

    <div class="divider"></div>

    <div class="toolbar-group">
      <button class="btn btn-ghost btn-icon" @click="emit('zoom-out')" title="Zoom Out">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>

      <span class="zoom-display">{{ store.zoomPercent }}%</span>

      <button class="btn btn-ghost btn-icon" @click="emit('zoom-in')" title="Zoom In">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>

      <button class="btn btn-ghost btn-icon" @click="emit('zoom-fit')" title="Fit to Viewport">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </button>

      <button class="btn btn-ghost btn-icon" @click="emit('zoom-reset')" title="Reset Zoom">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </button>
    </div>

    <div class="toolbar-spacer"></div>

    <div class="toolbar-group">
      <button class="btn btn-primary" @click="emit('save')" title="Save (Ctrl+S)">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
        <span>Save</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.app-toolbar {
  display: flex;
  align-items: center;
  height: var(--toolbar-height);
  padding: 0 var(--space-3);
  background-color: var(--surface);
  border-bottom: 1px solid var(--gray-200);
  gap: var(--space-1);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.toolbar-spacer {
  flex: 1;
}

.zoom-display {
  min-width: 48px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--gray-600);
}

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  min-width: 180px;
  padding: var(--space-1);
  background-color: var(--surface);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: 13px;
  color: var(--gray-700);
  border-radius: var(--radius);
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: var(--gray-100);
}
</style>
