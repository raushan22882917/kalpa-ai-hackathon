import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import './AppLogViewer.css';

export interface AppLogEntry {
  timestamp: Date;
  level: 'verbose' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  tag: string;
  message: string;
  pid?: number;
}

export interface AppLogViewerProps {
  deviceId: string;
  packageName: string;
  onStartCapture: (deviceId: string, packageName: string) => void;
  onStopCapture: (deviceId: string, packageName: string) => void;
}

/**
 * AppLogViewer component for displaying application logs in real-time
 */
export const AppLogViewer: React.FC<AppLogViewerProps> = ({
  deviceId,
  packageName,
  onStartCapture,
  onStopCapture
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js terminal for log display
    const terminal = new Terminal({
      cursorBlink: false,
      fontSize: 12,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
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
      rows: 30,
      cols: 120,
      disableStdin: true // Read-only terminal
    });

    // Initialize fit addon
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // Open terminal
    terminal.open(terminalRef.current);
    fitAddon.fit();

    // Store references
    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Display header
    terminal.writeln(`Application Logs - ${packageName}`);
    terminal.writeln(`Device: ${deviceId}`);
    terminal.writeln('─'.repeat(terminal.cols));
    terminal.writeln('');

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
  }, [deviceId, packageName]);

  const handleStartCapture = () => {
    setIsCapturing(true);
    onStartCapture(deviceId, packageName);
    
    if (xtermRef.current) {
      xtermRef.current.writeln('\x1b[32m[Log capture started]\x1b[0m');
      xtermRef.current.writeln('');
    }
  };

  const handleStopCapture = () => {
    setIsCapturing(false);
    onStopCapture(deviceId, packageName);
    
    if (xtermRef.current) {
      xtermRef.current.writeln('');
      xtermRef.current.writeln('\x1b[33m[Log capture stopped]\x1b[0m');
    }
  };

  const handleClear = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      xtermRef.current.writeln(`Application Logs - ${packageName}`);
      xtermRef.current.writeln(`Device: ${deviceId}`);
      xtermRef.current.writeln('─'.repeat(xtermRef.current.cols));
      xtermRef.current.writeln('');
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

  // Method to display a log entry (called from parent component)
  const displayLog = (log: AppLogEntry) => {
    if (!xtermRef.current) return;

    const terminal = xtermRef.current;
    const timestamp = log.timestamp.toLocaleTimeString();
    const levelColor = getLogLevelColor(log.level);
    const levelText = log.level.toUpperCase().padEnd(7);
    
    // Format: [HH:MM:SS] LEVEL TAG(PID): message
    terminal.write(`\x1b[90m[${timestamp}]\x1b[0m `);
    terminal.write(`${levelColor}${levelText}\x1b[0m `);
    terminal.write(`\x1b[36m${log.tag}\x1b[0m`);
    
    if (log.pid) {
      terminal.write(`\x1b[90m(${log.pid})\x1b[0m`);
    }
    
    terminal.write(`: ${log.message}`);
    terminal.writeln('');

    // Auto-scroll to bottom if enabled
    if (autoScroll) {
      terminal.scrollToBottom();
    }
  };

  const getLogLevelColor = (level: AppLogEntry['level']): string => {
    const colorMap: Record<AppLogEntry['level'], string> = {
      'verbose': '\x1b[90m', // Gray
      'debug': '\x1b[36m',   // Cyan
      'info': '\x1b[32m',    // Green
      'warn': '\x1b[33m',    // Yellow
      'error': '\x1b[31m',   // Red
      'fatal': '\x1b[35m'    // Magenta
    };
    return colorMap[level] || '\x1b[0m';
  };

  // Expose displayLog method via ref
  useEffect(() => {
    if (xtermRef.current) {
      (xtermRef.current as any).displayLog = displayLog;
    }
  }, [autoScroll]);

  return (
    <div className="app-log-viewer">
      <div className="app-log-viewer-header">
        <div className="app-log-viewer-title">
          <span className="app-log-viewer-icon">📋</span>
          <span>Application Logs</span>
          {isCapturing && (
            <span className="app-log-viewer-status">
              <span className="status-indicator"></span>
              Capturing
            </span>
          )}
        </div>
        <div className="app-log-viewer-actions">
          <label className="auto-scroll-toggle">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
          <button
            className="app-log-viewer-button"
            onClick={handleCopy}
            title="Copy selection"
          >
            Copy
          </button>
          <button
            className="app-log-viewer-button"
            onClick={handleClear}
            title="Clear logs"
          >
            Clear
          </button>
          {!isCapturing ? (
            <button
              className="app-log-viewer-button app-log-viewer-start"
              onClick={handleStartCapture}
              title="Start log capture"
            >
              Start
            </button>
          ) : (
            <button
              className="app-log-viewer-button app-log-viewer-stop"
              onClick={handleStopCapture}
              title="Stop log capture"
            >
              Stop
            </button>
          )}
        </div>
      </div>
      <div className="app-log-viewer-container" ref={terminalRef} />
    </div>
  );
};
