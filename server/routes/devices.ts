import { Router, Request, Response } from 'express';
import { DeviceManager } from '../services/deviceManager';

const router = Router();
const deviceManager = new DeviceManager();
const adbBridge = deviceManager.getADBBridge();
const iosBridge = deviceManager.getIOSBridge();

/**
 * GET /api/devices
 * Discover and list all available devices
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const devices = await deviceManager.discoverDevices();
    res.json({
      success: true,
      devices,
      count: devices.length
    });
  } catch (error) {
    console.error('Error discovering devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover devices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/devices/:deviceId
 * Get detailed information about a specific device
 */
router.get('/:deviceId', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const deviceInfo = await deviceManager.getDeviceInfo(deviceId);
    
    if (!deviceInfo) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        deviceId
      });
    }

    res.json({
      success: true,
      device: deviceInfo
    });
  } catch (error) {
    console.error('Error getting device info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get device information',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/devices/connected
 * Get list of currently connected devices
 */
router.get('/status/connected', async (req: Request, res: Response) => {
  try {
    const devices = deviceManager.getConnectedDevices();
    res.json({
      success: true,
      devices,
      count: devices.length
    });
  } catch (error) {
    console.error('Error getting connected devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get connected devices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
export { deviceManager, adbBridge, iosBridge };
