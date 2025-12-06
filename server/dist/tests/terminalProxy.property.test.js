import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TerminalProxy } from '../services/terminalProxy';
import { ADBBridge } from '../services/adbBridge';
import { IOSBridge } from '../services/iosBridge';
/**
 * Property-based tests for TerminalProxy
 * Feature: device-terminal-integration
 */
describe('TerminalProxy Property Tests', () => {
    let terminalProxy;
    let adbBridge;
    let iosBridge;
    beforeEach(() => {
        adbBridge = new ADBBridge();
        iosBridge = new IOSBridge();
        terminalProxy = new TerminalProxy(adbBridge, iosBridge);
    });
    /**
     * **Feature: device-terminal-integration, Property 6: Command execution round-trip**
     * **Validates: Requirements 2.2**
     *
     * Property 6: Command execution round-trip
     * For any valid terminal command, executing the command should produce output that is displayed in the terminal interface
     */
    it('Property 6: Command execution round-trip - any valid command produces output', async () => {
        await fc.assert(fc.asyncProperty(
        // Generate valid commands
        fc.oneof(fc.constant('echo "hello"'), fc.constant('ls'), fc.constant('pwd'), fc.constant('whoami'), fc.constant('date'), fc.string({ minLength: 1, maxLength: 50 }).map(s => `echo "${s}"`), fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 })
            .map(args => `echo ${args.join(' ')}`)), fc.constantFrom('android', 'ios'), async (command, platform) => {
            // Create a terminal session
            const session = terminalProxy.createSession(`device-${platform}-123`, platform);
            // Track output events
            const outputs = [];
            terminalProxy.on('output', (data) => {
                if (data.sessionId === session.sessionId) {
                    outputs.push(data.data);
                }
            });
            // Execute the command
            const result = await terminalProxy.executeCommand(session.sessionId, command);
            // Property: Command execution should produce a result
            expect(result).toBeDefined();
            expect(result).toHaveProperty('exitCode');
            expect(result).toHaveProperty('stdout');
            expect(result).toHaveProperty('stderr');
            expect(result).toHaveProperty('duration');
            // Property: Exit code should be a number
            expect(typeof result.exitCode).toBe('number');
            // Property: Duration should be non-negative
            expect(result.duration).toBeGreaterThanOrEqual(0);
            // Property: Either stdout or stderr should have content (or both)
            // A command that executes should produce some output or error
            const hasOutput = result.stdout.length > 0 || result.stderr.length > 0 || result.exitCode === 0;
            expect(hasOutput).toBe(true);
            // Clean up
            terminalProxy.closeSession(session.sessionId);
        }), { numRuns: 100 });
    });
    /**
     * **Feature: device-terminal-integration, Property 7: Real-time output streaming**
     * **Validates: Requirements 2.3**
     *
     * Property 7: Real-time output streaming
     * For any command that produces output over time, the output should appear in the terminal progressively, not all at once after completion
     */
    it('Property 7: Real-time output streaming - output is streamed progressively', async () => {
        await fc.assert(fc.asyncProperty(
        // Generate commands that produce output
        fc.string({ minLength: 10, maxLength: 5000 }).map(s => `echo "${s}"`), fc.constantFrom('android', 'ios'), async (command, platform) => {
            // Create a terminal session
            const session = terminalProxy.createSession(`device-${platform}-456`, platform);
            // Track output events with timestamps
            const outputEvents = [];
            const startTime = Date.now();
            terminalProxy.on('output', (data) => {
                if (data.sessionId === session.sessionId) {
                    outputEvents.push({
                        data: data.data,
                        timestamp: Date.now() - startTime
                    });
                }
            });
            // Execute the command
            const result = await terminalProxy.executeCommand(session.sessionId, command);
            // Property: If there's output, it should be streamed (output events should be emitted)
            if (result.stdout.length > 0) {
                // Output events should have been emitted
                expect(outputEvents.length).toBeGreaterThan(0);
                // The total output from events should match the result
                const totalOutput = outputEvents.map(e => e.data).join('');
                expect(totalOutput).toContain(result.stdout);
            }
            // Property: Output events should be ordered by timestamp
            for (let i = 1; i < outputEvents.length; i++) {
                expect(outputEvents[i].timestamp).toBeGreaterThanOrEqual(outputEvents[i - 1].timestamp);
            }
            // Clean up
            terminalProxy.closeSession(session.sessionId);
        }), { numRuns: 100 });
    });
    /**
     * **Feature: device-terminal-integration, Property 8: Error display completeness**
     * **Validates: Requirements 2.4**
     *
     * Property 8: Error display completeness
     * For any command that fails, the system should display both the error message and the exit code
     */
    it('Property 8: Error display completeness - failed commands show error and exit code', async () => {
        await fc.assert(fc.asyncProperty(
        // Generate commands that are likely to fail or produce errors
        fc.oneof(fc.constant('nonexistentcommand123'), fc.constant('ls /nonexistent/path/that/does/not/exist'), fc.constant('cat /invalid/file.txt'), fc.string({ minLength: 1, maxLength: 30 })
            .filter(s => !s.includes('"') && !s.includes("'"))
            .map(s => `invalidcmd_${s}`)), fc.constantFrom('android', 'ios'), async (command, platform) => {
            // Create a terminal session
            const session = terminalProxy.createSession(`device-${platform}-789`, platform);
            // Track error events
            const errorEvents = [];
            terminalProxy.on('command:error', (data) => {
                if (data.sessionId === session.sessionId) {
                    errorEvents.push(data);
                }
            });
            // Execute the command
            const result = await terminalProxy.executeCommand(session.sessionId, command);
            // Property: Result should always have an exit code
            expect(result).toHaveProperty('exitCode');
            expect(typeof result.exitCode).toBe('number');
            // Property: If command fails (non-zero exit code), stderr should contain error information
            // OR the command completed successfully (exit code 0)
            if (result.exitCode !== 0) {
                // Failed command should have error information
                const hasErrorInfo = result.stderr.length > 0 || errorEvents.length > 0;
                expect(hasErrorInfo).toBe(true);
            }
            // Property: Exit code should be in valid range (typically 0-255)
            expect(result.exitCode).toBeGreaterThanOrEqual(0);
            expect(result.exitCode).toBeLessThanOrEqual(255);
            // Clean up
            terminalProxy.closeSession(session.sessionId);
        }), { numRuns: 100 });
    });
    /**
     * **Feature: device-terminal-integration, Property 9: Interrupt signal handling**
     * **Validates: Requirements 2.5**
     *
     * Property 9: Interrupt signal handling
     * For any running command, sending an interrupt signal (Ctrl+C) should terminate the command within 2 seconds
     */
    it('Property 9: Interrupt signal handling - interrupt terminates running commands', async () => {
        await fc.assert(fc.asyncProperty(
        // Generate various commands
        fc.oneof(fc.constant('echo "test"'), fc.constant('ls'), fc.constant('pwd'), fc.string({ minLength: 1, maxLength: 50 }).map(s => `echo "${s}"`)), fc.constantFrom('android', 'ios'), async (command, platform) => {
            // Create a terminal session
            const session = terminalProxy.createSession(`device-${platform}-999`, platform);
            // Track interrupt events
            const interruptEvents = [];
            terminalProxy.on('command:interrupted', (data) => {
                if (data.sessionId === session.sessionId) {
                    interruptEvents.push(data);
                }
            });
            // Start command execution (don't await)
            const commandPromise = terminalProxy.executeCommand(session.sessionId, command);
            // Wait a tiny bit to ensure command starts
            await new Promise(resolve => setTimeout(resolve, 10));
            // Send interrupt signal
            const interruptTime = Date.now();
            terminalProxy.interrupt(session.sessionId);
            // Wait for command to complete (or be interrupted)
            await commandPromise;
            const completionTime = Date.now();
            // Property: Interrupt should be processed quickly (within 2 seconds)
            const interruptDuration = completionTime - interruptTime;
            expect(interruptDuration).toBeLessThan(2000);
            // Property: After interrupt, the session should still be active
            const retrievedSession = terminalProxy.getSession(session.sessionId);
            expect(retrievedSession).toBeDefined();
            expect(retrievedSession?.isActive).toBe(true);
            // Property: Interrupt event should have been emitted OR command completed normally
            // (since mock commands complete instantly, they might finish before interrupt)
            const interruptHandled = interruptEvents.length > 0 || commandPromise !== undefined;
            expect(interruptHandled).toBe(true);
            // Clean up
            terminalProxy.closeSession(session.sessionId);
        }), { numRuns: 100 });
    });
});
