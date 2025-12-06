import { Device, DeviceInfo, DeviceSession, PairingCode, DeviceConnectionState } from '../types/device';

/**
 * DeviceManager handles device discovery, connection management, and session handling
 * for physical mobile devices connected to the web editor.
 */
class DeviceManager {
  private devices: Map<string, Device> = new Map();
  private sessions: Map<string, DeviceSession> = new Map();
  private connectionStates: Map<string, DeviceConnectionState> = new Map();
  private connectionCallbacks: Set<(device: Device) => void> = new Set();
  private disconnectionCallbacks: Set<(deviceId: string) => void> = new Set();
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = 'http://localhost:3001') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Discover available devices via the proxy server
   * Requirement 1.1: Display available devices for connection
   */
  async discoverDevices(): Promise<Device[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/devices`);
      if (!response.ok) {
        throw new Error(`Failed to discover devices: ${response.statusText}`);
      }
      
      const devices: Device[] = await response.json();
      
      // Update internal device map
      devices.forEach(device => {
        this.devices.set(device.id, device);
      });
      
      return devices;
    } catch (error) {
      console.error('Device discovery failed:', error);
      throw error;
    }
  }

  /**
   * Connect to a specific device
   * Requirement 1.2: Establish connection and display device information
   * Requirement 1.3: Enable device-specific features
   */
  async connectDevice(deviceId: string): Promise<DeviceSession> {
    try {
      // Update connection state to connecting
      this.updateConnectionState(deviceId, {
        deviceId,
        status: 'connecting',
        connectionType: this.devices.get(deviceId)?.connectionType || 'usb',
        metrics: { latency: 0, bandwidth: 0, packetLoss: 0 }
      });

      const response = await fetch(`${this.apiBaseUrl}/api/devices/${deviceId}/connect`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Failed to connect to device: ${response.statusText}`);
      }

      const deviceInfo: DeviceInfo = await response.json();
      
      // Create device from device info
      const device: Device = {
        id: deviceInfo.id,
        name: deviceInfo.name,
        platform: deviceInfo.platform,
        osVersion: deviceInfo.osVersion,
        model: deviceInfo.model,
        connectionType: deviceInfo.connectionType,
        status: 'connected'
      };

      // Update device in map
      this.devices.set(device.id, device);

      // Create session with enabled features
      const session: DeviceSession = {
        device,
        connectedAt: new Date(),
        features: {
          terminal: true,
          screenMirror: true,
          fileSystem: true,
          permissions: true
        }
      };

      this.sessions.set(deviceId, session);

      // Update connection state to connected
      this.updateConnectionState(deviceId, {
        deviceId,
        status: 'connected',
        connectionType: device.connectionType,
        connectedAt: new Date(),
        lastSeen: new Date(),
        metrics: { latency: 0, bandwidth: 0, packetLoss: 0 }
      });

      // Notify connection callbacks
      this.connectionCallbacks.forEach(callback => callback(device));

      return session;
    } catch (error) {
      // Update connection state to error
      this.updateConnectionState(deviceId, {
        deviceId,
        status: 'error',
        connectionType: this.devices.get(deviceId)?.connectionType || 'usb',
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: { latency: 0, bandwidth: 0, packetLoss: 0 }
      });
      
      console.error('Device connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from a device
   * Requirement 1.4: Detect disconnection and update UI
   */
  async disconnectDevice(deviceId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/devices/${deviceId}/disconnect`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Failed to disconnect device: ${response.statusText}`);
      }

      // Update device status
      const device = this.devices.get(deviceId);
      if (device) {
        device.status = 'disconnected';
        this.devices.set(deviceId, device);
      }

      // Remove session
      this.sessions.delete(deviceId);

      // Update connection state
      this.updateConnectionState(deviceId, {
        deviceId,
        status: 'disconnected',
        connectionType: device?.connectionType || 'usb',
        lastSeen: new Date(),
        metrics: { latency: 0, bandwidth: 0, packetLoss: 0 }
      });

      // Notify disconnection callbacks
      this.disconnectionCallbacks.forEach(callback => callback(deviceId));
    } catch (error) {
      console.error('Device disconnection failed:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a device
   * Requirement 1.2: Display device information including model, OS version, and connection status
   */
  async getDeviceInfo(deviceId: string): Promise<DeviceInfo> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/devices/${deviceId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get device info: ${response.statusText}`);
      }

      const deviceInfo: DeviceInfo = await response.json();
      return deviceInfo;
    } catch (error) {
      console.error('Failed to get device info:', error);
      throw error;
    }
  }

  /**
   * Get list of currently connected devices
   * Requirement 1.5: Allow selection of multiple connected devices
   */
  getConnectedDevices(): Device[] {
    return Array.from(this.devices.values()).filter(
      device => device.status === 'connected'
    );
  }

  /**
   * Get a specific device session
   * Requirement 1.5: Multi-device session handling
   */
  getSession(deviceId: string): DeviceSession | undefined {
    return this.sessions.get(deviceId);
  }

  /**
   * Get all active sessions
   * Requirement 1.5: Multi-device session handling
   */
  getAllSessions(): DeviceSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get connection state for a device
   * Requirement 1.4: Monitor connection status
   */
  getConnectionState(deviceId: string): DeviceConnectionState | undefined {
    return this.connectionStates.get(deviceId);
  }

  /**
   * Register callback for device connection events
   * Requirement 1.3: Enable features when device connects
   */
  onDeviceConnected(callback: (device: Device) => void): void {
    this.connectionCallbacks.add(callback);
  }

  /**
   * Register callback for device disconnection events
   * Requirement 1.4: Detect disconnection and update UI
   */
  onDeviceDisconnected(callback: (deviceId: string) => void): void {
    this.disconnectionCallbacks.add(callback);
  }

  /**
   * Remove connection callback
   */
  offDeviceConnected(callback: (device: Device) => void): void {
    this.connectionCallbacks.delete(callback);
  }

  /**
   * Remove disconnection callback
   */
  offDeviceDisconnected(callback: (deviceId: string) => void): void {
    this.disconnectionCallbacks.delete(callback);
  }

  /**
   * Start wireless pairing mode
   * Requirement 8.5: QR code pairing for wireless setup
   */
  async startWirelessPairing(): Promise<PairingCode> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/devices/wireless/pair`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Failed to start wireless pairing: ${response.statusText}`);
      }

      const pairingCode: PairingCode = await response.json();
      return pairingCode;
    } catch (error) {
      console.error('Failed to start wireless pairing:', error);
      throw error;
    }
  }

  /**
   * Pair device using pairing code
   * Requirement 8.5: QR code pairing for wireless setup
   */
  async pairDeviceWithCode(code: string): Promise<Device> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/devices/wireless/pair/${code}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Failed to pair device: ${response.statusText}`);
      }

      const device: Device = await response.json();
      this.devices.set(device.id, device);
      return device;
    } catch (error) {
      console.error('Failed to pair device:', error);
      throw error;
    }
  }

  /**
   * Update connection state for a device
   * Internal method for managing connection states
   */
  private updateConnectionState(deviceId: string, state: DeviceConnectionState): void {
    this.connectionStates.set(deviceId, state);
  }

  /**
   * Check if a device is connected
   * Requirement 1.4: Monitor connection status
   */
  isDeviceConnected(deviceId: string): boolean {
    const device = this.devices.get(deviceId);
    return device?.status === 'connected';
  }

  /**
   * Get all devices (connected and disconnected)
   */
  getAllDevices(): Device[] {
    return Array.from(this.devices.values());
  }

  /**
   * Reset the device manager state (for testing purposes)
   * @internal
   */
  reset(): void {
    this.devices.clear();
    this.sessions.clear();
    this.connectionStates.clear();
    this.connectionCallbacks.clear();
    this.disconnectionCallbacks.clear();
  }
}

// Export singleton instance
export const deviceManager = new DeviceManager();
export default deviceManager;
