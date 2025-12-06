import { EventEmitter } from 'events';
import { ADBBridge } from './adbBridge';
import { IOSBridge } from './iosBridge';
import { CommandResult } from '../types/device';

export interface TerminalSession {
  sessionId: string;
  deviceId: string;
  platform: 'android' | 'ios';
  shell: 'sh' | 'bash' | 'zsh';
  workingDirectory: string;
  environment: Map<string, string>;
  isActive: boolean;
  createdAt: Date;
}

export interface CommandHistoryEntry {
  command: string;
  timestamp: Date;
  exitCode: number;
  duration: number;
}

/**
 * Terminal Proxy for managing device terminal sessions
 * Handles command execution, output streaming, and session management
 */
export class TerminalProxy extends EventEmitter {
  private sessions: Map<string, TerminalSession>;
  private sessionHistory: Map<string, CommandHistoryEntry[]>;
  private adbBridge: ADBBridge;
  private iosBridge: IOSBridge;
  private runningCommands: Map<string, AbortController>;

  constructor(adbBridge: ADBBridge, iosBridge: IOSBridge) {
    super();
    this.setMaxListeners(100); // Increase max listeners for property tests
    this.sessions = new Map();
    this.sessionHistory = new Map();
    this.adbBridge = adbBridge;
    this.iosBridge = iosBridge;
    this.runningCommands = new Map();
  }

  /**
   * Create a new terminal session for a device
   */
  createSession(deviceId: string, platform: 'android' | 'ios'): TerminalSession {
    const sessionId = this.generateSessionId();
    
    const session: TerminalSession = {
      sessionId,
      deviceId,
      platform,
      shell: 'sh',
      workingDirectory: platform === 'android' ? '/sdcard' : '/var/mobile',
      environment: new Map(),
      isActive: true,
      createdAt: new Date()
    };

    this.sessions.set(sessionId, session);
    this.sessionHistory.set(sessionId, []);

    this.emit('session:created', session);
    
    return session;
  }

  /**
   * Get a terminal session by ID
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Execute a command in a terminal session
   */
  async executeCommand(sessionId: string, command: string): Promise<CommandResult> {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (!session.isActive) {
      throw new Error(`Session is not active: ${sessionId}`);
    }

    const startTime = Date.now();
    
    try {
      // Create abort controller for this command
      const abortController = new AbortController();
      this.runningCommands.set(sessionId, abortController);

      // Emit command start event
      this.emit('command:start', { sessionId, command });

      // Execute command based on platform
      let result: CommandResult;
      if (session.platform === 'android') {
        result = await this.executeAndroidCommand(session, command, abortController);
      } else {
        result = await this.executeIOSCommand(session, command, abortController);
      }

      // Add to history
      const historyEntry: CommandHistoryEntry = {
        command,
        timestamp: new Date(),
        exitCode: result.exitCode,
        duration: result.duration
      };
      
      const history = this.sessionHistory.get(sessionId) || [];
      history.push(historyEntry);
      this.sessionHistory.set(sessionId, history);

      // Emit command complete event
      this.emit('command:complete', { sessionId, command, result });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResult: CommandResult = {
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        duration
      };

      this.emit('command:error', { sessionId, command, error: errorResult.stderr });

      return errorResult;
    } finally {
      this.runningCommands.delete(sessionId);
    }
  }

  /**
   * Execute command on Android device
   */
  private async executeAndroidCommand(
    session: TerminalSession,
    command: string,
    abortController: AbortController
  ): Promise<CommandResult> {
    // Build full command with working directory
    const fullCommand = `cd ${session.workingDirectory} && ${command}`;
    
    // Execute via ADB bridge
    const result = await this.adbBridge.executeCommand(session.deviceId, fullCommand);

    // Stream output in chunks if available
    if (result.stdout) {
      this.streamOutput(session.sessionId, result.stdout, 'stdout');
    }
    
    if (result.stderr) {
      this.streamOutput(session.sessionId, result.stderr, 'stderr');
    }

    return result;
  }

  /**
   * Execute command on iOS device
   */
  private async executeIOSCommand(
    session: TerminalSession,
    command: string,
    abortController: AbortController
  ): Promise<CommandResult> {
    // Build full command with working directory
    const fullCommand = `cd ${session.workingDirectory} && ${command}`;
    
    // Execute via iOS bridge
    const result = await this.iosBridge.executeCommand(session.deviceId, fullCommand);

    // Stream output in chunks if available
    if (result.stdout) {
      this.streamOutput(session.sessionId, result.stdout, 'stdout');
    }
    
    if (result.stderr) {
      this.streamOutput(session.sessionId, result.stderr, 'stderr');
    }

    return result;
  }

  /**
   * Stream output in chunks for real-time display
   */
  private streamOutput(sessionId: string, output: string, type: 'stdout' | 'stderr'): void {
    // Split output into chunks for streaming
    const chunkSize = 1024;
    for (let i = 0; i < output.length; i += chunkSize) {
      const chunk = output.slice(i, i + chunkSize);
      this.emit('output', {
        sessionId,
        type,
        data: chunk,
        timestamp: new Date()
      });
    }
  }

  /**
   * Send input to a running command
   */
  sendInput(sessionId: string, input: string): void {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Emit input event for handling
    this.emit('input', { sessionId, input });
  }

  /**
   * Interrupt a running command (Ctrl+C)
   */
  interrupt(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const abortController = this.runningCommands.get(sessionId);
    if (abortController) {
      abortController.abort();
      this.runningCommands.delete(sessionId);
      
      this.emit('command:interrupted', { sessionId });
      
      // Emit interrupt signal output
      this.emit('output', {
        sessionId,
        type: 'stderr',
        data: '^C\n',
        timestamp: new Date()
      });
    }
  }

  /**
   * Close a terminal session
   */
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Interrupt any running commands
    if (this.runningCommands.has(sessionId)) {
      this.interrupt(sessionId);
    }

    // Mark session as inactive
    session.isActive = false;

    // Clean up after a delay
    setTimeout(() => {
      this.sessions.delete(sessionId);
      this.sessionHistory.delete(sessionId);
    }, 5000);

    this.emit('session:closed', { sessionId });
  }

  /**
   * Get command history for a session
   */
  getHistory(sessionId: string): CommandHistoryEntry[] {
    return this.sessionHistory.get(sessionId) || [];
  }

  /**
   * Clear command history for a session
   */
  clearHistory(sessionId: string): void {
    this.sessionHistory.set(sessionId, []);
    this.emit('history:cleared', { sessionId });
  }

  /**
   * Change working directory for a session
   */
  changeDirectory(sessionId: string, directory: string): void {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.workingDirectory = directory;
    this.emit('directory:changed', { sessionId, directory });
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): TerminalSession[] {
    return Array.from(this.sessions.values()).filter(s => s.isActive);
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
