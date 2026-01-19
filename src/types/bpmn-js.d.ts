/**
 * Type declarations for bpmn-js library
 * These are minimal type declarations to satisfy TypeScript
 */

declare module 'bpmn-js/lib/Modeler' {
  export interface ModelerOptions {
    container?: HTMLElement | string
    keyboard?: {
      bindTo?: Document | HTMLElement
    }
    additionalModules?: unknown[]
  }

  export default class BpmnModeler {
    constructor(options?: ModelerOptions)

    get(name: 'elementFactory'): unknown
    get(name: 'elementRegistry'): unknown
    get(name: 'modeling'): unknown
    get(name: 'canvas'): {
      viewbox(): { scale: number }
      zoom(level: number | 'fit-viewport'): void
    }
    get(name: 'bpmnFactory'): unknown
    get(name: 'commandStack'): {
      canUndo(): boolean
      canRedo(): boolean
      undo(): void
      redo(): void
    }
    get(name: 'eventBus'): {
      on(event: string, callback: (e: unknown) => void): void
      off(event: string, callback: (e: unknown) => void): void
    }
    get(name: 'selection'): {
      get(): unknown[]
    }
    get(name: string): unknown

    importXML(xml: string): Promise<{ warnings: string[] }>
    saveXML(options?: { format?: boolean }): Promise<{ xml?: string }>
    saveSVG(): Promise<{ svg?: string }>
    destroy(): void
  }
}
