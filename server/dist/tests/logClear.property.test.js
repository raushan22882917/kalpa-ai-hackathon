import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { LogCaptureService } from '../services/logCaptureService';
import { ADBBridge } from '../services/adbBridge';
import { IOSBridge } from '../services/iosBridge';
/**
 * Feature: device-terminal-integration, Property 29: Log clear with continued capture
 *
 * Property: For any log clear operation, the viewer should be emptied but new logs
 * should continue to appear after the clear
 *
 * Validates: Requirements 7.4
 */
describe('Log Clear Property Tests', () => {
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
    it('should clear all logs when clearLogs is called', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 100 }), fc.uuid(), fc.constantFrom('android', 'ios'), (logs, deviceId, platform) => {
            // Start log capture
            const sessionId = logCaptureService.startCapture(deviceId, platform);
            // Manually inject logs into the session
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = logs;
            }
            // Verify logs exist
            const logsBeforeClear = logCaptureService.getLogs(sessionId);
            expect(logsBeforeClear.length).toBe(logs.length);
            // Clear logs
            logCaptureService.clearLogs(sessionId);
            // Verify logs are cleared
            const logsAfterClear = logCaptureService.getLogs(sessionId);
            expect(logsAfterClear.length).toBe(0);
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
    it('should continue capturing logs after clear', async () => {
        await fc.assert(fc.asyncProperty(fc.uuid(), fc.constantFrom('android', 'ios'), async (deviceId, platform) => {
            // Start log capture
            const sessionId = logCaptureService.startCapture(deviceId, platform);
            // Wait for some logs to be generated
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Get initial log count
            const logsBeforeClear = logCaptureService.getLogs(sessionId);
            const countBeforeClear = logsBeforeClear.length;
            // Clear logs
            logCaptureService.clearLogs(sessionId);
            // Verify logs are cleared
            const logsAfterClear = logCaptureService.getLogs(sessionId);
            expect(logsAfterClear.length).toBe(0);
            // Wait for new logs to be generated
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Verify new logs have been captured
            const logsAfterWait = logCaptureService.getLogs(sessionId);
            expect(logsAfterWait.length).toBeGreaterThan(0);
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 5 } // Fewer runs since this involves timing
        );
    }, 30000); // 30 second timeout
    it('should emit cleared event when logs are cleared', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 100 }), fc.uuid(), fc.constantFrom('android', 'ios'), (logs, deviceId, platform) => {
            // Start log capture
            const sessionId = logCaptureService.startCapture(deviceId, platform);
            // Manually inject logs into the session
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = logs;
            }
            // Listen for cleared event
            let clearedEventReceived = false;
            let clearedSessionId = null;
            logCaptureService.once('logs:cleared', (data) => {
                clearedEventReceived = true;
                clearedSessionId = data.sessionId;
            });
            // Clear logs
            logCaptureService.clearLogs(sessionId);
            // Verify event was emitted
            expect(clearedEventReceived).toBe(true);
            expect(clearedSessionId).toBe(sessionId);
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
    it('should not affect other sessions when clearing one session', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 50 }), fc.array(logEntryArb, { minLength: 10, maxLength: 50 }), fc.uuid(), fc.uuid(), (logs1, logs2, deviceId1, deviceId2) => {
            // Start two log capture sessions
            const sessionId1 = logCaptureService.startCapture(deviceId1, 'android');
            const sessionId2 = logCaptureService.startCapture(deviceId2, 'android');
            // Manually inject logs into both sessions
            const session1 = logCaptureService.sessions.get(sessionId1);
            const session2 = logCaptureService.sessions.get(sessionId2);
            if (session1) {
                session1.logs = logs1;
            }
            if (session2) {
                session2.logs = logs2;
            }
            // Verify both sessions have logs
            expect(logCaptureService.getLogs(sessionId1).length).toBe(logs1.length);
            expect(logCaptureService.getLogs(sessionId2).length).toBe(logs2.length);
            // Clear logs from session 1
            logCaptureService.clearLogs(sessionId1);
            // Verify session 1 is cleared
            expect(logCaptureService.getLogs(sessionId1).length).toBe(0);
            // Verify session 2 is unaffected
            expect(logCaptureService.getLogs(sessionId2).length).toBe(logs2.length);
            // Stop both captures
            logCaptureService.stopCapture(sessionId1);
            logCaptureService.stopCapture(sessionId2);
        }), { numRuns: 100 });
    });
    it('should allow multiple clears on the same session', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 100 }), fc.uuid(), fc.constantFrom('android', 'ios'), (logs, deviceId, platform) => {
            // Start log capture
            const sessionId = logCaptureService.startCapture(deviceId, platform);
            // Manually inject logs into the session
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = [...logs];
            }
            // First clear
            logCaptureService.clearLogs(sessionId);
            expect(logCaptureService.getLogs(sessionId).length).toBe(0);
            // Add more logs
            if (session) {
                session.logs = [...logs];
            }
            // Second clear
            logCaptureService.clearLogs(sessionId);
            expect(logCaptureService.getLogs(sessionId).length).toBe(0);
            // Add more logs again
            if (session) {
                session.logs = [...logs];
            }
            // Third clear
            logCaptureService.clearLogs(sessionId);
            expect(logCaptureService.getLogs(sessionId).length).toBe(0);
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
    it('should throw error when clearing non-existent session', () => {
        fc.assert(fc.property(fc.uuid(), (fakeSessionId) => {
            // Try to clear logs for a session that doesn't exist
            expect(() => {
                logCaptureService.clearLogs(fakeSessionId);
            }).toThrow();
        }), { numRuns: 100 });
    });
    it('should preserve session state after clear', () => {
        fc.assert(fc.property(fc.array(logEntryArb, { minLength: 10, maxLength: 100 }), fc.uuid(), fc.constantFrom('android', 'ios'), (logs, deviceId, platform) => {
            // Start log capture
            const sessionId = logCaptureService.startCapture(deviceId, platform);
            // Manually inject logs into the session
            const session = logCaptureService.sessions.get(sessionId);
            if (session) {
                session.logs = logs;
            }
            // Get session state before clear
            const sessionBefore = logCaptureService.sessions.get(sessionId);
            const isActiveBefore = sessionBefore?.isActive;
            const platformBefore = sessionBefore?.platform;
            const deviceIdBefore = sessionBefore?.deviceId;
            // Clear logs
            logCaptureService.clearLogs(sessionId);
            // Get session state after clear
            const sessionAfter = logCaptureService.sessions.get(sessionId);
            // Verify session state is preserved
            expect(sessionAfter?.isActive).toBe(isActiveBefore);
            expect(sessionAfter?.platform).toBe(platformBefore);
            expect(sessionAfter?.deviceId).toBe(deviceIdBefore);
            expect(sessionAfter?.sessionId).toBe(sessionId);
            // Stop capture
            logCaptureService.stopCapture(sessionId);
        }), { numRuns: 100 });
    });
});
