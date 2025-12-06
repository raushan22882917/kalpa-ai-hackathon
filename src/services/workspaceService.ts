/**
 * Workspace Service
 * Manages workspace selection, persistence, and recent projects
 */

import { nativeFileSystem } from './nativeFileSystemService';
import { notificationService } from './notificationService';
import { workspaceDataService } from './workspaceDataService';

export interface WorkspaceProject {
  name: string;
  path: string;
  lastOpened: number;
}

class WorkspaceService {
  private currentWorkspace: string | null = null;
  private readonly WORKSPACE_KEY = 'workspace_path';
  private readonly RECENT_PROJECTS_KEY = 'recent_projects';
  private readonly MAX_RECENT_PROJECTS = 10;

  constructor() {
    this.loadWorkspace();
  }

  /**
   * Load workspace from localStorage
   */
  private loadWorkspace(): void {
    const stored = localStorage.getItem(this.WORKSPACE_KEY);
    if (stored) {
      this.currentWorkspace = stored;
    }
  }

  /**
   * Get current workspace path
   */
  getCurrentWorkspace(): string | null {
    return this.currentWorkspace;
  }

  /**
   * Check if a workspace is currently open
   */
  hasWorkspace(): boolean {
    return this.currentWorkspace !== null;
  }

  /**
   * Open a workspace folder
   */
  async openWorkspace(): Promise<boolean> {
    try {
      const result = await nativeFileSystem.openWorkspace();
      
      if (result.success && result.data) {
        this.currentWorkspace = result.data;
        localStorage.setItem(this.WORKSPACE_KEY, result.data);
        
        // Add to recent projects
        await this.addToRecentProjects(result.data);
        
        // Detect folder contents
        const folderInfo = await this.detectFolderContents(result.data);
        
        // Show notification with folder info
        const folderName = this.getWorkspaceName();
        if (folderInfo.isEmpty) {
          notificationService.info(`Opened empty folder: ${folderName}`);
        } else {
          notificationService.success(
            `Opened workspace: ${folderName} (${folderInfo.fileCount} files, ${folderInfo.folderCount} folders)`
          );
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      notificationService.error('Failed to open workspace');
      console.error('Error opening workspace:', error);
      return false;
    }
  }

  /**
   * Detect folder contents
   */
  private async detectFolderContents(path: string): Promise<{
    isEmpty: boolean;
    fileCount: number;
    folderCount: number;
    hasGit: boolean;
    hasNodeModules: boolean;
    hasPackageJson: boolean;
  }> {
    try {
      const result = await nativeFileSystem.readDirectory(path);
      
      if (!result.success || !result.data) {
        return {
          isEmpty: true,
          fileCount: 0,
          folderCount: 0,
          hasGit: false,
          hasNodeModules: false,
          hasPackageJson: false
        };
      }

      const files = result.data;
      const fileCount = files.filter(f => f.type === 'file').length;
      const folderCount = files.filter(f => f.type === 'directory').length;
      const hasGit = files.some(f => f.name === '.git');
      const hasNodeModules = files.some(f => f.name === 'node_modules');
      const hasPackageJson = files.some(f => f.name === 'package.json');

      return {
        isEmpty: files.length === 0,
        fileCount,
        folderCount,
        hasGit,
        hasNodeModules,
        hasPackageJson
      };
    } catch (error) {
      console.error('Error detecting folder contents:', error);
      return {
        isEmpty: true,
        fileCount: 0,
        folderCount: 0,
        hasGit: false,
        hasNodeModules: false,
        hasPackageJson: false
      };
    }
  }

  /**
   * Set workspace from a path (e.g., from recent projects)
   */
  async setWorkspace(path: string): Promise<void> {
    this.currentWorkspace = path;
    localStorage.setItem(this.WORKSPACE_KEY, path);
    await this.addToRecentProjects(path);
  }

  /**
   * Close current workspace
   */
  closeWorkspace(): void {
    this.currentWorkspace = null;
    localStorage.removeItem(this.WORKSPACE_KEY);
  }

  /**
   * Get workspace name (last segment of path)
   */
  getWorkspaceName(): string {
    if (!this.currentWorkspace) return '';
    return this.currentWorkspace.split('/').pop() || this.currentWorkspace;
  }

  /**
   * Add a project to recent projects list
   */
  private async addToRecentProjects(path: string): Promise<void> {
    const name = path.split('/').pop() || path;
    const workspaceData = {
      path,
      name,
      lastOpened: Date.now()
    };
    
    // Save to IndexedDB
    try {
      await workspaceDataService.saveWorkspace(workspaceData);
    } catch (error) {
      console.error('Failed to save workspace to IndexedDB:', error);
    }
    
    // Also save to localStorage for quick access
    const projects = this.getRecentProjects();
    const filtered = projects.filter(p => p.path !== path);
    const updated: WorkspaceProject[] = [
      workspaceData,
      ...filtered
    ].slice(0, this.MAX_RECENT_PROJECTS);
    
    localStorage.setItem(this.RECENT_PROJECTS_KEY, JSON.stringify(updated));
  }

  /**
   * Get recent projects list
   */
  getRecentProjects(): WorkspaceProject[] {
    const stored = localStorage.getItem(this.RECENT_PROJECTS_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * Remove a project from recent projects
   */
  removeFromRecentProjects(path: string): void {
    const projects = this.getRecentProjects();
    const filtered = projects.filter(p => p.path !== path);
    localStorage.setItem(this.RECENT_PROJECTS_KEY, JSON.stringify(filtered));
  }

  /**
   * Clear all recent projects
   */
  clearRecentProjects(): void {
    localStorage.removeItem(this.RECENT_PROJECTS_KEY);
  }

  /**
   * Check if native file system is available
   */
  isNativeFileSystemAvailable(): boolean {
    return nativeFileSystem.isAvailable();
  }
}

// Singleton instance
export const workspaceService = new WorkspaceService();
