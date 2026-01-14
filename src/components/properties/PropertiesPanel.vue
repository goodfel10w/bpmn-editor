<script setup>
import { ref, watch, inject } from 'vue'
import { useEditorStore } from '../../stores/editorStore'
import { debounce } from 'lodash-es'
import { formatElementType } from '../../utils/exportUtils'

const store = useEditorStore()
const { updateElementProperty } = inject('bpmnModeler', {})

const localName = ref('')
const localId = ref('')
const localDocumentation = ref('')

// Watch for selection changes and update local state
watch(
  () => store.selectedElement,
  (element) => {
    if (element?.businessObject) {
      const bo = element.businessObject
      localName.value = bo.name || ''
      localId.value = bo.id || ''

      // Get documentation
      const docs = bo.documentation?.[0]
      localDocumentation.value = docs?.text || ''
    } else {
      localName.value = ''
      localId.value = ''
      localDocumentation.value = ''
    }
  },
  { immediate: true }
)

// Debounced update functions
const debouncedUpdateName = debounce((value) => {
  if (store.selectedElement && updateElementProperty) {
    updateElementProperty(store.selectedElement.id, 'name', value)
  }
}, 300)

const debouncedUpdateId = debounce((value) => {
  if (store.selectedElement && updateElementProperty) {
    updateElementProperty(store.selectedElement.id, 'id', value)
  }
}, 300)

function handleNameInput(event) {
  localName.value = event.target.value
  debouncedUpdateName(event.target.value)
}

function handleIdInput(event) {
  localId.value = event.target.value
  debouncedUpdateId(event.target.value)
}

function getElementTypeColor(type) {
  if (!type) return 'default'
  if (type.includes('Event')) return 'event'
  if (type.includes('Task')) return 'task'
  if (type.includes('Gateway')) return 'gateway'
  if (type.includes('Flow')) return 'flow'
  return 'default'
}

function getAttributes(businessObject) {
  if (!businessObject) return []

  const skipKeys = ['id', 'name', '$type', 'documentation', 'di', 'incoming', 'outgoing', '$parent', '$attrs']
  const attrs = []

  for (const [key, value] of Object.entries(businessObject)) {
    if (!skipKeys.includes(key) && value !== undefined && value !== null && typeof value !== 'object') {
      attrs.push({ key, value: String(value) })
    }
  }

  return attrs
}
</script>

<template>
  <aside class="properties-panel panel">
    <div class="panel-header">
      <span>Properties</span>
    </div>

    <div v-if="store.selectedElement" class="panel-content">
      <div class="element-header">
        <span
          class="element-type-badge"
          :class="getElementTypeColor(store.selectedElement.type)"
        >
          {{ formatElementType(store.selectedElement.type) }}
        </span>
      </div>

      <div class="property-group">
        <label class="label" for="prop-name">Name</label>
        <input
          id="prop-name"
          type="text"
          class="input"
          :value="localName"
          @input="handleNameInput"
          placeholder="Enter name..."
        />
      </div>

      <div class="property-group">
        <label class="label" for="prop-id">ID</label>
        <input
          id="prop-id"
          type="text"
          class="input"
          :value="localId"
          @input="handleIdInput"
          placeholder="Enter ID..."
        />
      </div>

      <div class="property-group">
        <label class="label" for="prop-documentation">Documentation</label>
        <textarea
          id="prop-documentation"
          class="input"
          :value="localDocumentation"
          placeholder="Add documentation..."
          rows="4"
          disabled
        ></textarea>
        <span class="hint">Documentation editing coming soon</span>
      </div>

      <template v-if="getAttributes(store.selectedElement.businessObject).length > 0">
        <div class="divider-horizontal"></div>

        <div class="attributes-section">
          <h4 class="section-title">Attributes</h4>
          <div
            v-for="attr in getAttributes(store.selectedElement.businessObject)"
            :key="attr.key"
            class="attribute-row"
          >
            <span class="attribute-key">{{ attr.key }}</span>
            <span class="attribute-value">{{ attr.value }}</span>
          </div>
        </div>
      </template>
    </div>

    <div v-else class="panel-content empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h8M12 8v8" stroke-dasharray="2 2" />
        </svg>
      </div>
      <p class="empty-text">Select an element to view and edit its properties</p>
    </div>
  </aside>
</template>

<style scoped>
.properties-panel {
  width: var(--properties-width);
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--gray-200);
  overflow: hidden;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

.element-header {
  margin-bottom: var(--space-4);
}

.element-type-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius);
  background-color: var(--gray-100);
  color: var(--gray-700);
}

.element-type-badge.event {
  background-color: #fef3c7;
  color: #92400e;
}

.element-type-badge.task {
  background-color: #dbeafe;
  color: #1e40af;
}

.element-type-badge.gateway {
  background-color: #fce7f3;
  color: #9d174d;
}

.element-type-badge.flow {
  background-color: #d1fae5;
  color: #065f46;
}

.property-group {
  margin-bottom: var(--space-4);
}

.hint {
  display: block;
  margin-top: var(--space-1);
  font-size: 11px;
  color: var(--gray-500);
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-600);
  margin-bottom: var(--space-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.attributes-section {
  margin-top: var(--space-3);
}

.attribute-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--gray-100);
}

.attribute-row:last-child {
  border-bottom: none;
}

.attribute-key {
  font-size: 12px;
  color: var(--gray-600);
  font-weight: 500;
}

.attribute-value {
  font-size: 12px;
  color: var(--gray-900);
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--gray-500);
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: var(--space-4);
  color: var(--gray-300);
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-text {
  font-size: 13px;
  max-width: 200px;
  line-height: 1.6;
}
</style>
