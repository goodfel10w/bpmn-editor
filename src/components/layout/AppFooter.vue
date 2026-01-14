<script setup>
import { useEditorStore } from '../../stores/editorStore'

const store = useEditorStore()
</script>

<template>
  <footer class="app-footer">
    <div class="footer-left">
      <span v-if="store.isDirty" class="status-badge modified">
        Modified
      </span>
      <span v-else class="status-badge">
        Saved
      </span>
    </div>

    <div class="footer-center">
      <span v-if="store.selectedElement" class="selection-info">
        {{ store.selectedElement.type.replace('bpmn:', '') }}: {{ store.selectedElement.id }}
      </span>
    </div>

    <div class="footer-right">
      <span class="zoom-info">
        Zoom: {{ store.zoomPercent }}%
      </span>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--footer-height);
  padding: 0 var(--space-4);
  background-color: var(--gray-100);
  border-top: 1px solid var(--gray-200);
  font-size: 11px;
  color: var(--gray-600);
}

.footer-left,
.footer-center,
.footer-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.footer-left {
  flex: 1;
}

.footer-center {
  flex: 2;
  justify-content: center;
}

.footer-right {
  flex: 1;
  justify-content: flex-end;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 500;
  border-radius: 3px;
  background-color: var(--gray-200);
  color: var(--gray-600);
}

.status-badge.modified {
  background-color: var(--primary-100);
  color: var(--primary-700);
}

.selection-info {
  color: var(--gray-500);
}

.zoom-info {
  font-weight: 500;
}
</style>
