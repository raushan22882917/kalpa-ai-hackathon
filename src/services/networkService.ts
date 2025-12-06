/**
 * Network Service
 * Handles network connectivity detection and offline/online state management
 */

import { notificationService } from './notificationService';

export type NetworkStatus = 'online' | 'offline';
type NetworkListener = (status: NetworkStatus) => void;

class NetworkService {
  private listeners: NetworkListener[] = [];
  private currentStatus: NetworkStatus;

  constructor() {
    // Initialize with current online status
    this.currentStatus = navigator.onLine ? 'online' : 'offline';
    this.setupEventListeners();
  }

  /**
   * Set up browser online/offline event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    this.currentStatus = 'online';
    notificationService.success('Connection restored. AI features are now available.');
    this.notifyListeners('online');
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.currentStatus = 'offline';
    notificationService.warning('You are offline. AI features are disabled.');
    this.notifyListeners('offline');
  };

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(status: NetworkStatus): void {
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(listener: NetworkListener): () => void {
    this.listeners.push(listener);
    
    // Immediately notify with current status
    listener(this.currentStatus);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return this.currentStatus;
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.currentStatus === 'online';
  }

  /**
   * Check if currently offline
   */
  isOffline(): boolean {
    return this.currentStatus === 'offline';
  }

  /**
   * Clean up event listeners
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners = [];
  }
}

export const networkService = new NetworkService();
