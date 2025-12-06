/**
 * GitHub Integration Service
 * Handles GitHub authentication, repository operations, and automatic code syncing
 * Users connect to their own GitHub account and repositories
 */

import { notificationService } from './notificationService';
import { authService } from './authService';

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  email: string;
  bio: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
  updated_at: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface BranchConfig {
  production: string;
  staging?: string;
  development?: string;
}

export interface AutoSyncConfig {
  enabled: boolean;
  autoCreateRepo: boolean;
  autoCommit: boolean;
  commitInterval: number; // minutes
  defaultRepoName?: string;
  defaultBranch: string;
  isPrivate: boolean;
}

class GitHubService {
  private accessToken: string | null = null;
  private readonly GITHUB_API = 'https://api.github.com';
  private readonly CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';
  private currentUser: GitHubUser | null = null;
  private activeRepo: GitHubRepo | null = null;
  private autoSyncConfig: AutoSyncConfig;
  private syncInterval: number | null = null;
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private branchConfig: BranchConfig = { production: 'main' };

  constructor() {
    // Load token from localStorage
    this.accessToken = localStorage.getItem('github_token');
    
    // Load auto-sync configuration
    const savedConfig = localStorage.getItem('github_autosync_config');
    this.autoSyncConfig = savedConfig ? JSON.parse(savedConfig) : {
      enabled: true,
      autoCreateRepo: true,
      autoCommit: true,
      commitInterval: 5,
      defaultBranch: 'main',
      isPrivate: false
    };

    // Load active repo
    const savedRepo = localStorage.getItem('github_active_repo');
    if (savedRepo) {
      this.activeRepo = JSON.parse(savedRepo);
    }

    // Load branch config
    const savedBranchConfig = localStorage.getItem('github_branch_config');
    if (savedBranchConfig) {
      this.branchConfig = JSON.parse(savedBranchConfig);
    }

    // Setup auto-sync with Firebase
    this.setupFirebaseSync();
  }

  // Setup automatic Firebase authentication sync
  private setupFirebaseSync(): void {
    authService.onAuthStateChange(async (user) => {
      if (user && this.isAuthenticated()) {
        // User signed in with Firebase and has GitHub token
        await this.initializeAutoSync();
      } else if (!user) {
        // User signed out
        this.stopAutoSync();
      }
    });
  }

  // Initialize auto-sync when user is authenticated
  private async initializeAutoSync(): Promise<void> {
    if (!this.autoSyncConfig.enabled) return;

    try {
      // Get current GitHub user
      this.currentUser = await this.getCurrentUser();
      
      if (!this.currentUser) return;

      // If auto-create is enabled and no active repo, create one
      if (this.autoSyncConfig.autoCreateRepo && !this.activeRepo) {
        await this.createDefaultRepo();
      }

      // Start auto-commit if enabled
      if (this.autoSyncConfig.autoCommit && this.activeRepo) {
        this.startAutoCommit();
      }

      this.notifyConnectionListeners(true);
      notificationService.success(`Connected to GitHub as ${this.currentUser.login}`);
    } catch (error: any) {
      console.error('Failed to initialize auto-sync:', error);
    }
  }

  // Create default repository for the user
  private async createDefaultRepo(): Promise<void> {
    if (!this.currentUser) return;

    const firebaseUser = authService.getCurrentUser();
    const repoName = this.autoSyncConfig.defaultRepoName || 
                     `vscode-web-${firebaseUser?.displayName?.toLowerCase().replace(/\s+/g, '-') || 'project'}`;

    try {
      // Check if repo already exists
      const existingRepo = await this.getRepo(this.currentUser.login, repoName);
      
      if (existingRepo) {
        this.activeRepo = existingRepo;
        this.saveActiveRepo();
        notificationService.info(`Using existing repository: ${repoName}`);
      } else {
        // Create new repository
        const newRepo = await this.createRepo(
          repoName,
          'Auto-created repository for Kalpa AI Editor',
          this.autoSyncConfig.isPrivate
        );

        if (newRepo) {
          this.activeRepo = newRepo;
          this.saveActiveRepo();
        }
      }
    } catch (error: any) {
      console.error('Failed to create default repo:', error);
    }
  }

