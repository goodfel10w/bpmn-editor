import { BLANK_DIAGRAM } from '../utils/bpmnTemplates'
import type {
  TransformCommand,
  CommandResult,
  AddShapeCommand,
  AddSequenceFlowCommand,
  UpdateElementCommand,
  RemoveElementCommand,
  BpmnModelerServices
} from '../types'
import { CANVAS } from '../constants'

/**
 * Service for programmatically transforming BPMN diagrams
 * based on AI-generated commands
 */
export class BpmnTransformService {
  private modeler: unknown

  constructor(modeler: unknown) {
    this.modeler = modeler
  }

  /**
   * Get bpmn-js services from the modeler
   */
  private getServices(): BpmnModelerServices {
    const modeler = this.modeler as { get: (name: string) => unknown }
    return {
      elementFactory: modeler.get('elementFactory'),
      elementRegistry: modeler.get('elementRegistry'),
      modeling: modeler.get('modeling'),
      canvas: modeler.get('canvas'),
      bpmnFactory: modeler.get('bpmnFactory'),
      commandStack: modeler.get('commandStack'),
      eventBus: modeler.get('eventBus'),
      selection: modeler.get('selection')
    }
  }

  /**
   * Get the process element (root element for adding shapes)
   */
  private getProcess(): unknown {
    const { elementRegistry } = this.getServices()
    const registry = elementRegistry as { find: (fn: (el: { type: string }) => boolean) => unknown }
    return registry.find((el) => el.type === 'bpmn:Process')
  }

  /**
   * Get a summary of current diagram elements for AI context
   * @returns JSON string describing all diagram elements
   */
  getDiagramContext(): string {
    const { elementRegistry } = this.getServices()
    const elements: Array<{
      id: string
      type: string
      name: string
      x?: number
      y?: number
      sourceId?: string
      targetId?: string
    }> = []

    const registry = elementRegistry as {
      forEach: (fn: (element: {
        id: string
        type: string
        x?: number
        y?: number
        businessObject?: { name?: string }
        source?: { id: string }
        target?: { id: string }
      }) => void) => void
    }

    registry.forEach((element) => {
      // Skip process and collaboration elements
      if (element.type === 'bpmn:Process' || element.type === 'bpmn:Collaboration') {
        return
      }
      // Skip labels
      if (element.type === 'label') {
        return
      }

      const info: {
        id: string
        type: string
        name: string
        x?: number
        y?: number
        sourceId?: string
        targetId?: string
      } = {
        id: element.id,
        type: element.type,
        name: element.businessObject?.name || ''
      }

      if (element.x !== undefined) {
        info.x = Math.round(element.x)
        info.y = Math.round(element.y!)
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
   * @param commands - Array of commands to execute
   * @returns Array of results for each command
   */
  async executeCommands(commands: TransformCommand[]): Promise<CommandResult[]> {
    const results: CommandResult[] = []

    for (const command of commands) {
      try {
        const result = await this.executeCommand(command)
        results.push({ success: true, command, result })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push({ success: false, command, error: errorMessage })
        console.error('Command failed:', command, error)
      }
    }

    return results
  }

  /**
   * Execute a single transformation command
   * @param command - Command to execute
   * @returns Result of the command execution
   */
  async executeCommand(command: TransformCommand): Promise<Record<string, unknown>> {
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
        throw new Error(`Unknown command action: ${(command as { action: string }).action}`)
    }
  }

  /**
   * Clear the diagram and start fresh
   */
  private async clearDiagram(): Promise<{ cleared: boolean }> {
    const modeler = this.modeler as { importXML: (xml: string) => Promise<void> }
    await modeler.importXML(BLANK_DIAGRAM)
    return { cleared: true }
  }

  /**
   * Add a Task element
   */
  private addTask(command: AddShapeCommand): { id: string; type: string } {
    return this.addShape('bpmn:Task', command, 'Task')
  }

  /**
   * Add a Start Event
   */
  private addStartEvent(command: AddShapeCommand): { id: string; type: string } {
    return this.addShape('bpmn:StartEvent', command, '')
  }

  /**
   * Add an End Event
   */
  private addEndEvent(command: AddShapeCommand): { id: string; type: string } {
    return this.addShape('bpmn:EndEvent', command, '')
  }

  /**
   * Add an Exclusive Gateway
   */
  private addExclusiveGateway(command: AddShapeCommand): { id: string; type: string } {
    return this.addShape('bpmn:ExclusiveGateway', command, '')
  }

  /**
   * Add a Parallel Gateway
   */
  private addParallelGateway(command: AddShapeCommand): { id: string; type: string } {
    return this.addShape('bpmn:ParallelGateway', command, '')
  }

  /**
   * Generic method to add a shape element
   */
  private addShape(
    type: string,
    { id, name, x = CANVAS.DEFAULT_X, y = CANVAS.DEFAULT_Y }: AddShapeCommand,
    defaultName: string
  ): { id: string; type: string } {
    const { elementFactory, modeling, bpmnFactory } = this.getServices()
    const process = this.getProcess()

    const factory = bpmnFactory as {
      create: (type: string, attrs: Record<string, unknown>) => unknown
    }
    const businessObject = factory.create(type, {
      id,
      name: name || defaultName
    })

    const elemFactory = elementFactory as {
      createShape: (attrs: Record<string, unknown>) => { id: string }
    }
    const shape = elemFactory.createShape({
      type,
      businessObject,
      x,
      y
    })

    const model = modeling as {
      createShape: (shape: unknown, position: { x: number; y: number }, parent: unknown) => void
    }
    model.createShape(shape, { x, y }, process)

    return { id: shape.id, type }
  }

  /**
   * Add a Sequence Flow between two elements
   */
  private addSequenceFlow(command: AddSequenceFlowCommand): { id: string; type: string } {
    const { sourceId, targetId } = command
    const { elementRegistry, modeling } = this.getServices()

    const registry = elementRegistry as { get: (id: string) => unknown | undefined }
    const source = registry.get(sourceId)
    const target = registry.get(targetId)

    if (!source) {
      throw new Error(`Source element not found: ${sourceId}`)
    }
    if (!target) {
      throw new Error(`Target element not found: ${targetId}`)
    }

    const model = modeling as { connect: (source: unknown, target: unknown) => { id: string } }
    const connection = model.connect(source, target)

    return { id: connection.id, type: 'bpmn:SequenceFlow' }
  }

  /**
   * Update element properties
   */
  private updateElement(command: UpdateElementCommand): { id: string; updated: string[] } {
    const { id, properties } = command
    const { elementRegistry, modeling } = this.getServices()

    const registry = elementRegistry as { get: (id: string) => unknown | undefined }
    const element = registry.get(id)

    if (!element) {
      throw new Error(`Element not found: ${id}`)
    }

    const model = modeling as {
      updateProperties: (element: unknown, properties: Record<string, unknown>) => void
    }
    model.updateProperties(element, properties)

    return { id, updated: Object.keys(properties) }
  }

  /**
   * Remove an element from the diagram
   */
  private removeElement(command: RemoveElementCommand): { id: string; removed: boolean } {
    const { id } = command
    const { elementRegistry, modeling } = this.getServices()

    const registry = elementRegistry as { get: (id: string) => unknown | undefined }
    const element = registry.get(id)

    if (!element) {
      throw new Error(`Element not found: ${id}`)
    }

    const model = modeling as { removeElements: (elements: unknown[]) => void }
    model.removeElements([element])

    return { id, removed: true }
  }
}
