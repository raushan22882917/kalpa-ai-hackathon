/**
 * Supabase Project Manager
 * Manages multiple Supabase projects per user
 * Stores user's project configurations in central Supabase
 */

import { supabaseService } from './supabaseService';
import { notificationService } from './notificationService';
import { authService } from './authService';

export interface SupabaseProject {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  project_url: string;
  anon_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseProjectInput {
  name: string;
  description?: string;
  project_url: string;
  anon_key: string;
}

class SupabaseProjectManager {
  private currentProject: SupabaseProject | null = null;
  private projects: SupabaseProject[] = [];
  private listeners: ((projects: SupabaseProject[]) => void)[] = [];

  constructor() {
    // Load active project from localStorage
    const savedProject = localStorage.getItem('active_supabase_project');
    if (savedProject) {
      try {
        this.currentProject = JSON.parse(savedProject);
      } catch (error) {
        console.error('Failed to load active project:', error);
      }
    }

    // Listen for auth changes
    authService.onAuthStateChange((user) => {
      if (user) {
        this.loadUserProjects();
      } else {
        this.clearProjects();
      }
    });
  }

  /**
   * Fetch user's Supabase projects from Supabase dashboard
   * This uses Supabase Management API
   */
  async fetchSupabaseProjects(accessToken: string): Promise<any[]> {
    try {
      const response = await fetch('https://api.supabase.com/v1/projects', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Supabase projects');
      }

      const projects = await response.json();
      return projects;
    } catch (error: any) {
      console.error('Failed to fetch Supabase projects:', error);
      notificationService.error('Failed to fetch your Supabase projects');
      return [];
    }
  }

  /**
   * Import a Supabase project from user's dashboard
   */
  async importSupabaseProject(
    supabaseAccessToken: string,
    projectId: string
  ): Promise<SupabaseProject | null> {
    try {
      // Fetch project details from Supabase API
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${supabaseAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project details');
      }

      const projectData = await response.json();

      // Get API keys
      const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${projectId}/api-keys`, {
        headers: {
          'Authorization': `Bearer ${supabaseAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!keysResponse.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const keys = await keysResponse.json();
      const anonKey = keys.find((k: any) => k.name === 'anon')?.api_key;

      if (!anonKey) {
        throw new Error('Anon key not found');
      }

      // Save to central Supabase
      const project = await this.addProject({
        name: projectData.name,
        description: projectData.region,
        project_url: `https://${projectData.ref}.supabase.co`,
        anon_key: anonKey
      });

      notificationService.success(`Project "${projectData.name}" imported successfully!`);
      return project;
    } catch (error: any) {
      console.error('Failed to import project:', error);
      notificationService.error(`Failed to import project: ${error.message}`);
      return null;
    }
  }

  /**
   * Add a new Supabase project configuration
   */
  async addProject(input: SupabaseProjectInput): Promise<SupabaseProject | null> {
    const user = authService.getCurrentUser();
    if (!user) {
      notificationService.error('Please sign in first');
      return null;
    }

    // Check if central Supabase is configured
    const centralUrl = import.meta.env.VITE_SUPABASE_URL;
    const centralKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!centralUrl || !centralKey) {
      console.error('Central Supabase not configured in .env');
      notificationService.error('Central Supabase not configured. Please check your .env file.');
      return null;
    }

    try {
      // Save to central Supabase (YOUR Supabase)
      const centralSupabase = this.getCentralSupabaseClient();
      
      const projectData = {
        user_id: user.uid,
        name: input.name,
        description: input.description || '',
        project_url: input.project_url,
        anon_key: input.anon_key,
        is_active: this.projects.length === 0, // First project is active by default
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Attempting to insert project:', { ...projectData, anon_key: '***' });

      const result = await centralSupabase.insert('supabase_projects', projectData);

      if (result && result.length > 0) {
        const newProject = result[0] as SupabaseProject;
        this.projects.push(newProject);
        
        if (newProject.is_active) {
          await this.setActiveProject(newProject.id);
        }
        
        this.notifyListeners();
        notificationService.success('Project added successfully!');
        return newProject;
      }

      notificationService.error('Failed to add project: No data returned');
      return null;
    } catch (error: any) {
      console.error('Failed to add project:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to add project';
      
      if (error.message.includes('relation "supabase_projects" does not exist')) {
        errorMessage = 'Database table not found. Please run the SQL schema in your Supabase dashboard.';
      } else if (error.message.includes('permission denied')) {
        errorMessage = 'Permission denied. Please check Row Level Security policies.';
      } else if (error.message.includes('duplicate key')) {
        errorMessage = 'A project with this name already exists.';
      } else if (error.message) {
        errorMessage = `Failed to add project: ${error.message}`;
      }
      
      notificationService.error(errorMessage);
      return null;
    }
  }

  /**
   * Load user's projects from central Supabase
   */
  async loadUserProjects(): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) return;

    try {
      const centralSupabase = this.getCentralSupabaseClient();
      
      const projects = await centralSupabase.query('supabase_projects', {
        filter: { user_id: user.uid },
        order: { column: 'created_at', ascending: false }
      });

      this.projects = projects as SupabaseProject[];
      
      // Find and set active project
      const activeProject = this.projects.find(p => p.is_active);
      if (activeProject) {
        this.currentProject = activeProject;
        localStorage.setItem('active_supabase_project', JSON.stringify(activeProject));
        
        // Configure supabaseService with active project
        supabaseService.configure({
          url: activeProject.project_url,
          anonKey: activeProject.anon_key,
          autoConnect: true
        });
      }
      
      this.notifyListeners();
    } catch (error: any) {
      console.error('Failed to load projects:', error);
    }
  }

