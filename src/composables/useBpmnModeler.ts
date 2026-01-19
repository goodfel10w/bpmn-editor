import { ref, shallowRef, onMounted, onUnmounted, type Ref, type ShallowRef } from 'vue'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import { useEditorStore } from '../stores/editorStore'
import { BLANK_DIAGRAM } from '../utils/bpmnTemplates'
import { ZOOM } from '../constants'
import type { SelectedElement } from '../types'

/**
 * Composable for managing the BPMN modeler instance
 * Provides methods for diagram manipulation, import/export, and zoom control
 *
 * @param containerRef - Reference to the DOM element that will contain the modeler
 */
export function useBpmnModeler(containerRef: Ref<HTMLElement | null>) {
  const store = useEditorStore()
  const modeler: ShallowRef<BpmnModeler | null> = shallowRef(null)
  const isReady = ref(false)

  /**
   * Initialize the BPMN modeler instance
   */
  function initModeler(): void {
    if (!containerRef.value) return

    modeler.value = new BpmnModeler({
      container: containerRef.value,
      keyboard: {
        bindTo: document
      }
    })

    const eventBus = modeler.value.get('eventBus')
    const canvas = modeler.value.get('canvas')

    // Track command stack changes for undo/redo and dirty state
    eventBus.on('commandStack.changed', () => {
      const commandStack = modeler.value!.get('commandStack')
      store.setUndoRedo(commandStack.canUndo(), commandStack.canRedo())
      store.markDirty()
    })

    // Track selection changes
    eventBus.on('selection.changed', (e: { newSelection: Array<{ id: string; type: string; businessObject: unknown }> }) => {
      const selection = e.newSelection[0]
      if (selection && selection.type !== 'bpmn:Process' && selection.type !== 'bpmn:Collaboration') {
        store.setSelectedElement({
          id: selection.id,
          type: selection.type,
          businessObject: selection.businessObject
        } as SelectedElement)
      } else {
        store.clearSelection()
      }
    })

    // Track zoom changes
    eventBus.on('canvas.viewbox.changed', () => {
      const viewbox = canvas.viewbox()
      store.setZoom(viewbox.scale)
    })

    // Import complete
    eventBus.on('import.done', (e: { error?: Error }) => {
      if (!e.error) {
        canvas.zoom('fit-viewport')
      }
    })

    isReady.value = true
  }

  /**
   * Import BPMN XML into the modeler
   * @param xml - BPMN XML string
   */
  async function importXML(xml: string): Promise<void> {
    if (!modeler.value) return

    store.setLoading(true)
    try {
      await modeler.value.importXML(xml)
      const canvas = modeler.value.get('canvas')
      canvas.zoom('fit-viewport')
    } catch (err) {
      console.error('Failed to import BPMN:', err)
      throw err
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Export the diagram as BPMN XML
   * @returns The BPMN XML string or null if export fails
   */
  async function exportXML(): Promise<string | null> {
    if (!modeler.value) return null
    const { xml } = await modeler.value.saveXML({ format: true })
    return xml ?? null
  }

  /**
   * Export the diagram as SVG
   * @returns The SVG string or null if export fails
   */
  async function exportSVG(): Promise<string | null> {
    if (!modeler.value) return null
    const { svg } = await modeler.value.saveSVG()
    return svg ?? null
  }

  /**
   * Create a new blank diagram
   */
  function createNewDiagram(): void {
    importXML(BLANK_DIAGRAM)
    store.setFileName(null)
    store.markClean()
  }

  /**
   * Zoom in by the configured step multiplier
   */
  function zoomIn(): void {
    if (!modeler.value) return
    const canvas = modeler.value.get('canvas')
    const currentZoom = canvas.zoom()
    canvas.zoom(Math.min(currentZoom * ZOOM.STEP_MULTIPLIER, ZOOM.MAX_LEVEL))
  }

  /**
   * Zoom out by the configured step multiplier
   */
  function zoomOut(): void {
    if (!modeler.value) return
    const canvas = modeler.value.get('canvas')
    const currentZoom = canvas.zoom()
    canvas.zoom(Math.max(currentZoom / ZOOM.STEP_MULTIPLIER, ZOOM.MIN_LEVEL))
  }

  /**
   * Zoom to fit the diagram in the viewport
   */
  function zoomFit(): void {
    if (!modeler.value) return
    const canvas = modeler.value.get('canvas')
    canvas.zoom('fit-viewport')
  }

  /**
   * Reset zoom to 100%
   */
  function zoomReset(): void {
    if (!modeler.value) return
    const canvas = modeler.value.get('canvas')
    canvas.zoom(ZOOM.DEFAULT_LEVEL)
  }

  /**
   * Undo the last operation
   */
  function undo(): void {
    if (!modeler.value) return
    const commandStack = modeler.value.get('commandStack')
    commandStack.undo()
  }

  /**
   * Redo the last undone operation
   */
  function redo(): void {
    if (!modeler.value) return
    const commandStack = modeler.value.get('commandStack')
    commandStack.redo()
  }

  /**
   * Update a property on a BPMN element
   * @param elementId - The element ID
   * @param property - The property name
   * @param value - The new property value
   */
  function updateElementProperty(elementId: string, property: string, value: unknown): void {
    if (!modeler.value) return

    const elementRegistry = modeler.value.get('elementRegistry')
    const modeling = modeler.value.get('modeling')
    const element = elementRegistry.get(elementId)

    if (element) {
      modeling.updateProperties(element, { [property]: value })
    }
  }

  /**
   * Delete the currently selected elements
   */
  function deleteSelectedElements(): void {
    if (!modeler.value) return

    const selection = modeler.value.get('selection')
    const modeling = modeler.value.get('modeling')
    const selected = selection.get()

    if (selected.length > 0) {
      modeling.removeElements(selected)
    }
  }

  onMounted(() => {
    initModeler()
  })

  onUnmounted(() => {
    if (modeler.value) {
      modeler.value.destroy()
      modeler.value = null
    }
  })

  return {
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
  }
}
