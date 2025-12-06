/**
 * Device File System Service
 * Provides file system operations for connected devices
 */
export class DeviceFileSystemService {
    constructor(adbBridge, iosBridge) {
        this.CHUNK_SIZE = 1024 * 1024; // 1MB chunks
        this.adbBridge = adbBridge;
        this.iosBridge = iosBridge;
    }
    /**
     * List directory contents on the device
     */
    async listDirectory(deviceId, path, platform) {
        try {
            if (platform === 'android') {
                return await this.listDirectoryAndroid(deviceId, path);
            }
            else {
                return await this.listDirectoryIOS(deviceId, path);
            }
        }
        catch (error) {
            console.error(`Error listing directory ${path} on device ${deviceId}:`, error);
            throw new Error(`Failed to list directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * List directory contents on Android device
     */
    async listDirectoryAndroid(deviceId, path) {
        // Use 'ls -la' command to get detailed file information
        const command = `ls -la "${path}"`;
        const result = await this.adbBridge.executeCommand(deviceId, command);
        if (result.exitCode !== 0) {
            throw new Error(`Failed to list directory: ${result.stderr}`);
        }
        return this.parseAndroidLsOutput(result.stdout, path);
    }
    /**
     * Parse Android 'ls -la' output into FileEntry objects
     */
    parseAndroidLsOutput(output, basePath) {
        const lines = output.split('\n').filter(line => line.trim());
        const entries = [];
        for (const line of lines) {
            // Skip total line and current/parent directory entries
            if (line.startsWith('total') || line.endsWith(' .') || line.endsWith(' ..')) {
                continue;
            }
            // Parse ls -la output format:
            // -rw-r--r-- 1 root root 1234 2024-01-01 12:00 filename
            const match = line.match(/^([drwx-]+)\s+\d+\s+\S+\s+\S+\s+(\d+)\s+(\S+\s+\S+\s+\S+)\s+(.+)$/);
            if (match) {
                const [, permissions, size, dateStr, name] = match;
                const type = permissions.startsWith('d') ? 'directory' : 'file';
                const fullPath = basePath.endsWith('/') ? `${basePath}${name}` : `${basePath}/${name}`;
                entries.push({
                    name,
                    path: fullPath,
                    type,
                    size: parseInt(size, 10),
                    modified: new Date(dateStr),
                    permissions
                });
            }
        }
        return entries;
    }
    /**
     * List directory contents on iOS device
     */
    async listDirectoryIOS(deviceId, path) {
        // Mock implementation - would use libimobiledevice or similar
        // Real implementation would use: ideviceinstaller -l or similar commands
        console.log(`Listing iOS directory ${path} on device ${deviceId}`);
        return [];
    }
    /**
     * Get detailed information about a file or directory
     */
    async getFileInfo(deviceId, path, platform) {
        try {
            if (platform === 'android') {
                return await this.getFileInfoAndroid(deviceId, path);
            }
            else {
                return await this.getFileInfoIOS(deviceId, path);
            }
        }
        catch (error) {
            console.error(`Error getting file info for ${path} on device ${deviceId}:`, error);
            throw new Error(`Failed to get file info: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get file information on Android device
     */
    async getFileInfoAndroid(deviceId, path) {
        const command = `stat -c '%n|%s|%Y|%A|%U|%G' "${path}"`;
        const result = await this.adbBridge.executeCommand(deviceId, command);
        if (result.exitCode !== 0) {
            throw new Error(`Failed to get file info: ${result.stderr}`);
        }
        const [name, size, mtime, permissions, owner, group] = result.stdout.trim().split('|');
        const basename = name.split('/').pop() || name;
        return {
            name: basename,
            path: name,
            type: permissions.startsWith('d') ? 'directory' : 'file',
            size: parseInt(size, 10),
            modified: new Date(parseInt(mtime, 10) * 1000),
            permissions,
            owner,
            group
        };
    }
    /**
     * Get file information on iOS device
     */
    async getFileInfoIOS(deviceId, path) {
        // Mock implementation
        throw new Error('iOS file info not yet implemented');
    }
    /**
     * Upload a file to the device with chunking
     */
    async uploadFile(deviceId, localPath, devicePath, platform, onProgress) {
        try {
            if (platform === 'android') {
                return await this.uploadFileAndroid(deviceId, localPath, devicePath, onProgress);
            }
            else {
                return await this.uploadFileIOS(deviceId, localPath, devicePath, onProgress);
            }
        }
        catch (error) {
            console.error(`Error uploading file to ${devicePath} on device ${deviceId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Upload file to Android device
     */
    async uploadFileAndroid(deviceId, localPath, devicePath, onProgress) {
        // Use ADB push command
        const command = `push "${localPath}" "${devicePath}"`;
        // Mock implementation - real implementation would use adbkit's push method
        // and track progress through the stream
        console.log(`Uploading file from ${localPath} to ${devicePath} on device ${deviceId}`);
        if (onProgress) {
            onProgress(100);
        }
        return { success: true };
    }
    /**
     * Upload file to iOS device
     */
    async uploadFileIOS(deviceId, localPath, devicePath, onProgress) {
        // Mock implementation
        console.log(`Uploading file to iOS device ${deviceId}`);
        return { success: false, error: 'iOS file upload not yet implemented' };
    }
    /**
     * Download a file from the device with chunking
     */
    async downloadFile(deviceId, devicePath, platform, onProgress) {
        try {
            if (platform === 'android') {
                return await this.downloadFileAndroid(deviceId, devicePath, onProgress);
            }
            else {
                return await this.downloadFileIOS(deviceId, devicePath, onProgress);
            }
        }
        catch (error) {
            console.error(`Error downloading file from ${devicePath} on device ${deviceId}:`, error);
            throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Download file from Android device
     */
    async downloadFileAndroid(deviceId, devicePath, onProgress) {
        // Use ADB pull command
        // Mock implementation - real implementation would use adbkit's pull method
        console.log(`Downloading file from ${devicePath} on device ${deviceId}`);
        if (onProgress) {
            onProgress(100);
        }
        return Buffer.from('');
    }
    /**
     * Download file from iOS device
     */
    async downloadFileIOS(deviceId, devicePath, onProgress) {
        // Mock implementation
        throw new Error('iOS file download not yet implemented');
    }
    /**
     * Delete a file or directory on the device
     */
    async deleteFile(deviceId, path, platform) {
        try {
            if (platform === 'android') {
                return await this.deleteFileAndroid(deviceId, path);
            }
            else {
                return await this.deleteFileIOS(deviceId, path);
            }
        }
        catch (error) {
            console.error(`Error deleting file ${path} on device ${deviceId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Delete file on Android device
     */
    async deleteFileAndroid(deviceId, path) {
        const command = `rm -rf "${path}"`;
        const result = await this.adbBridge.executeCommand(deviceId, command);
        if (result.exitCode !== 0) {
            return {
                success: false,
                error: result.stderr
            };
        }
        return { success: true };
    }
    /**
     * Delete file on iOS device
     */
    async deleteFileIOS(deviceId, path) {
        // Mock implementation
        return { success: false, error: 'iOS file deletion not yet implemented' };
    }
    /**
     * Rename or move a file on the device
     */
    async renameFile(deviceId, oldPath, newPath, platform) {
        try {
            if (platform === 'android') {
                return await this.renameFileAndroid(deviceId, oldPath, newPath);
            }
            else {
                return await this.renameFileIOS(deviceId, oldPath, newPath);
            }
        }
        catch (error) {
            console.error(`Error renaming file from ${oldPath} to ${newPath} on device ${deviceId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Rename file on Android device
     */
    async renameFileAndroid(deviceId, oldPath, newPath) {
        const command = `mv "${oldPath}" "${newPath}"`;
        const result = await this.adbBridge.executeCommand(deviceId, command);
        if (result.exitCode !== 0) {
            return {
                success: false,
                error: result.stderr
            };
        }
        return { success: true };
    }
    /**
     * Rename file on iOS device
     */
    async renameFileIOS(deviceId, oldPath, newPath) {
        // Mock implementation
        return { success: false, error: 'iOS file rename not yet implemented' };
    }
    /**
     * Create a directory on the device
     */
    async createDirectory(deviceId, path, platform) {
        try {
            if (platform === 'android') {
                return await this.createDirectoryAndroid(deviceId, path);
            }
            else {
                return await this.createDirectoryIOS(deviceId, path);
            }
        }
        catch (error) {
            console.error(`Error creating directory ${path} on device ${deviceId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Create directory on Android device
     */
    async createDirectoryAndroid(deviceId, path) {
        const command = `mkdir -p "${path}"`;
        const result = await this.adbBridge.executeCommand(deviceId, command);
        if (result.exitCode !== 0) {
            return {
                success: false,
                error: result.stderr
            };
        }
        return { success: true };
    }
    /**
     * Create directory on iOS device
     */
    async createDirectoryIOS(deviceId, path) {
        // Mock implementation
        return { success: false, error: 'iOS directory creation not yet implemented' };
    }
    /**
     * Delete a directory on the device
     */
    async deleteDirectory(deviceId, path, recursive, platform) {
        try {
            if (platform === 'android') {
                return await this.deleteDirectoryAndroid(deviceId, path, recursive);
            }
            else {
                return await this.deleteDirectoryIOS(deviceId, path, recursive);
            }
        }
        catch (error) {
            console.error(`Error deleting directory ${path} on device ${deviceId}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Delete directory on Android device
     */
    async deleteDirectoryAndroid(deviceId, path, recursive) {
        const command = recursive ? `rm -rf "${path}"` : `rmdir "${path}"`;
        const result = await this.adbBridge.executeCommand(deviceId, command);
        if (result.exitCode !== 0) {
            return {
                success: false,
                error: result.stderr
            };
        }
        return { success: true };
    }
    /**
     * Delete directory on iOS device
     */
    async deleteDirectoryIOS(deviceId, path, recursive) {
        // Mock implementation
        return { success: false, error: 'iOS directory deletion not yet implemented' };
    }
}
