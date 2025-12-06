/**
 * Native File System Service
 * Provides real disk access using Electron or File System Access API
 */

export interface NativeFileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
}

export interface NativeFileSystemResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

class NativeFileSystemService {
  private isElectron: boolean;
  private currentWorkspace: string | null = null;

  constructor() {
    this.isElectron = typeof window !== 'undefined' && !!(window as any).electron?.isElectron;
  }

  /**
   * Check if native file system is available
   */
  isAvailable(): boolean {
    if (this.isElectron) {
      return true;
    }
    // Check for File System Access API
    return 'showDirectoryPicker' in window;
  }

  /**
   * Open a directory picker and set as workspace
   */
  async openWorkspace(): Promise<NativeFileSystemResult<string>> {
    try {
      if (this.isElectron) {
        const dirPath = await (window as any).electron.selectDirectory();
        if (dirPath) {
          this.currentWorkspace = dirPath;
          return { success: true, data: dirPath };
        }
        return { success: false, error: 'No directory selected' };
      } else {
        // Use File System Access API
        const dirHandle = await (window as any).showDirectoryPicker();
        this.currentWorkspace = dirHandle.name;
        // Store handle for later use
        (window as any).__workspaceHandle = dirHandle;
        return { success: true, data: dirHandle.name };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to open workspace' };
    }
  }

  /**
   * Read a file from disk
   */
  async readFile(filePath: string): Promise<NativeFileSystemResult<string>> {
    try {
      if (this.isElectron) {
        const result = await (window as any).electron.fs.readFile(filePath);
        if (result.success) {
          return { success: true, data: result.content };
        }
        return { success: false, error: result.error };
      } else {
        // Use File System Access API
        const fileHandle = await this.getFileHandle(filePath);
        if (!fileHandle) {
          return { success: false, error: 'File not found' };
        }
        const file = await fileHandle.getFile();
        const content = await file.text();
        return { success: true, data: content };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to read file' };
    }
  }

  /**
   * Write content to a file
   */
  async writeFile(filePath: string, content: string): Promise<NativeFileSystemResult> {
    try {
      if (this.isElectron) {
        const result = await (window as any).electron.fs.writeFile(filePath, content);
        return result;
      } else {
        // Use File System Access API
        const fileHandle = await this.getFileHandle(filePath, true);
        if (!fileHandle) {
          return { success: false, error: 'Could not create file' };
        }
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to write file' };
    }
  }

  /**
   * Read directory contents
   */
  async readDirectory(dirPath: string): Promise<NativeFileSystemResult<NativeFileEntry[]>> {
    try {
      if (this.isElectron) {
        const result = await (window as any).electron.fs.readDir(dirPath);
        if (result.success) {
          return { success: true, data: result.files };
        }
        return { success: false, error: result.error };
      } else {
        // Use File System Access API
        const dirHandle = await this.getDirectoryHandle(dirPath);
        if (!dirHandle) {
          return { success: false, error: 'Directory not found' };
        }
        
        const entries: NativeFileEntry[] = [];
        for await (const [name, handle] of (dirHandle as any).entries()) {
          entries.push({
            name,
            path: `${dirPath}/${name}`,
            type: handle.kind === 'directory' ? 'directory' : 'file'
          });
        }
        return { success: true, data: entries };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to read directory' };
    }
  }

  /**
   * Create a new directory
   */
  async createDirectory(dirPath: string): Promise<NativeFileSystemResult> {
    try {
      if (this.isElectron) {
        return await (window as any).electron.fs.createDir(dirPath);
      } else {
        // Use File System Access API
        await this.getDirectoryHandle(dirPath, true);
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create directory' };
    }
  }

  /**
   * Delete a file or directory
   */
  async delete(targetPath: string): Promise<NativeFileSystemResult> {
    try {
      if (this.isElectron) {
        return await (window as any).electron.fs.delete(targetPath);
      } else {
        // Use File System Access API
        const parts = targetPath.split('/');
        const name = parts.pop()!;
        const parentPath = parts.join('/');
        
        const parentHandle = await this.getDirectoryHandle(parentPath);
        if (!parentHandle) {
          return { success: false, error: 'Parent directory not found' };
        }
        
        await (parentHandle as any).removeEntry(name, { recursive: true });
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete' };
    }
  }

  /**
   * Rename or move a file/directory
   */
  async rename(oldPath: string, newPath: string): Promise<NativeFileSystemResult> {
    try {
      if (this.isElectron) {
        return await (window as any).electron.fs.rename(oldPath, newPath);
      } else {
        // File System Access API doesn't support rename directly
        // Need to copy and delete
        return { success: false, error: 'Rename not supported in browser mode yet' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to rename' };
    }
  }

  /**
   * Check if a file/directory exists
   */
  async exists(targetPath: string): Promise<NativeFileSystemResult<boolean>> {
    try {
      if (this.isElectron) {
        const result = await (window as any).electron.fs.exists(targetPath);
        return { success: true, data: result.exists };
      } else {
        // Try to get handle
        const handle = await this.getFileHandle(targetPath) || await this.getDirectoryHandle(targetPath);
        return { success: true, data: !!handle };
      }
    } catch (error) {
      return { success: true, data: false };
    }
  }

  /**
   * Get file/directory stats
   */
  async stat(targetPath: string): Promise<NativeFileSystemResult<any>> {
    try {
      if (this.isElectron) {
        return await (window as any).electron.fs.stat(targetPath);
      } else {
        const fileHandle = await this.getFileHandle(targetPath);
        if (fileHandle) {
          const file = await fileHandle.getFile();
          return {
            success: true,
            data: {
              size: file.size,
              isFile: true,
              isDirectory: false,
              modified: new Date(file.lastModified)
            }
          };
        }
        return { success: false, error: 'File not found' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to get stats' };
    }
  }

  /**
   * Helper: Get file handle (File System Access API)
   */
  private async getFileHandle(filePath: string, create: boolean = false): Promise<any> {
    const workspaceHandle = (window as any).__workspaceHandle;
    if (!workspaceHandle) return null;

    const parts = filePath.split('/').filter(p => p);
    let currentHandle = workspaceHandle;

    for (let i = 0; i < parts.length - 1; i++) {
      try {
        currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
      } catch {
        return null;
      }
    }

    try {
      return await currentHandle.getFileHandle(parts[parts.length - 1], { create });
    } catch {
      return null;
    }
  }

  /**
   * Helper: Get directory handle (File System Access API)
   */
  private async getDirectoryHandle(dirPath: string, create: boolean = false): Promise<any> {
    const workspaceHandle = (window as any).__workspaceHandle;
    if (!workspaceHandle) return null;

    if (!dirPath || dirPath === '/') return workspaceHandle;

    const parts = dirPath.split('/').filter(p => p);
    let currentHandle = workspaceHandle;

    for (const part of parts) {
      try {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create });
      } catch {
        return null;
      }
    }

    return currentHandle;
  }

  /**
   * Get current workspace path
   */
  getWorkspace(): string | null {
    return this.currentWorkspace;
  }
}

// Singleton instance
export const nativeFileSystem = new NativeFileSystemService();
