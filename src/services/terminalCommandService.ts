/**
 * Terminal Command Service
 * Handles command execution through WebSocket terminal connection
 */

export interface CommandExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
}

class TerminalCommandService {
  private wsConnection: WebSocket | null = null;
  private commandQueue: Array<{
    command: string;
    resolve: (result: CommandExecutionResult) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessing = false;
  private outputBuffer: string[] = [];
  private currentCommandResolve: ((result: CommandExecutionResult) => void) | null = null;

  /**
   * Initialize WebSocket connection to terminal server
   */
  async connect(workspacePath?: string): Promise<boolean> {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      return true;
    }

    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const cwdParam = workspacePath ? `?cwd=${encodeURIComponent(workspacePath)}` : '';
        const wsUrl = `${protocol}//${window.location.hostname}:3001/terminal${cwdParam}`;
        
        this.wsConnection = new WebSocket(wsUrl);

        this.wsConnection.onopen = () => {
          console.log('Terminal WebSocket connected');
          resolve(true);
        };

        this.wsConnection.onerror = (error) => {
          console.error('Terminal WebSocket error:', error);
          reject(new Error('Failed to connect to terminal server'));
        };

        this.wsConnection.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.wsConnection.onclose = () => {
          console.log('Terminal WebSocket closed');
          this.wsConnection = null;
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
            reject(new Error('Connection timeout'));
          }
        }, 5000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming messages from terminal
   */
  private handleMessage(data: string) {
    this.outputBuffer.push(data);
    
    // Check for command completion indicators
    // This is a simple heuristic - you may need to adjust based on your shell
    if (data.includes('$') || data.includes('>') || data.includes('#')) {
      // Command might be complete
      if (this.currentCommandResolve) {
        const output = this.outputBuffer.join('');
        this.currentCommandResolve({
          success: true,
          output,
          exitCode: 0
        });
        this.currentCommandResolve = null;
        this.outputBuffer = [];
        this.processNextCommand();
      }
    }
  }

  /**
   * Execute a single command
   */
  async executeCommand(command: string): Promise<CommandExecutionResult> {
    // Ensure connection
    try {
      await this.connect();
    } catch (error) {
      return {
        success: false,
        error: 'Terminal server not available. Please start the backend server with: npm run server'
      };
    }

    return new Promise((resolve, reject) => {
      this.commandQueue.push({ command, resolve, reject });
      
      if (!this.isProcessing) {
        this.processNextCommand();
      }
    });
  }

  /**
   * Process next command in queue
   */
  private processNextCommand() {
    if (this.commandQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { command, resolve, reject } = this.commandQueue.shift()!;

    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      reject(new Error('Terminal connection not available'));
      this.processNextCommand();
      return;
    }

    try {
      this.currentCommandResolve = resolve;
      this.outputBuffer = [];
      
      // Send command to terminal
      this.wsConnection.send(JSON.stringify({
        type: 'input',
        data: `${command}\n`
      }));

      // Set timeout for command execution
      setTimeout(() => {
        if (this.currentCommandResolve === resolve) {
          const output = this.outputBuffer.join('');
          resolve({
            success: true,
            output,
            exitCode: 0
          });
          this.currentCommandResolve = null;
          this.outputBuffer = [];
          this.processNextCommand();
        }
      }, 3000); // 3 second timeout per command
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Failed to execute command'));
      this.processNextCommand();
    }
  }

  /**
   * Execute multiple commands in sequence
   */
  async executeCommands(commands: string[]): Promise<CommandExecutionResult[]> {
    const results: CommandExecutionResult[] = [];

    for (const command of commands) {
      try {
        const result = await this.executeCommand(command);
        results.push(result);
        
        // Stop on first failure
        if (!result.success) {
          break;
        }
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        break;
      }
    }

    return results;
  }

  /**
   * Disconnect from terminal
   */
  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.commandQueue = [];
    this.isProcessing = false;
    this.outputBuffer = [];
    this.currentCommandResolve = null;
  }

  /**
   * Check if terminal is connected
   */
  isConnected(): boolean {
    return this.wsConnection !== null && this.wsConnection.readyState === WebSocket.OPEN;
  }
}

export const terminalCommandService = new TerminalCommandService();
