/**
 * PTY Terminal Service
 * Manages real terminal sessions using node-pty
 */

import * as pty from 'node-pty';
import * as os from 'os';

export interface TerminalSession {
  id: string;
  ptyProcess: pty.IPty;
  createdAt: Date;
}

export class PTYTerminalService {
  private sessions: Map<string, TerminalSession> = new Map();

  /**
   * Create a new terminal session
   */
  createSession(sessionId: string, cwd?: string): TerminalSession {
    // Determine shell based on OS - no auto-detection, just use defaults
    let shell: string;
    
    if (os.platform() === 'win32') {
      shell = 'powershell.exe';
    } else {
      // Use user's default shell without any special flags
      shell = process.env.SHELL || '/bin/sh';
    }
    
    // Prepare environment with proper terminal settings
    const env = {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      LANG: process.env.LANG || 'en_US.UTF-8',
      LC_ALL: process.env.LC_ALL || 'en_US.UTF-8',
    } as { [key: string]: string };
    
    // Spawn PTY process with no shell arguments
    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: cwd || process.cwd(),
      env,
    });

    const session: TerminalSession = {
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
  getOrCreateSession(sessionId: string): TerminalSession {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      return existing;
    }
    return this.createSession(sessionId);
  }

  /**
   * Write data to terminal
   */
  write(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.ptyProcess.write(data);
    }
  }

  /**
   * Resize terminal
   */
  resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.ptyProcess.resize(cols, rows);
    }
  }

  /**
   * Close terminal session
   */
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.ptyProcess.kill();
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clean up all sessions
   */
  cleanup(): void {
    for (const session of this.sessions.values()) {
      session.ptyProcess.kill();
    }
    this.sessions.clear();
  }
}

export const ptyTerminalService = new PTYTerminalService();
