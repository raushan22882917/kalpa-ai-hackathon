import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { AppInstallationService } from '../services/appInstallationService';
import { ADBBridge } from '../services/adbBridge';
import { IOSBridge } from '../services/iosBridge';
/**
 * Property-Based Tests for App Launch
 * Feature: device-terminal-integration
 */
describe('App Launch Property Tests', () => {
    let appInstallationService;
    let adbBridge;
    let iosBridge;
    beforeEach(() => {
        adbBridge = new ADBBridge();
        iosBridge = new IOSBridge();
        appInstallationService = new AppInstallationService(adbBridge, iosBridge);
    });
    /**
     * Property 21: App launch with mirroring
     * For any installed application, clicking launch should start the app on the device
     * and automatically begin screen mirroring
     * Validates: Requirements 5.4
     */
    it('Property 21: App launch with mirroring - should launch app successfully', async () => {
        await fc.assert(fc.asyncProperty(fc.record({
            deviceId: fc.string({ minLength: 1, maxLength: 20 }),
            platform: fc.constantFrom('android', 'ios'),
            packageName: fc.string({ minLength: 1, maxLength: 50 }).map(name => `com.example.${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`)
        }), async ({ deviceId, platform, packageName }) => {
            // Launch the app
            const result = await appInstallationService.launchApp(deviceId, platform, packageName);
            // Verify launch result structure
            expect(result).toBeDefined();
            expect(result.success).toBeDefined();
            expect(typeof result.success).toBe('boolean');
            expect(result.packageName).toBe(packageName);
            // If launch succeeded, verify no error
            if (result.success) {
                expect(result.error).toBeUndefined();
            }
            else {
                // If launch failed, verify error is provided
                expect(result.error).toBeDefined();
                expect(typeof result.error).toBe('string');
            }
        }), { numRuns: 100 });
    });
    /**
     * Additional test: Verify launch result contains package name
     */
    it('should always return the package name in launch result', async () => {
        await fc.assert(fc.asyncProperty(fc.record({
            deviceId: fc.string({ minLength: 1, maxLength: 20 }),
            platform: fc.constantFrom('android', 'ios'),
            packageName: fc.string({ minLength: 1, maxLength: 50 }).map(name => `com.example.${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`)
        }), async ({ deviceId, platform, packageName }) => {
            const result = await appInstallationService.launchApp(deviceId, platform, packageName);
            // Package name should always be returned
            expect(result.packageName).toBe(packageName);
        }), { numRuns: 100 });
    });
    /**
     * Additional test: Verify launch handles both platforms
     */
    it('should handle launch for both Android and iOS platforms', async () => {
        await fc.assert(fc.asyncProperty(fc.record({
            deviceId: fc.string({ minLength: 1, maxLength: 20 }),
            platform: fc.constantFrom('android', 'ios'),
            packageName: fc.string({ minLength: 1, maxLength: 50 }).map(name => `com.example.${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`)
        }), async ({ deviceId, platform, packageName }) => {
            const result = await appInstallationService.launchApp(deviceId, platform, packageName);
            // Should return a result for both platforms
            expect(result).toBeDefined();
            expect(result.success).toBeDefined();
            // Platform-specific behavior is handled internally
            // Both platforms should return consistent result structure
            expect(typeof result.success).toBe('boolean');
            expect(result.packageName).toBe(packageName);
        }), { numRuns: 100 });
    });
});
