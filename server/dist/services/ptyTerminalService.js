/**
 * PTY Terminal Service
 * Manages real terminal sessions using node-pty
 */
import * as pty from 'node-pty';
import * as os from 'os';
export class PTYTerminalService {
    constructor() {
        this.sessions = new Map();
    }
    /**
     * Create a new terminal session
     */
    createSession(sessionId) {
        // Determine shell based on OS
        const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/bash';
        // Spawn PTY process
        const ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: process.cwd(),
            env: process.env,
        });
        const session = {
            id: sessionId,
            ptyProcess,
            createdAt: new Date(),
        };
        this.sessions.set(sessionId, session);
        return session;
    }
    /**
     * Get existing session or create new one
     */
    getOrCreateSession(sessionId) {
        const existing = this.sessions.get(sessionId);
        if (existing) {
            return existing;
        }
        return this.createSession(sessionId);
    }
    /**
     * Write data to terminal
     */
    write(sessionId, data) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.ptyProcess.write(data);
        }
    }
    /**
     * Resize terminal
     */
    resize(sessionId, cols, rows) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.ptyProcess.resize(cols, rows);
        }
    }
    /**
     * Close terminal session
     */
    closeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.ptyProcess.kill();
            this.sessions.delete(sessionId);
        }
    }
    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Get all active sessions
     */
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    /**
     * Clean up all sessions
     */
    cleanup() {
        for (const session of this.sessions.values()) {
            session.ptyProcess.kill();
        }
        this.sessions.clear();
    }
}
export const ptyTerminalService = new PTYTerminalService();
