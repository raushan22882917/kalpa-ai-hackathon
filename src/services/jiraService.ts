/**
 * Jira Service
 * Handles Jira API integration for task/issue management
 */

import { notificationService } from './notificationService';

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
        colorName: string;
      };
    };
    priority: {
      name: string;
      iconUrl: string;
    };
    issuetype: {
      name: string;
      iconUrl: string;
    };
    assignee: {
      displayName: string;
      emailAddress: string;
      avatarUrls: {
        '48x48': string;
      };
    } | null;
    reporter: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    duedate: string | null;
    project: {
      key: string;
      name: string;
    };
  };
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description: string;
  lead: {
    displayName: string;
  };
  projectTypeKey: string;
  avatarUrls: {
    '48x48': string;
  };
}

export interface JiraBoard {
  id: number;
  name: string;
  type: string;
  location: {
    projectKey: string;
    projectName: string;
  };
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'future' | 'active' | 'closed';
  startDate: string;
  endDate: string;
  completeDate: string | null;
  goal: string;
}

export interface JiraTransition {
  id: string;
  name: string;
  to: {
    name: string;
    statusCategory: {
      key: string;
    };
  };
}

class JiraService {
  private domain: string | null = null;
  private email: string | null = null;
  private apiToken: string | null = null;
  private baseUrl: string | null = null;

  constructor() {
    // Load credentials from localStorage
    const savedCreds = localStorage.getItem('jira_credentials');
    if (savedCreds) {
      const creds = JSON.parse(savedCreds);
      this.domain = creds.domain;
      this.email = creds.email;
      this.apiToken = creds.apiToken;
      this.baseUrl = `https://${creds.domain}.atlassian.net/rest/api/3`;
    }
  }

  /**
   * Configure Jira credentials
   */
  configure(domain: string, email: string, apiToken: string): void {
    this.domain = domain;
    this.email = email;
    this.apiToken = apiToken;
    this.baseUrl = `https://${domain}.atlassian.net/rest/api/3`;

    localStorage.setItem('jira_credentials', JSON.stringify({
      domain,
      email,
      apiToken
    }));

    notificationService.success('Jira configured successfully');
  }

  /**
   * Check if Jira is configured
   */
  isConfigured(): boolean {
    return !!(this.domain && this.email && this.apiToken);
  }

  /**
   * Get current configuration
   */
  getConfig(): { domain: string; email: string } | null {
    if (!this.isConfigured()) return null;
    return {
      domain: this.domain!,
      email: this.email!
    };
  }

  /**
   * Clear configuration
   */
  clearConfig(): void {
    this.domain = null;
    this.email = null;
    this.apiToken = null;
    this.baseUrl = null;
    localStorage.removeItem('jira_credentials');
    notificationService.info('Jira configuration cleared');
  }

  /**
   * Make authenticated request to Jira API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('Jira not configured');
    }

    const auth = btoa(`${this.email}:${this.apiToken}`);
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.errorMessages?.[0] || error.message || `Jira API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<JiraProject[]> {
    try {
      return await this.makeRequest<JiraProject[]>('/project');
    } catch (error: any) {
      notificationService.error(`Failed to fetch projects: ${error.message}`);
      return [];
    }
  }

  /**
   * Get project details
   */
  async getProject(projectKey: string): Promise<JiraProject | null> {
    try {
      return await this.makeRequest<JiraProject>(`/project/${projectKey}`);
    } catch (error: any) {
      notificationService.error(`Failed to fetch project: ${error.message}`);
      return null;
    }
  }

  /**
   * Search issues using JQL
   */
  async searchIssues(jql: string, maxResults: number = 50): Promise<JiraIssue[]> {
    try {
      const data = await this.makeRequest<{ issues: JiraIssue[] }>('/search', {
        method: 'POST',
        body: JSON.stringify({
          jql,
          maxResults,
          fields: [
            'summary',
            'description',
            'status',
            'priority',
            'issuetype',
            'assignee',
            'reporter',
            'created',
            'updated',
            'duedate',
            'project'
          ]
        })
      });
      return data.issues || [];
    } catch (error: any) {
      notificationService.error(`Failed to search issues: ${error.message}`);
      return [];
    }
  }

