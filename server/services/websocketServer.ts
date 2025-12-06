import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { DeviceManager } from './deviceManager';
import { TerminalProxy } from './terminalProxy';
import { ScreenCaptureService } from './screenCaptureService';
import { AppInstallationService } from './appInstallationService';
import { LogCaptureService } from './logCaptureService';

export interface BridgeMessage {
  type: 'command' | 'file' | 'permission' | 'screen' | 'log' | 'discovery' | 'terminal' | 'app-installation';
  deviceId?: string;
  payload: any;
  requestId: string;
}

export interface BridgeResponse {
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * WebSocket Server for real-time device communication
 */
export class DeviceWebSocketServer {
  private wss: WebSocketServer;
  private deviceManager: DeviceManager;
  private terminalProxy: TerminalProxy;
  private screenCaptureService: ScreenCaptureService;
  private appInstallationService: AppInstallationService;
  private logCaptureService: LogCaptureService;
  private clients: Map<string, WebSocket>;

  constructor(
    server: Server,
    deviceManager: DeviceManager,
    terminalProxy: TerminalProxy,
    screenCaptureService: ScreenCaptureService,
    appInstallationService: AppInstallationService,
    logCaptureService: LogCaptureService
  ) {
    this.wss = new WebSocketServer({ noServer: true });
    this.deviceManager = deviceManager;
    this.terminalProxy = terminalProxy;
    this.screenCaptureService = screenCaptureService;
    this.appInstallationService = appInstallationService;
    this.logCaptureService = logCaptureService;
    this.clients = new Map();

    this.setupWebSocketServer();
    this.setupTerminalEvents();
    this.setupScreenCaptureEvents();
    this.setupLogCaptureEvents();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);

      console.log(`Client connected: ${clientId}`);

