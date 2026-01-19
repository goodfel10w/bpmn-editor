import type { ValidationResult, FileValidation, TransformCommand, TransformAction } from '../types'
import { FILE_CONFIG } from '../constants'

/**
 * Validation utilities for input sanitization and security
 */

// ============================================================================
// File Validation
// ============================================================================

const DEFAULT_FILE_VALIDATION: FileValidation = {
  maxSize: FILE_CONFIG.MAX_FILE_SIZE,
  allowedExtensions: FILE_CONFIG.ALLOWED_EXTENSIONS
}

/**
 * Validate a file for import
 */
export function validateFile(
  file: File,
  options: Partial<FileValidation> = {}
): ValidationResult {
  const config = { ...DEFAULT_FILE_VALIDATION, ...options }
  const errors: string[] = []

  // Check file exists
  if (!file) {
    return { valid: false, errors: ['No file provided'] }
  }

  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024))
    errors.push(`File size exceeds maximum of ${maxSizeMB}MB`)
  }

  // Check file extension
  const extension = getFileExtension(file.name)
  if (!config.allowedExtensions.includes(extension)) {
    errors.push(`Invalid file type. Allowed types: ${config.allowedExtensions.join(', ')}`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get file extension including the dot
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.slice(lastDot).toLowerCase() : ''
}

// ============================================================================
// String Validation & Sanitization
// ============================================================================

/**
 * Sanitize a string to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (!input) return ''

  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

/**
 * Validate and sanitize user message input
 */
export function validateMessage(message: string): ValidationResult {
  const errors: string[] = []

  if (!message || typeof message !== 'string') {
    return { valid: false, errors: ['Message is required'] }
  }

  const trimmed = message.trim()
  if (trimmed.length === 0) {
    errors.push('Message cannot be empty')
  }

  if (trimmed.length > 10000) {
    errors.push('Message exceeds maximum length of 10,000 characters')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================================================
// API Key Validation
// ============================================================================

/**
 * Validate API key format (basic check, not verification)
 */
export function validateApiKey(key: string): ValidationResult {
  const errors: string[] = []

  if (!key || typeof key !== 'string') {
    return { valid: false, errors: ['API key is required'] }
  }

  const trimmed = key.trim()
  if (trimmed.length < 20) {
    errors.push('API key appears to be too short')
  }

  // Check for common placeholder patterns
  const placeholders = ['your-api-key', 'api-key-here', 'sk-xxx', 'ENTER_KEY']
  if (placeholders.some((p) => trimmed.toLowerCase().includes(p))) {
    errors.push('Please enter a valid API key')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================================================
// Transform Command Validation
// ============================================================================

const VALID_ACTIONS: TransformAction[] = [
  'clear',
  'addTask',
  'addStartEvent',
  'addEndEvent',
  'addExclusiveGateway',
  'addParallelGateway',
  'addSequenceFlow',
  'updateElement',
  'removeElement'
]

/**
 * Validate a transform command from AI
 */
export function validateCommand(command: unknown): ValidationResult {
  const errors: string[] = []

  if (!command || typeof command !== 'object') {
    return { valid: false, errors: ['Invalid command format'] }
  }

  const cmd = command as Record<string, unknown>

  // Check action
  if (!cmd.action || typeof cmd.action !== 'string') {
    errors.push('Command missing action')
  } else if (!VALID_ACTIONS.includes(cmd.action as TransformAction)) {
    errors.push(`Invalid action: ${cmd.action}`)
  }

  // Validate based on action type
  if (cmd.action === 'addSequenceFlow') {
    if (!cmd.sourceId || typeof cmd.sourceId !== 'string') {
      errors.push('addSequenceFlow requires sourceId')
    }
    if (!cmd.targetId || typeof cmd.targetId !== 'string') {
      errors.push('addSequenceFlow requires targetId')
    }
  }

  if (['addTask', 'addStartEvent', 'addEndEvent', 'addExclusiveGateway', 'addParallelGateway'].includes(cmd.action as string)) {
    if (!cmd.id || typeof cmd.id !== 'string') {
      errors.push(`${cmd.action} requires id`)
    }
    // Validate coordinates are numbers if provided
    if (cmd.x !== undefined && typeof cmd.x !== 'number') {
      errors.push('x coordinate must be a number')
    }
    if (cmd.y !== undefined && typeof cmd.y !== 'number') {
      errors.push('y coordinate must be a number')
    }
  }

  if (cmd.action === 'updateElement' || cmd.action === 'removeElement') {
    if (!cmd.id || typeof cmd.id !== 'string') {
      errors.push(`${cmd.action} requires id`)
    }
  }

  if (cmd.action === 'updateElement') {
    if (!cmd.properties || typeof cmd.properties !== 'object') {
      errors.push('updateElement requires properties object')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate an array of transform commands
 */
export function validateCommands(commands: unknown[]): ValidationResult {
  const errors: string[] = []

  if (!Array.isArray(commands)) {
    return { valid: false, errors: ['Commands must be an array'] }
  }

  commands.forEach((cmd, index) => {
    const result = validateCommand(cmd)
    if (!result.valid) {
      errors.push(`Command ${index + 1}: ${result.errors.join(', ')}`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================================================
// URL Validation
// ============================================================================

/**
 * Validate API endpoint URL
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = []

  if (!url || typeof url !== 'string') {
    return { valid: false, errors: ['URL is required'] }
  }

  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      errors.push('URL must use http or https protocol')
    }
  } catch {
    errors.push('Invalid URL format')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
