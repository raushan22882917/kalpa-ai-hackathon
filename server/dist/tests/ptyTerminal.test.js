/**
 * PTY Terminal Service Tests
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PTYTerminalService } from '../services/ptyTerminalService';
describe('PTYTerminalService', () => {
    let service;
    beforeEach(() => {
        service = new PTYTerminalService();
    });
    afterEach(() => {
        service.cleanup();
    });
    it('should create a new terminal session', () => {
        const session = service.createSession('test-session-1');
        expect(session).toBeDefined();
        expect(session.id).toBe('test-session-1');
        expect(session.ptyProcess).toBeDefined();
        expect(session.createdAt).toBeInstanceOf(Date);
    });
    it('should get or create session', () => {
        const session1 = service.getOrCreateSession('test-session-2');
        const session2 = service.getOrCreateSession('test-session-2');
        expect(session1).toBe(session2);
        expect(session1.id).toBe('test-session-2');
    });
    it('should write data to terminal', () => {
        const session = service.createSession('test-session-3');
        expect(() => {
            service.write('test-session-3', 'echo "test"\n');
        }).not.toThrow();
    });
    it('should resize terminal', () => {
        const session = service.createSession('test-session-4');
        expect(() => {
            service.resize('test-session-4', 100, 30);
        }).not.toThrow();
    });
    it('should close terminal session', () => {
        service.createSession('test-session-5');
        service.closeSession('test-session-5');
        const session = service.getSession('test-session-5');
        expect(session).toBeUndefined();
    });
    it('should get all active sessions', () => {
        service.createSession('session-1');
        service.createSession('session-2');
        service.createSession('session-3');
        const sessions = service.getAllSessions();
        expect(sessions).toHaveLength(3);
    });
    it('should cleanup all sessions', () => {
        service.createSession('session-a');
        service.createSession('session-b');
        service.cleanup();
        const sessions = service.getAllSessions();
        expect(sessions).toHaveLength(0);
    });
    it('should handle writing to non-existent session gracefully', () => {
        expect(() => {
            service.write('non-existent', 'test');
        }).not.toThrow();
    });
    it('should handle resizing non-existent session gracefully', () => {
        expect(() => {
            service.resize('non-existent', 80, 24);
        }).not.toThrow();
    });
});