  /**
   * Get issues for a project
   */
  async getProjectIssues(projectKey: string): Promise<JiraIssue[]> {
    return this.searchIssues(`project = ${projectKey} ORDER BY created DESC`);
  }

  /**
   * Get issues assigned to current user
   */
  async getMyIssues(): Promise<JiraIssue[]> {
    return this.searchIssues(`assignee = currentUser() ORDER BY updated DESC`);
  }

  /**
   * Get issue by key
   */
  async getIssue(issueKey: string): Promise<JiraIssue | null> {
    try {
      return await this.makeRequest<JiraIssue>(`/issue/${issueKey}`);
    } catch (error: any) {
      notificationService.error(`Failed to fetch issue: ${error.message}`);
      return null;
    }
  }

  /**
   * Create new issue
   */
  async createIssue(
    projectKey: string,
    summary: string,
    description: string,
    issueType: string = 'Task',
    priority?: string
  ): Promise<JiraIssue | null> {
    try {
      const fields: any = {
        project: { key: projectKey },
        summary,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: description
                }
              ]
            }
          ]
        },
        issuetype: { name: issueType }
      };

      if (priority) {
        fields.priority = { name: priority };
      }

      const data = await this.makeRequest<{ key: string }>('/issue', {
        method: 'POST',
        body: JSON.stringify({ fields })
      });

      notificationService.success(`Issue ${data.key} created successfully`);
      return await this.getIssue(data.key);
    } catch (error: any) {
      notificationService.error(`Failed to create issue: ${error.message}`);
      return null;
    }
  }

  /**
   * Update issue
   */
  async updateIssue(
    issueKey: string,
    updates: {
      summary?: string;
      description?: string;
      assignee?: string;
      priority?: string;
    }
  ): Promise<boolean> {
    try {
      const fields: any = {};

      if (updates.summary) {
        fields.summary = updates.summary;
      }

      if (updates.description) {
        fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: updates.description
                }
              ]
            }
          ]
        };
      }

      if (updates.assignee) {
        fields.assignee = { name: updates.assignee };
      }

      if (updates.priority) {
        fields.priority = { name: updates.priority };
      }

      await this.makeRequest(`/issue/${issueKey}`, {
        method: 'PUT',
        body: JSON.stringify({ fields })
      });

      notificationService.success('Issue updated successfully');
      return true;
    } catch (error: any) {
      notificationService.error(`Failed to update issue: ${error.message}`);
      return false;
    }
  }

  /**
   * Get available transitions for an issue
   */
  async getTransitions(issueKey: string): Promise<JiraTransition[]> {
    try {
      const data = await this.makeRequest<{ transitions: JiraTransition[] }>(
        `/issue/${issueKey}/transitions`
      );
      return data.transitions || [];
    } catch (error: any) {
      notificationService.error(`Failed to fetch transitions: ${error.message}`);
      return [];
    }
  }

  /**
   * Transition issue to new status
   */
  async transitionIssue(issueKey: string, transitionId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/issue/${issueKey}/transitions`, {
        method: 'POST',
        body: JSON.stringify({
          transition: { id: transitionId }
        })
      });

      notificationService.success('Issue status updated');
      return true;
    } catch (error: any) {
      notificationService.error(`Failed to transition issue: ${error.message}`);
      return false;
    }
  }

  /**
   * Add comment to issue
   */
  async addComment(issueKey: string, comment: string): Promise<boolean> {
    try {
      await this.makeRequest(`/issue/${issueKey}/comment`, {
        method: 'POST',
        body: JSON.stringify({
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: comment
                  }
                ]
              }
            ]
          }
        })
      });

      notificationService.success('Comment added successfully');
      return true;
    } catch (error: any) {
      notificationService.error(`Failed to add comment: ${error.message}`);
      return false;
    }
  }

  /**
   * Assign issue to user
   */
  async assignIssue(issueKey: string, accountId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/issue/${issueKey}/assignee`, {
        method: 'PUT',
        body: JSON.stringify({ accountId })
      });

      notificationService.success('Issue assigned successfully');
      return true;
    } catch (error: any) {
      notificationService.error(`Failed to assign issue: ${error.message}`);
      return false;
    }
  }

  /**
   * Get issue link
   */
  getIssueUrl(issueKey: string): string {
    return `https://${this.domain}.atlassian.net/browse/${issueKey}`;
  }
}

export const jiraService = new JiraService();
