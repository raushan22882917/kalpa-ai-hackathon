/**
 * Git Clone Service
 * Handles cloning GitHub repositories to local directories
 */

import { notificationService } from './notificationService';
import { workspaceService } from './workspaceService';

export interface CloneProgress {
  phase: 'validating' | 'cloning' | 'complete' | 'error';
  message: string;
  percentage?: number;
}

class GitCloneService {
  /**
   * Validate GitHub URL
   */
  validateGitHubUrl(url: string): { valid: boolean; repoName?: string; error?: string } {
    // Remove trailing slashes and .git
    const cleanUrl = url.trim().replace(/\.git$/, '').replace(/\/$/, '');

    // Match GitHub URLs
    const patterns = [
      /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)$/,
      /^git@github\.com:([^\/]+)\/([^\/]+)$/,
      /^github\.com\/([^\/]+)\/([^\/]+)$/
    ];

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        const repoName = match[2];
        return { valid: true, repoName };
      }
    }

    return { valid: false, error: 'Invalid GitHub URL format' };
  }

  /**
   * Clone repository using Electron (Node.js)
   */
  private async cloneWithElectron(
    repoUrl: string,
    targetPath: string,
    onProgress?: (progress: CloneProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      onProgress?.({ phase: 'cloning', message: 'Cloning repository...', percentage: 50 });

      // Use electron's git clone capability
      const result = await (window as any).electron?.gitClone?.(repoUrl, targetPath);

      if (result?.success) {
        onProgress?.({ phase: 'complete', message: 'Clone complete!', percentage: 100 });
        return { success: true };
      } else {
        return { success: false, error: result?.error || 'Clone failed' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Clone failed'
      };
    }
  }

  /**
   * Clone repository using Web API (fetch-based fallback)
   */
  private async cloneWithWeb(
    repoUrl: string,
    targetPath: string,
    onProgress?: (progress: CloneProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      onProgress?.({ phase: 'cloning', message: 'Downloading repository...', percentage: 30 });

      // Extract owner and repo from URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        return { success: false, error: 'Invalid GitHub URL' };
      }

      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, '');

      // Download as ZIP from GitHub
      const zipUrl = `https://github.com/${owner}/${cleanRepo}/archive/refs/heads/main.zip`;
      
      onProgress?.({ phase: 'cloning', message: 'Fetching repository archive...', percentage: 50 });

      const response = await fetch(zipUrl);
      if (!response.ok) {
        // Try master branch if main doesn't exist
        const masterUrl = `https://github.com/${owner}/${cleanRepo}/archive/refs/heads/master.zip`;
        const masterResponse = await fetch(masterUrl);
        if (!masterResponse.ok) {
          return { success: false, error: 'Repository not found or not accessible' };
        }
        return this.extractZip(masterResponse, targetPath, cleanRepo, onProgress);
      }

      return this.extractZip(response, targetPath, cleanRepo, onProgress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  /**
   * Extract ZIP file (browser-based)
   */
  private async extractZip(
    response: Response,
    targetPath: string,
    repoName: string,
    onProgress?: (progress: CloneProgress) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      onProgress?.({ phase: 'cloning', message: 'Extracting files...', percentage: 70 });

      const blob = await response.blob();
      
      // Use JSZip library if available
      if (typeof (window as any).JSZip !== 'undefined') {
        const JSZip = (window as any).JSZip;
        const zip = await JSZip.loadAsync(blob);
        
        // Extract files using File System Access API
        const dirHandle = await (window as any).showDirectoryPicker();
        const repoHandle = await dirHandle.getDirectoryHandle(repoName, { create: true });

        let processed = 0;
        const files = Object.keys(zip.files);
        const total = files.length;

        for (const filename of files) {
          const file = zip.files[filename];
          if (!file.dir) {
            const content = await file.async('blob');
            const pathParts = filename.split('/').slice(1); // Remove root folder
            
            // Create nested directories
            let currentHandle = repoHandle;
            for (let i = 0; i < pathParts.length - 1; i++) {
              currentHandle = await currentHandle.getDirectoryHandle(pathParts[i], { create: true });
            }

            // Write file
            const fileHandle = await currentHandle.getFileHandle(pathParts[pathParts.length - 1], { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
          }

          processed++;
          const percentage = 70 + Math.floor((processed / total) * 30);
          onProgress?.({ phase: 'cloning', message: `Extracting files... ${processed}/${total}`, percentage });
        }

        onProgress?.({ phase: 'complete', message: 'Clone complete!', percentage: 100 });
        return { success: true };
      } else {
        return { success: false, error: 'ZIP extraction not supported in this browser' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Extraction failed'
      };
    }
  }

  /**
   * Clone a GitHub repository
   */
  async cloneRepository(
    repoUrl: string,
    targetDirectory?: string,
    onProgress?: (progress: CloneProgress) => void
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      // Validate URL
      onProgress?.({ phase: 'validating', message: 'Validating repository URL...', percentage: 10 });
      
      const validation = this.validateGitHubUrl(repoUrl);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const repoName = validation.repoName!;

      // Get target directory
      let targetPath = targetDirectory;
      if (!targetPath) {
        if ((window as any).electron) {
          // Use Electron dialog
          targetPath = await (window as any).electron.selectDirectory();
          if (!targetPath) {
            return { success: false, error: 'No directory selected' };
          }
        } else {
          // Use File System Access API
          try {
            const dirHandle = await (window as any).showDirectoryPicker();
            targetPath = dirHandle.name;
          } catch {
            return { success: false, error: 'No directory selected' };
          }
        }
      }

      // Normalize GitHub URL
      const normalizedUrl = repoUrl.trim().replace(/\.git$/, '');
      const httpsUrl = normalizedUrl.startsWith('http') 
        ? normalizedUrl 
        : `https://github.com/${normalizedUrl.replace(/^github\.com\//, '')}`;

      // Clone repository
      let result;
      const fullTargetPath = targetPath ? `${targetPath}/${repoName}` : repoName;
      
      if ((window as any).electron?.gitClone) {
        result = await this.cloneWithElectron(httpsUrl, fullTargetPath, onProgress);
      } else {
        result = await this.cloneWithWeb(httpsUrl, targetPath || '', onProgress);
      }

      if (result.success) {
        notificationService.success(`Successfully cloned ${repoName}`);
        return { success: true, path: fullTargetPath };
      } else {
        notificationService.error(`Clone failed: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Clone failed';
      notificationService.error(`Clone failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Clone and open repository as workspace
   */
  async cloneAndOpen(
    repoUrl: string,
    onProgress?: (progress: CloneProgress) => void
  ): Promise<boolean> {
    const result = await this.cloneRepository(repoUrl, undefined, onProgress);
    
    if (result.success && result.path) {
      await workspaceService.setWorkspace(result.path);
      return true;
    }
    
    return false;
  }
}

// Singleton instance
export const gitCloneService = new GitCloneService();
