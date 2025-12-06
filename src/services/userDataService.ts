/**
 * User Data Service
 * Manages all user data storage across Firebase, Supabase, and localStorage
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { sessionStorageService, type UserPreferences } from './sessionStorageService';

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  updatedAt: number;
  lastLogin: number;
  preferences: UserPreferences;
  extensions: string[];
  projects: ProjectData[];
  recentFiles: RecentFile[];
  workspaces: WorkspaceData[];
}

export interface ProjectData {
  id: string;
  name: string;
  path: string;
  lastOpened: number;
  settings: Record<string, any>;
}

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: number;
  projectId?: string;
}

export interface WorkspaceData {
  id: string;
  name: string;
  folders: string[];
  settings: Record<string, any>;
  lastOpened: number;
}

class UserDataService {
  // Save complete user data to Firebase
  async saveUserData(uid: string, data: Partial<UserData>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      const updates = {
        ...data,
        updatedAt: Date.now(),
      };
      
      await setDoc(userRef, updates, { merge: true });
    } catch (error) {
      console.error('Failed to save user data to Firebase:', error);
      throw error;
    }
  }

  // Load complete user data from Firebase
  async loadUserData(uid: string): Promise<UserData | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as UserData;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load user data from Firebase:', error);
      return null;
    }
  }

  // Initialize user data on first login
  async initializeUserData(user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }): Promise<void> {
    try {
      const existing = await this.loadUserData(user.uid);
      
      if (!existing) {
        const userData: UserData = {
          ...user,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastLogin: Date.now(),
          preferences: sessionStorageService.loadPreferences(user.uid) || {
            theme: 'dark',
            fontSize: 14,
            editorSettings: {},
            extensions: [],
            recentFiles: [],
            workspaceSettings: {},
          },
          extensions: [],
          projects: [],
          recentFiles: [],
          workspaces: [],
        };
        
        await this.saveUserData(user.uid, userData);
      } else {
        // Update last login
        await this.updateLastLogin(user.uid);
      }
    } catch (error) {
      console.error('Failed to initialize user data:', error);
    }
  }

  // Update last login time
  async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.saveUserData(uid, {
        lastLogin: Date.now(),
      });
    } catch (error) {
      console.error('Failed to update last login:', error);
    }
  }

  // Save user preferences
  async savePreferences(uid: string, preferences: Partial<UserPreferences>): Promise<void> {
    try {
      // Save to localStorage
      sessionStorageService.savePreferences(uid, preferences);
      
      // Save to Firebase
      await this.saveUserData(uid, { preferences: preferences as UserPreferences });
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  // Load user preferences
  async loadPreferences(uid: string): Promise<UserPreferences | null> {
    try {
      // Try localStorage first (faster)
      const local = sessionStorageService.loadPreferences(uid);
      if (local) {
        return local;
      }
      
      // Fallback to Firebase
      const userData = await this.loadUserData(uid);
      return userData?.preferences || null;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return null;
    }
  }

  // Save user extensions
  async saveExtensions(uid: string, extensions: string[]): Promise<void> {
    try {
      await this.saveUserData(uid, { extensions });
      
      // Also update in session
      const session = sessionStorageService.loadSession();
      if (session && session.uid === uid) {
        session.preferences.extensions = extensions;
        sessionStorageService.saveSession(session);
      }
    } catch (error) {
      console.error('Failed to save extensions:', error);
    }
  }

  // Load user extensions
  async loadExtensions(uid: string): Promise<string[]> {
    try {
      const userData = await this.loadUserData(uid);
      return userData?.extensions || [];
    } catch (error) {
      console.error('Failed to load extensions:', error);
      return [];
    }
  }

  // Add recent file
  async addRecentFile(uid: string, file: RecentFile): Promise<void> {
    try {
      const userData = await this.loadUserData(uid);
      if (!userData) return;
      
      const recentFiles = userData.recentFiles || [];
      
      // Remove if already exists
      const filtered = recentFiles.filter(f => f.path !== file.path);
      
      // Add to beginning
      filtered.unshift(file);
      
      // Keep only last 50
      const trimmed = filtered.slice(0, 50);
      
      await this.saveUserData(uid, { recentFiles: trimmed });
    } catch (error) {
      console.error('Failed to add recent file:', error);
    }
  }

  // Get recent files
  async getRecentFiles(uid: string, limit: number = 10): Promise<RecentFile[]> {
    try {
      const userData = await this.loadUserData(uid);
      return (userData?.recentFiles || []).slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent files:', error);
      return [];
    }
  }

  // Save project
  async saveProject(uid: string, project: ProjectData): Promise<void> {
    try {
      const userData = await this.loadUserData(uid);
      if (!userData) return;
      
      const projects = userData.projects || [];
      const index = projects.findIndex(p => p.id === project.id);
      
      if (index >= 0) {
        projects[index] = project;
      } else {
        projects.push(project);
      }
      
      await this.saveUserData(uid, { projects });
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  }

  // Get projects
  async getProjects(uid: string): Promise<ProjectData[]> {
    try {
      const userData = await this.loadUserData(uid);
      return userData?.projects || [];
    } catch (error) {
      console.error('Failed to get projects:', error);
      return [];
    }
  }

  // Save workspace
  async saveWorkspace(uid: string, workspace: WorkspaceData): Promise<void> {
    try {
      const userData = await this.loadUserData(uid);
      if (!userData) return;
      
      const workspaces = userData.workspaces || [];
      const index = workspaces.findIndex(w => w.id === workspace.id);
      
      if (index >= 0) {
        workspaces[index] = workspace;
      } else {
        workspaces.push(workspace);
      }
      
      await this.saveUserData(uid, { workspaces });
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  }

  // Get workspaces
  async getWorkspaces(uid: string): Promise<WorkspaceData[]> {
    try {
      const userData = await this.loadUserData(uid);
      return userData?.workspaces || [];
    } catch (error) {
      console.error('Failed to get workspaces:', error);
      return [];
    }
  }

  // Sync local data to cloud
  async syncToCloud(uid: string): Promise<void> {
    try {
      const session = sessionStorageService.loadSession();
      if (!session || session.uid !== uid) return;
      
      // Sync preferences
      await this.savePreferences(uid, session.preferences);
      
      // Sync extensions
      await this.saveExtensions(uid, session.preferences.extensions);
    } catch (error) {
      console.error('Failed to sync to cloud:', error);
    }
  }

  // Sync cloud data to local
  async syncFromCloud(uid: string): Promise<void> {
    try {
      const userData = await this.loadUserData(uid);
      if (!userData) return;
      
      // Sync preferences to localStorage
      sessionStorageService.savePreferences(uid, userData.preferences);
      
      // Update session
      const session = sessionStorageService.loadSession();
      if (session && session.uid === uid) {
        session.preferences = userData.preferences;
        sessionStorageService.saveSession(session);
      }
    } catch (error) {
      console.error('Failed to sync from cloud:', error);
    }
  }

  // Export all user data (GDPR compliance)
  async exportAllData(uid: string): Promise<Record<string, any>> {
    try {
      const cloudData = await this.loadUserData(uid);
      const localData = sessionStorageService.exportUserData(uid);
      const sessionStats = sessionStorageService.getSessionStats();
      
      return {
        cloudData,
        localData,
        sessionStats,
        exportDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to export user data:', error);
      return {};
    }
  }

  // Delete all user data (GDPR compliance)
  async deleteAllData(uid: string): Promise<void> {
    try {
      // Delete from Firebase
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { deleted: true, deletedAt: Date.now() });
      
      // Clear local data
      sessionStorageService.clearAllUserData(uid);
    } catch (error) {
      console.error('Failed to delete user data:', error);
      throw error;
    }
  }
}

export const userDataService = new UserDataService();
