import { ref, readonly } from 'vue'
import type { Notification, NotificationType } from '../types'
import { NOTIFICATION } from '../constants'

/**
 * Composable for managing application notifications
 * Provides a centralized notification system to replace alert/confirm dialogs
 */

const notifications = ref<Notification[]>([])
let notificationId = 0

/**
 * Add a notification to the stack
 */
function notify(
  type: NotificationType,
  title: string,
  message?: string,
  duration?: number
): number {
  const id = ++notificationId

  const notification: Notification = {
    id,
    type,
    title,
    message,
    duration: duration ?? (type === 'error' ? NOTIFICATION.ERROR_DURATION : NOTIFICATION.DEFAULT_DURATION)
  }

  notifications.value.push(notification)

  // Limit visible notifications
  if (notifications.value.length > NOTIFICATION.MAX_VISIBLE) {
    notifications.value.shift()
  }

  // Auto-remove after duration
  if (notification.duration && notification.duration > 0) {
    setTimeout(() => {
      dismiss(id)
    }, notification.duration)
  }

  return id
}

/**
 * Show a success notification
 */
function success(title: string, message?: string): number {
  return notify('success', title, message)
}

/**
 * Show an error notification
 */
function error(title: string, message?: string): number {
  return notify('error', title, message)
}

/**
 * Show a warning notification
 */
function warning(title: string, message?: string): number {
  return notify('warning', title, message)
}

/**
 * Show an info notification
 */
function info(title: string, message?: string): number {
  return notify('info', title, message)
}

/**
 * Dismiss a notification by ID
 */
function dismiss(id: number): void {
  const index = notifications.value.findIndex((n) => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

/**
 * Clear all notifications
 */
function clearAll(): void {
  notifications.value = []
}

/**
 * Show a confirmation dialog and return a promise
 * This provides a non-blocking alternative to confirm()
 */
let confirmResolve: ((value: boolean) => void) | null = null
const showConfirmDialog = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')

function confirm(title: string, message: string): Promise<boolean> {
  confirmTitle.value = title
  confirmMessage.value = message
  showConfirmDialog.value = true

  return new Promise((resolve) => {
    confirmResolve = resolve
  })
}

function resolveConfirm(result: boolean): void {
  showConfirmDialog.value = false
  if (confirmResolve) {
    confirmResolve(result)
    confirmResolve = null
  }
}

export function useNotifications() {
  return {
    // State (readonly)
    notifications: readonly(notifications),
    showConfirmDialog: readonly(showConfirmDialog),
    confirmTitle: readonly(confirmTitle),
    confirmMessage: readonly(confirmMessage),

    // Notification methods
    notify,
    success,
    error,
    warning,
    info,
    dismiss,
    clearAll,

    // Confirmation dialog
    confirm,
    resolveConfirm
  }
}
