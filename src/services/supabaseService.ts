/**
 * Supabase Integration Service
 * Handles Supabase authentication, database operations, and storage
 * Automatically syncs with Firebase authentication
 */

import { notificationService } from './notificationService';
import { authService } from './authService';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  autoConnect?: boolean;
}

export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
}

export interface SupabaseTable {
  name: string;
  schema: string;
}

class SupabaseService {
  private supabaseUrl: string | null = null;
  private supabaseKey: string | null = null;
  private accessToken: string | null = null;
  private autoConnectEnabled: boolean = true;
  private isConnected: boolean = false;
  private connectionListeners: ((connected: boolean) => void)[] = [];

  constructor() {
    // Configuration Priority (similar to Lovable.dev):
    // 1. User's configuration (localStorage) - HIGHEST PRIORITY
    // 2. Environment variables (.env) - Fallback for testing only
    // 
    // Each user connects to their OWN Supabase project for complete data privacy
    const savedConfig = localStorage.getItem('supabase_config');
    if (savedConfig) {
      // User has configured their own Supabase project
      const config = JSON.parse(savedConfig);
      this.supabaseUrl = config.url;
      this.supabaseKey = config.anonKey;
      this.autoConnectEnabled = config.autoConnect !== false;
    } else {
      // Fallback to .env (developer testing only)
      this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || null;
      this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || null;
    }

    this.accessToken = localStorage.getItem('supabase_token');

    // Auto-connect with Firebase auth
    this.setupFirebaseSync();
  }

  // Setup automatic Firebase authentication sync
  private setupFirebaseSync(): void {
    authService.onAuthStateChange(async (user) => {
      if (user && this.autoConnectEnabled && this.isConfigured()) {
        // User signed in with Firebase, auto-connect to Supabase
        await this.autoConnectWithFirebase(user);
      } else if (!user) {
        // User signed out, disconnect from Supabase
        await this.disconnect();
      }
    });
  }

  // Auto-connect to Supabase using Firebase user credentials
  private async autoConnectWithFirebase(firebaseUser: any): Promise<void> {
    try {
      if (!firebaseUser.email) {
        console.warn('Firebase user has no email, skipping Supabase auto-connect');
        return;
      }

      // Skip auto-connect if password grant type is not available
      // This prevents 400 errors when Supabase password auth is not configured
      // Users can manually connect to Supabase if needed
      console.log('Skipping Supabase auto-connect - manual connection required');
      return;

      // Note: The code below is disabled because Supabase password grant type
      // requires the user to exist in Supabase with the correct password.
      // Auto-connecting with Firebase UID as password won't work unless
      // the user was explicitly created in Supabase with that password.
      
      // Try to sign in to Supabase with Firebase email
      // const result = await this.signInOrCreateUser(
      //   firebaseUser.email,
      //   firebaseUser.uid, // Use Firebase UID as password for simplicity
      //   {
      //     firebase_uid: firebaseUser.uid,
      //     display_name: firebaseUser.displayName,
      //     photo_url: firebaseUser.photoURL
      //   }
      // );

      // if (result) {
      //   this.isConnected = true;
      //   this.notifyConnectionListeners(true);
      //   notificationService.success('Connected to Supabase automatically');
      // }
    } catch (error: any) {
      console.error('Auto-connect to Supabase failed:', error);
      // Don't show error notification for auto-connect failures
    }
  }

  // Sign in or create user in Supabase
  // private async _signInOrCreateUser(
  //   email: string,
  //   password: string,
  //   metadata?: Record<string, any>
  // ): Promise<SupabaseUser | null> {
  //   // Try to sign in first
  //   let user = await this.signIn(email, password);
    
  //   if (!user) {
  //     // If sign in fails, try to create the user
  //     user = await this.signUp(email, password, metadata);
  //   }

  //   return user;
  // }

