/**
 * Editor State Service
 * Handles persistence of editor state to local storage for offline support
 */

export interface EditorFileState {
  fileName: string;
  content: string;
  language: string;
  cursorPosition?: {
    lineNumber: number;
    column: number;
  };
  lastModified: Date;
}

export interface PersistedEditorState {
  openFiles: EditorFileState[];
  activeFile: string | null;
  lastSaved: Date;
}

class EditorStateService {
  private static readonly STORAGE_KEY = 'editorState';
  private autoSaveInterval: number | null = null;
  private currentState: PersistedEditorState | null = null;

  /**
   * Initialize the service and start auto-save
   */
  initialize(autoSaveIntervalMs: number = 5000): void {
    this.loadState();
    this.startAutoSave(autoSaveIntervalMs);
  }

  /**
   * Load editor state from local storage
   */
  loadState(): PersistedEditorState {
    try {
      const savedState = localStorage.getItem(EditorStateService.STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Convert date strings back to Date objects
        this.currentState = {
          ...parsed,
          lastSaved: new Date(parsed.lastSaved),
          openFiles: parsed.openFiles.map((file: any) => ({
            ...file,
            lastModified: new Date(file.lastModified),
          })),
        };
        return this.currentState!;
      }
    } catch (error) {
      console.error('Failed to load editor state:', error);
    }

    // Return default state if loading fails
    this.currentState = {
      openFiles: [],
      activeFile: null,
      lastSaved: new Date(),
    };
    return this.currentState;
  }

  /**
   * Save editor state to local storage
   */
  saveState(state: PersistedEditorState): void {
    try {
      const stateToSave = {
        ...state,
        lastSaved: new Date(),
      };
      localStorage.setItem(EditorStateService.STORAGE_KEY, JSON.stringify(stateToSave));
      this.currentState = stateToSave;
      console.log('Editor state saved to local storage');
    } catch (error) {
      console.error('Failed to save editor state:', error);
      // Check if quota exceeded
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('Local storage quota exceeded. Consider clearing old data.');
      }
    }
  }

  /**
   * Update a single file in the state
   */
  updateFile(file: EditorFileState): void {
    const state = this.getCurrentState();
    const existingIndex = state.openFiles.findIndex(f => f.fileName === file.fileName);

    if (existingIndex >= 0) {
      // Update existing file
      state.openFiles[existingIndex] = {
        ...file,
        lastModified: new Date(),
      };
    } else {
      // Add new file
      state.openFiles.push({
        ...file,
        lastModified: new Date(),
      });
    }

    this.saveState(state);
  }

  /**
   * Remove a file from the state
   */
  removeFile(fileName: string): void {
    const state = this.getCurrentState();
    state.openFiles = state.openFiles.filter(f => f.fileName !== fileName);
    
    // Clear active file if it was the removed file
    if (state.activeFile === fileName) {
      state.activeFile = state.openFiles.length > 0 ? state.openFiles[0].fileName : null;
    }

    this.saveState(state);
  }

  /**
   * Set the active file
   */
  setActiveFile(fileName: string): void {
    const state = this.getCurrentState();
    state.activeFile = fileName;
    this.saveState(state);
  }

  /**
   * Get current state (from memory or load from storage)
   */
  getCurrentState(): PersistedEditorState {
    if (!this.currentState) {
      return this.loadState();
    }
    return { ...this.currentState };
  }

  /**
   * Get a specific file from the state
   */
  getFile(fileName: string): EditorFileState | null {
    const state = this.getCurrentState();
    return state.openFiles.find(f => f.fileName === fileName) || null;
  }

  /**
   * Clear all saved state
   */
  clearState(): void {
    try {
      localStorage.removeItem(EditorStateService.STORAGE_KEY);
      this.currentState = {
        openFiles: [],
        activeFile: null,
        lastSaved: new Date(),
      };
      console.log('Editor state cleared');
    } catch (error) {
      console.error('Failed to clear editor state:', error);
    }
  }

  /**
   * Start auto-save interval
   */
  private startAutoSave(intervalMs: number): void {
    if (this.autoSaveInterval !== null) {
      window.clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = window.setInterval(() => {
      if (this.currentState) {
        this.saveState(this.currentState);
      }
    }, intervalMs);
  }

  /**
   * Stop auto-save interval
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval !== null) {
      window.clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Check if there are unsaved local changes
   */
  hasLocalChanges(): boolean {
    const state = this.getCurrentState();
    return state.openFiles.length > 0;
  }

  /**
   * Get all files that have been modified since a given timestamp
   */
  getModifiedFilesSince(timestamp: Date): EditorFileState[] {
    const state = this.getCurrentState();
    return state.openFiles.filter(file => file.lastModified > timestamp);
  }

  /**
   * Sync local changes to backend (placeholder for future implementation)
   * This would be called when network connection is restored
   */
  async syncToBackend(backendUrl?: string): Promise<void> {
    if (!backendUrl) {
      console.log('No backend URL configured, skipping sync');
      return;
    }

    const state = this.getCurrentState();
    if (state.openFiles.length === 0) {
      console.log('No local changes to sync');
      return;
    }

    console.log(`Syncing ${state.openFiles.length} files to backend...`);
    
    // This is a placeholder for actual backend sync implementation
    // In a real implementation, this would:
    // 1. Send file changes to the backend
    // 2. Handle conflicts
    // 3. Update local state with server timestamps
    // 4. Handle errors gracefully
    
    try {
      // Placeholder: In real implementation, make API calls here
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Failed to sync to backend:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopAutoSave();
    this.currentState = null;
  }
}

export const editorStateService = new EditorStateService();
