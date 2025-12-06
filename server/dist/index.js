import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
dotenv.config();
const app = express();
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
app.get('/health', (_req, res) => {
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
terminalWss.on('connection', (ws) => {
    const sessionId = Math.random().toString(36).substring(7);
    const session = ptyTerminalService.createSession(sessionId);
    // Forward PTY output to WebSocket
    session.ptyProcess.onData((data) => {
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
    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message.toString());
            if (msg.type === 'input') {
                ptyTerminalService.write(sessionId, msg.data);
            }
            else if (msg.type === 'resize') {
                ptyTerminalService.resize(sessionId, msg.cols, msg.rows);
            }
        }
        catch (error) {
            console.error('Terminal message error:', error);
        }
    });
    // Handle WebSocket close
    ws.on('close', () => {
        ptyTerminalService.closeSession(sessionId);
    });
});
// Handle WebSocket upgrade for terminal path
server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    if (pathname === '/terminal') {
        terminalWss.handleUpgrade(request, socket, head, (ws) => {
            terminalWss.emit('connection', ws, request);
        });
    }
    // DeviceWebSocketServer handles /device-bridge automatically via its constructor
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