  // Disconnect from Supabase
  private async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.signOut();
      this.isConnected = false;
      this.notifyConnectionListeners(false);
    }
  }

  // Subscribe to connection state changes
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    // Immediately call with current state
    callback(this.isConnected);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  // Notify connection listeners
  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  // Check if connected
  isUserConnected(): boolean {
    return this.isConnected;
  }

  // Configure Supabase
  configure(config: SupabaseConfig): void {
    this.supabaseUrl = config.url;
    this.supabaseKey = config.anonKey;
    this.autoConnectEnabled = config.autoConnect !== false;
    
    const configToSave = {
      url: config.url,
      anonKey: config.anonKey,
      autoConnect: this.autoConnectEnabled
    };
    
    localStorage.setItem('supabase_config', JSON.stringify(configToSave));
    notificationService.success('Supabase configured successfully');

    // If user is already signed in with Firebase, auto-connect
    const firebaseUser = authService.getCurrentUser();
    if (firebaseUser && this.autoConnectEnabled) {
      this.autoConnectWithFirebase(firebaseUser);
    }
  }

  // Get current configuration
  getConfig(): SupabaseConfig | null {
    if (!this.supabaseUrl || !this.supabaseKey) return null;
    
    return {
      url: this.supabaseUrl,
      anonKey: this.supabaseKey,
      autoConnect: this.autoConnectEnabled
    };
  }

  // Enable/disable auto-connect
  setAutoConnect(enabled: boolean): void {
    this.autoConnectEnabled = enabled;
    const config = this.getConfig();
    if (config) {
      config.autoConnect = enabled;
      localStorage.setItem('supabase_config', JSON.stringify(config));
    }
  }

  // Check if configured
  isConfigured(): boolean {
    return !!(this.supabaseUrl && this.supabaseKey);
  }

  // Sign up with email
  async signUp(email: string, password: string, metadata?: Record<string, any>): Promise<SupabaseUser | null> {
    if (!this.isConfigured()) {
      console.warn('Supabase not configured');
      return null;
    }

    try {
      const response = await this.makeAuthRequest('/auth/v1/signup', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          data: metadata
        })
      });

      if (response.access_token) {
        this.setAccessToken(response.access_token);
        this.isConnected = true;
        this.notifyConnectionListeners(true);
      }

      return response.user;
    } catch (error: any) {
      console.error('Supabase sign up failed:', error);
      return null;
    }
  }

  // Sign in with email
  async signIn(email: string, password: string): Promise<SupabaseUser | null> {
    if (!this.isConfigured()) {
      console.warn('Supabase not configured');
      return null;
    }

    try {
      const response = await this.makeAuthRequest('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        })
      });

      if (response.access_token) {
        this.setAccessToken(response.access_token);
        this.isConnected = true;
        this.notifyConnectionListeners(true);
      }

      return response.user;
    } catch (error: any) {
      // Check if it's a 400 error (bad request) - likely means user doesn't exist or password is wrong
      if (error.message && error.message.includes('400')) {
        console.warn('Supabase sign in failed: Invalid credentials or user does not exist');
      } else {
        console.error('Supabase sign in failed:', error);
      }
      return null;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    if (!this.accessToken) return;

    try {
      await this.makeAuthRequest('/auth/v1/logout', {
        method: 'POST'
      });

      this.accessToken = null;
      this.isConnected = false;
      localStorage.removeItem('supabase_token');
      this.notifyConnectionListeners(false);
    } catch (error: any) {
      console.error('Supabase sign out failed:', error);
    }
  }

  // Get current user
  async getCurrentUser(): Promise<SupabaseUser | null> {
    if (!this.accessToken) return null;

    try {
      const response = await this.makeAuthRequest('/auth/v1/user');
      return response as SupabaseUser;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // Set access token
  private setAccessToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem('supabase_token', token);
  }

  // Query data from table
  async query(table: string, options: {
    select?: string;
    filter?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  } = {}): Promise<any[]> {
    if (!this.isConfigured()) {
      notificationService.error('Supabase not configured');
      return [];
    }

    try {
      // Remove schema prefix if present (e.g., "public.table_name" -> "table_name")
      const tableName = table.includes('.') ? table.split('.').pop() : table;
      
      let url = `/rest/v1/${tableName}`;
      const params = new URLSearchParams();

      // Default to selecting all columns if not specified
      if (options.select) {
        params.append('select', options.select);
      } else {
        params.append('select', '*');
      }

      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          params.append(key, `eq.${value}`);
        });
      }

      if (options.order) {
        params.append('order', `${options.order.column}.${options.order.ascending ? 'asc' : 'desc'}`);
      }

      // Default limit to prevent huge responses
      if (options.limit) {
        params.append('limit', options.limit.toString());
      } else {
        params.append('limit', '100');
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await this.makeRestRequest(url);
      
      if (response && response.length > 0) {
        notificationService.success(`Found ${response.length} rows in ${tableName}`);
      } else {
        notificationService.info(`Table ${tableName} is empty`);
      }
      
      return response;
    } catch (error: any) {
      // Provide more helpful error messages
      let errorMsg = error.message;
      
      if (errorMsg.includes('schema cache')) {
        errorMsg = 'Table not found or schema cache needs refresh. Try reloading the page or check if the table exists.';
      } else if (errorMsg.includes('permission denied')) {
        errorMsg = 'Permission denied. Check Row Level Security policies for this table.';
      } else if (errorMsg.includes('relation') && errorMsg.includes('does not exist')) {
        errorMsg = 'Table does not exist in the database.';
      }
      
      notificationService.error(`Query failed: ${errorMsg}`);
      console.error('Query error details:', error);
      return [];
    }
  }

  // Insert data into table
  async insert(table: string, data: Record<string, any> | Record<string, any>[]): Promise<any> {
    if (!this.isConfigured()) {
      notificationService.error('Supabase not configured');
      return null;
    }

    try {
      const response = await this.makeRestRequest(`/rest/v1/${table}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      notificationService.success('Data inserted successfully');
      return response;
    } catch (error: any) {
      notificationService.error(`Insert failed: ${error.message}`);
      return null;
    }
  }

  // Update data in table
  async update(table: string, data: Record<string, any>, filter: Record<string, any>): Promise<any> {
    if (!this.isConfigured()) {
      notificationService.error('Supabase not configured');
      return null;
    }

    try {
      let url = `/rest/v1/${table}`;
      const params = new URLSearchParams();

      Object.entries(filter).forEach(([key, value]) => {
        params.append(key, `eq.${value}`);
      });

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await this.makeRestRequest(url, {
        method: 'PATCH',
        body: JSON.stringify(data)
      });

      notificationService.success('Data updated successfully');
      return response;
    } catch (error: any) {
      notificationService.error(`Update failed: ${error.message}`);
      return null;
    }
  }

  // Delete data from table
  async delete(table: string, filter: Record<string, any>): Promise<boolean> {
    if (!this.isConfigured()) {
      notificationService.error('Supabase not configured');
      return false;
    }

    try {
      let url = `/rest/v1/${table}`;
      const params = new URLSearchParams();

      Object.entries(filter).forEach(([key, value]) => {
        params.append(key, `eq.${value}`);
      });

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      await this.makeRestRequest(url, {
        method: 'DELETE'
      });

      notificationService.success('Data deleted successfully');
      return true;
    } catch (error: any) {
      notificationService.error(`Delete failed: ${error.message}`);
      return false;
    }
  }

  // Upload file to storage
  async uploadFile(bucket: string, path: string, file: File): Promise<string | null> {
    if (!this.isConfigured()) {
      notificationService.error('Supabase not configured');
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken || this.supabaseKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const publicUrl = `${this.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
      notificationService.success('File uploaded successfully');
      return publicUrl;
    } catch (error: any) {
      notificationService.error(`Upload failed: ${error.message}`);
      return null;
    }
  }

  // Make auth request
  private async makeAuthRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers: HeadersInit = {
      'apikey': this.supabaseKey!,
      'Content-Type': 'application/json',
      ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` })
    };

    const response = await fetch(`${this.supabaseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error_description || error.error || response.statusText;
        // Include status code in error message for better debugging
        errorMessage = `[${response.status}] ${errorMessage}`;
      } catch {
        errorMessage = `[${response.status}] ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Make REST API request
  private async makeRestRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers: HeadersInit = {
      'apikey': this.supabaseKey!,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` })
    };

    const response = await fetch(`${this.supabaseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }
}

export const supabaseService = new SupabaseService();
