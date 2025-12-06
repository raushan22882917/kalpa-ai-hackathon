import { ADBBridge } from './adbBridge';
import { IOSBridge } from './iosBridge';
/**
 * Device Manager coordinates device discovery and management
 * across both Android and iOS platforms
 */
export class DeviceManager {
    constructor() {
        this.adbBridge = new ADBBridge();
        this.iosBridge = new IOSBridge();
        this.connectedDevices = new Map();
    }
    /**
     * Discover all available devices (both Android and iOS)
     * This implements the device discovery functionality required by Property 1
     */
    async discoverDevices() {
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
        }
        catch (error) {
            console.error('Error discovering devices:', error);
            return [];
        }
    }
    /**
     * Get detailed information about a specific device
     */
    async getDeviceInfo(deviceId) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) {
            return null;
        }
        // Query the appropriate bridge based on platform
        if (device.platform === 'android') {
            return await this.adbBridge.getDeviceInfo(deviceId);
        }
        else {
            return await this.iosBridge.getDeviceInfo(deviceId);
        }
    }
    /**
     * Get all currently connected devices
     */
    getConnectedDevices() {
        return Array.from(this.connectedDevices.values());
    }
    /**
     * Check if a device is connected
     */
    isDeviceConnected(deviceId) {
        return this.connectedDevices.has(deviceId);
    }
    /**
     * Remove a device from the connected devices list
     */
    removeDevice(deviceId) {
        this.connectedDevices.delete(deviceId);
    }
    /**
     * Get the ADB bridge instance
     */
    getADBBridge() {
        return this.adbBridge;
    }
    /**
     * Get the iOS bridge instance
     */
    getIOSBridge() {
        return this.iosBridge;
    }
    /**
     * List permissions for a device and package/bundle
     */
    async listPermissions(deviceId, appId) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) {
            throw new Error(`Device ${deviceId} not found`);
        }
        if (device.platform === 'android') {
            return await this.adbBridge.listPermissions(deviceId, appId);
        }
        else {
            return await this.iosBridge.listPermissions(deviceId, appId);
        }
    }
    /**
     * Get the status of a specific permission
     */
    async getPermissionStatus(deviceId, appId, permission) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) {
            throw new Error(`Device ${deviceId} not found`);
        }
        if (device.platform === 'android') {
            return await this.adbBridge.getPermissionStatus(deviceId, appId, permission);
        }
        else {
            return await this.iosBridge.getPermissionStatus(deviceId, appId, permission);
        }
    }
    /**
     * Request a permission for an app
     */
    async requestPermission(deviceId, appId, permission) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) {
            throw new Error(`Device ${deviceId} not found`);
        }
        if (device.platform === 'android') {
            return await this.adbBridge.requestPermission(deviceId, appId, permission);
        }
        else {
            return await this.iosBridge.requestPermission(deviceId, appId, permission);
        }
    }
    /**
     * Request multiple permissions at once
     */
    async requestMultiplePermissions(deviceId, appId, permissions) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) {
            throw new Error(`Device ${deviceId} not found`);
        }
        if (device.platform === 'android') {
            return await this.adbBridge.requestMultiplePermissions(deviceId, appId, permissions);
        }
        else {
            return await this.iosBridge.requestMultiplePermissions(deviceId, appId, permissions);
        }
    }
    /**
     * Revoke a permission from an app
     */
    async revokePermission(deviceId, appId, permission) {
        const device = this.connectedDevices.get(deviceId);
        if (!device) {
            throw new Error(`Device ${deviceId} not found`);
        }
        if (device.platform === 'android') {
            return await this.adbBridge.revokePermission(deviceId, appId, permission);
        }
        else {
            return await this.iosBridge.revokePermission(deviceId, appId, permission);
        }
    }
}
