<script setup>
import { ref, watch, nextTick, inject, computed } from 'vue'
import { useEditorStore } from '../../stores/editorStore'
import { useAiService } from '../../composables/useAiService'
import { BpmnTransformService } from '../../services/bpmnTransformService'

const store = useEditorStore()
const { modeler } = inject('bpmnModeler', {})

const {
  isProcessing,
  apiKey,
  apiEndpoint,
  modelName,
  saveSettings,
  sendMessage
} = useAiService()

const inputMessage = ref('')
const messagesContainer = ref(null)
const showSettings = ref(false)
const settingsApiKey = ref(apiKey.value)
const settingsEndpoint = ref(apiEndpoint.value)
const settingsModel = ref(modelName.value)

const hasApiKey = computed(() => !!apiKey.value)

// Scroll to bottom when messages change
watch(() => store.chatMessages.length, async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
})

async function handleSendMessage() {
  const message = inputMessage.value.trim()
  if (!message || isProcessing.value) return

  // Add user message
  store.addChatMessage({
    role: 'user',
    content: message
  })

  inputMessage.value = ''
  store.setAiProcessing(true)

  try {
    // Get diagram context for AI
    let diagramContext = ''
    if (modeler?.value) {
      const transformService = new BpmnTransformService(modeler.value)
      diagramContext = transformService.getDiagramContext()
    }

    // Send to AI
    const response = await sendMessage(message, diagramContext)

    // Add AI response message
    store.addChatMessage({
      role: 'assistant',
      content: response.message
    })

    // Execute commands if any
    if (response.commands && response.commands.length > 0 && modeler?.value) {
      const transformService = new BpmnTransformService(modeler.value)
      const results = await transformService.executeCommands(response.commands)

      // Check for errors
      const errors = results.filter(r => !r.success)
      if (errors.length > 0) {
        store.addChatMessage({
          role: 'system',
          content: `Some commands failed: ${errors.map(e => e.error).join(', ')}`
        })
      }
    }
  } catch (error) {
    store.addChatMessage({
      role: 'system',
      content: `Error: ${error.message}`
    })
  } finally {
    store.setAiProcessing(false)
  }
}

function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
}

function handleSaveSettings() {
  saveSettings(settingsApiKey.value, settingsEndpoint.value, settingsModel.value)
  showSettings.value = false
}

function handleCancelSettings() {
  settingsApiKey.value = apiKey.value
  settingsEndpoint.value = apiEndpoint.value
  settingsModel.value = modelName.value
  showSettings.value = false
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <aside class="chat-panel panel">
    <div class="panel-header">
      <span>AI Assistant</span>
      <button
        class="btn btn-ghost btn-icon btn-sm"
        @click="showSettings = !showSettings"
        title="Settings"
      >
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      </button>
    </div>

    <!-- Settings Panel -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-content">
        <h4 class="settings-title">API Configuration</h4>

        <div class="property-group">
          <label class="label" for="api-key">API Key</label>
          <input
            id="api-key"
            type="password"
            class="input"
            v-model="settingsApiKey"
            placeholder="sk-..."
          />
        </div>

        <div class="property-group">
          <label class="label" for="api-endpoint">API Endpoint</label>
          <input
            id="api-endpoint"
            type="text"
            class="input"
            v-model="settingsEndpoint"
            placeholder="https://api.openai.com/v1/chat/completions"
          />
        </div>

        <div class="property-group">
          <label class="label" for="model-name">Model</label>
          <input
            id="model-name"
            type="text"
            class="input"
            v-model="settingsModel"
            placeholder="gpt-4o-mini"
          />
        </div>

        <div class="settings-actions">
          <button class="btn btn-ghost" @click="handleCancelSettings">Cancel</button>
          <button class="btn btn-primary" @click="handleSaveSettings">Save</button>
        </div>
      </div>
    </div>

    <!-- Chat Content -->
    <div v-else class="chat-content">
      <!-- No API Key Warning -->
      <div v-if="!hasApiKey" class="api-key-warning">
        <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
        <p>Configure your API key to start using the AI assistant.</p>
        <button class="btn btn-primary btn-sm" @click="showSettings = true">
          Configure API Key
        </button>
      </div>

      <!-- Messages -->
      <div v-else ref="messagesContainer" class="messages-container">
        <div v-if="store.chatMessages.length === 0" class="empty-chat">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
            <path d="M8 10h.01M12 10h.01M16 10h.01" />
          </svg>
          <p class="empty-text">Start a conversation to transform your BPMN diagram</p>
          <div class="suggestions">
            <button class="suggestion" @click="inputMessage = 'Create a simple approval workflow'">
              Create a simple approval workflow
            </button>
            <button class="suggestion" @click="inputMessage = 'Add a review task after the start event'">
              Add a review task
            </button>
            <button class="suggestion" @click="inputMessage = 'Create a process with parallel tasks'">
              Create parallel tasks
            </button>
          </div>
        </div>

        <div
          v-for="msg in store.chatMessages"
          :key="msg.id"
          class="message"
          :class="msg.role"
        >
          <div class="message-content">
            <span class="message-text">{{ msg.content }}</span>
            <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
          </div>
        </div>

        <div v-if="store.isAiProcessing" class="message assistant loading">
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div v-if="hasApiKey" class="input-area">
        <textarea
          v-model="inputMessage"
          class="chat-input"
          placeholder="Describe what you want to create or change..."
          rows="2"
          @keydown="handleKeyDown"
          :disabled="isProcessing"
        ></textarea>
        <button
          class="btn btn-primary send-btn"
          @click="handleSendMessage"
          :disabled="!inputMessage.trim() || isProcessing"
        >
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.chat-panel {
  width: var(--properties-width);
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--gray-200);
  overflow: hidden;
  background-color: var(--surface);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--gray-200);
  background-color: var(--gray-50);
  font-weight: 600;
  font-size: 13px;
}

