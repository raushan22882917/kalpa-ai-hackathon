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
  properties?: Map<string, string>;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
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

export interface AppInstallProgress {
  status: 'uploading' | 'installing' | 'completed' | 'failed';
  progress: number; // 0-100
  message?: string;
  error?: string;
}

export interface AppInstallResult {
  success: boolean;
  packageName?: string;
  error?: string;
  duration: number;
}

export interface AppLaunchResult {
  success: boolean;
  packageName: string;
  error?: string;
}

export interface AppLogEntry {
  timestamp: Date;
  level: 'verbose' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  tag: string;
  message: string;
  pid?: number;
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
