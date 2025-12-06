import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { LogCaptureService } from '../services/logCaptureService';
import { ADBBridge } from '../services/adbBridge';
import { IOSBridge } from '../services/iosBridge';
/**
 * Feature: device-terminal-integration, Property 28: Log filtering accuracy
 *
 * Property: For any filter criteria (level, tag, or text), the log viewer should
 * display only logs that match all specified criteria
 *
 * Validates: Requirements 7.3
 */
describe('Log Filtering Property Tests', () => {
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
    it('should filter logs by level correctly', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 100 }), fc.array(logLevelArb, { minLength: 1, maxLength: 3 }), (logs, selectedLevels) => {
            // Create a mock session with these logs
            const deviceId = 'test-device';
            const sessionId = logCaptureService.startCapture(deviceId, 'android');
            // Manually inject logs into the session (accessing private state for testing)
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = logs;
            }
            // Apply level filter
            const filter = { level: selectedLevels };
            const filteredLogs = logCaptureService.getLogs(sessionId, filter);
            // Verify all filtered logs match the selected levels
            for (const log of filteredLogs) {
                expect(selectedLevels).toContain(log.level);
            }
            // Verify no logs with other levels are included
            const includedLevels = new Set(filteredLogs.map(l => l.level));
            for (const level of includedLevels) {
                expect(selectedLevels).toContain(level);
            }
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
    it('should filter logs by tag correctly', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 100 }), fc.string({ minLength: 1, maxLength: 10 }), (logs, tagFilter) => {
            // Create a mock session with these logs
            const deviceId = 'test-device';
            const sessionId = logCaptureService.startCapture(deviceId, 'android');
            // Manually inject logs into the session
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = logs;
            }
            // Apply tag filter
            const filter = { tag: tagFilter };
            const filteredLogs = logCaptureService.getLogs(sessionId, filter);
            // Verify all filtered logs contain the tag filter (case-insensitive)
            for (const log of filteredLogs) {
                expect(log.tag.toLowerCase()).toContain(tagFilter.toLowerCase());
            }
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
    it('should filter logs by text correctly', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 100 }), fc.string({ minLength: 1, maxLength: 10 }), (logs, textFilter) => {
            // Create a mock session with these logs
            const deviceId = 'test-device';
            const sessionId = logCaptureService.startCapture(deviceId, 'android');
            // Manually inject logs into the session
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = logs;
            }
            // Apply text filter
            const filter = { text: textFilter };
            const filteredLogs = logCaptureService.getLogs(sessionId, filter);
            // Verify all filtered logs contain the text filter (case-insensitive)
            for (const log of filteredLogs) {
                expect(log.message.toLowerCase()).toContain(textFilter.toLowerCase());
            }
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
    it('should apply multiple filters with AND logic', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 100 }), fc.array(logLevelArb, { minLength: 1, maxLength: 2 }), fc.string({ minLength: 1, maxLength: 5 }), fc.string({ minLength: 1, maxLength: 5 }), (logs, selectedLevels, tagFilter, textFilter) => {
            // Create a mock session with these logs
            const deviceId = 'test-device';
            const sessionId = logCaptureService.startCapture(deviceId, 'android');
            // Manually inject logs into the session
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = logs;
            }
            // Apply multiple filters
            const filter = {
                level: selectedLevels,
                tag: tagFilter,
                text: textFilter
            };
            const filteredLogs = logCaptureService.getLogs(sessionId, filter);
            // Verify all filtered logs match ALL criteria
            for (const log of filteredLogs) {
                // Must match level
                expect(selectedLevels).toContain(log.level);
                // Must match tag
                expect(log.tag.toLowerCase()).toContain(tagFilter.toLowerCase());
                // Must match text
                expect(log.message.toLowerCase()).toContain(textFilter.toLowerCase());
            }
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
    it('should return all logs when no filter is applied', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 100 }), (logs) => {
            // Create a mock session with these logs
            const deviceId = 'test-device';
            const sessionId = logCaptureService.startCapture(deviceId, 'android');
            // Manually inject logs into the session
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = logs;
            }
            // Get logs without filter
            const filteredLogs = logCaptureService.getLogs(sessionId);
            // Verify all logs are returned
            expect(filteredLogs.length).toBe(logs.length);
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
    it('should return empty array when filter matches no logs', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 100 }), (logs) => {
            // Create a mock session with these logs
            const deviceId = 'test-device';
            const sessionId = logCaptureService.startCapture(deviceId, 'android');
            // Manually inject logs into the session
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = logs;
            }
            // Apply a filter that should match nothing
            const filter = {
                text: 'IMPOSSIBLE_STRING_THAT_WILL_NEVER_MATCH_12345'
            };
            const filteredLogs = logCaptureService.getLogs(sessionId, filter);
            // Verify no logs are returned
            expect(filteredLogs.length).toBe(0);
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
    it('should maintain filter consistency across multiple calls', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 100 }), fc.array(logLevelArb, { minLength: 1, maxLength: 2 }), (logs, selectedLevels) => {
            // Create a mock session with these logs
            const deviceId = 'test-device';
            const sessionId = logCaptureService.startCapture(deviceId, 'android');
            // Manually inject logs into the session
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = logs;
            }
            // Apply filter multiple times
            const filter = { level: selectedLevels };
            const filteredLogs1 = logCaptureService.getLogs(sessionId, filter);
            const filteredLogs2 = logCaptureService.getLogs(sessionId, filter);
            const filteredLogs3 = logCaptureService.getLogs(sessionId, filter);
            // Verify results are consistent
            expect(filteredLogs1.length).toBe(filteredLogs2.length);
            expect(filteredLogs2.length).toBe(filteredLogs3.length);
            // Verify same logs are returned
            for (let i = 0; i < filteredLogs1.length; i++) {
                expect(filteredLogs1[i]).toEqual(filteredLogs2[i]);
                expect(filteredLogs2[i]).toEqual(filteredLogs3[i]);
            }
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
});
