export interface Device {
  id: string;
  name: string;
  platform: 'android' | 'ios';
  osVersion: string;
  model: string;
  connectionType: 'usb' | 'wireless';
  status: 'connected' | 'disconnected' | 'connecting';
}

export interface DeviceInfo {
  id: string;
  name: string;
  platform: 'android' | 'ios';
  osVersion: string;
  model: string;
  manufacturer?: string;
  serialNumber?: string;
  connectionType: 'usb' | 'wireless';
  properties?: Record<string, string>;
}

export interface DeviceSession {
  device: Device;
  connectedAt: Date;
  features: {
    terminal: boolean;
    screenMirror: boolean;
    fileSystem: boolean;
    permissions: boolean;
  };
}

export interface PairingCode {
  code: string;
  expiresAt: Date;
}

export interface DeviceConnectionState {
  deviceId: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  connectionType: 'usb' | 'wireless';
  connectedAt?: Date;
  lastSeen?: Date;
  error?: string;
  metrics: {
    latency: number;
    bandwidth: number;
    packetLoss: number;
  };
}

export type PermissionStatus = 'granted' | 'denied' | 'not_requested';

export interface Permission {
  name: string;
  status: PermissionStatus;
  description: string;
  required: boolean;
}

export interface PermissionRequestResult {
  permission: string;
  granted: boolean;
  error?: string;
}

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  permissions: string;
}

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  permissions: string;
  owner?: string;
  group?: string;
}

export interface TransferProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface FileOperationResult {
  success: boolean;
  error?: string;
}
