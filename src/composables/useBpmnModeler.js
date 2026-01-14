import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import BpmnModeler from 'bpmn-js/lib/Modeler'
import { useEditorStore } from '../stores/editorStore'
import { BLANK_DIAGRAM } from '../utils/bpmnTemplates'

export function useBpmnModeler(containerRef) {
  const store = useEditorStore()
  const modeler = shallowRef(null)
  const isReady = ref(false)

  function initModeler() {
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
      const commandStack = modeler.value.get('commandStack')
      store.setUndoRedo(commandStack.canUndo(), commandStack.canRedo())
      store.markDirty()
    })

    // Track selection changes
    eventBus.on('selection.changed', (e) => {
      const selection = e.newSelection[0]
      if (selection && selection.type !== 'bpmn:Process' && selection.type !== 'bpmn:Collaboration') {
        store.setSelectedElement({
          id: selection.id,
          type: selection.type,
          businessObject: selection.businessObject
        })
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
    eventBus.on('import.done', (e) => {
      if (!e.error) {
        canvas.zoom('fit-viewport')
      }
    })

    isReady.value = true
  }

  async function importXML(xml) {
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

  async function exportXML() {
    if (!modeler.value) return null
    const { xml } = await modeler.value.saveXML({ format: true })
    return xml
  }

  async function exportSVG() {
    if (!modeler.value) return null
    const { svg } = await modeler.value.saveSVG()
    return svg
  }

  function createNewDiagram() {
    importXML(BLANK_DIAGRAM)
    store.setFileName(null)
    store.markClean()
  }

  function zoomIn() {
    if (!modeler.value) return
    const canvas = modeler.value.get('canvas')
    const currentZoom = canvas.zoom()
    canvas.zoom(Math.min(currentZoom * 1.2, 4))
  }

  function zoomOut() {
    if (!modeler.value) return
    const canvas = modeler.value.get('canvas')
    const currentZoom = canvas.zoom()
    canvas.zoom(Math.max(currentZoom / 1.2, 0.2))
  }

  function zoomFit() {
    if (!modeler.value) return
    const canvas = modeler.value.get('canvas')
    canvas.zoom('fit-viewport')
  }

  function zoomReset() {
    if (!modeler.value) return
    const canvas = modeler.value.get('canvas')
    canvas.zoom(1)
  }

  function undo() {
    if (!modeler.value) return
    const commandStack = modeler.value.get('commandStack')
    commandStack.undo()
  }

  function redo() {
    if (!modeler.value) return
    const commandStack = modeler.value.get('commandStack')
    commandStack.redo()
  }

  function updateElementProperty(elementId, property, value) {
    if (!modeler.value) return

    const elementRegistry = modeler.value.get('elementRegistry')
    const modeling = modeler.value.get('modeling')
    const element = elementRegistry.get(elementId)

    if (element) {
      modeling.updateProperties(element, { [property]: value })
    }
  }

  function deleteSelectedElements() {
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
