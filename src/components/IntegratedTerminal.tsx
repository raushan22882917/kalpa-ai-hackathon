import React, { useState, useEffect, useRef } from 'react';
import './IntegratedTerminal.css';

export interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface IntegratedTerminalProps {
  command: string;
  onExecute: (command: string) => Promise<CommandResult>;
  autoExecute?: boolean;
}

interface TerminalState {
  isRunning: boolean;
  output: string[];
  exitCode?: number;
  error?: string;
}

export const IntegratedTerminal: React.FC<IntegratedTerminalProps> = ({
  command,
  onExecute,
  autoExecute = false,
}) => {
  const [state, setState] = useState<TerminalState>({
    isRunning: false,
    output: [],
    exitCode: undefined,
    error: undefined,
  });
  const [showConfirmation, setShowConfirmation] = useState(!autoExecute);
  const outputRef = useRef<HTMLDivElement>(null);
  const executeButtonRef = useRef<HTMLButtonElement>(null);
  const hasExecutedRef = useRef(false);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [state.output]);

  const handleExecute = async () => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;
    
    setShowConfirmation(false);
    setState({
      isRunning: true,
      output: [`$ ${command}`],
      exitCode: undefined,
      error: undefined,
    });

    try {
      const result = await onExecute(command);
      
      const newOutput = [`$ ${command}`];
      
      if (result.stdout) {
        newOutput.push(...result.stdout.split('\n'));
      }
      
      if (result.stderr) {
        newOutput.push(...result.stderr.split('\n').map(line => `ERROR: ${line}`));
      }

      setState({
        isRunning: false,
        output: newOutput,
        exitCode: result.exitCode,
        error: result.exitCode !== 0 ? result.stderr : undefined,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({
        isRunning: false,
        output: [`$ ${command}`, `ERROR: ${errorMessage}`],
        exitCode: 1,
        error: errorMessage,
      });
    }
  };

  // Auto-execute if enabled
  useEffect(() => {
    if (autoExecute && !hasExecutedRef.current) {
      handleExecute();
    }
  }, [autoExecute]);

  // Keyboard shortcut for execution
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && showConfirmation && !state.isRunning) {
      e.preventDefault();
      handleExecute();
    }
  };

  const getStatusClass = () => {
    if (state.isRunning) return 'terminal-status-running';
    if (state.exitCode === 0) return 'terminal-status-success';
    if (state.exitCode !== undefined && state.exitCode !== 0) return 'terminal-status-error';
    return '';
  };

  return (
    <div 
      className={`integrated-terminal ${getStatusClass()}`}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Integrated terminal"
    >
      <div className="terminal-header">
        <span className="terminal-title">Terminal</span>
        {state.isRunning && (
          <span className="terminal-spinner" aria-label="Command executing">⟳</span>
        )}
        {state.exitCode !== undefined && (
          <span 
            className={`terminal-exit-code ${state.exitCode === 0 ? 'success' : 'error'}`}
            role="status"
            aria-live="polite"
          >
            Exit Code: {state.exitCode}
          </span>
        )}
      </div>

      {showConfirmation ? (
        <div className="terminal-confirmation">
          <div className="terminal-command-preview">
            <code aria-label={`Command to execute: ${command}`}>{command}</code>
          </div>
          <button
            ref={executeButtonRef}
            className="terminal-execute-button"
            onClick={handleExecute}
            disabled={state.isRunning}
            aria-label={`Execute command: ${command} (Ctrl+Enter)`}
            title="Execute command (Ctrl+Enter)"
          >
            Execute Command
          </button>
        </div>
      ) : (
        <div 
          className="terminal-output" 
          ref={outputRef}
          role="log"
          aria-live="polite"
          aria-label="Terminal output"
        >
          {state.output.map((line, index) => (
            <div
              key={index}
              className={`terminal-line ${
                line.startsWith('$') ? 'terminal-command' :
                line.startsWith('ERROR:') ? 'terminal-error' :
                'terminal-stdout'
              }`}
            >
              {line}
            </div>
          ))}
          {state.isRunning && (
            <div className="terminal-line terminal-cursor" aria-hidden="true">▊</div>
          )}
        </div>
      )}

      {state.error && (
        <div className="terminal-error-summary" role="alert" aria-live="assertive">
          <strong>Error:</strong> {state.error}
        </div>
      )}
    </div>
  );
};

// Component for handling multiple commands in sequence
export interface CommandQueueProps {
  commands: string[];
  onExecute: (command: string) => Promise<CommandResult>;
  autoExecute?: boolean;
}

export const CommandQueue: React.FC<CommandQueueProps> = ({
  commands,
  onExecute,
  autoExecute = false,
}) => {
  const [results, setResults] = useState<CommandResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentOutput, setCurrentOutput] = useState<string[]>([]);
  const executionStartedRef = useRef(false);

  const executeAllCommands = async () => {
    if (executionStartedRef.current) return;
    executionStartedRef.current = true;
    
    setIsExecuting(true);
    const allResults: CommandResult[] = [];

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      setCurrentOutput([`$ ${command}`, 'Executing...']);

      try {
        const result = await onExecute(command);
        allResults.push(result);
        setResults([...allResults]);

        // Stop if command failed
        if (result.exitCode !== 0) {
          break;
        }
      } catch (error) {
        const errorResult: CommandResult = {
          command,
          exitCode: 1,
          stdout: '',
          stderr: error instanceof Error ? error.message : 'Unknown error',
        };
        allResults.push(errorResult);
        setResults([...allResults]);
        break;
      }
    }

    setIsExecuting(false);
    setCurrentOutput([]);
  };

  // Execute all commands sequentially
  useEffect(() => {
    if (autoExecute && commands.length > 0 && !executionStartedRef.current) {
      executeAllCommands();
    }
  }, [autoExecute, commands.length]);

  const handleManualStart = () => {
    executeAllCommands();
  };

  const lastResult = results.length > 0 ? results[results.length - 1] : null;
  const hasFailure = lastResult !== null && lastResult.exitCode !== 0;
  const isComplete = results.length === commands.length || hasFailure;
  const hasStarted = executionStartedRef.current;

  return (
    <div className="command-queue">
      <div className="queue-header">
        <span>
          {isComplete
            ? `Completed ${results.length} of ${commands.length} commands`
            : `Command ${results.length + 1} of ${commands.length}`}
        </span>
      </div>

      {!hasStarted && (
        <div className="terminal-confirmation">
          <div className="terminal-command-preview">
            <code>{commands.length} commands queued</code>
          </div>
          <button
            className="terminal-execute-button"
            onClick={handleManualStart}
          >
            Execute All Commands
          </button>
        </div>
      )}

      {isExecuting && currentOutput.length > 0 && (
        <div className="terminal-output">
          {currentOutput.map((line, index) => (
            <div key={index} className="terminal-line terminal-stdout">
              {line}
            </div>
          ))}
          <div className="terminal-line terminal-cursor">▊</div>
        </div>
      )}

      {isComplete && (
        <div className="queue-complete">
          <p>
            {lastResult?.exitCode === 0
              ? '✓ All commands completed successfully'
              : '✗ Command execution stopped due to error'}
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="queue-summary">
          <h4>Execution Summary:</h4>
          {results.map((result, index) => (
            <div key={index} className="queue-result">
              <span className={result.exitCode === 0 ? 'success' : 'error'}>
                {result.exitCode === 0 ? '✓' : '✗'}
              </span>
              <code>{result.command}</code>
              <span className="exit-code">Exit: {result.exitCode}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
