import { ref, readonly } from 'vue'
import type { AiResponse, TransformCommand } from '../types'
import { AI_CONFIG, STORAGE_KEYS } from '../constants'
import { storeApiKey, retrieveApiKey, storeSetting, retrieveSetting, clearCredentials } from '../utils/security'
import { validateApiKey, validateMessage, validateCommands, validateUrl } from '../utils/validation'

/**
 * System prompt that explains how to generate BPMN transformation commands
 */
const SYSTEM_PROMPT = `You are a BPMN (Business Process Model and Notation) expert assistant that helps users modify and create BPMN diagrams through natural language instructions.

When the user requests changes to a BPMN diagram, you must respond with a JSON object containing two fields:
1. "message": A brief, friendly explanation of what you're doing
2. "commands": An array of transformation commands to execute

Available commands:
- { "action": "addTask", "id": "unique_id", "name": "Task Name", "x": 200, "y": 200 }
- { "action": "addStartEvent", "id": "unique_id", "name": "Start", "x": 100, "y": 200 }
- { "action": "addEndEvent", "id": "unique_id", "name": "End", "x": 500, "y": 200 }
- { "action": "addExclusiveGateway", "id": "unique_id", "name": "Gateway Name", "x": 300, "y": 200 }
- { "action": "addParallelGateway", "id": "unique_id", "name": "Gateway Name", "x": 300, "y": 200 }
- { "action": "addSequenceFlow", "sourceId": "source_element_id", "targetId": "target_element_id" }
- { "action": "updateElement", "id": "element_id", "properties": { "name": "New Name" } }
- { "action": "removeElement", "id": "element_id" }
- { "action": "clear" } - Clears the entire diagram

Positioning guidelines:
- Start events typically at x: 150, y: 200
- Tasks are spaced ~150px apart horizontally
- End events at the far right
- Gateways are used for decision points (exclusive) or parallel execution (parallel)
- Keep y coordinates similar for horizontal flows (around 200)
- For parallel branches, offset y by ~100 (e.g., y: 150 and y: 250)

IMPORTANT: Always respond with ONLY valid JSON. No markdown, no code blocks, just the JSON object.

Example response:
{"message":"I'll create a simple approval workflow with a start event, review task, and end event.","commands":[{"action":"clear"},{"action":"addStartEvent","id":"start_1","name":"Start","x":150,"y":200},{"action":"addTask","id":"task_1","name":"Review Document","x":300,"y":200},{"action":"addEndEvent","id":"end_1","name":"End","x":450,"y":200},{"action":"addSequenceFlow","sourceId":"start_1","targetId":"task_1"},{"action":"addSequenceFlow","sourceId":"task_1","targetId":"end_1"}]}`

/**
 * Composable for managing AI service integration
 * Provides methods for communicating with OpenAI-compatible APIs
 */
export function useAiService() {
  const isProcessing = ref(false)
  const error = ref<string | null>(null)

  // Load settings from storage
  const apiKey = ref(retrieveApiKey())
  const apiEndpoint = ref(retrieveSetting(STORAGE_KEYS.API_ENDPOINT, AI_CONFIG.DEFAULT_ENDPOINT))
  const modelName = ref(retrieveSetting(STORAGE_KEYS.MODEL_NAME, AI_CONFIG.DEFAULT_MODEL))

  /**
   * Save AI service settings
   * @param key - API key
   * @param endpoint - API endpoint URL
   * @param model - Model name
   */
  function saveSettings(key: string, endpoint?: string, model?: string): void {
    const finalEndpoint = endpoint || AI_CONFIG.DEFAULT_ENDPOINT
    const finalModel = model || AI_CONFIG.DEFAULT_MODEL

    // Validate inputs
    const keyValidation = validateApiKey(key)
    if (!keyValidation.valid) {
      throw new Error(keyValidation.errors.join(', '))
    }

    const urlValidation = validateUrl(finalEndpoint)
    if (!urlValidation.valid) {
      throw new Error(urlValidation.errors.join(', '))
    }

    // Store settings
    apiKey.value = key
    apiEndpoint.value = finalEndpoint
    modelName.value = finalModel

    storeApiKey(key)
    storeSetting(STORAGE_KEYS.API_ENDPOINT, finalEndpoint)
    storeSetting(STORAGE_KEYS.MODEL_NAME, finalModel)
  }

  /**
   * Clear all AI service settings
   */
  function clearSettings(): void {
    apiKey.value = ''
    apiEndpoint.value = AI_CONFIG.DEFAULT_ENDPOINT
    modelName.value = AI_CONFIG.DEFAULT_MODEL
    clearCredentials()
  }

  /**
   * Send a message to the AI service
   * @param userMessage - The user's message
   * @param currentDiagramContext - JSON string describing current diagram elements
   * @returns AI response with message and commands
   */
  async function sendMessage(
    userMessage: string,
    currentDiagramContext: string = ''
  ): Promise<AiResponse> {
    // Validate API key
    if (!apiKey.value) {
      throw new Error('API key not configured. Please set your API key in the chat settings.')
    }

    // Validate message
    const messageValidation = validateMessage(userMessage)
    if (!messageValidation.valid) {
      throw new Error(messageValidation.errors.join(', '))
    }

    isProcessing.value = true
    error.value = null

    try {
      const messages: Array<{ role: string; content: string }> = [
        { role: 'system', content: SYSTEM_PROMPT }
      ]

      // Add context about current diagram if available
      if (currentDiagramContext) {
        messages.push({
          role: 'system',
          content: `Current diagram elements:\n${currentDiagramContext}`
        })
      }

      messages.push({ role: 'user', content: userMessage })

      const response = await fetch(apiEndpoint.value, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.value}`
        },
        body: JSON.stringify({
          model: modelName.value,
          messages,
          temperature: AI_CONFIG.TEMPERATURE,
          max_tokens: AI_CONFIG.MAX_TOKENS
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = (errorData as { error?: { message?: string } }).error?.message
        throw new Error(errorMessage || `API request failed: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('No response from AI')
      }

      // Parse the JSON response
      try {
        const parsed = JSON.parse(content) as { message?: string; commands?: unknown[] }

        // Validate commands before returning
        const commands = parsed.commands || []
        const commandValidation = validateCommands(commands)

        if (!commandValidation.valid) {
          console.warn('Invalid commands from AI:', commandValidation.errors)
          // Return message without invalid commands
          return {
            message: parsed.message || 'Done!',
            commands: []
          }
        }

        return {
          message: parsed.message || 'Done!',
          commands: commands as TransformCommand[]
        }
      } catch {
        // If the response isn't valid JSON, return it as a message without commands
        return {
          message: content,
          commands: []
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      error.value = errorMessage
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * Check if the service is configured with an API key
   */
  function isConfigured(): boolean {
    return !!apiKey.value && apiKey.value.length > 10
  }

  return {
    isProcessing: readonly(isProcessing),
    error: readonly(error),
    apiKey: readonly(apiKey),
    apiEndpoint: readonly(apiEndpoint),
    modelName: readonly(modelName),
    saveSettings,
    clearSettings,
    sendMessage,
    isConfigured
  }
}
