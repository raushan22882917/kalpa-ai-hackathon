/**
 * Notification Service
 * Handles displaying notifications to users
 */

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

type NotificationListener = (notification: Notification) => void;

class NotificationService {
  private listeners: NotificationListener[] = [];

  /**
   * Subscribe to notifications
   */
  subscribe(listener: NotificationListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Show a notification
   */
  show(type: NotificationType, message: string, duration?: number): void {
    const notification: Notification = {
      id: `notification-${Date.now()}-${Math.random()}`,
      type,
      message,
      duration,
    };

    this.listeners.forEach(listener => listener(notification));
  }

  /**
   * Show info notification
   */
  info(message: string, duration?: number): void {
    this.show('info', message, duration);
  }

  /**
   * Show warning notification
   */
  warning(message: string, duration?: number): void {
    this.show('warning', message, duration);
  }

  /**
   * Show error notification
   */
  error(message: string, duration?: number): void {
    this.show('error', message, duration);
  }

  /**
   * Show success notification
   */
  success(message: string, duration?: number): void {
    this.show('success', message, duration);
  }
}

export const notificationService = new NotificationService();
