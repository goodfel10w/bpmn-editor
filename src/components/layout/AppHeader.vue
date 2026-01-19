<script setup>
import { useEditorStore } from '../../stores/editorStore'

const store = useEditorStore()
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8" cy="8" r="2" fill="currentColor" />
          <circle cx="16" cy="16" r="2" fill="currentColor" />
          <path d="M10 8h6M8 10v6" />
        </svg>
        <span class="logo-text">BPMN Editor</span>
      </div>
    </div>

    <div class="header-center">
      <span v-if="store.currentFileName" class="file-name">
        {{ store.currentFileName }}
        <span v-if="store.isDirty" class="modified-indicator">*</span>
      </span>
      <span v-else class="file-name untitled">Untitled Diagram</span>
    </div>

    <div class="header-right">
      <div class="header-actions">
        <button
          class="btn btn-ghost btn-icon"
          @click="store.togglePalette"
          :class="{ active: store.showPalette }"
          title="Toggle Palette"
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="18" rx="1" />
            <path d="M14 3h7M14 9h7M14 15h7" />
          </svg>
        </button>
        <button
          class="btn btn-ghost btn-icon"
          @click="store.toggleProperties"
          :class="{ active: store.showProperties }"
          title="Toggle Properties"
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="14" y="3" width="7" height="18" rx="1" />
            <path d="M3 3h7M3 9h7M3 15h7" />
          </svg>
        </button>
        <div class="divider-vertical"></div>
        <button
          class="btn btn-ghost btn-icon"
          @click="store.toggleChat"
          :class="{ active: store.showChat }"
          title="AI Assistant"
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
            <circle cx="9" cy="10" r="1" fill="currentColor" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 var(--space-4);
  background-color: var(--surface);
  border-bottom: 1px solid var(--gray-200);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--primary-600);
}

.logo-text {
  font-weight: 600;
  font-size: 15px;
  color: var(--gray-900);
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.file-name {
  font-size: 13px;
  color: var(--gray-700);
}

.file-name.untitled {
  color: var(--gray-500);
  font-style: italic;
}

.modified-indicator {
  color: var(--primary-600);
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.btn.active {
  background-color: var(--primary-100);
  color: var(--primary-700);
}

.divider-vertical {
  width: 1px;
  height: 20px;
  background-color: var(--gray-300);
  margin: 0 var(--space-1);
}
</style>
