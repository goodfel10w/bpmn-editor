/**
 * Application constants
 * Centralizes magic numbers and configuration values
 */

// ============================================================================
// Zoom Configuration
// ============================================================================

export const ZOOM = {
  /** Zoom multiplier for zoom in/out operations */
  STEP_MULTIPLIER: 1.2,
  /** Maximum zoom level */
  MAX_LEVEL: 4,
  /** Minimum zoom level */
  MIN_LEVEL: 0.2,
  /** Default zoom level */
  DEFAULT_LEVEL: 1
} as const

// ============================================================================
// Canvas Positioning
// ============================================================================

export const CANVAS = {
  /** Default X position for new elements */
  DEFAULT_X: 200,
  /** Default Y position for new elements */
  DEFAULT_Y: 200,
  /** Horizontal spacing between elements */
  ELEMENT_SPACING_X: 150,
  /** Vertical offset for parallel branches */
  BRANCH_OFFSET_Y: 100
} as const

// ============================================================================
// AI Service Configuration
// ============================================================================

export const AI_CONFIG = {
  /** Default API endpoint */
  DEFAULT_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
  /** Default model name */
  DEFAULT_MODEL: 'gpt-4o-mini',
  /** Temperature for AI responses */
  TEMPERATURE: 0.7,
  /** Maximum tokens for AI response */
  MAX_TOKENS: 2000
} as const

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  API_KEY: 'bpmn_ai_api_key',
  API_ENDPOINT: 'bpmn_ai_endpoint',
  MODEL_NAME: 'bpmn_ai_model'
} as const

// ============================================================================
// File Configuration
// ============================================================================

export const FILE_CONFIG = {
  /** Default filename for new diagrams */
  DEFAULT_FILENAME: 'diagram.bpmn',
  /** Allowed file extensions for import */
  ALLOWED_EXTENSIONS: ['.bpmn', '.xml'],
  /** Maximum file size in bytes (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024
} as const

// ============================================================================
// Export Configuration
// ============================================================================

export const EXPORT_CONFIG = {
  /** Scale factor for PNG export */
  PNG_SCALE: 2,
  /** MIME types for exports */
  MIME_TYPES: {
    XML: 'application/xml',
    SVG: 'image/svg+xml',
    PNG: 'image/png'
  }
} as const

// ============================================================================
// Notification Configuration
// ============================================================================

export const NOTIFICATION = {
  /** Default duration for notifications (ms) */
  DEFAULT_DURATION: 5000,
  /** Duration for error notifications (ms) */
  ERROR_DURATION: 8000,
  /** Maximum notifications shown at once */
  MAX_VISIBLE: 5
} as const

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

export const KEYBOARD = {
  CTRL_N: { key: 'n', ctrl: true },
  CTRL_O: { key: 'o', ctrl: true },
  CTRL_S: { key: 's', ctrl: true },
  CTRL_Z: { key: 'z', ctrl: true },
  CTRL_Y: { key: 'y', ctrl: true },
  DELETE: { key: 'Delete', ctrl: false },
  BACKSPACE: { key: 'Backspace', ctrl: false }
} as const

// ============================================================================
// UI Configuration
// ============================================================================

export const UI = {
  /** Time format options for chat messages */
  TIME_FORMAT: {
    hour: '2-digit' as const,
    minute: '2-digit' as const
  }
} as const
