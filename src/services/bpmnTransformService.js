import { BLANK_DIAGRAM } from '../utils/bpmnTemplates'

/**
 * Service for programmatically transforming BPMN diagrams
 * based on AI-generated commands
 */
export class BpmnTransformService {
  constructor(modeler) {
    this.modeler = modeler
  }

  /**
   * Get bpmn-js services
   */
  getServices() {
    return {
      elementFactory: this.modeler.get('elementFactory'),
      elementRegistry: this.modeler.get('elementRegistry'),
      modeling: this.modeler.get('modeling'),
      canvas: this.modeler.get('canvas'),
      bpmnFactory: this.modeler.get('bpmnFactory')
    }
  }

  /**
   * Get the process element (root element for adding shapes)
   */
  getProcess() {
    const { elementRegistry } = this.getServices()
    const processElement = elementRegistry.find(el => el.type === 'bpmn:Process')
    return processElement
  }

  /**
   * Get a summary of current diagram elements for AI context
   */
  getDiagramContext() {
    const { elementRegistry } = this.getServices()
    const elements = []

    elementRegistry.forEach(element => {
      if (element.type === 'bpmn:Process' || element.type === 'bpmn:Collaboration') {
        return
      }
      if (element.type === 'label') {
        return
      }

      const info = {
        id: element.id,
        type: element.type,
        name: element.businessObject?.name || ''
      }

      if (element.x !== undefined) {
        info.x = Math.round(element.x)
        info.y = Math.round(element.y)
      }

      if (element.type === 'bpmn:SequenceFlow') {
        info.sourceId = element.source?.id
        info.targetId = element.target?.id
      }

      elements.push(info)
    })

    return JSON.stringify(elements, null, 2)
  }

  /**
   * Execute a list of transformation commands
   */
  async executeCommands(commands) {
    const results = []

    for (const command of commands) {
      try {
        const result = await this.executeCommand(command)
        results.push({ success: true, command, result })
      } catch (error) {
        results.push({ success: false, command, error: error.message })
        console.error('Command failed:', command, error)
      }
    }

    return results
  }

  /**
   * Execute a single transformation command
   */
  async executeCommand(command) {
    switch (command.action) {
      case 'clear':
        return this.clearDiagram()
      case 'addTask':
        return this.addTask(command)
      case 'addStartEvent':
        return this.addStartEvent(command)
      case 'addEndEvent':
        return this.addEndEvent(command)
      case 'addExclusiveGateway':
        return this.addExclusiveGateway(command)
      case 'addParallelGateway':
        return this.addParallelGateway(command)
      case 'addSequenceFlow':
        return this.addSequenceFlow(command)
      case 'updateElement':
        return this.updateElement(command)
      case 'removeElement':
        return this.removeElement(command)
      default:
        throw new Error(`Unknown command action: ${command.action}`)
    }
  }

  /**
   * Clear the diagram and start fresh
   */
  async clearDiagram() {
    await this.modeler.importXML(BLANK_DIAGRAM)
    return { cleared: true }
  }

  /**
   * Add a Task element
   */
  addTask({ id, name, x = 200, y = 200 }) {
    const { elementFactory, modeling, bpmnFactory } = this.getServices()
    const process = this.getProcess()

    const businessObject = bpmnFactory.create('bpmn:Task', {
      id,
      name: name || 'Task'
    })

    const shape = elementFactory.createShape({
      type: 'bpmn:Task',
      businessObject,
      x,
      y
    })

    modeling.createShape(shape, { x, y }, process)
    return { id: shape.id, type: 'bpmn:Task' }
  }

  /**
   * Add a Start Event
   */
  addStartEvent({ id, name, x = 100, y = 200 }) {
    const { elementFactory, modeling, bpmnFactory } = this.getServices()
    const process = this.getProcess()

    const businessObject = bpmnFactory.create('bpmn:StartEvent', {
      id,
      name: name || ''
    })

    const shape = elementFactory.createShape({
      type: 'bpmn:StartEvent',
      businessObject,
      x,
      y
    })

    modeling.createShape(shape, { x, y }, process)
    return { id: shape.id, type: 'bpmn:StartEvent' }
  }

  /**
   * Add an End Event
   */
  addEndEvent({ id, name, x = 500, y = 200 }) {
    const { elementFactory, modeling, bpmnFactory } = this.getServices()
    const process = this.getProcess()

    const businessObject = bpmnFactory.create('bpmn:EndEvent', {
      id,
      name: name || ''
    })

    const shape = elementFactory.createShape({
      type: 'bpmn:EndEvent',
      businessObject,
      x,
      y
    })

    modeling.createShape(shape, { x, y }, process)
    return { id: shape.id, type: 'bpmn:EndEvent' }
  }

  /**
   * Add an Exclusive Gateway
   */
  addExclusiveGateway({ id, name, x = 300, y = 200 }) {
    const { elementFactory, modeling, bpmnFactory } = this.getServices()
    const process = this.getProcess()

    const businessObject = bpmnFactory.create('bpmn:ExclusiveGateway', {
      id,
      name: name || ''
    })

    const shape = elementFactory.createShape({
      type: 'bpmn:ExclusiveGateway',
      businessObject,
      x,
      y
    })

    modeling.createShape(shape, { x, y }, process)
    return { id: shape.id, type: 'bpmn:ExclusiveGateway' }
  }

  /**
   * Add a Parallel Gateway
   */
  addParallelGateway({ id, name, x = 300, y = 200 }) {
    const { elementFactory, modeling, bpmnFactory } = this.getServices()
    const process = this.getProcess()

    const businessObject = bpmnFactory.create('bpmn:ParallelGateway', {
      id,
      name: name || ''
    })

    const shape = elementFactory.createShape({
      type: 'bpmn:ParallelGateway',
      businessObject,
      x,
      y
    })

    modeling.createShape(shape, { x, y }, process)
    return { id: shape.id, type: 'bpmn:ParallelGateway' }
  }

  /**
   * Add a Sequence Flow between two elements
   */
  addSequenceFlow({ sourceId, targetId }) {
    const { elementRegistry, modeling } = this.getServices()

    const source = elementRegistry.get(sourceId)
    const target = elementRegistry.get(targetId)

    if (!source) {
      throw new Error(`Source element not found: ${sourceId}`)
    }
    if (!target) {
      throw new Error(`Target element not found: ${targetId}`)
    }

    const connection = modeling.connect(source, target)
    return { id: connection.id, type: 'bpmn:SequenceFlow' }
  }

  /**
   * Update element properties
   */
  updateElement({ id, properties }) {
    const { elementRegistry, modeling } = this.getServices()

    const element = elementRegistry.get(id)
    if (!element) {
      throw new Error(`Element not found: ${id}`)
    }

    modeling.updateProperties(element, properties)
    return { id, updated: Object.keys(properties) }
  }

  /**
   * Remove an element from the diagram
   */
  removeElement({ id }) {
    const { elementRegistry, modeling } = this.getServices()

    const element = elementRegistry.get(id)
    if (!element) {
      throw new Error(`Element not found: ${id}`)
    }

    modeling.removeElements([element])
    return { id, removed: true }
  }
}