  // Start auto-commit interval
  private startAutoCommit(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    const intervalMs = this.autoSyncConfig.commitInterval * 60 * 1000;
    
    this.syncInterval = window.setInterval(() => {
      this.autoCommitChanges();
    }, intervalMs);
  }

  // Stop auto-commit
  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.notifyConnectionListeners(false);
  }

  // Auto-commit changes
  private async autoCommitChanges(): Promise<void> {
    if (!this.activeRepo || !this.currentUser) return;

    // This would integrate with the file system service
    // For now, it's a placeholder for the auto-commit logic
    console.log('Auto-commit triggered');
  }

  // Save active repo to localStorage
  private saveActiveRepo(): void {
    if (this.activeRepo) {
      localStorage.setItem('github_active_repo', JSON.stringify(this.activeRepo));
    }
  }

  // Get auto-sync configuration
  getAutoSyncConfig(): AutoSyncConfig {
    return { ...this.autoSyncConfig };
  }

  // Update auto-sync configuration
  updateAutoSyncConfig(config: Partial<AutoSyncConfig>): void {
    this.autoSyncConfig = { ...this.autoSyncConfig, ...config };
    localStorage.setItem('github_autosync_config', JSON.stringify(this.autoSyncConfig));

    // Restart auto-sync if needed
    if (this.autoSyncConfig.enabled && this.autoSyncConfig.autoCommit && this.activeRepo) {
      this.startAutoCommit();
    } else {
      this.stopAutoSync();
    }
  }

  // Get active repository
  getActiveRepo(): GitHubRepo | null {
    return this.activeRepo;
  }

  // Set active repository
  setActiveRepo(repo: GitHubRepo): void {
    this.activeRepo = repo;
    this.saveActiveRepo();
    
    if (this.autoSyncConfig.enabled && this.autoSyncConfig.autoCommit) {
      this.startAutoCommit();
    }
  }

  // Subscribe to connection state changes
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    // Immediately call with current state
    callback(this.isAuthenticated() && !!this.currentUser);
    
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

  // Authenticate with GitHub OAuth
  async authenticate(): Promise<void> {
    try {
      // For web-based OAuth flow
      const redirectUri = `${window.location.origin}/github-callback`;
      const scope = 'repo,user,gist';
      
      const authUrl = `https://github.com/login/oauth/authorize?client_id=${this.CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}`;
      
      // Open OAuth window
      window.location.href = authUrl;
    } catch (error: any) {
      notificationService.error(`GitHub authentication failed: ${error.message}`);
      throw error;
    }
  }

  // Set access token (called after OAuth callback)
  setAccessToken(token: string): void {
    this.accessToken = token;
    localStorage.setItem('github_token', token);
  }

  // Sign out
  signOut(): void {
    this.accessToken = null;
    localStorage.removeItem('github_token');
    notificationService.success('Signed out from GitHub');
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Get current user
  async getCurrentUser(): Promise<GitHubUser | null> {
    if (!this.accessToken) return null;

    try {
      const response = await this.makeRequest('/user');
      return response as GitHubUser;
    } catch (error) {
      console.error('Failed to get GitHub user:', error);
      return null;
    }
  }

  // Get user repositories
  async getUserRepos(): Promise<GitHubRepo[]> {
    if (!this.accessToken) return [];

    try {
      const response = await this.makeRequest('/user/repos?sort=updated&per_page=100');
      return response as GitHubRepo[];
    } catch (error) {
      console.error('Failed to get repositories:', error);
      return [];
    }
  }

  // Get repository details
  async getRepo(owner: string, repo: string): Promise<GitHubRepo | null> {
    try {
      const response = await this.makeRequest(`/repos/${owner}/${repo}`);
      return response as GitHubRepo;
    } catch (error) {
      console.error('Failed to get repository:', error);
      return null;
    }
  }

  // Get repository commits
  async getCommits(owner: string, repo: string, branch: string = 'main'): Promise<GitHubCommit[]> {
    try {
      const response = await this.makeRequest(`/repos/${owner}/${repo}/commits?sha=${branch}&per_page=50`);
      return (response as any[]).map(commit => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date
      }));
    } catch (error) {
      console.error('Failed to get commits:', error);
      return [];
    }
  }

  // Get file content from repository
  async getFileContent(owner: string, repo: string, path: string, branch: string = 'main'): Promise<string | null> {
    try {
      const response = await this.makeRequest(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
      const data = response as any;
      
      if (data.content) {
        // Decode base64 content
        return atob(data.content.replace(/\n/g, ''));
      }
      return null;
    } catch (error) {
      console.error('Failed to get file content:', error);
      return null;
    }
  }

  // Create or update file
  async updateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string = 'main',
    sha?: string
  ): Promise<boolean> {
    try {
      const encodedContent = btoa(content);
      
      const body: any = {
        message,
        content: encodedContent,
        branch
      };

      if (sha) {
        body.sha = sha;
      }

      await this.makeRequest(`/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });

      notificationService.success('File updated successfully');
      return true;
    } catch (error: any) {
      notificationService.error(`Failed to update file: ${error.message}`);
      return false;
    }
  }

  // Create repository
  async createRepo(name: string, description: string, isPrivate: boolean = false): Promise<GitHubRepo | null> {
    try {
      const response = await this.makeRequest('/user/repos', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          private: isPrivate,
          auto_init: true
        })
      });

      notificationService.success(`Repository "${name}" created successfully`);
      return response as GitHubRepo;
    } catch (error: any) {
      // Check if repo already exists
      if (error.message.includes('already exists')) {
        notificationService.info(`Repository "${name}" already exists`);
        return await this.getRepo(this.currentUser?.login || '', name);
      }
      notificationService.error(`Failed to create repository: ${error.message}`);
      return null;
    }
  }

  // Push multiple files to repository
  async pushFiles(
    files: { path: string; content: string }[],
    commitMessage: string = 'Auto-commit from Kalpa AI Editor'
  ): Promise<boolean> {
    if (!this.activeRepo || !this.currentUser) {
      notificationService.error('No active repository');
      return false;
    }

    try {
      const [owner, repo] = this.activeRepo.full_name.split('/');
      let successCount = 0;

      for (const file of files) {
        // Get existing file SHA if it exists
        let sha: string | undefined;
        try {
          const existingFile = await this.makeRequest(
            `/repos/${owner}/${repo}/contents/${file.path}?ref=${this.autoSyncConfig.defaultBranch}`
          );
          sha = (existingFile as any).sha;
        } catch (error) {
          // File doesn't exist, that's okay
        }

        // Update or create file
        const success = await this.updateFile(
          owner,
          repo,
          file.path,
          file.content,
          commitMessage,
          this.autoSyncConfig.defaultBranch,
          sha
        );

        if (success) successCount++;
      }

      if (successCount === files.length) {
        notificationService.success(`Pushed ${successCount} file(s) to GitHub`);
        return true;
      } else {
        notificationService.warning(`Pushed ${successCount}/${files.length} files`);
        return false;
      }
    } catch (error: any) {
      notificationService.error(`Failed to push files: ${error.message}`);
      return false;
    }
  }

  // Quick push - push current workspace files
  async quickPush(_commitMessage?: string): Promise<boolean> {
    // This would integrate with the file system service
    // to get all modified files and push them
    notificationService.info('Quick push feature coming soon');
    return false;
  }

  // Clone repository (returns clone URL)
  getCloneUrl(repo: GitHubRepo): string {
    return repo.clone_url;
  }

  // Get all branches for a repository
  async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    try {
      const response = await this.makeRequest(`/repos/${owner}/${repo}/branches`);
      return response as GitHubBranch[];
    } catch (error) {
      console.error('Failed to get branches:', error);
      return [];
    }
  }

  // Create a new branch
  async createBranch(owner: string, repo: string, branchName: string, fromBranch: string = 'main'): Promise<boolean> {
    try {
      // Get the SHA of the source branch
      const refResponse = await this.makeRequest(`/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`);
      const sha = refResponse.object.sha;

      // Create new branch
      await this.makeRequest(`/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: sha
        })
      });

      notificationService.success(`Branch "${branchName}" created successfully`);
      return true;
    } catch (error: any) {
      notificationService.error(`Failed to create branch: ${error.message}`);
      return false;
    }
  }

  // Delete a branch
  async deleteBranch(owner: string, repo: string, branchName: string): Promise<boolean> {
    try {
      await this.makeRequest(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
        method: 'DELETE'
      });

      notificationService.success(`Branch "${branchName}" deleted successfully`);
      return true;
    } catch (error: any) {
      notificationService.error(`Failed to delete branch: ${error.message}`);
      return false;
    }
  }

  // Set branch configuration (production, staging, development)
  setBranchConfig(config: BranchConfig): void {
    this.branchConfig = config;
    localStorage.setItem('github_branch_config', JSON.stringify(config));
    notificationService.success('Branch configuration updated');
  }

  // Get branch configuration
  getBranchConfig(): BranchConfig {
    return { ...this.branchConfig };
  }

  // Push code to specific branch with AI
  async aiPushToRepo(
    files: { path: string; content: string }[],
    branch: string,
    commitMessage: string = 'AI-generated code update'
  ): Promise<boolean> {
    if (!this.activeRepo || !this.currentUser) {
      notificationService.error('No active repository');
      return false;
    }

    try {
      const [owner, repo] = this.activeRepo.full_name.split('/');
      let successCount = 0;

      notificationService.info(`Pushing ${files.length} file(s) to ${branch} branch...`);

      for (const file of files) {
        // Get existing file SHA if it exists
        let sha: string | undefined;
        try {
          const existingFile = await this.makeRequest(
            `/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`
          );
          sha = (existingFile as any).sha;
        } catch (error) {
          // File doesn't exist, that's okay
        }

        // Update or create file
        const success = await this.updateFile(
          owner,
          repo,
          file.path,
          file.content,
          commitMessage,
          branch,
          sha
        );

        if (success) successCount++;
      }

      if (successCount === files.length) {
        notificationService.success(`✅ AI pushed ${successCount} file(s) to ${branch} branch`);
        return true;
      } else {
        notificationService.warning(`Pushed ${successCount}/${files.length} files`);
        return false;
      }
    } catch (error: any) {
      notificationService.error(`Failed to push files: ${error.message}`);
      return false;
    }
  }

  // Push to production branch
  async pushToProduction(files: { path: string; content: string }[], commitMessage?: string): Promise<boolean> {
    return this.aiPushToRepo(
      files,
      this.branchConfig.production,
      commitMessage || 'Deploy to production'
    );
  }

  // Push to staging branch
  async pushToStaging(files: { path: string; content: string }[], commitMessage?: string): Promise<boolean> {
    if (!this.branchConfig.staging) {
      notificationService.error('Staging branch not configured');
      return false;
    }
    return this.aiPushToRepo(
      files,
      this.branchConfig.staging,
      commitMessage || 'Deploy to staging'
    );
  }

  // Push to development branch
  async pushToDevelopment(files: { path: string; content: string }[], commitMessage?: string): Promise<boolean> {
    if (!this.branchConfig.development) {
      notificationService.error('Development branch not configured');
      return false;
    }
    return this.aiPushToRepo(
      files,
      this.branchConfig.development,
      commitMessage || 'Update development'
    );
  }

  // Make API request
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken && !endpoint.includes('/repos/')) {
      throw new Error('Not authenticated');
    }

    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` })
    };

    const response = await fetch(`${this.GITHUB_API}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'GitHub API request failed');
    }

    return response.json();
  }
}

export const githubService = new GitHubService();
