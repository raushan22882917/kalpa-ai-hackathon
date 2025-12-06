/**
 * DeviceBridgeService manages WebSocket communication between the frontend and proxy server
 * for device operations. It handles connection management, message routing, and reconnection logic.
 */

export interface BridgeMessage {
  type: 'command' | 'file' | 'permission' | 'screen' | 'log' | 'terminal' | 'connect' | 'disconnect';
  deviceId: string;
  payload: any;
  requestId: string;
}

export interface BridgeResponse {
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
}

type MessageCallback = (data: any) => void;

/**
 * DeviceBridgeService handles WebSocket communication with the proxy server
 * Requirement 1.1, 1.2, 1.3, 1.4: Manage device connections and communication
 */
class DeviceBridgeService {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second
  private maxReconnectDelay: number = 30000; // Max 30 seconds
  private messageCallbacks: Map<string, Set<MessageCallback>> = new Map();
  private pendingRequests: Map<string, {
    resolve: (response: BridgeResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();
  private messageQueue: BridgeMessage[] = [];
  private isConnecting: boolean = false;
  private errorCallbacks: Set<(error: Error) => void> = new Set();
  private reconnectCallbacks: Set<() => void> = new Set();
  private requestTimeout: number = 30000; // 30 seconds

  constructor(wsUrl: string = 'ws://localhost:3001') {
    this.wsUrl = wsUrl;
  }

  /**
   * Connect to the WebSocket server
   * Requirement 1.1: Establish connection to proxy server
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        const checkConnection = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection);
            resolve();
          } else if (!this.isConnecting) {
            clearInterval(checkConnection);
            reject(new Error('Connection failed'));
          }
        }, 100);
      });
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected to proxy server');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          
          // Send queued messages
          this.flushMessageQueue();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.errorCallbacks.forEach(callback => callback(new Error('WebSocket error')));
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          this.ws = null;
          
          // Attempt reconnection with exponential backoff
          this.attemptReconnection();
        };

        // Timeout for connection
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   * Requirement 1.4: Handle disconnection
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // Clear pending requests
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();
  }

  /**
   * Check if connected to WebSocket server
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Send a message and wait for response
   * Requirement 1.2: Send commands to devices
   */
  async sendMessage(message: BridgeMessage): Promise<BridgeResponse> {
    // If not connected, queue the message
    if (!this.isConnected()) {
      this.messageQueue.push(message);
      
      // Try to connect
      try {
        await this.connect();
      } catch (error) {
        throw new Error('Failed to connect to proxy server');
      }
    }

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(message.requestId);
        reject(new Error('Request timeout'));
      }, this.requestTimeout);

      // Store pending request
      this.pendingRequests.set(message.requestId, {
        resolve,
        reject,
        timeout
      });

      // Send message
      try {
        this.ws!.send(JSON.stringify(message));
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(message.requestId);
        reject(error);
      }
    });
  }

  /**
   * Register callback for specific message type
   * Requirement 1.3: Handle real-time updates
   */
  onMessage(type: string, callback: MessageCallback): void {
    if (!this.messageCallbacks.has(type)) {
      this.messageCallbacks.set(type, new Set());
    }
    this.messageCallbacks.get(type)!.add(callback);
  }

  /**
   * Unregister callback for specific message type
   */
  offMessage(type: string, callback: MessageCallback): void {
    const callbacks = this.messageCallbacks.get(type);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Register error callback
   * Requirement 1.4: Handle connection errors
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.add(callback);
  }

  /**
   * Unregister error callback
   */
  offError(callback: (error: Error) => void): void {
    this.errorCallbacks.delete(callback);
  }

  /**
   * Register reconnection callback
   * Requirement 1.4: Handle reconnection
   */
  onReconnect(callback: () => void): void {
    this.reconnectCallbacks.add(callback);
  }

  /**
   * Unregister reconnection callback
   */
  offReconnect(callback: () => void): void {
    this.reconnectCallbacks.delete(callback);
  }

  /**
   * Handle incoming WebSocket message
   * @private
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Check if this is a response to a pending request
      if (message.requestId && this.pendingRequests.has(message.requestId)) {
        const { resolve, timeout } = this.pendingRequests.get(message.requestId)!;
        clearTimeout(timeout);
        this.pendingRequests.delete(message.requestId);
        resolve(message as BridgeResponse);
        return;
      }

      // Otherwise, it's a broadcast message - notify callbacks
      if (message.type) {
        const callbacks = this.messageCallbacks.get(message.type);
        if (callbacks) {
          callbacks.forEach(callback => callback(message.data || message.payload));
        }
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Attempt reconnection with exponential backoff
   * Requirement 1.4: Implement reconnection logic with exponential backoff
   * @private
   */
  private attemptReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.errorCallbacks.forEach(callback => 
        callback(new Error('Max reconnection attempts reached'))
      );
      return;
    }

    this.reconnectAttempts++;
    
    console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);

    setTimeout(async () => {
      try {
        await this.connect();
        console.log('Reconnected successfully');
        
        // Notify reconnection callbacks
        this.reconnectCallbacks.forEach(callback => callback());
      } catch (error) {
        console.error('Reconnection failed:', error);
        
        // Exponential backoff
        this.reconnectDelay = Math.min(
          this.reconnectDelay * 2,
          this.maxReconnectDelay
        );
      }
    }, this.reconnectDelay);
  }

  /**
   * Flush queued messages after reconnection
   * Requirement 1.4: Add message queuing for offline scenarios
   * @private
   */
  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }

    console.log(`Flushing ${this.messageQueue.length} queued messages`);

    const queue = [...this.messageQueue];
    this.messageQueue = [];

    queue.forEach(message => {
      this.sendMessage(message).catch(error => {
        console.error('Failed to send queued message:', error);
      });
    });
  }

  /**
   * Generate unique request ID
   */
  generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Terminal-specific methods
   */

  /**
   * Create a terminal session for a device
   */
  async createTerminalSession(deviceId: string, platform: 'android' | 'ios'): Promise<any> {
    const response = await this.sendMessage({
      type: 'terminal',
      deviceId,
      payload: {
        action: 'create',
        deviceId,
        platform
      },
      requestId: this.generateRequestId()
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to create terminal session');
    }

    return response.data.session;
  }

  /**
   * Execute a command in a terminal session
   */
  async executeTerminalCommand(sessionId: string, command: string): Promise<any> {
    const response = await this.sendMessage({
      type: 'terminal',
      deviceId: '', // Not needed for session-based operations
      payload: {
        action: 'execute',
        sessionId,
        command
      },
      requestId: this.generateRequestId()
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to execute command');
    }

    return response.data.result;
  }

  /**
   * Send input to a terminal session
   */
  async sendTerminalInput(sessionId: string, input: string): Promise<void> {
    const response = await this.sendMessage({
      type: 'terminal',
      deviceId: '',
      payload: {
        action: 'input',
        sessionId,
        input
      },
      requestId: this.generateRequestId()
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to send input');
    }
  }

  /**
   * Interrupt a running command in a terminal session
   */
  async interruptTerminalCommand(sessionId: string): Promise<void> {
    const response = await this.sendMessage({
      type: 'terminal',
      deviceId: '',
      payload: {
        action: 'interrupt',
        sessionId
      },
      requestId: this.generateRequestId()
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to interrupt command');
    }
  }

  /**
   * Close a terminal session
   */
  async closeTerminalSession(sessionId: string): Promise<void> {
    const response = await this.sendMessage({
      type: 'terminal',
      deviceId: '',
      payload: {
        action: 'close',
        sessionId
      },
      requestId: this.generateRequestId()
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to close session');
    }
  }

  /**
   * Get command history for a terminal session
   */
  async getTerminalHistory(sessionId: string): Promise<any[]> {
    const response = await this.sendMessage({
      type: 'terminal',
      deviceId: '',
      payload: {
        action: 'history',
        sessionId
      },
      requestId: this.generateRequestId()
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to get history');
    }

    return response.data.history;
  }

  /**
   * Clear command history for a terminal session
   */
  async clearTerminalHistory(sessionId: string): Promise<void> {
    const response = await this.sendMessage({
      type: 'terminal',
      deviceId: '',
      payload: {
        action: 'clear-history',
        sessionId
      },
      requestId: this.generateRequestId()
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to clear history');
    }
  }

  /**
   * Permission-specific methods
   */

  /**
   * List permissions for a device and app
   */
  async listPermissions(deviceId: string, appId?: string): Promise<any[]> {
    const response = await this.sendMessage({
      type: 'permission',
      deviceId,
      payload: {
        action: 'list',
        deviceId,
        appId
      },
      requestId: this.generateRequestId()
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to list permissions');
    }

    return response.data.permissions;
  }

  /**
   * Get the status of a specific permission
   */
  async getPermissionStatus(deviceId: string, appId: string, permission: string): Promise<string> {
    const response = await this.sendMessage({
      type: 'permission',
      deviceId,
      payload: {
        action: 'get-status',
        deviceId,
        appId,
        permission
      },
      requestId: this.generateRequestId()
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to get permission status');
    }

    return response.data.status;
  }

  /**
   * Request a permission for an app
   */
  async requestPermission(deviceId: string, appId: string, permission: string): Promise<any> {
    const response = await this.sendMessage({
      type: 'permission',
      deviceId,
      payload: {
        action: 'request',
        deviceId,
        appId,
        permission
      },
      requestId: this.generateRequestId()
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to request permission');
    }

    return response.data.result;
  }

  /**
   * Request multiple permissions at once
   */
  async requestMultiplePermissions(deviceId: string, appId: string, permissions: string[]): Promise<any[]> {
    const response = await this.sendMessage({
      type: 'permission',
      deviceId,
      payload: {
        action: 'request-multiple',
        deviceId,
        appId,
        permissions
      },
      requestId: this.generateRequestId()
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to request permissions');
    }

    return response.data.results;
  }

  /**
   * Revoke a permission from an app
   */
  async revokePermission(deviceId: string, appId: string, permission: string): Promise<boolean> {
    const response = await this.sendMessage({
      type: 'permission',
      deviceId,
      payload: {
        action: 'revoke',
        deviceId,
        appId,
        permission
      },
      requestId: this.generateRequestId()
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to revoke permission');
    }

    return response.data.revoked;
  }

  /**
   * Reset the service (for testing purposes)
   * @internal
   */
  reset(): void {
    this.disconnect();
    this.messageCallbacks.clear();
    this.messageQueue = [];
    this.errorCallbacks.clear();
    this.reconnectCallbacks.clear();
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
  }
}

// Export singleton instance
export const deviceBridgeService = new DeviceBridgeService();
export default deviceBridgeService;
