import dotenv from 'dotenv';

// CRITICAL: Load environment variables BEFORE any other imports
dotenv.config();

import express, { Express, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import aiRoutes from './routes/ai';
import deviceRoutes, { deviceManager, adbBridge, iosBridge } from './routes/devices';
import appInstallationRoutes, { appInstallationService } from './routes/appInstallation';
import filesystemRoutes from './routes/filesystem';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { DeviceWebSocketServer } from './services/websocketServer';
import { TerminalProxy } from './services/terminalProxy';
import { ScreenCaptureService } from './services/screenCaptureService';
import { LogCaptureService } from './services/logCaptureService';
import { ptyTerminalService } from './services/ptyTerminalService';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for WebSocket support
const server = createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/ai', aiRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/app-installation', appInstallationRoutes);
app.use('/api/filesystem', filesystemRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize Terminal Proxy
const terminalProxy = new TerminalProxy(adbBridge, iosBridge);

// Initialize Screen Capture Service
const screenCaptureService = new ScreenCaptureService(adbBridge, iosBridge);

// Initialize Log Capture Service
const logCaptureService = new LogCaptureService(adbBridge, iosBridge);

// Initialize WebSocket server for device communication
const wsServer = new DeviceWebSocketServer(server, deviceManager, terminalProxy, screenCaptureService, appInstallationService, logCaptureService);

// Initialize WebSocket server for terminal
const terminalWss = new WebSocketServer({ noServer: true });

terminalWss.on('connection', (ws: WebSocket, request: any) => {
  const sessionId = Math.random().toString(36).substring(7);
  
  // Extract workspace path from query parameters
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const workspacePath = url.searchParams.get('cwd') || process.cwd();
  
  console.log(`Creating terminal session in: ${workspacePath}`);
  
  const session = ptyTerminalService.createSession(sessionId, workspacePath);

  // Forward PTY output to WebSocket
  session.ptyProcess.onData((data: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  // Handle PTY exit
  session.ptyProcess.onExit(() => {
    ptyTerminalService.closeSession(sessionId);
    ws.close();
  });

  // Handle WebSocket messages
  ws.on('message', (message: Buffer) => {
    try {
      const msg = JSON.parse(message.toString());
      
      if (msg.type === 'input') {
        ptyTerminalService.write(sessionId, msg.data);
      } else if (msg.type === 'resize') {
        ptyTerminalService.resize(sessionId, msg.cols, msg.rows);
      }
    } catch (error) {
      console.error('Terminal message error:', error);
    }
  });

  // Handle WebSocket close
  ws.on('close', () => {
    ptyTerminalService.closeSession(sessionId);
  });
});

// Handle WebSocket upgrade for both terminal and device-bridge paths
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

  console.log(`WebSocket upgrade request for: ${pathname}`);

  if (pathname === '/terminal') {
    terminalWss.handleUpgrade(request, socket, head, (ws) => {
      terminalWss.emit('connection', ws, request);
    });
  } else if (pathname === '/device-bridge') {
    wsServer.handleUpgrade(request, socket, head);
  } else {
    console.log(`Unknown WebSocket path: ${pathname}`);
    socket.destroy();
  }
});

// Cleanup on exit
process.on('SIGTERM', () => {
  ptyTerminalService.cleanup();
  process.exit(0);
});

process.on('SIGINT', () => {
  ptyTerminalService.cleanup();
  process.exit(0);
});

// Start server
server.listen(PORT, () => {
  console.log(`AI Backend server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/device-bridge`);
  console.log(`Terminal WebSocket available at ws://localhost:${PORT}/terminal`);
});

export default app;
export { wsServer, terminalWss };
