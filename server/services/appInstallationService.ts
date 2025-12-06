import { EventEmitter } from 'events';
import { ADBBridge } from './adbBridge';
import { IOSBridge } from './iosBridge';
import { AppInstallProgress, AppInstallResult, AppLaunchResult, AppLogEntry } from '../types/device';
import * as fs from 'fs';
import * as path from 'path';

/**
 * App Installation Service
 * Handles app package transfer, installation, launching, and log capture
 */
export class AppInstallationService extends EventEmitter {
  private adbBridge: ADBBridge;
  private iosBridge: IOSBridge;
  private uploadDir: string;
  private activeLogStreams: Map<string, NodeJS.Timeout>;

  constructor(adbBridge: ADBBridge, iosBridge: IOSBridge) {
    super();
    this.adbBridge = adbBridge;
    this.iosBridge = iosBridge;
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.activeLogStreams = new Map();
    
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Save uploaded app package to disk
   */
  async saveAppPackage(deviceId: string, fileName: string, fileData: Buffer): Promise<string> {
    // Sanitize deviceId to remove invalid file path characters
    const sanitizedDeviceId = deviceId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(this.uploadDir, `${sanitizedDeviceId}_${Date.now()}_${fileName}`);
    
    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, fileData, (err) => {
        if (err) {
          reject(new Error(`Failed to save app package: ${err.message}`));
        } else {
          resolve(filePath);
        }
      });
    });
  }

  /**
   * Install app on device with progress tracking
   */
  async installApp(
    deviceId: string,
    platform: 'android' | 'ios',
    filePath: string,
    onProgress?: (progress: AppInstallProgress) => void
  ): Promise<AppInstallResult> {
    const startTime = Date.now();

    try {
      // Emit uploading status
      if (onProgress) {
        onProgress({
          status: 'uploading',
          progress: 0,
          message: 'Transferring app package to device...'
        });
      }

      // Simulate upload progress (in real implementation, this would track actual transfer)
      if (onProgress) {
        onProgress({
          status: 'uploading',
          progress: 50,
          message: 'Transferring app package to device...'
        });
      }

      // Emit installing status
      if (onProgress) {
        onProgress({
          status: 'installing',
          progress: 75,
          message: 'Installing app on device...'
        });
      }

      // Install based on platform
      if (platform === 'android') {
        await this.adbBridge.installApp(deviceId, filePath);
      } else {
        await this.iosBridge.installApp(deviceId, filePath);
      }

      // Extract package name from file
      const packageName = await this.extractPackageName(platform, filePath);

      // Emit completed status
      if (onProgress) {
        onProgress({
          status: 'completed',
          progress: 100,
          message: 'App installed successfully'
        });
      }

      // Clean up uploaded file
      this.cleanupFile(filePath);

      return {
        success: true,
        packageName,
        duration: Date.now() - startTime
      };
    } catch (error) {
      // Emit failed status
      if (onProgress) {
        onProgress({
          status: 'failed',
          progress: 0,
          message: 'Installation failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Clean up uploaded file
      this.cleanupFile(filePath);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Launch an installed app on the device
   */
  async launchApp(
    deviceId: string,
    platform: 'android' | 'ios',
    packageName: string
  ): Promise<AppLaunchResult> {
    try {
      if (platform === 'android') {
        // Launch Android app using ADB
        const result = await this.adbBridge.executeCommand(
          deviceId,
          `monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`
        );

        if (result.exitCode !== 0) {
          throw new Error(`Failed to launch app: ${result.stderr}`);
        }
      } else {
        // Launch iOS app
        const result = await this.iosBridge.executeCommand(
          deviceId,
          `ios-deploy --bundle_id ${packageName} --justlaunch`
        );

        if (result.exitCode !== 0) {
          throw new Error(`Failed to launch app: ${result.stderr}`);
        }
      }

      return {
        success: true,
        packageName
      };
    } catch (error) {
      return {
        success: false,
        packageName,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Start capturing application logs
   */
  async startLogCapture(
    deviceId: string,
    platform: 'android' | 'ios',
    packageName: string,
    onLog: (log: AppLogEntry) => void
  ): Promise<void> {
    const streamKey = `${deviceId}_${packageName}`;

    // Stop existing stream if any
    this.stopLogCapture(deviceId, packageName);

    if (platform === 'android') {
      // Start Android logcat for specific package
      this.startAndroidLogCapture(deviceId, packageName, onLog, streamKey);
    } else {
      // Start iOS log capture
      this.startIOSLogCapture(deviceId, packageName, onLog, streamKey);
    }
  }

  /**
   * Stop capturing application logs
   */
  stopLogCapture(deviceId: string, packageName: string): void {
    const streamKey = `${deviceId}_${packageName}`;
    const interval = this.activeLogStreams.get(streamKey);

    if (interval) {
      clearInterval(interval);
      this.activeLogStreams.delete(streamKey);
    }
  }

  /**
   * Start Android logcat capture
   */
  private startAndroidLogCapture(
    deviceId: string,
    packageName: string,
    onLog: (log: AppLogEntry) => void,
    streamKey: string
  ): void {
    // In a real implementation, this would spawn a logcat process and stream output
    // For now, we'll simulate with periodic log generation
    const interval = setInterval(async () => {
      try {
        const result = await this.adbBridge.executeCommand(
          deviceId,
          `logcat -d -s ${packageName}:* --format time`
        );

        if (result.exitCode === 0 && result.stdout) {
          const logs = this.parseAndroidLogs(result.stdout, packageName);
          logs.forEach(log => onLog(log));
        }
      } catch (error) {
        console.error(`Error capturing Android logs: ${error}`);
      }
    }, 1000);

    this.activeLogStreams.set(streamKey, interval);
  }

  /**
   * Start iOS log capture
   */
  private startIOSLogCapture(
    deviceId: string,
    packageName: string,
    onLog: (log: AppLogEntry) => void,
    streamKey: string
  ): void {
    // In a real implementation, this would use idevicesyslog or similar
    const interval = setInterval(async () => {
      try {
        const result = await this.iosBridge.executeCommand(
          deviceId,
          `idevicesyslog -m ${packageName}`
        );

        if (result.exitCode === 0 && result.stdout) {
          const logs = this.parseIOSLogs(result.stdout, packageName);
          logs.forEach(log => onLog(log));
        }
      } catch (error) {
        console.error(`Error capturing iOS logs: ${error}`);
      }
    }, 1000);

    this.activeLogStreams.set(streamKey, interval);
  }

  /**
   * Parse Android logcat output
   */
  private parseAndroidLogs(output: string, packageName: string): AppLogEntry[] {
    const logs: AppLogEntry[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parse logcat format: MM-DD HH:MM:SS.mmm LEVEL/TAG(PID): message
      const match = line.match(/(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3})\s+([VDIWEF])\/([^(]+)\((\d+)\):\s*(.+)/);

      if (match) {
        const [, timestamp, levelChar, tag, pid, message] = match;
        const level = this.mapAndroidLogLevel(levelChar);

        logs.push({
          timestamp: new Date(timestamp),
          level,
          tag: tag.trim(),
          message: message.trim(),
          pid: parseInt(pid, 10)
        });
      }
    }

    return logs;
  }

  /**
   * Parse iOS log output
   */
  private parseIOSLogs(output: string, packageName: string): AppLogEntry[] {
    const logs: AppLogEntry[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      // Simple iOS log parsing (format varies by tool)
      logs.push({
        timestamp: new Date(),
        level: 'info',
        tag: packageName,
        message: line.trim()
      });
    }

    return logs;
  }

  /**
   * Map Android log level character to standard level
   */
  private mapAndroidLogLevel(levelChar: string): AppLogEntry['level'] {
    const levelMap: Record<string, AppLogEntry['level']> = {
      'V': 'verbose',
      'D': 'debug',
      'I': 'info',
      'W': 'warn',
      'E': 'error',
      'F': 'fatal'
    };

    return levelMap[levelChar] || 'info';
  }

  /**
   * Extract package name from app file
   */
  private async extractPackageName(platform: 'android' | 'ios', filePath: string): Promise<string> {
    // In a real implementation, this would parse the APK/IPA to extract package name
    // For now, return a placeholder based on filename
    const fileName = path.basename(filePath);
    const nameWithoutExt = fileName.replace(/\.(apk|ipa)$/i, '');
    
    return platform === 'android' 
      ? `com.example.${nameWithoutExt.toLowerCase()}`
      : `com.example.${nameWithoutExt.toLowerCase()}`;
  }

  /**
   * Clean up uploaded file
   */
  private cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to cleanup file ${filePath}:`, error);
    }
  }

  /**
   * Stop all active log streams
   */
  stopAllLogCaptures(): void {
    for (const [key, interval] of this.activeLogStreams.entries()) {
      clearInterval(interval);
    }
    this.activeLogStreams.clear();
  }
}
