import { Device, DeviceInfo, Permission, PermissionStatus, PermissionRequestResult } from '../types/device';
import { ADBBridge } from './adbBridge';
import { IOSBridge } from './iosBridge';

/**
 * Device Manager coordinates device discovery and management
 * across both Android and iOS platforms
 */
export class DeviceManager {
  private adbBridge: ADBBridge;
  private iosBridge: IOSBridge;
  private connectedDevices: Map<string, Device>;

  constructor() {
    this.adbBridge = new ADBBridge();
    this.iosBridge = new IOSBridge();
    this.connectedDevices = new Map();
  }

  /**
   * Discover all available devices (both Android and iOS)
   * This implements the device discovery functionality required by Property 1
   */
  async discoverDevices(): Promise<Device[]> {
    try {
      // Discover devices from both platforms in parallel
      const [androidDevices, iosDevices] = await Promise.all([
        this.adbBridge.listDevices(),
        this.iosBridge.listDevices()
      ]);

      // Combine all discovered devices
      const allDevices = [...androidDevices, ...iosDevices];

      // Update connected devices map
      allDevices.forEach(device => {
        this.connectedDevices.set(device.id, device);
      });

      return allDevices;
    } catch (error) {
      console.error('Error discovering devices:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific device
   */
  async getDeviceInfo(deviceId: string): Promise<DeviceInfo | null> {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) {
      return null;
    }

    // Query the appropriate bridge based on platform
    if (device.platform === 'android') {
      return await this.adbBridge.getDeviceInfo(deviceId);
    } else {
      return await this.iosBridge.getDeviceInfo(deviceId);
    }
  }

  /**
   * Get all currently connected devices
   */
  getConnectedDevices(): Device[] {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Check if a device is connected
   */
  isDeviceConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }

  /**
   * Remove a device from the connected devices list
   */
  removeDevice(deviceId: string): void {
    this.connectedDevices.delete(deviceId);
  }

  /**
   * Get the ADB bridge instance
   */
  getADBBridge(): ADBBridge {
    return this.adbBridge;
  }

  /**
   * Get the iOS bridge instance
   */
  getIOSBridge(): IOSBridge {
    return this.iosBridge;
  }

  /**
   * List permissions for a device and package/bundle
   */
  async listPermissions(deviceId: string, appId?: string): Promise<Permission[]> {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    if (device.platform === 'android') {
      return await this.adbBridge.listPermissions(deviceId, appId);
    } else {
      return await this.iosBridge.listPermissions(deviceId, appId);
    }
  }

  /**
   * Get the status of a specific permission
   */
  async getPermissionStatus(deviceId: string, appId: string, permission: string): Promise<PermissionStatus> {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    if (device.platform === 'android') {
      return await this.adbBridge.getPermissionStatus(deviceId, appId, permission);
    } else {
      return await this.iosBridge.getPermissionStatus(deviceId, appId, permission);
    }
  }

  /**
   * Request a permission for an app
   */
  async requestPermission(deviceId: string, appId: string, permission: string): Promise<PermissionRequestResult> {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    if (device.platform === 'android') {
      return await this.adbBridge.requestPermission(deviceId, appId, permission);
    } else {
      return await this.iosBridge.requestPermission(deviceId, appId, permission);
    }
  }

  /**
   * Request multiple permissions at once
   */
  async requestMultiplePermissions(
    deviceId: string, 
    appId: string, 
    permissions: string[]
  ): Promise<PermissionRequestResult[]> {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    if (device.platform === 'android') {
      return await this.adbBridge.requestMultiplePermissions(deviceId, appId, permissions);
    } else {
      return await this.iosBridge.requestMultiplePermissions(deviceId, appId, permissions);
    }
  }

  /**
   * Revoke a permission from an app
   */
  async revokePermission(deviceId: string, appId: string, permission: string): Promise<boolean> {
    const device = this.connectedDevices.get(deviceId);
    
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    if (device.platform === 'android') {
      return await this.adbBridge.revokePermission(deviceId, appId, permission);
    } else {
      return await this.iosBridge.revokePermission(deviceId, appId, permission);
    }
  }
}
