import { STORAGE_KEYS } from '../constants'

/**
 * Security utilities for handling sensitive data
 * Note: localStorage is inherently insecure for secrets.
 * This provides obfuscation, not true encryption.
 * For production, use secure server-side session management.
 */

// Simple obfuscation key (not cryptographically secure)
const OBFUSCATION_KEY = 'bpmn-editor-v1'

/**
 * Obfuscate a string (basic XOR obfuscation)
 * WARNING: This is NOT encryption, just obfuscation to prevent casual inspection
 */
function obfuscate(text: string): string {
  if (!text) return ''

  let result = ''
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)
    result += String.fromCharCode(charCode)
  }
  return btoa(result)
}

/**
 * Deobfuscate a string
 */
function deobfuscate(encoded: string): string {
  if (!encoded) return ''

  try {
    const decoded = atob(encoded)
    let result = ''
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)
      result += String.fromCharCode(charCode)
    }
    return result
  } catch {
    // If decoding fails, return empty string
    return ''
  }
}

/**
 * Securely store API key with obfuscation
 */
export function storeApiKey(key: string): void {
  if (!key) {
    localStorage.removeItem(STORAGE_KEYS.API_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEYS.API_KEY, obfuscate(key))
}

/**
 * Retrieve and deobfuscate API key
 */
export function retrieveApiKey(): string {
  const stored = localStorage.getItem(STORAGE_KEYS.API_KEY)
  if (!stored) return ''

  // Check if it's already obfuscated (starts with valid base64)
  // Handle migration from plaintext storage
  if (stored.startsWith('sk-')) {
    // Migrate old plaintext key
    storeApiKey(stored)
    return stored
  }

  return deobfuscate(stored)
}

/**
 * Clear all stored credentials
 */
export function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEYS.API_KEY)
  localStorage.removeItem(STORAGE_KEYS.API_ENDPOINT)
  localStorage.removeItem(STORAGE_KEYS.MODEL_NAME)
}

/**
 * Store non-sensitive setting
 */
export function storeSetting(key: string, value: string): void {
  if (value) {
    localStorage.setItem(key, value)
  } else {
    localStorage.removeItem(key)
  }
}

/**
 * Retrieve non-sensitive setting
 */
export function retrieveSetting(key: string, defaultValue: string = ''): string {
  return localStorage.getItem(key) || defaultValue
}

/**
 * Mask API key for display (show first and last 4 characters)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 12) return '••••••••'

  const first = key.slice(0, 4)
  const last = key.slice(-4)
  const middle = '•'.repeat(Math.min(key.length - 8, 20))

  return `${first}${middle}${last}`
}

/**
 * Check if API key appears to be configured
 */
export function hasApiKey(): boolean {
  const key = retrieveApiKey()
  return key.length > 10
}
