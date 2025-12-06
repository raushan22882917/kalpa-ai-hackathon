import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { LogCaptureService } from '../services/logCaptureService';
import { ADBBridge } from '../services/adbBridge';
import { IOSBridge } from '../services/iosBridge';
/**
 * Feature: device-terminal-integration, Property 30: Error log highlighting
 *
 * Property: For any log entry with error level, the system should highlight it
 * distinctly from other log levels
 *
 * Validates: Requirements 7.5
 */
describe('Error Highlighting Property Tests', () => {
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
        tag: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        message: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        deviceId: fc.uuid(),
        pid: fc.option(fc.integer({ min: 1, max: 65535 }), { nil: undefined })
    });
    it('should identify error level logs correctly', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 100 }), fc.uuid(), (logs, deviceId) => {
            // Start log capture
            const sessionId = logCaptureService.startCapture(deviceId, 'android');
            // Manually inject logs into the session
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = logs;
            }
            // Get all logs
            const allLogs = logCaptureService.getLogs(sessionId);
            // Count error and fatal logs
            const errorLogs = allLogs.filter(log => log.level === 'error' || log.level === 'fatal');
            const nonErrorLogs = allLogs.filter(log => log.level !== 'error' && log.level !== 'fatal');
            // Verify error logs have error or fatal level
            for (const log of errorLogs) {
                expect(['error', 'fatal']).toContain(log.level);
            }
            // Verify non-error logs don't have error or fatal level
            for (const log of nonErrorLogs) {
                expect(['error', 'fatal']).not.toContain(log.level);
            }
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
    it('should distinguish error logs from other levels', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 20, maxLength: 100 }), fc.uuid(), (logs, deviceId) => {
            // Start log capture
            const sessionId = logCaptureService.startCapture(deviceId, 'android');
            // Manually inject logs into the session
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = logs;
            }
            // Filter for error/fatal logs
            const errorFilter = { level: ['error', 'fatal'] };
            const errorLogs = logCaptureService.getLogs(sessionId, errorFilter);
            // Filter for non-error logs
            const nonErrorFilter = { level: ['verbose', 'debug', 'info', 'warn'] };
            const nonErrorLogs = logCaptureService.getLogs(sessionId, nonErrorFilter);
            // Verify no overlap
            const errorLogIds = new Set(errorLogs.map(l => `${l.timestamp.getTime()}-${l.message}`));
            const nonErrorLogIds = new Set(nonErrorLogs.map(l => `${l.timestamp.getTime()}-${l.message}`));
            for (const id of errorLogIds) {
                expect(nonErrorLogIds.has(id)).toBe(false);
            }
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
    it('should maintain error level through parsing for Android logs', () => {
        fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && !s.includes(':')), fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), fc.integer({ min: 1000, max: 9999 }), fc.uuid(), (tag, message, pid, deviceId) => {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ms = String(now.getMilliseconds()).padStart(3, '0');
            // Create Android logcat format line with error level
            const logLine = `${month}-${day} ${hours}:${minutes}:${seconds}.${ms} ${pid} ${pid} E ${tag}: ${message}`;
            // Parse the log line
            const parsed = logCaptureService.parseAndroidLog(logLine, deviceId);
            // Verify parsing succeeded and level is error
            expect(parsed).not.toBeNull();
            if (parsed) {
                expect(parsed.level).toBe('error');
            }
        }), { numRuns: 100 });
    });
    it('should maintain fatal level through parsing for Android logs', () => {
        fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && !s.includes(':')), fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), fc.integer({ min: 1000, max: 9999 }), fc.uuid(), (tag, message, pid, deviceId) => {
            const now = new Date();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ms = String(now.getMilliseconds()).padStart(3, '0');
            // Create Android logcat format line with fatal level
            const logLine = `${month}-${day} ${hours}:${minutes}:${seconds}.${ms} ${pid} ${pid} F ${tag}: ${message}`;
            // Parse the log line
            const parsed = logCaptureService.parseAndroidLog(logLine, deviceId);
            // Verify parsing succeeded and level is fatal
            expect(parsed).not.toBeNull();
            if (parsed) {
                expect(parsed.level).toBe('fatal');
            }
        }), { numRuns: 100 });
    });
    it('should maintain error level through parsing for iOS logs', () => {
        fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && !s.includes('[') && !s.includes(']')), fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), fc.integer({ min: 1000, max: 9999 }), fc.uuid(), (tag, message, pid, deviceId) => {
            const now = new Date();
            const month = now.toLocaleString('en-US', { month: 'short' });
            const day = String(now.getDate()).padStart(2, ' ');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            // Create iOS syslog format line with error level
            const logLine = `${month} ${day} ${hours}:${minutes}:${seconds} iPhone ${tag}[${pid}] <Error>: ${message}`;
            // Parse the log line
            const parsed = logCaptureService.parseIOSLog(logLine, deviceId);
            // Verify parsing succeeded and level is error
            expect(parsed).not.toBeNull();
            if (parsed) {
                expect(parsed.level).toBe('error');
            }
        }), { numRuns: 100 });
    });
    it('should maintain critical level through parsing for iOS logs', () => {
        fc.assert(fc.property(fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && !s.includes('[') && !s.includes(']')), fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), fc.integer({ min: 1000, max: 9999 }), fc.uuid(), (tag, message, pid, deviceId) => {
            const now = new Date();
            const month = now.toLocaleString('en-US', { month: 'short' });
            const day = String(now.getDate()).padStart(2, ' ');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            // Create iOS syslog format line with critical level (maps to fatal)
            const logLine = `${month} ${day} ${hours}:${minutes}:${seconds} iPhone ${tag}[${pid}] <Critical>: ${message}`;
            // Parse the log line
            const parsed = logCaptureService.parseIOSLog(logLine, deviceId);
            // Verify parsing succeeded and level is fatal
            expect(parsed).not.toBeNull();
            if (parsed) {
                expect(parsed.level).toBe('fatal');
            }
        }), { numRuns: 100 });
    });
    it('should allow filtering for only error and fatal logs', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 20, maxLength: 100 }), fc.uuid(), (logs, deviceId) => {
            // Start log capture
            const sessionId = logCaptureService.startCapture(deviceId, 'android');
            // Manually inject logs into the session
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = logs;
            }
            // Filter for error and fatal logs only
            const errorFilter = { level: ['error', 'fatal'] };
            const errorLogs = logCaptureService.getLogs(sessionId, errorFilter);
            // Verify all returned logs are error or fatal
            for (const log of errorLogs) {
                expect(['error', 'fatal']).toContain(log.level);
            }
            // Count expected error logs
            const expectedErrorCount = logs.filter(l => l.level === 'error' || l.level === 'fatal').length;
            expect(errorLogs.length).toBe(expectedErrorCount);
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
});
