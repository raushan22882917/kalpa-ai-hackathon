/**
 * Code Execution Service
 * Handles running code in different languages
 */

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  exitCode?: number;
  executionTime?: number;
}

export class CodeExecutionService {
  /**
   * Get the command to run a file based on its language
   */
  private getRunCommand(language: string, fileName: string): string | null {
    const commands: Record<string, string> = {
      javascript: `node "${fileName}"`,
      typescript: `ts-node "${fileName}"`,
      python: `python3 "${fileName}"`,
      java: `javac "${fileName}" && java "${fileName.replace('.java', '')}"`,
      cpp: `g++ "${fileName}" -o output && ./output`,
      c: `gcc "${fileName}" -o output && ./output`,
      go: `go run "${fileName}"`,
      rust: `rustc "${fileName}" && ./${fileName.replace('.rs', '')}`,
      ruby: `ruby "${fileName}"`,
      php: `php "${fileName}"`,
      shell: `bash "${fileName}"`,
      bash: `bash "${fileName}"`,
      powershell: `powershell -File "${fileName}"`,
    };

    return commands[language.toLowerCase()] || null;
  }

  /**
   * Execute code via terminal
   */
  async executeInTerminal(
    language: string,
    fileName: string,
    onOutput?: (output: string) => void
  ): Promise<void> {
    const command = this.getRunCommand(language, fileName);
    
    if (!command) {
      throw new Error(`Cannot run ${language} files. Language not supported.`);
    }

    // Send command to terminal via WebSocket
    // This will be handled by the terminal component
    if (onOutput) {
      onOutput(`\x1b[32m▶ Running: ${command}\x1b[0m\n`);
    }

    // The actual execution will happen in the terminal
    return;
  }

  /**
   * Get execution instructions for a language
   */
  getExecutionInstructions(language: string): string {
    const instructions: Record<string, string> = {
      javascript: 'Save the file and click Run to execute with Node.js',
      typescript: 'Save the file and click Run to execute with ts-node',
      python: 'Save the file and click Run to execute with Python 3',
      java: 'Save the file and click Run to compile and execute',
      cpp: 'Save the file and click Run to compile with g++ and execute',
      c: 'Save the file and click Run to compile with gcc and execute',
      go: 'Save the file and click Run to execute with go run',
      rust: 'Save the file and click Run to compile and execute',
      ruby: 'Save the file and click Run to execute with Ruby',
      php: 'Save the file and click Run to execute with PHP',
      shell: 'Save the file and click Run to execute with bash',
      bash: 'Save the file and click Run to execute with bash',
      powershell: 'Save the file and click Run to execute with PowerShell',
      html: 'Open in browser to view',
      css: 'Include in HTML file to apply styles',
      markdown: 'Preview in markdown viewer',
    };

    return instructions[language.toLowerCase()] || 'Save the file to edit';
  }

  /**
   * Check if a language is executable
   */
  isExecutable(language: string): boolean {
    return this.getRunCommand(language, 'dummy') !== null;
  }

  /**
   * Format code based on language
   */
  async formatCode(code: string, _language: string): Promise<string> {
    // This would integrate with formatters like prettier, black, etc.
    // For now, return the code as-is
    return code;
  }

  /**
   * Get debug configuration for a language
   */
  getDebugConfig(language: string, fileName: string): any {
    const configs: Record<string, any> = {
      javascript: {
        type: 'node',
        request: 'launch',
        name: 'Debug JavaScript',
        program: fileName,
      },
      typescript: {
        type: 'node',
        request: 'launch',
        name: 'Debug TypeScript',
        program: fileName,
        preLaunchTask: 'tsc: build',
      },
      python: {
        type: 'python',
        request: 'launch',
        name: 'Debug Python',
        program: fileName,
      },
    };

    return configs[language.toLowerCase()] || null;
  }
}

export const codeExecutionService = new CodeExecutionService();
