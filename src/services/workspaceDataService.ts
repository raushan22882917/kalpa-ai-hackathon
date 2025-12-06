/**
 * Workspace Data Service
 * Manages workspace-specific data storage using IndexedDB
 * Similar to VS Code's workspace storage
 */

interface WorkspaceData {
  path: string;
  name: string;
  lastOpened: number;
  settings?: Record<string, any>;
  openFiles?: string[];
  expandedFolders?: string[];
}

class WorkspaceDataService {
  private dbName = 'KalpaWorkspaceDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create workspaces store
        if (!db.objectStoreNames.contains('workspaces')) {
          const workspaceStore = db.createObjectStore('workspaces', { keyPath: 'path' });
          workspaceStore.createIndex('lastOpened', 'lastOpened', { unique: false });
        }

        // Create workspace files store (for caching file contents)
        if (!db.objectStoreNames.contains('workspaceFiles')) {
          const filesStore = db.createObjectStore('workspaceFiles', { keyPath: ['workspacePath', 'filePath'] });
          filesStore.createIndex('workspacePath', 'workspacePath', { unique: false });
        }
      };
    });
  }

  /**
   * Save workspace data
   */
  async saveWorkspace(data: WorkspaceData): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['workspaces'], 'readwrite');
      const store = transaction.objectStore('workspaces');
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get workspace data
   */
  async getWorkspace(path: string): Promise<WorkspaceData | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['workspaces'], 'readonly');
      const store = transaction.objectStore('workspaces');
      const request = store.get(path);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all workspaces sorted by last opened
   */
  async getAllWorkspaces(): Promise<WorkspaceData[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['workspaces'], 'readonly');
      const store = transaction.objectStore('workspaces');
      const index = store.index('lastOpened');
      const request = index.openCursor(null, 'prev'); // Sort descending

      const workspaces: WorkspaceData[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          workspaces.push(cursor.value);
          cursor.continue();
        } else {
          resolve(workspaces);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete workspace data
   */
  async deleteWorkspace(path: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['workspaces'], 'readwrite');
      const store = transaction.objectStore('workspaces');
      const request = store.delete(path);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save file content for a workspace (caching)
   */
  async saveWorkspaceFile(workspacePath: string, filePath: string, content: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['workspaceFiles'], 'readwrite');
      const store = transaction.objectStore('workspaceFiles');
      const request = store.put({
        workspacePath,
        filePath,
        content,
        lastModified: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached file content
   */
  async getWorkspaceFile(workspacePath: string, filePath: string): Promise<string | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['workspaceFiles'], 'readonly');
      const store = transaction.objectStore('workspaceFiles');
      const request = store.get([workspacePath, filePath]);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.content : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cached files for a workspace
   */
  async clearWorkspaceFiles(workspacePath: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['workspaceFiles'], 'readwrite');
      const store = transaction.objectStore('workspaceFiles');
      const index = store.index('workspacePath');
      const request = index.openCursor(IDBKeyRange.only(workspacePath));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const workspaceDataService = new WorkspaceDataService();
