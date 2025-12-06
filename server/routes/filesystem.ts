import { Router, Request, Response } from 'express';
import { DeviceFileSystemService } from '../services/deviceFileSystemService';
import { deviceManager, adbBridge, iosBridge } from './devices';

const router = Router();
const fileSystemService = new DeviceFileSystemService(adbBridge, iosBridge);

/**
 * GET /api/filesystem/:deviceId/list
 * List directory contents on the device
 */
router.get('/:deviceId/list', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { path = '/' } = req.query;

    // Get device to determine platform
    const devices = deviceManager.getConnectedDevices();
    const device = devices.find(d => d.id === deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        deviceId
      });
    }

    const entries = await fileSystemService.listDirectory(
      deviceId,
      path as string,
      device.platform
    );

    res.json({
      success: true,
      path,
      entries,
      count: entries.length
    });
  } catch (error) {
    console.error('Error listing directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list directory',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/filesystem/:deviceId/info
 * Get detailed information about a file or directory
 */
router.get('/:deviceId/info', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'Path parameter is required'
      });
    }

    // Get device to determine platform
    const devices = deviceManager.getConnectedDevices();
    const device = devices.find(d => d.id === deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        deviceId
      });
    }

    const fileInfo = await fileSystemService.getFileInfo(
      deviceId,
      path as string,
      device.platform
    );

    res.json({
      success: true,
      fileInfo
    });
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file information',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/filesystem/:deviceId/upload
 * Upload a file to the device
 */
router.post('/:deviceId/upload', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { localPath, devicePath } = req.body;

    if (!localPath || !devicePath) {
      return res.status(400).json({
        success: false,
        error: 'localPath and devicePath are required'
      });
    }

    // Get device to determine platform
    const devices = deviceManager.getConnectedDevices();
    const device = devices.find(d => d.id === deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        deviceId
      });
    }

    const result = await fileSystemService.uploadFile(
      deviceId,
      localPath,
      devicePath,
      device.platform
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'File uploaded successfully',
        devicePath
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to upload file',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/filesystem/:deviceId/download
 * Download a file from the device
 */
router.get('/:deviceId/download', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'Path parameter is required'
      });
    }

    // Get device to determine platform
    const devices = deviceManager.getConnectedDevices();
    const device = devices.find(d => d.id === deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        deviceId
      });
    }

    const fileBuffer = await fileSystemService.downloadFile(
      deviceId,
      path as string,
      device.platform
    );

    // Extract filename from path
    const filename = (path as string).split('/').pop() || 'download';

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/filesystem/:deviceId/delete
 * Delete a file or directory on the device
 */
router.delete('/:deviceId/delete', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'Path is required'
      });
    }

    // Get device to determine platform
    const devices = deviceManager.getConnectedDevices();
    const device = devices.find(d => d.id === deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        deviceId
      });
    }

    const result = await fileSystemService.deleteFile(
      deviceId,
      path,
      device.platform
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'File deleted successfully',
        path
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete file',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PUT /api/filesystem/:deviceId/rename
 * Rename or move a file on the device
 */
router.put('/:deviceId/rename', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { oldPath, newPath } = req.body;

    if (!oldPath || !newPath) {
      return res.status(400).json({
        success: false,
        error: 'oldPath and newPath are required'
      });
    }

    // Get device to determine platform
    const devices = deviceManager.getConnectedDevices();
    const device = devices.find(d => d.id === deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        deviceId
      });
    }

    const result = await fileSystemService.renameFile(
      deviceId,
      oldPath,
      newPath,
      device.platform
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'File renamed successfully',
        oldPath,
        newPath
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to rename file',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rename file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/filesystem/:deviceId/mkdir
 * Create a directory on the device
 */
router.post('/:deviceId/mkdir', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'Path is required'
      });
    }

    // Get device to determine platform
    const devices = deviceManager.getConnectedDevices();
    const device = devices.find(d => d.id === deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        deviceId
      });
    }

    const result = await fileSystemService.createDirectory(
      deviceId,
      path,
      device.platform
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Directory created successfully',
        path
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create directory',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error creating directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create directory',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/filesystem/:deviceId/rmdir
 * Delete a directory on the device
 */
router.delete('/:deviceId/rmdir', async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { path, recursive = false } = req.body;

    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'Path is required'
      });
    }

    // Get device to determine platform
    const devices = deviceManager.getConnectedDevices();
    const device = devices.find(d => d.id === deviceId);

    if (!device) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
        deviceId
      });
    }

    const result = await fileSystemService.deleteDirectory(
      deviceId,
      path,
      recursive,
      device.platform
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Directory deleted successfully',
        path
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete directory',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Error deleting directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete directory',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