.btn-sm {
  padding: var(--space-1);
}

.btn-sm .icon {
  width: 16px;
  height: 16px;
}

/* Settings Panel */
.settings-panel {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

.settings-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-800);
  margin-bottom: var(--space-4);
}

.property-group {
  margin-bottom: var(--space-4);
}

.settings-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--gray-200);
}

/* Chat Content */
.chat-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.api-key-warning {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  text-align: center;
  color: var(--gray-600);
}

.warning-icon {
  width: 48px;
  height: 48px;
  color: var(--warning);
  margin-bottom: var(--space-4);
}

.api-key-warning p {
  font-size: 13px;
  margin-bottom: var(--space-4);
  max-width: 200px;
}

/* Messages Container */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--gray-500);
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: var(--gray-300);
  margin-bottom: var(--space-3);
}

.empty-text {
  font-size: 13px;
  max-width: 200px;
  margin-bottom: var(--space-4);
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
}

.suggestion {
  padding: var(--space-2) var(--space-3);
  font-size: 12px;
  color: var(--primary-700);
  background-color: var(--primary-50);
  border: 1px solid var(--primary-200);
  border-radius: var(--radius);
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
}

.suggestion:hover {
  background-color: var(--primary-100);
  border-color: var(--primary-300);
}

/* Messages */
.message {
  margin-bottom: var(--space-3);
}

.message-content {
  display: inline-block;
  max-width: 85%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.5;
}

.message.user {
  text-align: right;
}

.message.user .message-content {
  background-color: var(--primary-500);
  color: white;
  border-bottom-right-radius: var(--radius-sm);
}

.message.assistant .message-content {
  background-color: var(--gray-100);
  color: var(--gray-800);
  border-bottom-left-radius: var(--radius-sm);
}

.message.system .message-content {
  background-color: var(--warning);
  background-color: #fef3c7;
  color: #92400e;
  font-size: 12px;
}

.message-text {
  display: block;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message-time {
  display: block;
  font-size: 10px;
  margin-top: var(--space-1);
  opacity: 0.7;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: var(--space-1) 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: var(--gray-400);
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Input Area */
.input-area {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  border-top: 1px solid var(--gray-200);
  background-color: var(--gray-50);
}

.chat-input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--gray-300);
  border-radius: var(--radius);
  font-size: 13px;
  font-family: inherit;
  resize: none;
  min-height: 40px;
  max-height: 100px;
}

.chat-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px var(--primary-100);
}

.chat-input:disabled {
  background-color: var(--gray-100);
  cursor: not-allowed;
}

.send-btn {
  align-self: flex-end;
  padding: var(--space-2);
  min-width: 40px;
  height: 40px;
}

.send-btn .icon {
  width: 18px;
  height: 18px;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
