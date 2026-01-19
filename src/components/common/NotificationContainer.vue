<script setup lang="ts">
import { useNotifications } from '../../composables/useNotifications'

const {
  notifications,
  dismiss,
  showConfirmDialog,
  confirmTitle,
  confirmMessage,
  resolveConfirm
} = useNotifications()

function getIconClass(type: string): string {
  switch (type) {
    case 'success':
      return 'notification-icon--success'
    case 'error':
      return 'notification-icon--error'
    case 'warning':
      return 'notification-icon--warning'
    default:
      return 'notification-icon--info'
  }
}

function getIcon(type: string): string {
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '!'
    default:
      return 'i'
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Notification Stack -->
    <div class="notification-container">
      <TransitionGroup name="notification">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification', `notification--${notification.type}`]"
        >
          <span :class="['notification-icon', getIconClass(notification.type)]">
            {{ getIcon(notification.type) }}
          </span>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div v-if="notification.message" class="notification-message">
              {{ notification.message }}
            </div>
          </div>
          <button
            class="notification-close"
            @click="dismiss(notification.id)"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>

    <!-- Confirmation Dialog -->
    <Transition name="dialog">
      <div v-if="showConfirmDialog" class="dialog-overlay" @click.self="resolveConfirm(false)">
        <div class="dialog">
          <div class="dialog-header">{{ confirmTitle }}</div>
          <div class="dialog-body">{{ confirmMessage }}</div>
          <div class="dialog-actions">
            <button class="dialog-btn dialog-btn--cancel" @click="resolveConfirm(false)">
              Cancel
            </button>
            <button class="dialog-btn dialog-btn--confirm" @click="resolveConfirm(true)">
              Confirm
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;
}

.notification--success {
  border-left-color: #10b981;
}

.notification--error {
  border-left-color: #ef4444;
}

.notification--warning {
  border-left-color: #f59e0b;
}

.notification--info {
  border-left-color: #3b82f6;
}

.notification-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}

.notification-icon--success {
  background: #10b981;
}

.notification-icon--error {
  background: #ef4444;
}

.notification-icon--warning {
  background: #f59e0b;
}

.notification-icon--info {
  background: #3b82f6;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.notification-message {
  color: #6b7280;
  font-size: 13px;
  margin-top: 4px;
}

.notification-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  font-size: 14px;
}

.notification-close:hover {
  color: #6b7280;
}

/* Notification animations */
.notification-enter-active {
  transition: all 0.3s ease;
}

.notification-leave-active {
  transition: all 0.2s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Dialog styles */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.dialog-header {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.dialog-body {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 24px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.dialog-btn--cancel {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #374151;
}

.dialog-btn--cancel:hover {
  background: #e5e7eb;
}

.dialog-btn--confirm {
  background: #3b82f6;
  border: 1px solid #3b82f6;
  color: white;
}

.dialog-btn--confirm:hover {
  background: #2563eb;
}

/* Dialog animations */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-active .dialog,
.dialog-leave-active .dialog {
  transition: transform 0.2s ease;
}

.dialog-enter-from .dialog {
  transform: scale(0.95);
}
</style>
