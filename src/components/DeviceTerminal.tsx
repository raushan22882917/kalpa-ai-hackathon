import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import './DeviceTerminal.css';

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export interface DeviceTerminalProps {
  sessionId: string;
  deviceId: string;
  onExecuteCommand: (sessionId: string, command: string) => Promise<CommandResult>;
  onInterrupt: (sessionId: string) => void;
  onClose: (sessionId: string) => void;
}

/**
 * DeviceTerminal component for executing commands on connected devices
 * Integrates xterm.js for terminal rendering with real-time output streaming
 */
export const DeviceTerminal: React.FC<DeviceTerminalProps> = ({
  sessionId,
  deviceId,
  onExecuteCommand,
  onInterrupt,
  onClose
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [currentCommand, setCurrentCommand] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js terminal
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      },
      rows: 24,
      cols: 80
    });

    // Initialize fit addon for responsive sizing
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Open terminal in the container
    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Display welcome message
    terminal.writeln(`Device Terminal - Session: ${sessionId}`);
    terminal.writeln(`Connected to device: ${deviceId}`);
    terminal.writeln('');
    writePrompt(terminal);

    // Handle terminal input
    let currentLine = '';
    terminal.onData((data) => {
      if (isExecuting) {
        // If command is executing, only allow Ctrl+C
        if (data === '\x03') {
          // Ctrl+C
          handleInterrupt();
        }
        return;
      }

      switch (data) {
        case '\r': // Enter
          if (currentLine.trim()) {
            terminal.writeln('');
            handleCommandExecution(currentLine.trim(), terminal);
            currentLine = '';
          } else {
            terminal.writeln('');
            writePrompt(terminal);
          }
          break;

        case '\x7F': // Backspace
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            terminal.write('\b \b');
          }
          break;

        case '\x03': // Ctrl+C
          terminal.writeln('^C');
          currentLine = '';
          writePrompt(terminal);
          break;

        case '\x1b[A': // Up arrow
          if (commandHistory.length > 0) {
            const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
            if (newIndex !== historyIndex) {
              setHistoryIndex(newIndex);
              const historicalCommand = commandHistory[commandHistory.length - 1 - newIndex];
              // Clear current line
              terminal.write('\r\x1b[K');
              writePrompt(terminal);
              terminal.write(historicalCommand);
              currentLine = historicalCommand;
            }
          }
          break;

        case '\x1b[B': // Down arrow
          if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const historicalCommand = commandHistory[commandHistory.length - 1 - newIndex];
            // Clear current line
            terminal.write('\r\x1b[K');
            writePrompt(terminal);
            terminal.write(historicalCommand);
            currentLine = historicalCommand;
          } else if (historyIndex === 0) {
            setHistoryIndex(-1);
            terminal.write('\r\x1b[K');
            writePrompt(terminal);
            currentLine = '';
          }
          break;

        default:
          // Regular character input
          if (data >= ' ' || data === '\t') {
            currentLine += data;
            terminal.write(data);
          }
      }
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, [sessionId, deviceId]);

  const writePrompt = (terminal: Terminal) => {
    terminal.write('\r\n$ ');
  };

  const handleCommandExecution = async (command: string, terminal: Terminal) => {
    setIsExecuting(true);
    setCurrentCommand(command);
    
    // Add to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    try {
      const result = await onExecuteCommand(sessionId, command);
      
      // Display output
      if (result.stdout) {
        terminal.writeln(result.stdout);
      }
      
      if (result.stderr) {
        terminal.write('\x1b[31m'); // Red color for errors
        terminal.writeln(result.stderr);
        terminal.write('\x1b[0m'); // Reset color
      }

      // Display exit code if non-zero
      if (result.exitCode !== 0) {
        terminal.write('\x1b[31m'); // Red color
        terminal.writeln(`Exit code: ${result.exitCode}`);
        terminal.write('\x1b[0m'); // Reset color
      }
    } catch (error) {
      terminal.write('\x1b[31m'); // Red color
      terminal.writeln(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      terminal.write('\x1b[0m'); // Reset color
    } finally {
      setIsExecuting(false);
      setCurrentCommand('');
      writePrompt(terminal);
    }
  };

  const handleInterrupt = () => {
    if (isExecuting) {
      onInterrupt(sessionId);
      setIsExecuting(false);
      setCurrentCommand('');
      
      if (xtermRef.current) {
        xtermRef.current.writeln('^C');
        writePrompt(xtermRef.current);
      }
    }
  };

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      writePrompt(xtermRef.current);
    }
  };

  const handleCopy = () => {
    if (xtermRef.current) {
      const selection = xtermRef.current.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection);
      }
    }
  };

  const handlePaste = async () => {
    if (xtermRef.current && !isExecuting) {
      try {
        const text = await navigator.clipboard.readText();
        xtermRef.current.paste(text);
      } catch (error) {
        console.error('Failed to paste:', error);
      }
    }
  };

  return (
    <div className="device-terminal">
      <div className="device-terminal-header">
        <div className="device-terminal-title">
          <span className="device-terminal-icon">$</span>
          <span>Device Terminal</span>
          {isExecuting && (
            <span className="device-terminal-executing">
              Executing: {currentCommand}
            </span>
          )}
        </div>
        <div className="device-terminal-actions">
          <button
            className="device-terminal-button"
            onClick={handleCopy}
            title="Copy selection"
          >
            Copy
          </button>
          <button
            className="device-terminal-button"
            onClick={handlePaste}
            title="Paste"
            disabled={isExecuting}
          >
            Paste
          </button>
          <button
            className="device-terminal-button"
            onClick={handleClear}
            title="Clear terminal"
          >
            Clear
          </button>
          {isExecuting && (
            <button
              className="device-terminal-button device-terminal-interrupt"
              onClick={handleInterrupt}
              title="Interrupt (Ctrl+C)"
            >
              Interrupt
            </button>
          )}
          <button
            className="device-terminal-button device-terminal-close"
            onClick={() => onClose(sessionId)}
            title="Close terminal"
          >
            ×
          </button>
        </div>
      </div>
      <div className="device-terminal-container" ref={terminalRef} />
    </div>
  );
};
