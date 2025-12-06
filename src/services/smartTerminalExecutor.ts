/**
 * Smart Terminal Executor Service
 * Executes commands with intelligent waiting and completion detection
 */

export interface CommandExecutionOptions {
  onProgress?: (message: string) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export interface CommandDefinition {
  command: string;
  waitForCompletion: boolean;
  expectedDuration?: number; // in milliseconds
  successIndicators?: string[]; // strings that indicate success
  needsCtrlC?: boolean; // whether to send Ctrl+C after completion
}

class SmartTerminalExecutor {
  private terminalOutput: string = '';
  private outputListener: ((output: string) => void) | null = null;

  /**
   * Execute a series of commands with intelligent waiting
   */
  async executeCommands(
    commands: CommandDefinition[],
    sendToTerminal: (cmd: string) => void,
    options: CommandExecutionOptions = {}
  ): Promise<void> {
    for (let i = 0; i < commands.length; i++) {
      const cmd = commands[i];
      
      options.onProgress?.(`Executing (${i + 1}/${commands.length}): ${cmd.command}`);
      
      // Send command to terminal
      sendToTerminal(cmd.command);
      
      if (cmd.waitForCompletion) {
        // Wait for command to complete
        await this.waitForCommandCompletion(cmd);
        
        // Send Ctrl+C if needed (for dev servers, etc.)
        if (cmd.needsCtrlC) {
          sendToTerminal('\x03'); // Ctrl+C
          await this.delay(500);
        }
      } else {
        // Just wait a fixed amount of time
        await this.delay(cmd.expectedDuration || 1000);
      }
    }
    
    options.onComplete?.();
  }

  /**
   * Wait for a command to complete by monitoring output
   */
  private async waitForCommandCompletion(cmd: CommandDefinition): Promise<void> {
    const maxWaitTime = cmd.expectedDuration || 60000; // Default 60 seconds
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        // Check if we've exceeded max wait time
        if (elapsed > maxWaitTime) {
          clearInterval(checkInterval);
          resolve();
          return;
        }
        
        // Check for success indicators in output
        if (cmd.successIndicators) {
          const hasSuccess = cmd.successIndicators.some(indicator => 
            this.terminalOutput.toLowerCase().includes(indicator.toLowerCase())
          );
          
          if (hasSuccess) {
            clearInterval(checkInterval);
            resolve();
            return;
          }
        }
        
        // Check for common completion patterns
        if (this.isCommandComplete(cmd.command)) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
    });
  }

  /**
   * Check if command appears to be complete based on output patterns
   */
  private isCommandComplete(command: string): boolean {
    const lowerOutput = this.terminalOutput.toLowerCase();
    const lowerCmd = command.toLowerCase();
    
    // npm/yarn install completion
    if (lowerCmd.includes('install') || lowerCmd.includes('npm i')) {
      return lowerOutput.includes('added') || 
             lowerOutput.includes('packages in') ||
             lowerOutput.includes('up to date');
    }
    
    // npm create/init completion
    if (lowerCmd.includes('create') || lowerCmd.includes('init')) {
      return lowerOutput.includes('done') || 
             lowerOutput.includes('created') ||
             lowerOutput.includes('scaffolding project');
    }
    
    // mkdir, cd, echo - instant commands
    if (lowerCmd.startsWith('mkdir') || 
        lowerCmd.startsWith('cd ') || 
        lowerCmd.startsWith('echo')) {
      return true;
    }
    
    // Python pip install
    if (lowerCmd.includes('pip install')) {
      return lowerOutput.includes('successfully installed') ||
             lowerOutput.includes('requirement already satisfied');
    }
    
    // Git commands
    if (lowerCmd.startsWith('git ')) {
      return lowerOutput.includes('done') ||
             lowerOutput.includes('already') ||
             this.terminalOutput.endsWith('$') ||
             this.terminalOutput.endsWith('>');
    }
    
    // Default: check if prompt returned
    return this.terminalOutput.endsWith('$ ') || 
           this.terminalOutput.endsWith('> ') ||
           this.terminalOutput.endsWith('% ');
  }

  /**
   * Update terminal output (call this when terminal receives data)
   */
  updateOutput(output: string): void {
    this.terminalOutput += output;
    
    // Keep only last 5000 characters to prevent memory issues
    if (this.terminalOutput.length > 5000) {
      this.terminalOutput = this.terminalOutput.slice(-5000);
    }
    
    this.outputListener?.(output);
  }

  /**
   * Listen to terminal output
   */
  onOutput(callback: (output: string) => void): () => void {
    this.outputListener = callback;
    return () => {
      this.outputListener = null;
    };
  }

  /**
   * Clear terminal output buffer
   */
  clearOutput(): void {
    this.terminalOutput = '';
  }

  /**
   * Simple delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Categorize commands and determine execution strategy
   */
  categorizeCommands(commands: string[]): CommandDefinition[] {
    return commands.map(cmd => {
      const lowerCmd = cmd.toLowerCase();
      
      // Quick commands (no waiting needed)
      if (lowerCmd.startsWith('mkdir') || 
          lowerCmd.startsWith('cd ') ||
          lowerCmd.startsWith('echo')) {
        return {
          command: cmd,
          waitForCompletion: false,
          expectedDuration: 300
        };
      }
      
      // npm/yarn create (long running)
      if (lowerCmd.includes('create vite') || 
          lowerCmd.includes('create-next-app') ||
          lowerCmd.includes('create-react-app') ||
          lowerCmd.includes('create-expo-app')) {
        return {
          command: cmd,
          waitForCompletion: true,
          expectedDuration: 120000, // 2 minutes
          successIndicators: ['done', 'created', 'success']
        };
      }
      
      // npm/yarn install
      if (lowerCmd.includes('install') || lowerCmd.includes('npm i ')) {
        return {
          command: cmd,
          waitForCompletion: true,
          expectedDuration: 90000, // 90 seconds
          successIndicators: ['added', 'packages in', 'up to date']
        };
      }
      
      // npm init
      if (lowerCmd.includes('npm init') || lowerCmd.includes('yarn init')) {
        return {
          command: cmd,
          waitForCompletion: true,
          expectedDuration: 5000,
          successIndicators: ['wrote to']
        };
      }
      
      // Python pip install
      if (lowerCmd.includes('pip install')) {
        return {
          command: cmd,
          waitForCompletion: true,
          expectedDuration: 60000,
          successIndicators: ['successfully installed']
        };
      }
      
      // Dev servers (need Ctrl+C after starting)
      if (lowerCmd.includes('npm run dev') || 
          lowerCmd.includes('npm start') ||
          lowerCmd.includes('yarn dev') ||
          lowerCmd.includes('yarn start')) {
        return {
          command: cmd,
          waitForCompletion: true,
          expectedDuration: 15000,
          successIndicators: ['local:', 'localhost:', 'ready in'],
          needsCtrlC: true
        };
      }
      
      // Default: medium wait
      return {
        command: cmd,
        waitForCompletion: true,
        expectedDuration: 5000
      };
    });
  }
}

export const smartTerminalExecutor = new SmartTerminalExecutor();
