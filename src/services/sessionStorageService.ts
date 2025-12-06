/**
 * Session Storage Service
 * Manages user sessions, login data, and persistent storage
 */

export interface UserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'email' | 'google' | 'anonymous';
  loginTime: number;
  lastActivity: number;
  sessionId: string;
  deviceInfo: DeviceInfo;
  preferences: UserPreferences;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  fontSize: number;
  editorSettings: Record<string, any>;
  extensions: string[];
  recentFiles: string[];
  workspaceSettings: Record<string, any>;
}

export interface LoginHistory {
  sessionId: string;
  loginTime: number;
  logoutTime?: number;
  ipAddress?: string;
  deviceInfo: DeviceInfo;
  duration?: number;
}

class SessionStorageService {
  private readonly SESSION_KEY = 'vscode_user_session';
  private readonly PREFERENCES_KEY = 'vscode_user_preferences';
  private readonly LOGIN_HISTORY_KEY = 'vscode_login_history';
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get device information
  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  // Create new session
  createSession(user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    provider: 'email' | 'google' | 'anonymous';
  }): UserSession {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    const session: UserSession = {
      ...user,
      loginTime: now,
      lastActivity: now,
      sessionId,
      deviceInfo: this.getDeviceInfo(),
      preferences: this.loadPreferences(user.uid) || this.getDefaultPreferences(),
    };

    // Save session to localStorage
    this.saveSession(session);

    // Add to login history
    this.addToLoginHistory({
      sessionId,
      loginTime: now,
      deviceInfo: session.deviceInfo,
    });

    return session;
  }

  // Save session to localStorage
  saveSession(session: UserSession): void {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  // Load session from localStorage
  loadSession(): UserSession | null {
    try {
      // Try localStorage first (persistent)
      let sessionData = localStorage.getItem(this.SESSION_KEY);
      
      // Fallback to sessionStorage
      if (!sessionData) {
        sessionData = sessionStorage.getItem(this.SESSION_KEY);
      }

      if (!sessionData) {
        return null;
      }

      const session: UserSession = JSON.parse(sessionData);

      // Check if session is expired
      if (this.isSessionExpired(session)) {
        this.clearSession();
        return null;
      }

      // Update last activity
      session.lastActivity = Date.now();
      this.saveSession(session);

      return session;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  }

  // Check if session is expired
  private isSessionExpired(session: UserSession): boolean {
    const now = Date.now();
    return now - session.lastActivity > this.SESSION_TIMEOUT;
  }

  // Update session activity
  updateActivity(): void {
    const session = this.loadSession();
    if (session) {
      session.lastActivity = Date.now();
      this.saveSession(session);
    }
  }

  // Clear session
  clearSession(): void {
    try {
      const session = this.loadSession();
      if (session) {
        // Update login history with logout time
        this.updateLoginHistory(session.sessionId, Date.now());
      }

      localStorage.removeItem(this.SESSION_KEY);
      sessionStorage.removeItem(this.SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  }

  // Save user preferences
  savePreferences(uid: string, preferences: Partial<UserPreferences>): void {
    try {
      const existing = this.loadPreferences(uid) || this.getDefaultPreferences();
      const updated = { ...existing, ...preferences };
      
      const key = `${this.PREFERENCES_KEY}_${uid}`;
      localStorage.setItem(key, JSON.stringify(updated));

      // Update current session
      const session = this.loadSession();
      if (session && session.uid === uid) {
        session.preferences = updated;
        this.saveSession(session);
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  // Load user preferences
  loadPreferences(uid: string): UserPreferences | null {
    try {
      const key = `${this.PREFERENCES_KEY}_${uid}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return null;
    }
  }

  // Get default preferences
  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'dark',
      fontSize: 14,
      editorSettings: {},
      extensions: [],
      recentFiles: [],
      workspaceSettings: {},
    };
  }

  // Add to login history
  private addToLoginHistory(entry: LoginHistory): void {
    try {
      const history = this.getLoginHistory();
      history.push(entry);
      
      // Keep only last 50 entries
      const trimmed = history.slice(-50);
      
      localStorage.setItem(this.LOGIN_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to add to login history:', error);
    }
  }

  // Update login history with logout time
  private updateLoginHistory(sessionId: string, logoutTime: number): void {
    try {
      const history = this.getLoginHistory();
      const entry = history.find(h => h.sessionId === sessionId);
      
      if (entry) {
        entry.logoutTime = logoutTime;
        entry.duration = logoutTime - entry.loginTime;
        localStorage.setItem(this.LOGIN_HISTORY_KEY, JSON.stringify(history));
      }
    } catch (error) {
      console.error('Failed to update login history:', error);
    }
  }

  // Get login history
  getLoginHistory(): LoginHistory[] {
    try {
      const data = localStorage.getItem(this.LOGIN_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get login history:', error);
      return [];
    }
  }

  // Clear all user data
  clearAllUserData(uid: string): void {
    try {
      // Clear session
      this.clearSession();
      
      // Clear preferences
      const key = `${this.PREFERENCES_KEY}_${uid}`;
      localStorage.removeItem(key);
      
      // Clear other user-specific data
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(uid)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  // Export user data (for GDPR compliance)
  exportUserData(uid: string): Record<string, any> {
    return {
      session: this.loadSession(),
      preferences: this.loadPreferences(uid),
      loginHistory: this.getLoginHistory(),
      exportDate: new Date().toISOString(),
    };
  }

  // Get session statistics
  getSessionStats(): {
    totalSessions: number;
    averageDuration: number;
    lastLogin: number | null;
    totalDuration: number;
  } {
    const history = this.getLoginHistory();
    const completedSessions = history.filter(h => h.duration);
    
    const totalDuration = completedSessions.reduce((sum, h) => sum + (h.duration || 0), 0);
    const averageDuration = completedSessions.length > 0 
      ? totalDuration / completedSessions.length 
      : 0;
    
    const lastLogin = history.length > 0 
      ? history[history.length - 1].loginTime 
      : null;

    return {
      totalSessions: history.length,
      averageDuration,
      lastLogin,
      totalDuration,
    };
  }
}

export const sessionStorageService = new SessionStorageService();

// Auto-update activity every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    sessionStorageService.updateActivity();
  }, 5 * 60 * 1000);
}
