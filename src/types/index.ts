/**
 * Type definitions for the BPMN Editor application
 */

// ============================================================================
// BPMN Element Types
// ============================================================================

export type BpmnElementType =
  | 'bpmn:Process'
  | 'bpmn:Collaboration'
  | 'bpmn:Task'
  | 'bpmn:StartEvent'
  | 'bpmn:EndEvent'
  | 'bpmn:ExclusiveGateway'
  | 'bpmn:ParallelGateway'
  | 'bpmn:SequenceFlow'
  | 'label'

export interface BpmnBusinessObject {
  id: string
  name?: string
  $type: string
  [key: string]: unknown
}

export interface BpmnElement {
  id: string
  type: BpmnElementType
  businessObject: BpmnBusinessObject
  x?: number
  y?: number
  width?: number
  height?: number
  source?: BpmnElement
  target?: BpmnElement
}

export interface SelectedElement {
  id: string
  type: BpmnElementType
  businessObject: BpmnBusinessObject
}

// ============================================================================
// Chat Types
// ============================================================================

export type ChatMessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: number
  role: ChatMessageRole
  content: string
  timestamp: Date
}

// ============================================================================
// AI Transform Command Types
// ============================================================================

export type TransformAction =
  | 'clear'
  | 'addTask'
  | 'addStartEvent'
  | 'addEndEvent'
  | 'addExclusiveGateway'
  | 'addParallelGateway'
  | 'addSequenceFlow'
  | 'updateElement'
  | 'removeElement'

export interface BaseCommand {
  action: TransformAction
}

export interface ClearCommand extends BaseCommand {
  action: 'clear'
}

export interface AddShapeCommand extends BaseCommand {
  action: 'addTask' | 'addStartEvent' | 'addEndEvent' | 'addExclusiveGateway' | 'addParallelGateway'
  id: string
  name?: string
  x?: number
  y?: number
}

export interface AddSequenceFlowCommand extends BaseCommand {
  action: 'addSequenceFlow'
  sourceId: string
  targetId: string
}

export interface UpdateElementCommand extends BaseCommand {
  action: 'updateElement'
  id: string
  properties: Record<string, unknown>
}

export interface RemoveElementCommand extends BaseCommand {
  action: 'removeElement'
  id: string
}

export type TransformCommand =
  | ClearCommand
  | AddShapeCommand
  | AddSequenceFlowCommand
  | UpdateElementCommand
  | RemoveElementCommand

export interface CommandResult {
  success: boolean
  command: TransformCommand
  result?: Record<string, unknown>
  error?: string
}

export interface AiResponse {
  message: string
  commands: TransformCommand[]
}

// ============================================================================
// API Configuration Types
// ============================================================================

export interface AiSettings {
  apiKey: string
  apiEndpoint: string
  modelName: string
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: number
  type: NotificationType
  title: string
  message?: string
  duration?: number
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'bpmn' | 'xml' | 'svg' | 'png'

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface FileValidation {
  maxSize: number
  allowedExtensions: string[]
}

// ============================================================================
// BPMN-js Service Types (simplified for external library)
// ============================================================================

export interface BpmnModelerServices {
  elementFactory: unknown
  elementRegistry: unknown
  modeling: unknown
  canvas: unknown
  bpmnFactory: unknown
  commandStack: unknown
  eventBus: unknown
  selection: unknown
}
