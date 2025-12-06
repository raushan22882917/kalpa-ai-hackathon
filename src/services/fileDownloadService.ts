/**
 * File Download/Upload Service
 * Handles file operations for cross-platform compatibility
 */

export class FileDownloadService {
  /**
   * Download a single file
   */
  static downloadFile(fileName: string, content: string, mimeType: string = 'text/plain'): void {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Failed to download file:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Download multiple files as a ZIP
   */
  static async downloadAsZip(files: Array<{ name: string; content: string }>): Promise<void> {
    try {
      // For now, download files individually
      // In production, you'd use a library like JSZip
      for (const file of files) {
        this.downloadFile(file.name, file.content);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Failed to download files:', error);
      throw new Error('Failed to download files');
    }
  }

  /**
   * Upload a file
   */
  static uploadFile(): Promise<{ name: string; content: string; type: string }> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.txt,.js,.ts,.tsx,.jsx,.json,.css,.html,.xml,.py,.java,.cpp,.c,.h,.sh,.yml,.yaml,.md';
      input.style.display = 'none';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        try {
          const content = await file.text();
          resolve({
            name: file.name,
            content,
            type: file.type,
          });
        } catch (error) {
          reject(error);
        } finally {
          document.body.removeChild(input);
        }
      };

      input.oncancel = () => {
        document.body.removeChild(input);
        reject(new Error('File selection cancelled'));
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  /**
   * Upload multiple files
   */
  static uploadMultipleFiles(): Promise<Array<{ name: string; content: string; type: string }>> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.txt,.js,.ts,.tsx,.jsx,.json,.css,.html,.xml,.py,.java,.cpp,.c,.h,.sh,.yml,.yaml,.md';
      input.style.display = 'none';
      
      input.onchange = async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        if (files.length === 0) {
          reject(new Error('No files selected'));
          return;
        }

        try {
          const results = await Promise.all(
            files.map(async (file) => ({
              name: file.name,
              content: await file.text(),
              type: file.type,
            }))
          );
          resolve(results);
        } catch (error) {
          reject(error);
        } finally {
          document.body.removeChild(input);
        }
      };

      input.oncancel = () => {
        document.body.removeChild(input);
        reject(new Error('File selection cancelled'));
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  /**
   * Upload a folder (Chrome/Edge only)
   */
  static uploadFolder(): Promise<Array<{ name: string; content: string; path: string }>> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      // @ts-ignore - webkitdirectory is not in TypeScript types
      input.webkitdirectory = true;
      input.style.display = 'none';
      
      input.onchange = async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        if (files.length === 0) {
          reject(new Error('No files selected'));
          return;
        }

        try {
          const results = await Promise.all(
            files.map(async (file) => ({
              name: file.name,
              content: await file.text(),
              // @ts-ignore - webkitRelativePath is not in TypeScript types
              path: file.webkitRelativePath || file.name,
            }))
          );
          resolve(results);
        } catch (error) {
          reject(error);
        } finally {
          document.body.removeChild(input);
        }
      };

      input.oncancel = () => {
        document.body.removeChild(input);
        reject(new Error('Folder selection cancelled'));
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  /**
   * Get MIME type from file extension
   */
  static getMimeType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'js': 'application/javascript',
      'ts': 'application/typescript',
      'tsx': 'application/typescript',
      'jsx': 'application/javascript',
      'json': 'application/json',
      'css': 'text/css',
      'html': 'text/html',
      'xml': 'application/xml',
      'py': 'text/x-python',
      'java': 'text/x-java',
      'cpp': 'text/x-c++src',
      'c': 'text/x-csrc',
      'h': 'text/x-chdr',
      'sh': 'application/x-sh',
      'yml': 'text/yaml',
      'yaml': 'text/yaml',
      'md': 'text/markdown',
    };
    return mimeTypes[ext || ''] || 'text/plain';
  }

  /**
   * Share file using Web Share API (mobile)
   */
  static async shareFile(fileName: string, content: string): Promise<void> {
    if (!navigator.share) {
      throw new Error('Web Share API not supported');
    }

    try {
      const blob = new Blob([content], { type: this.getMimeType(fileName) });
      const file = new File([blob], fileName, { type: blob.type });
      
      await navigator.share({
        files: [file],
        title: fileName,
        text: `Sharing ${fileName}`,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to share file:', error);
        throw error;
      }
    }
  }

  /**
   * Check if File System Access API is supported
   */
  static isFileSystemAccessSupported(): boolean {
    return 'showOpenFilePicker' in window;
  }

  /**
   * Open file using File System Access API (Chrome/Edge)
   */
  static async openFileWithFileSystem(): Promise<{ name: string; content: string; handle: any }> {
    if (!this.isFileSystemAccessSupported()) {
      throw new Error('File System Access API not supported');
    }

    try {
      // @ts-ignore - File System Access API
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Code Files',
            accept: {
              'text/*': ['.txt', '.js', '.ts', '.tsx', '.jsx', '.json', '.css', '.html', '.xml', '.py', '.java', '.cpp', '.c', '.h', '.sh', '.yml', '.yaml', '.md'],
            },
          },
        ],
        multiple: false,
      });

      const file = await fileHandle.getFile();
      const content = await file.text();

      return {
        name: file.name,
        content,
        handle: fileHandle,
      };
    } catch (error) {
      console.error('Failed to open file:', error);
      throw error;
    }
  }

  /**
   * Save file using File System Access API (Chrome/Edge)
   */
  static async saveFileWithFileSystem(fileName: string, content: string): Promise<void> {
    if (!this.isFileSystemAccessSupported()) {
      // Fallback to download
      this.downloadFile(fileName, content);
      return;
    }

    try {
      // @ts-ignore - File System Access API
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Code Files',
            accept: {
              'text/*': ['.txt', '.js', '.ts', '.tsx', '.jsx', '.json', '.css', '.html', '.xml', '.py', '.java', '.cpp', '.c', '.h', '.sh', '.yml', '.yaml', '.md'],
            },
          },
        ],
      });

      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to save file:', error);
        throw error;
      }
    }
  }
}
