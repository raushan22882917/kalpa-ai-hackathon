/**
 * Recent Files Service
 * Manages cache of recently opened files and folders using localStorage
 */

export interface RecentItem {
  path: string;
  type: 'file' | 'folder';
  name: string;
  lastOpened: number;
}

const STORAGE_KEY = 'vscode-web-recent-items';
const MAX_RECENT_ITEMS = 20;

class RecentFilesService {
  private recentItems: RecentItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load recent items from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.recentItems = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load recent items:', error);
      this.recentItems = [];
    }
  }

  /**
   * Save recent items to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.recentItems));
    } catch (error) {
      console.error('Failed to save recent items:', error);
    }
  }

  /**
   * Add a file to recent items
   */
  addFile(path: string): void {
    const name = path.split('/').pop() || path;
    this.addItem({
      path,
      type: 'file',
      name,
      lastOpened: Date.now(),
    });
  }

  /**
   * Add a folder to recent items
   */
  addFolder(path: string): void {
    const name = path.split('/').pop() || path;
    this.addItem({
      path,
      type: 'folder',
      name,
      lastOpened: Date.now(),
    });
  }

  /**
   * Add an item to recent items (internal)
   */
  private addItem(item: RecentItem): void {
    // Remove existing item with same path
    this.recentItems = this.recentItems.filter(i => i.path !== item.path);

    // Add new item at the beginning
    this.recentItems.unshift(item);

    // Keep only MAX_RECENT_ITEMS
    if (this.recentItems.length > MAX_RECENT_ITEMS) {
      this.recentItems = this.recentItems.slice(0, MAX_RECENT_ITEMS);
    }

    this.saveToStorage();
  }

  /**
   * Get all recent items
   */
  getRecentItems(): RecentItem[] {
    return [...this.recentItems];
  }

  /**
   * Get recent files only
   */
  getRecentFiles(): RecentItem[] {
    return this.recentItems.filter(item => item.type === 'file');
  }

  /**
   * Get recent folders only
   */
  getRecentFolders(): RecentItem[] {
    return this.recentItems.filter(item => item.type === 'folder');
  }

  /**
   * Clear all recent items
   */
  clearAll(): void {
    this.recentItems = [];
    this.saveToStorage();
  }

  /**
   * Remove a specific item
   */
  removeItem(path: string): void {
    this.recentItems = this.recentItems.filter(item => item.path !== path);
    this.saveToStorage();
  }

  /**
   * Get the most recent folder
   */
  getMostRecentFolder(): RecentItem | null {
    const folders = this.getRecentFolders();
    return folders.length > 0 ? folders[0] : null;
  }

  /**
   * Get the most recent file
   */
  getMostRecentFile(): RecentItem | null {
    const files = this.getRecentFiles();
    return files.length > 0 ? files[0] : null;
  }
}

export const recentFilesService = new RecentFilesService();
