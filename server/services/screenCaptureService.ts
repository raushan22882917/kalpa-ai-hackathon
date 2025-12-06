import { EventEmitter } from 'events';
import { ADBBridge } from './adbBridge';
import { IOSBridge } from './iosBridge';

export interface ScreenCaptureOptions {
  quality: 'low' | 'medium' | 'high';
  frameRate: number;
  width?: number;
  height?: number;
}

export interface ScreenMetrics {
  frameRate: number;
  latency: number;
  bandwidth: number;
  droppedFrames: number;
}

export interface CaptureSession {
  sessionId: string;
  deviceId: string;
  platform: 'android' | 'ios';
  options: ScreenCaptureOptions;
  startTime: Date;
  isActive: boolean;
  metrics: ScreenMetrics;
}

/**
 * Screen Capture Service for device screen mirroring
 * Manages screen capture sessions and WebRTC streaming
 */
export class ScreenCaptureService extends EventEmitter {
  private adbBridge: ADBBridge;
  private iosBridge: IOSBridge;
  private sessions: Map<string, CaptureSession>;
  private captureIntervals: Map<string, NodeJS.Timeout>;
  private frameCounters: Map<string, number>;

  constructor(adbBridge: ADBBridge, iosBridge: IOSBridge) {
    super();
    this.adbBridge = adbBridge;
    this.iosBridge = iosBridge;
    this.sessions = new Map();
    this.captureIntervals = new Map();
    this.frameCounters = new Map();
  }

  /**
   * Start screen capture for a device
   */
  async startCapture(
    deviceId: string,
    platform: 'android' | 'ios',
    options: Partial<ScreenCaptureOptions> = {}
  ): Promise<CaptureSession> {
    // Check if session already exists
    const existingSession = this.findSessionByDevice(deviceId);
    if (existingSession) {
      throw new Error(`Screen capture already active for device ${deviceId}`);
    }

    const sessionId = this.generateSessionId();
    const captureOptions: ScreenCaptureOptions = {
      quality: options.quality || 'medium',
      frameRate: options.frameRate || 30,
      width: options.width,
      height: options.height
    };

    const session: CaptureSession = {
      sessionId,
      deviceId,
      platform,
      options: captureOptions,
      startTime: new Date(),
      isActive: true,
      metrics: {
        frameRate: 0,
        latency: 0,
        bandwidth: 0,
        droppedFrames: 0
      }
    };

    this.sessions.set(sessionId, session);
    this.frameCounters.set(sessionId, 0);

    // Start capture loop
    await this.startCaptureLoop(session);

    this.emit('capture:started', { sessionId, deviceId, platform });

    return session;
  }

  /**
   * Stop screen capture for a session
   */
  async stopCapture(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Stop capture loop
    const interval = this.captureIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.captureIntervals.delete(sessionId);
    }

    // Stop metrics interval
    const metricsInterval = this.captureIntervals.get(`${sessionId}:metrics`);
    if (metricsInterval) {
      clearInterval(metricsInterval);
      this.captureIntervals.delete(`${sessionId}:metrics`);
    }

    session.isActive = false;
    this.sessions.delete(sessionId);
    this.frameCounters.delete(sessionId);

