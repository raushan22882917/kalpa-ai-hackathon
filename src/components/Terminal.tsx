/**
 * Terminal Component
 * Provides an integrated terminal experience with xterm.js and problems panel
 */

import { useState, useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import './Terminal.css';
import { previewDetectionService } from '../services/previewDetectionService';

interface TerminalProps {
  visible: boolean;
  onClose: () => void;
  problems?: Problem[];
  workspacePath?: string;
  currentFilePath?: string;
  onPreviewDetected?: (url: string) => void;
  language?: string;
  onDebug?: () => void;
}

interface Problem {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  source?: string;
}

interface TerminalInstance {
  id: string;
  name: string;
  xterm: XTerm;
  fitAddon: FitAddon;
  ws: WebSocket;
  ref: HTMLDivElement;
}

type ViewTab = 'terminals' | 'problems';

const Terminal = ({ visible, onClose, problems = [], workspacePath, currentFilePath, onPreviewDetected, language = 'plaintext', onDebug }: TerminalProps) => {
  const [activeView, setActiveView] = useState<ViewTab>('terminals');
  const [terminals, setTerminals] = useState<TerminalInstance[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [detectedServerUrl, setDetectedServerUrl] = useState<string | null>(null);
  const [debugPort, setDebugPort] = useState<string>('9229');
  const [showPortInput, setShowPortInput] = useState(false);
  const commandQueueRef = useRef<string[]>([]);
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const prevFilePathRef = useRef<string | undefined>(undefined);
  const prevWorkspacePathRef = useRef<string | undefined>(undefined);

  const canDebug = (lang: string): boolean => {
    const debuggableLanguages = [
      'javascript',
      'typescript',
      'python',
      'java',
      'cpp',
      'c',
      'go',
    ];
    return debuggableLanguages.includes(lang.toLowerCase());
  };

  const createTerminal = (name?: string) => {
    const id = `terminal-${Date.now()}`;
    const terminalName = name || `Terminal ${terminals.length + 1}`;
    
    const container = document.createElement('div');
    container.className = 'xterm-instance';
    container.style.display = 'none';
    
    if (terminalContainerRef.current) {
      terminalContainerRef.current.appendChild(container);
    }

    const xterm = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
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
        brightWhite: '#ffffff',
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.open(container);
    fitAddon.fit();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Add workspace path as query parameter if available, otherwise use Downloads directory
    const defaultPath = '/Users/raushankumar/downloads';
    const cwdPath = workspacePath || defaultPath;
    const cwdParam = `?cwd=${encodeURIComponent(cwdPath)}`;
    const wsUrl = `${protocol}//${window.location.hostname}:3001/terminal${cwdParam}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Connection successful - shell prompt will appear automatically
    };

    ws.onerror = () => {
      xterm.writeln('\x1b[31m✗ Failed to connect to terminal server\x1b[0m\r\n');
      xterm.writeln('\x1b[33mTo use the terminal, start the backend server:\x1b[0m\r\n');
      xterm.writeln('  1. Open a new terminal on your device\r\n');
      xterm.writeln('  2. Run: \x1b[36mnpm run server\x1b[0m\r\n');
      xterm.writeln('  3. The server will start on port 3001\r\n');
      xterm.writeln('  4. Refresh this page to reconnect\r\n');
      xterm.writeln('\r\n\x1b[90mAlternatively, run commands directly in your device terminal.\x1b[0m\r\n');
    };

    ws.onmessage = (event) => {
      const data = event.data;
      xterm.write(data);
      
      // Analyze output for dev server starts
      previewDetectionService.analyzeTerminalOutput(data);
    };

    ws.onclose = () => {
      xterm.writeln('\r\n\x1b[33m⚠ Connection closed\x1b[0m\r\n');
      xterm.writeln('The terminal server has disconnected.\r\n');
      xterm.writeln('Run \x1b[36mnpm run server\x1b[0m in your device terminal to restart.\r\n');
    };

    xterm.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    const instance: TerminalInstance = {
      id,
      name: terminalName,
      xterm,
      fitAddon,
      ws,
      ref: container,
    };

    setTerminals((prev) => [...prev, instance]);
    setActiveTerminalId(id);
    
    return instance;
  };

  const closeTerminal = (id: string) => {
    const terminal = terminals.find((t) => t.id === id);
    if (terminal) {
      terminal.ws.close();
      terminal.xterm.dispose();
      terminal.ref.remove();
      
      setTerminals((prev) => prev.filter((t) => t.id !== id));
      
      if (activeTerminalId === id) {
        const remaining = terminals.filter((t) => t.id !== id);
        setActiveTerminalId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  const handleClear = () => {
    const activeTerminal = terminals.find((t) => t.id === activeTerminalId);
    if (activeTerminal) {
      activeTerminal.xterm.clear();
    }
  };

  // Subscribe to preview detection
  useEffect(() => {
    const unsubscribe = previewDetectionService.subscribe((serverInfo) => {
      // Automatically open preview
      if (onPreviewDetected) {
        onPreviewDetected(serverInfo.url);
      }
      
      // Show brief notification
      setDetectedServerUrl(serverInfo.url);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => {
        setDetectedServerUrl(null);
      }, 5000);
    });

    return unsubscribe;
  }, [onPreviewDetected]);

  // Create first terminal when component becomes visible
  useEffect(() => {
    if (visible && terminals.length === 0) {
      createTerminal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Execute command in active terminal
  const executeCommand = (command: string) => {
    const activeTerminal = terminals.find((t) => t.id === activeTerminalId);
    if (activeTerminal && activeTerminal.ws.readyState === WebSocket.OPEN) {
      // Send command to terminal
      activeTerminal.ws.send(JSON.stringify({ 
        type: 'input', 
        data: `${command}\n` 
      }));
    } else {
      // Queue command if terminal not ready
      commandQueueRef.current.push(command);
    }
  };

  // Expose executeCommand globally
  useEffect(() => {
    (window as any).terminalExecuteCommand = executeCommand;
    return () => {
      delete (window as any).terminalExecuteCommand;
    };
  }, [terminals, activeTerminalId]);

  // Process queued commands when terminal becomes ready
  useEffect(() => {
    const activeTerminal = terminals.find((t) => t.id === activeTerminalId);
    if (activeTerminal && activeTerminal.ws.readyState === WebSocket.OPEN && commandQueueRef.current.length > 0) {
      commandQueueRef.current.forEach(cmd => {
        activeTerminal.ws.send(JSON.stringify({ 
          type: 'input', 
          data: `${cmd}\n` 
        }));
      });
      commandQueueRef.current = [];
    }
  }, [terminals, activeTerminalId]);

  // Change directory when workspace path changes
  useEffect(() => {
    if (!workspacePath || workspacePath === prevWorkspacePathRef.current) return;
    
    prevWorkspacePathRef.current = workspacePath;
    
    const activeTerminal = terminals.find((t) => t.id === activeTerminalId);
    if (activeTerminal && activeTerminal.ws.readyState === WebSocket.OPEN) {
      // Send cd command to change directory
      activeTerminal.ws.send(JSON.stringify({ 
        type: 'input', 
        data: `cd "${workspacePath}"\n` 
      }));
    }
  }, [workspacePath, terminals, activeTerminalId]);

  // Change directory to file's directory when file is opened
  useEffect(() => {
    if (!currentFilePath || currentFilePath === prevFilePathRef.current) return;
    
    prevFilePathRef.current = currentFilePath;
    
    const activeTerminal = terminals.find((t) => t.id === activeTerminalId);
    if (activeTerminal && activeTerminal.ws.readyState === WebSocket.OPEN) {
      // Extract directory from file path
      let fileDir: string;
      
      if (currentFilePath.includes('/')) {
        fileDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
      } else if (currentFilePath.includes('\\')) {
        // Windows path
        fileDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('\\'));
      } else {
        // File in current directory
        return;
      }
      
      if (fileDir) {
        // Send cd command to change to file's directory
        activeTerminal.ws.send(JSON.stringify({ 
          type: 'input', 
          data: `cd "${fileDir}"\n` 
        }));
      }
    }
  }, [currentFilePath, terminals, activeTerminalId]);

  // Handle terminal visibility and focus
  useEffect(() => {
    if (!visible || activeView !== 'terminals') return;

    terminals.forEach((terminal) => {
      if (terminal.id === activeTerminalId) {
        terminal.ref.style.display = 'block';
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          terminal.fitAddon.fit();
          terminal.xterm.focus();
        }, 0);
      } else {
        terminal.ref.style.display = 'none';
      }
    });
  }, [activeTerminalId, terminals, visible, activeView]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const activeTerminal = terminals.find((t) => t.id === activeTerminalId);
      if (activeTerminal && visible && activeView === 'terminals') {
        activeTerminal.fitAddon.fit();
        if (activeTerminal.ws.readyState === WebSocket.OPEN) {
          activeTerminal.ws.send(JSON.stringify({
            type: 'resize',
            cols: activeTerminal.xterm.cols,
            rows: activeTerminal.xterm.rows,
          }));
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [terminals, activeTerminalId, visible, activeView]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // This cleanup only runs when component unmounts
      const currentTerminals = terminals;
      currentTerminals.forEach((terminal) => {
        try {
          terminal.ws.close();
          terminal.xterm.dispose();
          terminal.ref.remove();
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) {
    return null;
  }

  const errorCount = problems.filter(p => p.severity === 'error').length;
  const warningCount = problems.filter(p => p.severity === 'warning').length;

  return (
    <div className="terminal-container">
      {detectedServerUrl && (
        <div className="server-detected-banner auto-opened">
          <span className="banner-icon">✓</span>
          <span className="banner-text">
            Preview opened: <strong>{detectedServerUrl}</strong>
          </span>
          <button 
            className="banner-close"
            onClick={() => setDetectedServerUrl(null)}
          >
            ✕
          </button>
        </div>
      )}
      <div className="terminal-header">
        <div className="terminal-tabs">
          <button
            className={`terminal-tab ${activeView === 'terminals' ? 'active' : ''}`}
            onClick={() => setActiveView('terminals')}
          >
            ⚡ Terminals
          </button>
          <button
            className={`terminal-tab ${activeView === 'problems' ? 'active' : ''}`}
            onClick={() => setActiveView('problems')}
          >
            🔍 Problems
            {(errorCount > 0 || warningCount > 0) && (
              <span className="problem-badge">
                {errorCount > 0 && <span className="error-badge">{errorCount}</span>}
                {warningCount > 0 && <span className="warning-badge">{warningCount}</span>}
              </span>
            )}
          </button>
        </div>
        <div className="terminal-actions">
          {activeView === 'terminals' && (
            <>
              {canDebug(language) && onDebug && (
                <button 
                  className="terminal-action-btn debug-btn" 
                  title="Debug (F5)"
                  onClick={onDebug}
                >
                  🐛 Debug
                </button>
              )}
              <div className="port-control">
                <button 
                  className="terminal-action-btn port-btn" 
                  title="Configure Debug Port"
                  onClick={() => setShowPortInput(!showPortInput)}
                >
                  🔌 Port: {debugPort}
                </button>
                {showPortInput && (
                  <div className="port-input-popup">
                    <input
                      type="text"
                      value={debugPort}
                      onChange={(e) => setDebugPort(e.target.value)}
                      placeholder="Port number"
                      className="port-input"
                    />
                    <button 
                      className="port-apply-btn"
                      onClick={() => setShowPortInput(false)}
                    >
                      ✓
                    </button>
                  </div>
                )}
              </div>
              <button 
                className="terminal-action-btn" 
                title="New Terminal"
                onClick={() => createTerminal()}
              >
                ➕
              </button>
              <button 
                className="terminal-action-btn" 
                title="Clear"
                onClick={handleClear}
              >
                🗑️
              </button>
            </>
          )}
          <button className="close-button" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="terminal-content">
        {activeView === 'terminals' ? (
          <>
            {terminals.length > 0 && (
              <div className="terminal-instance-tabs">
                {terminals.map((terminal) => (
                  <div
                    key={terminal.id}
                    className={`terminal-instance-tab ${terminal.id === activeTerminalId ? 'active' : ''}`}
                  >
                    <button
                      className="terminal-instance-name"
                      onClick={() => setActiveTerminalId(terminal.id)}
                    >
                      {terminal.name}
                    </button>
                    <button
                      className="terminal-instance-close"
                      onClick={() => closeTerminal(terminal.id)}
                      title="Close terminal"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div 
              ref={terminalContainerRef} 
              className="xterm-container"
              onClick={() => {
                const activeTerminal = terminals.find((t) => t.id === activeTerminalId);
                if (activeTerminal) {
                  activeTerminal.xterm.focus();
                }
              }}
            />
          </>
        ) : (
          <div className="problems-panel">
            {problems.length === 0 ? (
              <div className="no-problems">
                <span className="success-icon">✓</span>
                <p>No problems detected in the workspace</p>
              </div>
            ) : (
              <div className="problems-list">
                {problems.map((problem, index) => (
                  <div key={index} className={`problem-item problem-${problem.severity}`}>
                    <span className={`problem-icon ${problem.severity}`}>
                      {problem.severity === 'error' ? '❌' : problem.severity === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div className="problem-details">
                      <div className="problem-message">{problem.message}</div>
                      <div className="problem-location">
                        {problem.file} [{problem.line},{problem.column}]
                        {problem.source && <span className="problem-source"> - {problem.source}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Terminal;