  /**
   * Set active project
   */
  async setActiveProject(projectId: string): Promise<void> {
    const project = this.projects.find(p => p.id === projectId);
    if (!project) {
      notificationService.error('Project not found');
      return;
    }

    try {
      const centralSupabase = this.getCentralSupabaseClient();
      const user = authService.getCurrentUser();
      if (!user) return;

      // Deactivate all projects
      await centralSupabase.update(
        'supabase_projects',
        { is_active: false },
        { user_id: user.uid }
      );

      // Activate selected project
      await centralSupabase.update(
        'supabase_projects',
        { is_active: true, updated_at: new Date().toISOString() },
        { id: projectId }
      );

      // Update local state
      this.projects.forEach(p => p.is_active = false);
      project.is_active = true;
      this.currentProject = project;
      
      localStorage.setItem('active_supabase_project', JSON.stringify(project));

      // Configure supabaseService
      supabaseService.configure({
        url: project.project_url,
        anonKey: project.anon_key,
        autoConnect: true
      });

      this.notifyListeners();
      notificationService.success(`Switched to project: ${project.name}`);
    } catch (error: any) {
      console.error('Failed to set active project:', error);
      notificationService.error('Failed to switch project');
    }
  }

  /**
   * Update project
   */
  async updateProject(projectId: string, updates: Partial<SupabaseProjectInput>): Promise<void> {
    try {
      const centralSupabase = this.getCentralSupabaseClient();
      
      await centralSupabase.update(
        'supabase_projects',
        { ...updates, updated_at: new Date().toISOString() },
        { id: projectId }
      );

      // Update local state
      const project = this.projects.find(p => p.id === projectId);
      if (project) {
        Object.assign(project, updates);
        
        if (this.currentProject?.id === projectId) {
          this.currentProject = project;
          localStorage.setItem('active_supabase_project', JSON.stringify(project));
        }
      }

      this.notifyListeners();
      notificationService.success('Project updated successfully!');
    } catch (error: any) {
      console.error('Failed to update project:', error);
      notificationService.error('Failed to update project');
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    try {
      const centralSupabase = this.getCentralSupabaseClient();
      
      await centralSupabase.delete('supabase_projects', { id: projectId });

      // Update local state
      this.projects = this.projects.filter(p => p.id !== projectId);
      
      if (this.currentProject?.id === projectId) {
        this.currentProject = null;
        localStorage.removeItem('active_supabase_project');
        
        // Set first project as active if available
        if (this.projects.length > 0) {
          await this.setActiveProject(this.projects[0].id);
        }
      }

      this.notifyListeners();
      notificationService.success('Project deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      notificationService.error('Failed to delete project');
    }
  }

  /**
   * Get current active project
   */
  getCurrentProject(): SupabaseProject | null {
    return this.currentProject;
  }

  /**
   * Get all projects
   */
  getProjects(): SupabaseProject[] {
    return this.projects;
  }

  /**
   * Subscribe to project changes
   */
  onProjectsChange(callback: (projects: SupabaseProject[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.projects); // Immediate call with current state
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Clear all projects (on sign out)
   */
  private clearProjects(): void {
    this.projects = [];
    this.currentProject = null;
    localStorage.removeItem('active_supabase_project');
    this.notifyListeners();
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.projects));
  }

  /**
   * Get central Supabase client (YOUR Supabase for storing user data)
   */
  private getCentralSupabaseClient() {
    // This uses YOUR Supabase credentials from .env
    // to store user's project configurations
    return {
      query: async (table: string, options: any) => {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!url || !key) {
          throw new Error('Central Supabase not configured');
        }

        let endpoint = `${url}/rest/v1/${table}`;
        const params = new URLSearchParams();

        if (options.select) params.append('select', options.select);
        if (options.filter) {
          Object.entries(options.filter).forEach(([key, value]) => {
            params.append(key, `eq.${value}`);
          });
        }
        if (options.order) {
          params.append('order', `${options.order.column}.${options.order.ascending ? 'asc' : 'desc'}`);
        }

        if (params.toString()) endpoint += `?${params.toString()}`;

        const response = await fetch(endpoint, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Query failed');
        return response.json();
      },

      insert: async (table: string, data: any) => {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!url || !key) {
          throw new Error('Central Supabase not configured in .env file');
        }

        console.log(`Inserting into ${table} at ${url}`);

        const response = await fetch(`${url}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Insert failed:', response.status, errorText);
          
          let errorMessage = 'Insert failed';
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.hint || errorText;
          } catch {
            errorMessage = errorText || `Insert failed with status ${response.status}`;
          }
          
          throw new Error(errorMessage);
        }
        
        return response.json();
      },

      update: async (table: string, data: any, filter: any) => {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!url || !key) {
          throw new Error('Central Supabase not configured');
        }

        let endpoint = `${url}/rest/v1/${table}`;
        const params = new URLSearchParams();
        Object.entries(filter).forEach(([key, value]) => {
          params.append(key, `eq.${value}`);
        });
        if (params.toString()) endpoint += `?${params.toString()}`;

        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Update failed');
        return response.json();
      },

      delete: async (table: string, filter: any) => {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!url || !key) {
          throw new Error('Central Supabase not configured');
        }

        let endpoint = `${url}/rest/v1/${table}`;
        const params = new URLSearchParams();
        Object.entries(filter).forEach(([key, value]) => {
          params.append(key, `eq.${value}`);
        });
        if (params.toString()) endpoint += `?${params.toString()}`;

        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Delete failed');
        return true;
      }
    };
  }
}

export const supabaseProjectManager = new SupabaseProjectManager();
