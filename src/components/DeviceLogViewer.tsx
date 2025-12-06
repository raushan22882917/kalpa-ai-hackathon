import React, { useState, useEffect, useRef } from 'react';
import './DeviceLogViewer.css';

export type LogLevel = 'verbose' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  tag: string;
  message: string;
  deviceId: string;
  pid?: number;
}

export interface LogFilter {
  level?: LogLevel[];
  tag?: string;
  text?: string;
}

interface DeviceLogViewerProps {
  deviceId: string;
  platform: 'android' | 'ios';
  onClose?: () => void;
}

export const DeviceLogViewer: React.FC<DeviceLogViewerProps> = ({
  deviceId,
  platform,
  onClose
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<LogFilter>({});
  const [selectedLevels, setSelectedLevels] = useState<LogLevel[]>([]);
  const [tagFilter, setTagFilter] = useState('');
  const [textFilter, setTextFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start log capture when component mounts
    startCapture();

    return () => {
      // Stop log capture when component unmounts
      if (sessionId) {
        stopCapture();
      }
    };
  }, [deviceId, platform]);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const startCapture = async () => {
    try {
      // Send message to start log capture via WebSocket
      // In a real implementation, this would use the DeviceBridgeService
      // For now, simulate starting capture
      const mockSessionId = `log-session-${Date.now()}`;
      setSessionId(mockSessionId);
      setIsCapturing(true);

      // Simulate receiving logs
      simulateLogStream();
    } catch (error) {
      console.error('Failed to start log capture:', error);
    }
  };

  const stopCapture = async () => {
    if (!sessionId) return;

    try {
      // In a real implementation, this would use the DeviceBridgeService
      setIsCapturing(false);
    } catch (error) {
      console.error('Failed to stop log capture:', error);
    }
  };

  const clearLogs = async () => {
    if (!sessionId) return;

    try {
      // In a real implementation, this would use the DeviceBridgeService
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const updateFilter = () => {
    const newFilter: LogFilter = {};

    if (selectedLevels.length > 0) {
      newFilter.level = selectedLevels;
    }

    if (tagFilter.trim()) {
      newFilter.tag = tagFilter.trim();
    }

    if (textFilter.trim()) {
      newFilter.text = textFilter.trim();
    }

    setFilter(newFilter);

    if (sessionId) {
      // In a real implementation, this would use the DeviceBridgeService
    }
  };

  const toggleLevel = (level: LogLevel) => {
    setSelectedLevels(prev => {
      if (prev.includes(level)) {
        return prev.filter(l => l !== level);
      } else {
        return [...prev, level];
      }
    });
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `${log.timestamp.toISOString()} [${log.level.toUpperCase()}] ${log.tag}: ${log.message}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `device-logs-${deviceId}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFilteredLogs = (): LogEntry[] => {
    return logs.filter(log => {
      // Filter by level
      if (filter.level && filter.level.length > 0) {
        if (!filter.level.includes(log.level)) {
          return false;
        }
      }

      // Filter by tag
      if (filter.tag) {
        if (!log.tag.toLowerCase().includes(filter.tag.toLowerCase())) {
          return false;
        }
      }

      // Filter by text
      if (filter.text) {
        if (!log.message.toLowerCase().includes(filter.text.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  };

  const getLevelClassName = (level: LogLevel): string => {
    return `log-level-${level}`;
  };

  const formatTimestamp = (timestamp: Date): string => {
    const time = timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    });
    const ms = timestamp.getMilliseconds().toString().padStart(3, '0');
    return `${time}.${ms}`;
  };

  // Simulate log stream for testing
  const simulateLogStream = () => {
    const levels: LogLevel[] = ['verbose', 'debug', 'info', 'warn', 'error', 'fatal'];
    const tags = ['ActivityManager', 'System', 'NetworkManager', 'PackageManager', 'WindowManager'];
    const messages = [
      'Starting activity',
      'Network connection established',
      'Package installed successfully',
      'Window focus changed',
      'Service started',
      'Broadcast received',
      'Permission granted',
      'Configuration changed'
    ];

    const interval = setInterval(() => {
      if (!isCapturing) {
        clearInterval(interval);
        return;
      }

      const newLog: LogEntry = {
        timestamp: new Date(),
        level: levels[Math.floor(Math.random() * levels.length)],
        tag: tags[Math.floor(Math.random() * tags.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        deviceId,
        pid: Math.floor(Math.random() * 10000) + 1000
      };

      setLogs(prev => [...prev, newLog]);
    }, 1000);
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div className="device-log-viewer">
      <div className="log-viewer-header">
        <h3>Device Logs - {deviceId}</h3>
        <div className="log-viewer-actions">
          <button
            className="log-action-button"
            onClick={clearLogs}
            disabled={!isCapturing}
            title="Clear logs"
          >
            Clear
          </button>
          <button
            className="log-action-button"
            onClick={exportLogs}
            disabled={logs.length === 0}
            title="Export logs"
          >
            Export
          </button>
          <label className="auto-scroll-toggle">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
          {onClose && (
            <button className="log-close-button" onClick={onClose}>
              ×
            </button>
          )}
        </div>
      </div>

      <div className="log-viewer-filters">
        <div className="filter-group">
          <label>Level:</label>
          <div className="level-filters">
            {(['verbose', 'debug', 'info', 'warn', 'error', 'fatal'] as LogLevel[]).map(level => (
              <button
                key={level}
                className={`level-filter-button ${selectedLevels.includes(level) ? 'active' : ''} ${getLevelClassName(level)}`}
                onClick={() => toggleLevel(level)}
              >
                {level.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Tag:</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Filter by tag..."
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            onBlur={updateFilter}
            onKeyPress={(e) => e.key === 'Enter' && updateFilter()}
          />
        </div>

        <div className="filter-group">
          <label>Text:</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Filter by message..."
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
            onBlur={updateFilter}
            onKeyPress={(e) => e.key === 'Enter' && updateFilter()}
          />
        </div>

        <button className="apply-filter-button" onClick={updateFilter}>
          Apply Filters
        </button>
      </div>

      <div className="log-viewer-content" ref={logContainerRef}>
        {filteredLogs.length === 0 ? (
          <div className="log-empty-state">
            {logs.length === 0 ? 'No logs captured yet' : 'No logs match the current filter'}
          </div>
        ) : (
          <div className="log-entries">
            {filteredLogs.map((log, index) => (
              <div
                key={`${log.timestamp.getTime()}-${index}`}
                className={`log-entry ${getLevelClassName(log.level)}`}
              >
                <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                <span className={`log-level ${getLevelClassName(log.level)}`}>
                  {log.level.charAt(0).toUpperCase()}
                </span>
                {log.pid && <span className="log-pid">{log.pid}</span>}
                <span className="log-tag">{log.tag}</span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="log-viewer-footer">
        <span className="log-count">
          {filteredLogs.length} / {logs.length} logs
          {isCapturing && <span className="capturing-indicator"> • Capturing</span>}
        </span>
      </div>
    </div>
  );
};
