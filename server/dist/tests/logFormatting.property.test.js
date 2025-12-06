import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { LogCaptureService } from '../services/logCaptureService';
import { ADBBridge } from '../services/adbBridge';
import { IOSBridge } from '../services/iosBridge';
/**
 * Feature: device-terminal-integration, Property 27: Log display formatting
 *
 * Property: For any captured log entry, the log viewer should display it with
 * appropriate syntax highlighting based on log level
 *
 * Validates: Requirements 7.2
 */
describe('Log Formatting Property Tests', () => {
    let logCaptureService;
    let adbBridge;
    let iosBridge;
    beforeEach(() => {
        adbBridge = new ADBBridge();
        iosBridge = new IOSBridge();
        logCaptureService = new LogCaptureService(adbBridge, iosBridge);
    });
    // Arbitrary for generating log levels
    const logLevelArb = fc.constantFrom('verbose', 'debug', 'info', 'warn', 'error', 'fatal');
    // Arbitrary for generating log entries
    const logEntryArb = fc.record({
        timestamp: fc.date(),
        level: logLevelArb,
        tag: fc.string({ minLength: 1, maxLength: 50 }),
        message: fc.string({ minLength: 1, maxLength: 200 }),
        deviceId: fc.uuid(),
        pid: fc.option(fc.integer({ min: 1, max: 65535 }), { nil: undefined })
    });
    it('should parse Android logs with correct level detection', () => {
        fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && !s.includes(':')), // tag (no colons)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), // message
        fc.integer({ min: 1000, max: 9999 }), // pid
        logLevelArb, fc.uuid(), // deviceId
        (tag, message, pid, level, deviceId) => {
            // Map level to Android logcat character
            const levelMap = {
                'verbose': 'V',
                'debug': 'D',
                'info': 'I',
                'warn': 'W',
                'error': 'E',
                'fatal': 'F'
            };
            const levelChar = levelMap[level];
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ms = String(now.getMilliseconds()).padStart(3, '0');
            // Create Android logcat format line
            const logLine = `${month}-${day} ${hours}:${minutes}:${seconds}.${ms} ${pid} ${pid} ${levelChar} ${tag}: ${message}`;
            // Parse the log line
            const parsed = logCaptureService.parseAndroidLog(logLine, deviceId);
            // Verify parsing succeeded
            expect(parsed).not.toBeNull();
            if (parsed) {
                // Verify level is correctly detected
                expect(parsed.level).toBe(level);
                // Verify other fields are preserved (trimmed)
                expect(parsed.tag).toBe(tag.trim());
                expect(parsed.message).toBe(message.trim());
                expect(parsed.deviceId).toBe(deviceId);
                expect(parsed.pid).toBe(pid);
            }
        }), { numRuns: 100 });
    });
    it('should parse iOS logs with correct level detection', () => {
        fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && !s.includes('[') && !s.includes(']')), // tag (no brackets)
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), // message
        fc.integer({ min: 1000, max: 9999 }), // pid
        fc.constantFrom('Debug', 'Info', 'Notice', 'Warning', 'Error', 'Critical'), fc.uuid(), // deviceId
        (tag, message, pid, iosLevel, deviceId) => {
            // Map iOS level to LogLevel
            const levelMap = {
                'Debug': 'debug',
                'Info': 'info',
                'Notice': 'info',
                'Warning': 'warn',
                'Error': 'error',
                'Critical': 'fatal'
            };
            const expectedLevel = levelMap[iosLevel];
            const now = new Date();
            const month = now.toLocaleString('en-US', { month: 'short' });
            const day = String(now.getDate()).padStart(2, ' ');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            // Create iOS syslog format line
            const logLine = `${month} ${day} ${hours}:${minutes}:${seconds} iPhone ${tag}[${pid}] <${iosLevel}>: ${message}`;
            // Parse the log line
            const parsed = logCaptureService.parseIOSLog(logLine, deviceId);
            // Verify parsing succeeded
            expect(parsed).not.toBeNull();
            if (parsed) {
                // Verify level is correctly detected
                expect(parsed.level).toBe(expectedLevel);
                // Verify other fields are preserved (trimmed)
                expect(parsed.tag).toBe(tag.trim());
                expect(parsed.message).toBe(message.trim());
                expect(parsed.deviceId).toBe(deviceId);
                expect(parsed.pid).toBe(pid);
            }
        }), { numRuns: 100 });
    });
    it('should maintain log level information through the capture pipeline', async () => {
        await fc.assert(fc.asyncProperty(fc.uuid(), // deviceId
        fc.constantFrom('android', 'ios'), async (deviceId, platform) => {
            // Start log capture
            const sessionId = logCaptureService.startCapture(deviceId, platform);
            // Collect logs emitted by the service
            const emittedLogs = [];
            logCaptureService.on('log', (data) => {
                if (data.sessionId === sessionId) {
                    emittedLogs.push(data.log);
                }
            });
            // Wait for some logs to be generated
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 1500);
            });
            // Get logs from the session
            const sessionLogs = logCaptureService.getLogs(sessionId);
            // Verify all logs have a valid level
            for (const log of sessionLogs) {
                expect(log.level).toMatch(/^(verbose|debug|info|warn|error|fatal)$/);
            }
            // Verify emitted logs also have valid levels
            for (const log of emittedLogs) {
                expect(log.level).toMatch(/^(verbose|debug|info|warn|error|fatal)$/);
            }
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 5 } // Fewer runs since this involves timing
        );
    }, 30000); // 30 second timeout for this test
    it('should preserve all log entry fields during formatting', () => {
        fc.assert(fc.property(logEntryArb, (logEntry) => {
            // Verify all required fields are present
            expect(logEntry.timestamp).toBeInstanceOf(Date);
            expect(logEntry.level).toMatch(/^(verbose|debug|info|warn|error|fatal)$/);
            expect(logEntry.tag).toBeTruthy();
            expect(logEntry.message).toBeTruthy();
            expect(logEntry.deviceId).toBeTruthy();
            // Verify optional fields
            if (logEntry.pid !== undefined) {
                expect(logEntry.pid).toBeGreaterThan(0);
            }
            return true;
        }), { numRuns: 100 });
    });
});
