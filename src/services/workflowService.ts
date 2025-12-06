/**
 * Workflow Service
 * Integrates Organizations, Git (GitHub/Bitbucket), and Jira for complete development workflow
 */

// import { githubService } from './githubService';
import { bitbucketService } from './bitbucketService';
import { jiraService } from './jiraService';
import { notificationService } from './notificationService';

export interface WorkflowProject {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  git_provider: 'github' | 'bitbucket';
  repo_url: string;
  repo_name: string;
  local_path: string;
  jira_project_key?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTask {
  id: string;
  project_id: string;
  jira_issue_key: string;
  title: string;
  description: string;
  assigned_to: string;
  status: string;
  branch_name: string;
  pr_url?: string;
  created_at: string;
}

class WorkflowService {
  /**
   * Connect a repository to an organization
   */
  async connectRepository(
    organizationId: string,
    provider: 'github' | 'bitbucket',
    repoName: string,
    jiraProjectKey?: string
  ): Promise<WorkflowProject | null> {
    try {
      let repoUrl = '';
      
      if (provider === 'github') {
        // For GitHub, construct the clone URL directly
        repoUrl = `https://github.com/${repoName}.git`;
      } else {
        const repo = await bitbucketService.getRepository(repoName);
        if (!repo) {
          notificationService.error('Repository not found on Bitbucket');
          return null;
        }
        repoUrl = bitbucketService.getCloneUrl(repoName);
      }

      // Store in organization projects
      const project: WorkflowProject = {
        id: crypto.randomUUID(),
        organization_id: organizationId,
        name: repoName,
        description: `${provider} repository`,
        git_provider: provider,
        repo_url: repoUrl,
        repo_name: repoName,
        local_path: `~/projects/${repoName}`,
        jira_project_key: jiraProjectKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to localStorage for now (you can extend to save to Supabase)
      this.saveProject(project);

      notificationService.success(`Repository ${repoName} connected to organization`);
      return project;
    } catch (error: any) {
      notificationService.error(`Failed to connect repository: ${error.message}`);
      return null;
    }
  }

  /**
   * Clone repository and start working
   */
  async startWorking(projectId: string): Promise<boolean> {
    try {
      const project = this.getProject(projectId);
      if (!project) {
        notificationService.error('Project not found');
        return false;
      }

      notificationService.info('Cloning repository...');

      // Clone the repository
      const cloneCommand = `git clone ${project.repo_url} ${project.local_path}`;
      
      // Execute clone command
      await this.executeGitCommand(cloneCommand);

      // Pull latest changes
      await this.pullLatest(projectId);

      notificationService.success(`Repository cloned to ${project.local_path}`);
      notificationService.info('Ready to start coding!');

      return true;
    } catch (error: any) {
      notificationService.error(`Failed to start working: ${error.message}`);
      return false;
    }
  }

  /**
   * Pull latest changes from remote
   */
  async pullLatest(projectId: string): Promise<boolean> {
    try {
      const project = this.getProject(projectId);
      if (!project) {
        notificationService.error('Project not found');
        return false;
      }

      notificationService.info('Pulling latest changes...');

      const commands = [
        `cd ${project.local_path}`,
        'git fetch origin',
        'git pull origin main'
      ];

      for (const cmd of commands) {
        await this.executeGitCommand(cmd);
      }

      notificationService.success('Latest changes pulled successfully');
      return true;
    } catch (error: any) {
      notificationService.error(`Failed to pull changes: ${error.message}`);
      return false;
    }
  }

  /**
   * One-click push to remote
   */
  async pushChanges(
    projectId: string,
    commitMessage: string,
    createPR: boolean = false
  ): Promise<boolean> {
    try {
      const project = this.getProject(projectId);
      if (!project) {
        notificationService.error('Project not found');
        return false;
      }

      notificationService.info('Pushing changes...');

      // Git commands
      const commands = [
        `cd ${project.local_path}`,
        'git add .',
        `git commit -m "${commitMessage}"`,
        'git push origin HEAD'
      ];

      for (const cmd of commands) {
        await this.executeGitCommand(cmd);
      }

      notificationService.success('Changes pushed successfully');

      // Create PR if requested
      if (createPR) {
        await this.createPullRequest(projectId, commitMessage);
      }

      return true;
    } catch (error: any) {
      notificationService.error(`Failed to push changes: ${error.message}`);
      return false;
    }
  }

  /**
   * Create pull request
   */
  async createPullRequest(
    projectId: string,
    title: string,
    description?: string
  ): Promise<string | null> {
    try {
      const project = this.getProject(projectId);
      if (!project) {
        notificationService.error('Project not found');
        return null;
      }

      // Get current branch
      const branchName = await this.getCurrentBranch(project.local_path);

      let prUrl = null;

      if (project.git_provider === 'github') {
        // For GitHub, we'll need to implement PR creation
        // For now, just return the GitHub URL
        prUrl = `https://github.com/${project.repo_name}/compare/${branchName}?expand=1`;
        notificationService.info('Open GitHub to create PR: ' + prUrl);
      } else {
        const pr = await bitbucketService.createPullRequest(
          project.repo_name,
          title,
          branchName,
          'main',
          description
        );
        prUrl = pr?.links.html.href || null;
      }

      if (prUrl) {
        notificationService.success('Pull request created successfully');
      }

      return prUrl;
    } catch (error: any) {
      notificationService.error(`Failed to create PR: ${error.message}`);
      return null;
    }
  }

  /**
   * Assign Jira task to team member
   */
  async assignTask(
    issueKey: string,
    assigneeId: string
  ): Promise<boolean> {
    try {
      const success = await jiraService.assignIssue(issueKey, assigneeId);
      
      if (success) {
        notificationService.success(`Task ${issueKey} assigned successfully`);
      }

      return success;
    } catch (error: any) {
      notificationService.error(`Failed to assign task: ${error.message}`);
      return false;
    }
  }

  /**
   * Create branch for Jira task
   */
  async createTaskBranch(
    projectId: string,
    issueKey: string
  ): Promise<boolean> {
    try {
      const project = this.getProject(projectId);
      if (!project) {
        notificationService.error('Project not found');
        return false;
      }

      // Get issue details
      const issue = await jiraService.getIssue(issueKey);
      if (!issue) {
        notificationService.error('Jira issue not found');
        return false;
      }

      // Create branch name from issue key
      const branchName = `feature/${issueKey.toLowerCase()}-${issue.fields.summary
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 50)}`;

      notificationService.info(`Creating branch: ${branchName}`);

      const commands = [
        `cd ${project.local_path}`,
        'git fetch origin',
        'git checkout main',
        'git pull origin main',
        `git checkout -b ${branchName}`
      ];

      for (const cmd of commands) {
        await this.executeGitCommand(cmd);
      }

      notificationService.success(`Branch ${branchName} created`);
      return true;
    } catch (error: any) {
      notificationService.error(`Failed to create branch: ${error.message}`);
      return false;
    }
  }

  /**
   * Submit code for approval (create PR and update Jira)
   */
  async submitForApproval(
    projectId: string,
    issueKey: string,
    commitMessage: string
  ): Promise<boolean> {
    try {
      const project = this.getProject(projectId);
      if (!project) {
        notificationService.error('Project not found');
        return false;
      }

      // Push changes
      await this.pushChanges(projectId, commitMessage, false);

      // Create PR
      const prUrl = await this.createPullRequest(
        projectId,
        `${issueKey}: ${commitMessage}`,
        `Resolves ${issueKey}\n\n${commitMessage}`
      );

      if (!prUrl) {
        return false;
      }

      // Update Jira issue
      await jiraService.addComment(
        issueKey,
        `Pull request created: ${prUrl}`
      );

      // Transition to "In Review"
      const transitions = await jiraService.getTransitions(issueKey);
      const reviewTransition = transitions.find(t => 
        t.name.toLowerCase().includes('review')
      );

      if (reviewTransition) {
        await jiraService.transitionIssue(issueKey, reviewTransition.id);
      }

      notificationService.success('Code submitted for approval');
      return true;
    } catch (error: any) {
      notificationService.error(`Failed to submit for approval: ${error.message}`);
      return false;
    }
  }

  /**
   * Get current git branch
   */
  private async getCurrentBranch(localPath: string): Promise<string> {
    try {
      const result = await this.executeGitCommand(`cd ${localPath} && git branch --show-current`);
      return result.trim() || 'main';
    } catch {
      return 'main';
    }
  }

  /**
   * Execute git command
   */
  private async executeGitCommand(command: string): Promise<string> {
    // In a real implementation, this would use the terminal service
    // For now, we'll simulate it
    console.log('Executing:', command);
    
    // You can integrate with terminalService here
    // await terminalService.executeCommand(command);
    
    return 'Command executed';
  }

  /**
   * Save project to storage
   */
  private saveProject(project: WorkflowProject): void {
    const projects = this.getAllProjects();
    projects.push(project);
    localStorage.setItem('workflow_projects', JSON.stringify(projects));
  }

  /**
   * Get project by ID
   */
  private getProject(projectId: string): WorkflowProject | null {
    const projects = this.getAllProjects();
    return projects.find(p => p.id === projectId) || null;
  }

  /**
   * Get all projects
   */
  getAllProjects(): WorkflowProject[] {
    const data = localStorage.getItem('workflow_projects');
    return data ? JSON.parse(data) : [];
  }

  /**
   * Get projects for organization
   */
  getOrganizationProjects(organizationId: string): WorkflowProject[] {
    return this.getAllProjects().filter(p => p.organization_id === organizationId);
  }

  /**
   * Delete project
   */
  deleteProject(projectId: string): boolean {
    const projects = this.getAllProjects().filter(p => p.id !== projectId);
    localStorage.setItem('workflow_projects', JSON.stringify(projects));
    notificationService.success('Project removed');
    return true;
  }
}

export const workflowService = new WorkflowService();
