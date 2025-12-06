import { EventEmitter } from 'events';
/**
 * Log Capture Service for device log streaming
 * Captures and formats logs from Android and iOS devices
 */
export class LogCaptureService extends EventEmitter {
    constructor(adbBridge, iosBridge) {
        super();
        this.adbBridge = adbBridge;
        this.iosBridge = iosBridge;
        this.sessions = new Map();
        this.logIntervals = new Map();
    }
    /**
     * Start capturing logs from a device
     */
    startCapture(deviceId, platform, filter) {
        const sessionId = this.generateSessionId();
        const session = {
            sessionId,
            deviceId,
            platform,
            isActive: true,
            filter,
            logs: []
        };
        this.sessions.set(sessionId, session);
        // Start log streaming based on platform
        if (platform === 'android') {
            this.startAndroidLogCapture(session);
        }
        else {
            this.startIOSLogCapture(session);
        }
        this.emit('capture:started', { sessionId, deviceId, platform });
        return sessionId;
    }
    /**
     * Stop capturing logs for a session
     */
    stopCapture(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Log session not found: ${sessionId}`);
        }
        session.isActive = false;
        // Clear the log capture interval
        const interval = this.logIntervals.get(sessionId);
        if (interval) {
            clearInterval(interval);
            this.logIntervals.delete(sessionId);
        }
        this.emit('capture:stopped', { sessionId, deviceId: session.deviceId });
    }
    /**
     * Get logs for a session with optional filtering
     */
    getLogs(sessionId, filter) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Log session not found: ${sessionId}`);
        }
        return this.filterLogs(session.logs, filter);
    }
    /**
     * Clear logs for a session (but continue capturing)
     */
    clearLogs(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Log session not found: ${sessionId}`);
        }
        session.logs = [];
        this.emit('logs:cleared', { sessionId, deviceId: session.deviceId });
    }
    /**
     * Update filter for a session
     */
    setFilter(sessionId, filter) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Log session not found: ${sessionId}`);
        }
        session.filter = filter;
        this.emit('filter:updated', { sessionId, filter });
    }
    /**
     * Get active sessions
     */
    getActiveSessions() {
        return Array.from(this.sessions.values()).filter(s => s.isActive);
    }
    /**
     * Start Android log capture using logcat
     */
    startAndroidLogCapture(session) {
        // Mock implementation - in production would use adb logcat
        // Command: adb -s <deviceId> logcat -v time
        // Simulate log streaming
        const interval = setInterval(() => {
            if (!session.isActive) {
                clearInterval(interval);
                return;
            }
            // Generate mock log entries
            const mockLogs = this.generateMockAndroidLogs(session.deviceId);
            for (const log of mockLogs) {
                session.logs.push(log);
                // Emit log event if it passes the filter
                if (this.matchesFilter(log, session.filter)) {
                    this.emit('log', { sessionId: session.sessionId, log });
                }
            }
            // Keep only last 10000 logs to prevent memory issues
            if (session.logs.length > 10000) {
                session.logs = session.logs.slice(-10000);
            }
        }, 1000);
        this.logIntervals.set(session.sessionId, interval);
    }
    /**
     * Start iOS log capture using idevicesyslog
     */
    startIOSLogCapture(session) {
        // Mock implementation - in production would use idevicesyslog
        // Command: idevicesyslog -u <deviceId>
        // Simulate log streaming
        const interval = setInterval(() => {
            if (!session.isActive) {
                clearInterval(interval);
                return;
            }
            // Generate mock log entries
            const mockLogs = this.generateMockIOSLogs(session.deviceId);
            for (const log of mockLogs) {
                session.logs.push(log);
                // Emit log event if it passes the filter
                if (this.matchesFilter(log, session.filter)) {
                    this.emit('log', { sessionId: session.sessionId, log });
                }
            }
            // Keep only last 10000 logs to prevent memory issues
            if (session.logs.length > 10000) {
                session.logs = session.logs.slice(-10000);
            }
        }, 1000);
        this.logIntervals.set(session.sessionId, interval);
    }
    /**
     * Parse Android logcat output into LogEntry
     */
    parseAndroidLog(line, deviceId) {
        // Android logcat format: MM-DD HH:MM:SS.mmm PID TID LEVEL TAG: message
        // Example: 12-01 10:30:45.123 1234 5678 I ActivityManager: Starting activity
        const regex = /^(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+([^:]+):\s*(.*)$/;
        const match = line.match(regex);
        if (!match) {
            return null;
        }
        const [, timestamp, pid, , levelChar, tag, message] = match;
        // Parse timestamp (add current year)
        const year = new Date().getFullYear();
        const dateStr = `${year}-${timestamp.replace(' ', 'T')}`;
        const date = new Date(dateStr);
        // Map level character to LogLevel
        const levelMap = {
            'V': 'verbose',
            'D': 'debug',
            'I': 'info',
            'W': 'warn',
            'E': 'error',
            'F': 'fatal'
        };
        return {
            timestamp: date,
            level: levelMap[levelChar] || 'info',
            tag: tag.trim(),
            message: message.trim(),
            deviceId,
            pid: parseInt(pid, 10)
        };
    }
    /**
     * Parse iOS syslog output into LogEntry
     */
    parseIOSLog(line, deviceId) {
        // iOS syslog format varies, but typically:
        // MMM DD HH:MM:SS DeviceName Process[PID] <Level>: message
        // Example: Dec 01 10:30:45 iPhone MyApp[1234] <Notice>: Application started
        const regex = /^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+\S+\s+([^\[]+)\[(\d+)\]\s+<(\w+)>:\s*(.*)$/;
        const match = line.match(regex);
        if (!match) {
            return null;
        }
        const [, timestamp, tag, pid, levelStr, message] = match;
        // Parse timestamp (add current year)
        const year = new Date().getFullYear();
        const date = new Date(`${year} ${timestamp}`);
        // Map iOS level to LogLevel
        const levelMap = {
            'Debug': 'debug',
            'Info': 'info',
            'Notice': 'info',
            'Warning': 'warn',
            'Error': 'error',
            'Critical': 'fatal'
        };
        return {
            timestamp: date,
            level: levelMap[levelStr] || 'info',
            tag: tag.trim(),
            message: message.trim(),
            deviceId,
            pid: parseInt(pid, 10)
        };
    }
    /**
     * Filter logs based on criteria
     */
    filterLogs(logs, filter) {
        if (!filter) {
            return logs;
        }
        return logs.filter(log => this.matchesFilter(log, filter));
    }
    /**
     * Check if a log entry matches the filter
     */
    matchesFilter(log, filter) {
        if (!filter) {
            return true;
        }
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
    }
    /**
     * Generate mock Android logs for testing
     */
    generateMockAndroidLogs(deviceId) {
        const levels = ['verbose', 'debug', 'info', 'warn', 'error'];
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
        const numLogs = Math.floor(Math.random() * 3) + 1;
        const logs = [];
        for (let i = 0; i < numLogs; i++) {
            logs.push({
                timestamp: new Date(),
                level: levels[Math.floor(Math.random() * levels.length)],
                tag: tags[Math.floor(Math.random() * tags.length)],
                message: messages[Math.floor(Math.random() * messages.length)],
                deviceId,
                pid: Math.floor(Math.random() * 10000) + 1000
            });
        }
        return logs;
    }
    /**
     * Generate mock iOS logs for testing
     */
    generateMockIOSLogs(deviceId) {
        const levels = ['debug', 'info', 'warn', 'error'];
        const tags = ['SpringBoard', 'kernel', 'UserEventAgent', 'locationd', 'CommCenter'];
        const messages = [
            'Application launched',
            'Location services enabled',
            'Network connection changed',
            'Memory warning received',
            'Background task started',
            'Push notification received',
            'Screen locked',
            'Device orientation changed'
        ];
        const numLogs = Math.floor(Math.random() * 3) + 1;
        const logs = [];
        for (let i = 0; i < numLogs; i++) {
            logs.push({
                timestamp: new Date(),
                level: levels[Math.floor(Math.random() * levels.length)],
                tag: tags[Math.floor(Math.random() * tags.length)],
                message: messages[Math.floor(Math.random() * messages.length)],
                deviceId,
                pid: Math.floor(Math.random() * 10000) + 1000
            });
        }
        return logs;
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return `log-session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
}