      ws.on('message', async (data: Buffer) => {
        try {
          const message: BridgeMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error handling message:', error);
          this.sendError(ws, 'unknown', 'Invalid message format');
        }
      });

      ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error: Error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });

      // Send initial connection success message
      this.sendResponse(ws, {
        requestId: 'connection',
        success: true,
        data: { message: 'Connected to device bridge' }
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: BridgeMessage): Promise<void> {
    try {
      switch (message.type) {
        case 'discovery':
          await this.handleDeviceDiscovery(ws, message);
          break;
        
        case 'terminal':
          await this.handleTerminal(ws, message);
          break;
        
        case 'command':
          await this.handleCommand(ws, message);
          break;
        
        case 'file':
          await this.handleFileOperation(ws, message);
          break;
        
        case 'permission':
          await this.handlePermission(ws, message);
          break;
        
        case 'screen':
          await this.handleScreenOperation(ws, message);
          break;
        
        case 'log':
          await this.handleLogOperation(ws, message);
          break;
        
        case 'app-installation':
          await this.handleAppInstallation(ws, message);
          break;
        
        default:
          this.sendError(ws, message.requestId, `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      this.sendError(
        ws,
        message.requestId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private setupTerminalEvents(): void {
    // Forward terminal events to connected clients
    this.terminalProxy.on('output', (data) => {
      this.broadcast({
        type: 'terminal:output',
        data
      });
    });

    this.terminalProxy.on('command:start', (data) => {
      this.broadcast({
        type: 'terminal:command:start',
        data
      });
    });

    this.terminalProxy.on('command:complete', (data) => {
      this.broadcast({
        type: 'terminal:command:complete',
        data
      });
    });

    this.terminalProxy.on('command:error', (data) => {
      this.broadcast({
        type: 'terminal:command:error',
        data
      });
    });

    this.terminalProxy.on('command:interrupted', (data) => {
      this.broadcast({
        type: 'terminal:command:interrupted',
        data
      });
    });

    this.terminalProxy.on('session:created', (data) => {
      this.broadcast({
        type: 'terminal:session:created',
        data
      });
    });

    this.terminalProxy.on('session:closed', (data) => {
      this.broadcast({
        type: 'terminal:session:closed',
        data
      });
    });
  }

  private async handleDeviceDiscovery(ws: WebSocket, message: BridgeMessage): Promise<void> {
    const devices = await this.deviceManager.discoverDevices();
    
    this.sendResponse(ws, {
      requestId: message.requestId,
      success: true,
      data: { devices }
    });
  }

  private async handleTerminal(ws: WebSocket, message: BridgeMessage): Promise<void> {
    const { action, sessionId, deviceId, platform, command, input, directory } = message.payload;

    try {
      switch (action) {
        case 'create':
          const session = this.terminalProxy.createSession(deviceId, platform);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { session }
          });
          break;

        case 'execute':
          const result = await this.terminalProxy.executeCommand(sessionId, command);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { result }
          });
          break;

        case 'input':
          this.terminalProxy.sendInput(sessionId, input);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { message: 'Input sent' }
          });
          break;

        case 'interrupt':
          this.terminalProxy.interrupt(sessionId);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { message: 'Command interrupted' }
          });
          break;

        case 'close':
          this.terminalProxy.closeSession(sessionId);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { message: 'Session closed' }
          });
          break;

        case 'history':
          const history = this.terminalProxy.getHistory(sessionId);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { history }
          });
          break;

        case 'clear-history':
          this.terminalProxy.clearHistory(sessionId);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { message: 'History cleared' }
          });
          break;

        case 'change-directory':
          this.terminalProxy.changeDirectory(sessionId, directory);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { message: 'Directory changed' }
          });
          break;

        case 'list-sessions':
          const sessions = this.terminalProxy.getActiveSessions();
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { sessions }
          });
          break;

        default:
          this.sendError(ws, message.requestId, `Unknown terminal action: ${action}`);
      }
    } catch (error) {
      this.sendError(
        ws,
        message.requestId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async handleCommand(ws: WebSocket, message: BridgeMessage): Promise<void> {
    // Placeholder for command execution
    this.sendResponse(ws, {
      requestId: message.requestId,
      success: true,
      data: { message: 'Command execution not yet implemented' }
    });
  }

  private async handleFileOperation(ws: WebSocket, message: BridgeMessage): Promise<void> {
    // Placeholder for file operations
    this.sendResponse(ws, {
      requestId: message.requestId,
      success: true,
      data: { message: 'File operations not yet implemented' }
    });
  }

  private async handlePermission(ws: WebSocket, message: BridgeMessage): Promise<void> {
    const { action, deviceId, appId, permission, permissions } = message.payload;

    try {
      switch (action) {
        case 'list':
          const permissionList = await this.deviceManager.listPermissions(deviceId, appId);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { permissions: permissionList }
          });
          break;

        case 'get-status':
          const status = await this.deviceManager.getPermissionStatus(deviceId, appId, permission);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { status }
          });
          break;

        case 'request':
          const result = await this.deviceManager.requestPermission(deviceId, appId, permission);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { result }
          });
          break;

        case 'request-multiple':
          const results = await this.deviceManager.requestMultiplePermissions(deviceId, appId, permissions);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { results }
          });
          break;

        case 'revoke':
          const revoked = await this.deviceManager.revokePermission(deviceId, appId, permission);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { revoked }
          });
          break;

        default:
          this.sendError(ws, message.requestId, `Unknown permission action: ${action}`);
      }
    } catch (error) {
      this.sendError(
        ws,
        message.requestId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async handleScreenOperation(ws: WebSocket, message: BridgeMessage): Promise<void> {
    const { action, sessionId, deviceId, platform, quality } = message.payload;

    try {
      switch (action) {
        case 'start':
          const session = await this.screenCaptureService.startCapture(
            deviceId,
            platform,
            { quality: quality || 'medium' }
          );
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { session }
          });
          break;

        case 'stop':
          await this.screenCaptureService.stopCapture(sessionId);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { message: 'Screen capture stopped' }
          });
          break;

        case 'set-quality':
          await this.screenCaptureService.setQuality(sessionId, quality);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { message: 'Quality updated' }
          });
          break;

        case 'get-metrics':
          const metrics = this.screenCaptureService.getMetrics(sessionId);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { metrics }
          });
          break;

        case 'get-frame-rate':
          const frameRate = this.screenCaptureService.getFrameRate(sessionId);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { frameRate }
          });
          break;

        case 'get-latency':
          const latency = this.screenCaptureService.getLatency(sessionId);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { latency }
          });
          break;

        case 'list-sessions':
          const sessions = this.screenCaptureService.getActiveSessions();
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { sessions }
          });
          break;

        default:
          this.sendError(ws, message.requestId, `Unknown screen action: ${action}`);
      }
    } catch (error) {
      this.sendError(
        ws,
        message.requestId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async handleLogOperation(ws: WebSocket, message: BridgeMessage): Promise<void> {
    const { action, sessionId, deviceId, platform, filter } = message.payload;

    try {
      switch (action) {
        case 'start':
          const newSessionId = this.logCaptureService.startCapture(deviceId, platform, filter);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { sessionId: newSessionId }
          });
          break;

        case 'stop':
          this.logCaptureService.stopCapture(sessionId);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { message: 'Log capture stopped' }
          });
          break;

        case 'get-logs':
          const logs = this.logCaptureService.getLogs(sessionId, filter);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { logs }
          });
          break;

        case 'clear':
          this.logCaptureService.clearLogs(sessionId);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { message: 'Logs cleared' }
          });
          break;

        case 'set-filter':
          this.logCaptureService.setFilter(sessionId, filter);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { message: 'Filter updated' }
          });
          break;

        case 'list-sessions':
          const sessions = this.logCaptureService.getActiveSessions();
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { sessions }
          });
          break;

        default:
          this.sendError(ws, message.requestId, `Unknown log action: ${action}`);
      }
    } catch (error) {
      this.sendError(
        ws,
        message.requestId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private async handleAppInstallation(ws: WebSocket, message: BridgeMessage): Promise<void> {
    const { action, deviceId, platform, packageName } = message.payload;

    try {
      switch (action) {
        case 'launch':
          const launchResult = await this.appInstallationService.launchApp(
            deviceId,
            platform,
            packageName
          );
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: launchResult.success,
            data: launchResult.success ? { packageName: launchResult.packageName } : undefined,
            error: launchResult.error
          });
          break;

        case 'start-log-capture':
          await this.appInstallationService.startLogCapture(
            deviceId,
            platform,
            packageName,
            (log) => {
              // Broadcast log entries to all clients
              this.broadcast({
                type: 'app:log',
                data: {
                  deviceId,
                  packageName,
                  log
                }
              });
            }
          );
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { message: 'Log capture started' }
          });
          break;

        case 'stop-log-capture':
          this.appInstallationService.stopLogCapture(deviceId, packageName);
          this.sendResponse(ws, {
            requestId: message.requestId,
            success: true,
            data: { message: 'Log capture stopped' }
          });
          break;

        default:
          this.sendError(ws, message.requestId, `Unknown app installation action: ${action}`);
      }
    } catch (error) {
      this.sendError(
        ws,
        message.requestId,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  private sendResponse(ws: WebSocket, response: BridgeResponse): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(response));
    }
  }

  private sendError(ws: WebSocket, requestId: string, error: string): void {
    this.sendResponse(ws, {
      requestId,
      success: false,
      error
    });
  }

  private setupScreenCaptureEvents(): void {
    // Forward screen capture events to connected clients
    this.screenCaptureService.on('capture:started', (data) => {
      this.broadcast({
        type: 'screen:capture:started',
        data
      });
    });

    this.screenCaptureService.on('capture:stopped', (data) => {
      this.broadcast({
        type: 'screen:capture:stopped',
        data
      });
    });

    this.screenCaptureService.on('frame', (data) => {
      // Convert frame data to base64 for transmission
      const frameBase64 = data.frameData.toString('base64');
      this.broadcast({
        type: 'screen:frame',
        data: {
          ...data,
          frameData: frameBase64
        }
      });
    });

    this.screenCaptureService.on('metrics:update', (data) => {
      this.broadcast({
        type: 'screen:metrics:update',
        data
      });
    });

    this.screenCaptureService.on('quality:changed', (data) => {
      this.broadcast({
        type: 'screen:quality:changed',
        data
      });
    });
  }

  private setupLogCaptureEvents(): void {
    // Forward log capture events to connected clients
    this.logCaptureService.on('capture:started', (data) => {
      this.broadcast({
        type: 'log:capture:started',
        data
      });
    });

    this.logCaptureService.on('capture:stopped', (data) => {
      this.broadcast({
        type: 'log:capture:stopped',
        data
      });
    });

    this.logCaptureService.on('log', (data) => {
      this.broadcast({
        type: 'log:entry',
        data
      });
    });

    this.logCaptureService.on('logs:cleared', (data) => {
      this.broadcast({
        type: 'log:cleared',
        data
      });
    });

    this.logCaptureService.on('filter:updated', (data) => {
      this.broadcast({
        type: 'log:filter:updated',
        data
      });
    });
  }

  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(message: any): void {
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  /**
   * Get the number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Handle WebSocket upgrade for device bridge
   */
  handleUpgrade(request: any, socket: any, head: any): void {
    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request);
    });
  }
}