    this.emit('capture:stopped', { sessionId, deviceId: session.deviceId });
  }

  /**
   * Get current frame rate for a session
   */
  getFrameRate(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    return session?.metrics.frameRate || 0;
  }

  /**
   * Get current latency for a session
   */
  getLatency(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    return session?.metrics.latency || 0;
  }

  /**
   * Set quality for a session
   */
  async setQuality(sessionId: string, quality: 'low' | 'medium' | 'high'): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.options.quality = quality;

    // Adjust frame rate based on quality
    switch (quality) {
      case 'low':
        session.options.frameRate = 15;
        break;
      case 'medium':
        session.options.frameRate = 30;
        break;
      case 'high':
        session.options.frameRate = 60;
        break;
    }

    // Restart capture loop with new settings
    await this.restartCaptureLoop(session);

    this.emit('quality:changed', { sessionId, quality });
  }

  /**
   * Get session metrics
   */
  getMetrics(sessionId: string): ScreenMetrics | null {
    const session = this.sessions.get(sessionId);
    return session?.metrics || null;
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): CaptureSession[] {
    return Array.from(this.sessions.values()).filter(s => s.isActive);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): CaptureSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Find session by device ID
   */
  private findSessionByDevice(deviceId: string): CaptureSession | null {
    for (const session of this.sessions.values()) {
      if (session.deviceId === deviceId && session.isActive) {
        return session;
      }
    }
    return null;
  }

  /**
   * Start the capture loop for a session
   */
  private async startCaptureLoop(session: CaptureSession): Promise<void> {
    const intervalMs = 1000 / session.options.frameRate;

    const interval = setInterval(async () => {
      try {
        await this.captureFrame(session);
      } catch (error) {
        console.error(`Error capturing frame for session ${session.sessionId}:`, error);
        session.metrics.droppedFrames++;
      }
    }, intervalMs);

    this.captureIntervals.set(session.sessionId, interval);

    // Start metrics calculation
    this.startMetricsCalculation(session);
  }

  /**
   * Restart capture loop with new settings
   */
  private async restartCaptureLoop(session: CaptureSession): Promise<void> {
    // Stop existing loop
    const interval = this.captureIntervals.get(session.sessionId);
    if (interval) {
      clearInterval(interval);
    }

    // Start new loop
    await this.startCaptureLoop(session);
  }

  /**
   * Capture a single frame
   */
  private async captureFrame(session: CaptureSession): Promise<void> {
    const startTime = Date.now();

    let frameData: Buffer;

    // Capture screen based on platform
    if (session.platform === 'android') {
      frameData = await this.adbBridge.captureScreen(session.deviceId);
    } else {
      frameData = await this.iosBridge.captureScreen(session.deviceId);
    }

    const captureTime = Date.now() - startTime;

    // Update metrics
    session.metrics.latency = captureTime;

    // Increment frame counter
    const currentCount = this.frameCounters.get(session.sessionId) || 0;
    this.frameCounters.set(session.sessionId, currentCount + 1);

    // Emit frame event
    this.emit('frame', {
      sessionId: session.sessionId,
      deviceId: session.deviceId,
      frameData,
      timestamp: Date.now(),
      metrics: {
        latency: captureTime,
        frameNumber: currentCount + 1
      }
    });
  }

  /**
   * Start metrics calculation for a session
   */
  private startMetricsCalculation(session: CaptureSession): void {
    // Calculate actual frame rate every second
    const metricsInterval = setInterval(() => {
      const frameCount = this.frameCounters.get(session.sessionId) || 0;
      const elapsedSeconds = (Date.now() - session.startTime.getTime()) / 1000;
      
      if (elapsedSeconds > 0) {
        session.metrics.frameRate = Math.round(frameCount / elapsedSeconds);
      }

      // Emit metrics update
      this.emit('metrics:update', {
        sessionId: session.sessionId,
        metrics: session.metrics
      });
    }, 1000);

    // Store interval for cleanup
    this.captureIntervals.set(`${session.sessionId}:metrics`, metricsInterval);
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `screen-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Clean up all sessions
   */
  async cleanup(): Promise<void> {
    const sessionIds = Array.from(this.sessions.keys());
    
    for (const sessionId of sessionIds) {
      try {
        await this.stopCapture(sessionId);
      } catch (error) {
        console.error(`Error stopping session ${sessionId}:`, error);
      }
    }

    // Clear all intervals
    for (const interval of this.captureIntervals.values()) {
      clearInterval(interval);
    }

    this.sessions.clear();
    this.captureIntervals.clear();
    this.frameCounters.clear();
    this.removeAllListeners();
  }
}
