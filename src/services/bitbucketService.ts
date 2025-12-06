/**
 * Bitbucket Service
 * Handles Bitbucket API integration for repository management
 */

import { notificationService } from './notificationService';

export interface BitbucketRepository {
  uuid: string;
  name: string;
  full_name: string;
  description: string;
  is_private: boolean;
  created_on: string;
  updated_on: string;
  size: number;
  language: string;
  has_issues: boolean;
  has_wiki: boolean;
  mainbranch: {
    name: string;
  };
  links: {
    html: {
      href: string;
    };
    clone: Array<{
      name: string;
      href: string;
    }>;
  };
}

export interface BitbucketBranch {
  name: string;
  target: {
    hash: string;
    date: string;
    message: string;
    author: {
      user: {
        display_name: string;
      };
    };
  };
}

export interface BitbucketCommit {
  hash: string;
  date: string;
  message: string;
  author: {
    user: {
      display_name: string;
      uuid: string;
    };
  };
}

export interface BitbucketPullRequest {
  id: number;
  title: string;
  description: string;
  state: 'OPEN' | 'MERGED' | 'DECLINED' | 'SUPERSEDED';
  created_on: string;
  updated_on: string;
  author: {
    display_name: string;
  };
  source: {
    branch: {
      name: string;
    };
  };
  destination: {
    branch: {
      name: string;
    };
  };
  links: {
    html: {
      href: string;
    };
  };
}

class BitbucketService {
  private username: string | null = null;
  private appPassword: string | null = null;
  private workspace: string | null = null;
  private baseUrl = 'https://api.bitbucket.org/2.0';

  constructor() {
    // Load credentials from localStorage
    const savedCreds = localStorage.getItem('bitbucket_credentials');
    if (savedCreds) {
      const creds = JSON.parse(savedCreds);
      this.username = creds.username;
      this.appPassword = creds.appPassword;
      this.workspace = creds.workspace;
    }
  }

  /**
   * Configure Bitbucket credentials
   */
  configure(username: string, appPassword: string, workspace: string): void {
    this.username = username;
    this.appPassword = appPassword;
    this.workspace = workspace;

    localStorage.setItem('bitbucket_credentials', JSON.stringify({
      username,
      appPassword,
      workspace
    }));

    notificationService.success('Bitbucket configured successfully');
  }

  /**
   * Check if Bitbucket is configured
   */
  isConfigured(): boolean {
    return !!(this.username && this.appPassword && this.workspace);
  }

  /**
   * Get current configuration
   */
  getConfig(): { username: string; workspace: string } | null {
    if (!this.isConfigured()) return null;
    return {
      username: this.username!,
      workspace: this.workspace!
    };
  }

  /**
   * Clear configuration
   */
  clearConfig(): void {
    this.username = null;
    this.appPassword = null;
    this.workspace = null;
    localStorage.removeItem('bitbucket_credentials');
    notificationService.info('Bitbucket configuration cleared');
  }

  /**
   * Make authenticated request to Bitbucket API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('Bitbucket not configured');
    }

    const auth = btoa(`${this.username}:${this.appPassword}`);
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `Bitbucket API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get user's repositories
   */
  async getRepositories(): Promise<BitbucketRepository[]> {
    try {
      const data = await this.makeRequest<{ values: BitbucketRepository[] }>(
        `/repositories/${this.workspace}`
      );
      return data.values || [];
    } catch (error: any) {
      notificationService.error(`Failed to fetch repositories: ${error.message}`);
      return [];
    }
  }

  /**
   * Get repository details
   */
  async getRepository(repoSlug: string): Promise<BitbucketRepository | null> {
    try {
      return await this.makeRequest<BitbucketRepository>(
        `/repositories/${this.workspace}/${repoSlug}`
      );
    } catch (error: any) {
      notificationService.error(`Failed to fetch repository: ${error.message}`);
      return null;
    }
  }

  /**
   * Get repository branches
   */
  async getBranches(repoSlug: string): Promise<BitbucketBranch[]> {
    try {
      const data = await this.makeRequest<{ values: BitbucketBranch[] }>(
        `/repositories/${this.workspace}/${repoSlug}/refs/branches`
      );
      return data.values || [];
    } catch (error: any) {
      notificationService.error(`Failed to fetch branches: ${error.message}`);
      return [];
    }
  }

  /**
   * Get repository commits
   */
  async getCommits(repoSlug: string, branch?: string): Promise<BitbucketCommit[]> {
    try {
      const endpoint = branch
        ? `/repositories/${this.workspace}/${repoSlug}/commits/${branch}`
        : `/repositories/${this.workspace}/${repoSlug}/commits`;

      const data = await this.makeRequest<{ values: BitbucketCommit[] }>(endpoint);
      return data.values || [];
    } catch (error: any) {
      notificationService.error(`Failed to fetch commits: ${error.message}`);
      return [];
    }
  }

  /**
   * Get pull requests
   */
  async getPullRequests(repoSlug: string, state?: 'OPEN' | 'MERGED' | 'DECLINED'): Promise<BitbucketPullRequest[]> {
    try {
      let endpoint = `/repositories/${this.workspace}/${repoSlug}/pullrequests`;
      if (state) {
        endpoint += `?state=${state}`;
      }

      const data = await this.makeRequest<{ values: BitbucketPullRequest[] }>(endpoint);
      return data.values || [];
    } catch (error: any) {
      notificationService.error(`Failed to fetch pull requests: ${error.message}`);
      return [];
    }
  }

  /**
   * Create pull request
   */
  async createPullRequest(
    repoSlug: string,
    title: string,
    sourceBranch: string,
    destinationBranch: string,
    description?: string
  ): Promise<BitbucketPullRequest | null> {
    try {
      const pr = await this.makeRequest<BitbucketPullRequest>(
        `/repositories/${this.workspace}/${repoSlug}/pullrequests`,
        {
          method: 'POST',
          body: JSON.stringify({
            title,
            description,
            source: {
              branch: {
                name: sourceBranch
              }
            },
            destination: {
              branch: {
                name: destinationBranch
              }
            }
          })
        }
      );

      notificationService.success('Pull request created successfully');
      return pr;
    } catch (error: any) {
      notificationService.error(`Failed to create pull request: ${error.message}`);
      return null;
    }
  }

  /**
   * Get file content from repository
   */
  async getFileContent(repoSlug: string, filePath: string, branch: string = 'main'): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/repositories/${this.workspace}/${repoSlug}/src/${branch}/${filePath}`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${this.username}:${this.appPassword}`)}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      return await response.text();
    } catch (error: any) {
      notificationService.error(`Failed to fetch file: ${error.message}`);
      return null;
    }
  }

  /**
   * Clone repository URL
   */
  getCloneUrl(repoSlug: string, protocol: 'https' | 'ssh' = 'https'): string {
    if (protocol === 'ssh') {
      return `git@bitbucket.org:${this.workspace}/${repoSlug}.git`;
    }
    return `https://bitbucket.org/${this.workspace}/${repoSlug}.git`;
  }
}

export const bitbucketService = new BitbucketService();
