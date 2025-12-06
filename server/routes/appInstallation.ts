import express, { Request, Response } from 'express';
import multer from 'multer';
import { AppInstallationService } from '../services/appInstallationService';
import { ADBBridge } from '../services/adbBridge';
import { IOSBridge } from '../services/iosBridge';

const router = express.Router();

// Initialize bridges and service
const adbBridge = new ADBBridge();
const iosBridge = new IOSBridge();
const appInstallationService = new AppInstallationService(adbBridge, iosBridge);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  }
});

/**
 * POST /api/app-installation/upload
 * Upload and install an app package
 */
router.post('/upload', upload.single('appPackage'), async (req: Request, res: Response) => {
  try {
    const { deviceId, platform } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!deviceId || !platform) {
      return res.status(400).json({ error: 'Missing deviceId or platform' });
    }

    if (platform !== 'android' && platform !== 'ios') {
      return res.status(400).json({ error: 'Invalid platform. Must be android or ios' });
    }

    // Validate file extension
    const validExtensions = platform === 'android' ? ['.apk'] : ['.ipa'];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      return res.status(400).json({ 
        error: `Invalid file type. Expected ${validExtensions.join(' or ')} for ${platform}` 
      });
    }

    // Save the uploaded file
    const filePath = await appInstallationService.saveAppPackage(
      deviceId,
      file.originalname,
      file.buffer
    );

    // Install the app
    const result = await appInstallationService.installApp(
      deviceId,
      platform,
      filePath
    );

    if (result.success) {
      res.json({
        success: true,
        packageName: result.packageName,
        duration: result.duration
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error installing app:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to install app'
    });
  }
});

/**
 * POST /api/app-installation/launch
 * Launch an installed app
 */
router.post('/launch', async (req: Request, res: Response) => {
  try {
    const { deviceId, platform, packageName } = req.body;

    if (!deviceId || !platform || !packageName) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    if (platform !== 'android' && platform !== 'ios') {
      return res.status(400).json({ error: 'Invalid platform' });
    }

    const result = await appInstallationService.launchApp(deviceId, platform, packageName);

    if (result.success) {
      res.json({
        success: true,
        packageName: result.packageName
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error launching app:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to launch app'
    });
  }
});

export default router;
export { appInstallationService };
