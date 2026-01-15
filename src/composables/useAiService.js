import { ref } from 'vue'

// System prompt that explains how to generate BPMN transformation commands
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

export function useAiService() {
  const isProcessing = ref(false)
  const error = ref(null)
  const apiKey = ref(localStorage.getItem('bpmn_ai_api_key') || '')
  const apiEndpoint = ref(localStorage.getItem('bpmn_ai_endpoint') || 'https://api.openai.com/v1/chat/completions')
  const modelName = ref(localStorage.getItem('bpmn_ai_model') || 'gpt-4o-mini')

  function saveSettings(key, endpoint, model) {
    apiKey.value = key
    apiEndpoint.value = endpoint || 'https://api.openai.com/v1/chat/completions'
    modelName.value = model || 'gpt-4o-mini'

    localStorage.setItem('bpmn_ai_api_key', key)
    localStorage.setItem('bpmn_ai_endpoint', apiEndpoint.value)
    localStorage.setItem('bpmn_ai_model', modelName.value)
  }

  function clearSettings() {
    apiKey.value = ''
    localStorage.removeItem('bpmn_ai_api_key')
    localStorage.removeItem('bpmn_ai_endpoint')
    localStorage.removeItem('bpmn_ai_model')
  }

  async function sendMessage(userMessage, currentDiagramContext = '') {
    if (!apiKey.value) {
      throw new Error('API key not configured. Please set your API key in the chat settings.')
    }

    isProcessing.value = true
    error.value = null

    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
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
          'Authorization': `Bearer ${apiKey.value}`
        },
        body: JSON.stringify({
          model: modelName.value,
          messages,
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API request failed: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('No response from AI')
      }

      // Parse the JSON response
      try {
        const parsed = JSON.parse(content)
        return {
          message: parsed.message || 'Done!',
          commands: parsed.commands || []
        }
      } catch (parseError) {
        // If the response isn't valid JSON, return it as a message without commands
        return {
          message: content,
          commands: []
        }
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isProcessing.value = false
    }
  }

  return {
    isProcessing,
    error,
    apiKey,
    apiEndpoint,
    modelName,
    saveSettings,
    clearSettings,
    sendMessage
  }
}
