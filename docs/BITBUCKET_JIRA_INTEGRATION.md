# Bitbucket & Jira Integration Guide

Complete guide for integrating Bitbucket version control and Jira task management into your IDE.

## Overview

This integration provides:
- **Bitbucket**: Repository management, pull requests, branches, commits
- **Jira**: Project management, issue tracking, task assignment, workflows

## Features

### Bitbucket Integration
- ✅ View all repositories in your workspace
- ✅ Browse repository details
- ✅ View branches and commits
- ✅ Manage pull requests
- ✅ Clone repositories
- ✅ View repository metadata

### Jira Integration
- ✅ View all projects
- ✅ Browse project issues
- ✅ View issues assigned to you
- ✅ Create new issues
- ✅ Update issue status
- ✅ Add comments
- ✅ Assign issues
- ✅ Filter by status, priority, type

## Setup

### Bitbucket Setup

#### 1. Create App Password

1. Go to [Bitbucket Settings](https://bitbucket.org/account/settings/app-passwords/)
2. Click "Create app password"
3. Give it a label (e.g., "IDE Integration")
4. Select permissions:
   - **Repositories**: Read, Write
   - **Pull requests**: Read, Write
   - **Issues**: Read, Write (optional)
5. Click "Create"
6. **Copy the password** (you won't see it again!)

#### 2. Configure in IDE

1. Open IDE
2. Click Bitbucket icon in Activity Bar
3. Enter credentials:
   - **Username**: Your Bitbucket username
   - **App Password**: The password you just created
   - **Workspace**: Your workspace slug
4. Click "Connect"

### Jira Setup

#### 1. Create API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "IDE Integration")
4. Click "Create"
5. **Copy the token** (you won't see it again!)

#### 2. Configure in IDE

1. Open IDE
2. Click Jira icon in Activity Bar
3. Enter credentials:
   - **Domain**: Your Jira domain (e.g., "mycompany" for mycompany.atlassian.net)
   - **Email**: Your Atlassian account email
   - **API Token**: The token you just created
4. Click "Connect"

## Usage

### Bitbucket Operations

#### View Repositories
1. Click Bitbucket icon in Activity Bar
2. Browse your repositories in the left panel
3. Click a repository to view details

#### Clone Repository
1. Select a repository
2. Click "Clone" button
3. Clone URL is copied to clipboard
4. Use in terminal: `git clone <url>`

#### View Pull Requests
1. Select a repository
2. View open pull requests in the right panel
3. Click "View" to open in browser

#### View Branches & Commits
```typescript
import { bitbucketService } from './services/bitbucketService';

// Get branches
const branches = await bitbucketService.getBranches('repo-name');

// Get commits
const commits = await bitbucketService.getCommits('repo-name', 'main');
```

### Jira Operations

#### View Projects
1. Click Jira icon in Activity Bar
2. Click "Projects" tab
3. Browse your projects in the left panel
4. Click a project to view issues

#### View My Issues
1. Click Jira icon in Activity Bar
2. Click "My Issues" tab
3. View all issues assigned to you
4. Click "View in Jira" to open in browser

#### Create Issue
1. Select a project
2. Click "Create Issue"
3. Fill in details:
   - Summary (required)
   - Description
   - Type (Task, Bug, Story, Epic)
   - Priority
4. Click "Create"

#### Update Issue Status
```typescript
import { jiraService } from './services/jiraService';

// Get available transitions
const transitions = await jiraService.getTransitions('PROJ-123');

// Transition to new status
await jiraService.transitionIssue('PROJ-123', transitionId);
```

## API Reference

### Bitbucket Service

```typescript
import { bitbucketService } from './services/bitbucketService';

// Configure
bitbucketService.configure(username, appPassword, workspace);

// Check configuration
const isConfigured = bitbucketService.isConfigured();

// Get repositories
const repos = await bitbucketService.getRepositories();

// Get repository details
const repo = await bitbucketService.getRepository('repo-slug');

// Get branches
const branches = await bitbucketService.getBranches('repo-slug');

// Get commits
const commits = await bitbucketService.getCommits('repo-slug', 'branch-name');

// Get pull requests
const prs = await bitbucketService.getPullRequests('repo-slug', 'OPEN');

// Create pull request
const pr = await bitbucketService.createPullRequest(
  'repo-slug',
  'PR Title',
  'source-branch',
  'destination-branch',
  'Description'
);

// Get file content
const content = await bitbucketService.getFileContent(
  'repo-slug',
  'path/to/file.ts',
  'main'
);

// Get clone URL
const cloneUrl = bitbucketService.getCloneUrl('repo-slug', 'https');
```

### Jira Service

```typescript
import { jiraService } from './services/jiraService';

// Configure
jiraService.configure(domain, email, apiToken);

// Check configuration
const isConfigured = jiraService.isConfigured();

// Get projects
const projects = await jiraService.getProjects();

// Get project details
const project = await jiraService.getProject('PROJ');

// Search issues with JQL
const issues = await jiraService.searchIssues('project = PROJ AND status = "In Progress"');

// Get project issues
const projectIssues = await jiraService.getProjectIssues('PROJ');

// Get my issues
const myIssues = await jiraService.getMyIssues();

// Get issue details
const issue = await jiraService.getIssue('PROJ-123');

// Create issue
const newIssue = await jiraService.createIssue(
  'PROJ',
  'Issue Summary',
  'Detailed description',
  'Task',
  'High'
);

// Update issue
await jiraService.updateIssue('PROJ-123', {
  summary: 'Updated summary',
  description: 'Updated description',
  priority: 'High'
});

// Get transitions
const transitions = await jiraService.getTransitions('PROJ-123');

// Transition issue
await jiraService.transitionIssue('PROJ-123', transitionId);

// Add comment
await jiraService.addComment('PROJ-123', 'This is a comment');

// Assign issue
await jiraService.assignIssue('PROJ-123', accountId);

// Get issue URL
const url = jiraService.getIssueUrl('PROJ-123');
```

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Bitbucket | `Ctrl+Shift+B` |
| Open Jira | `Ctrl+Shift+J` |

## Integration with Organizations

Link Bitbucket repositories and Jira projects to your organizations:

```typescript
import { organizationService } from './services/organizationService';
import { bitbucketService } from './services/bitbucketService';
import { jiraService } from './services/jiraService';

// Add Bitbucket repo to organization
const repo = await bitbucketService.getRepository('my-repo');
await organizationService.addProjectToOrganization(orgId, repo.uuid);

// Add Jira project to organization
const project = await jiraService.getProject('PROJ');
await organizationService.addProjectToOrganization(orgId, project.id);
```

## Workflow Examples

### Complete Development Workflow

```
1. View Jira issues assigned to you
   → Select issue to work on

2. Clone Bitbucket repository
   → Copy clone URL
   → Clone in terminal

3. Create feature branch
   → Work on the issue

4. Commit and push changes
   → Create pull request in Bitbucket

5. Update Jira issue status
   → Move to "In Review"

6. After PR approval
   → Merge PR
   → Update Jira to "Done"
```

### Team Collaboration

```
1. Create organization in IDE
   → Share invite code with team

2. Add Bitbucket repos to organization
   → All members can access

3. Add Jira projects to organization
   → Track team tasks

4. Team members:
   → View shared repositories
   → See project issues
   → Collaborate on code
```

## Security

### Credentials Storage
- Credentials stored in browser localStorage
- Encrypted in transit (HTTPS)
- Never sent to third parties
- Only used for API authentication

### Best Practices
1. Use app passwords/tokens (not account passwords)
2. Limit token permissions to what's needed
3. Rotate tokens regularly
4. Don't share tokens
5. Revoke unused tokens

## Troubleshooting

### Bitbucket Issues

**Problem**: Can't connect to Bitbucket
**Solution**:
- Verify username is correct
- Check app password is valid
- Ensure workspace slug is correct
- Verify app password has required permissions

**Problem**: Repositories not loading
**Solution**:
- Check workspace has repositories
- Verify app password has "Repositories: Read" permission
- Check browser console for errors

### Jira Issues

**Problem**: Can't connect to Jira
**Solution**:
- Verify domain is correct (without .atlassian.net)
- Check email matches Atlassian account
- Ensure API token is valid
- Try creating a new API token

**Problem**: Issues not loading
**Solution**:
- Verify you have access to the project
- Check project permissions
- Try searching with JQL in Jira web interface
- Check browser console for errors

**Problem**: Can't create issues
**Solution**:
- Verify you have "Create Issues" permission
- Check required fields for issue type
- Ensure project allows the issue type
- Try creating in Jira web interface first

## Advanced Usage

### Custom JQL Queries

```typescript
// Search for specific issues
const issues = await jiraService.searchIssues(
  'project = PROJ AND assignee = currentUser() AND status != Done ORDER BY priority DESC'
);

// Find bugs
const bugs = await jiraService.searchIssues(
  'project = PROJ AND issuetype = Bug AND status = Open'
);

// Find overdue issues
const overdue = await jiraService.searchIssues(
  'project = PROJ AND duedate < now() AND status != Done'
);
```

### Bitbucket Webhooks

Set up webhooks in Bitbucket to trigger actions in your IDE:
1. Go to Repository Settings > Webhooks
2. Add webhook URL
3. Select events (push, PR created, etc.)
4. Handle webhook in your IDE

### Jira Automation

Create automation rules in Jira:
1. Go to Project Settings > Automation
2. Create rule (e.g., "When issue moves to In Progress, assign to current user")
3. Rules apply automatically

## Tips & Tricks

1. **Quick Issue Creation**: Keep Jira panel open while coding to quickly create issues
2. **PR Reviews**: Use Bitbucket panel to track PRs needing review
3. **Status Updates**: Update Jira issues directly from IDE
4. **Clone URLs**: Quickly copy clone URLs without opening browser
5. **My Issues**: Use "My Issues" tab to focus on your work

## Next Steps

1. ✅ Configure Bitbucket and Jira
2. ✅ Link repositories and projects to organizations
3. ✅ Create your first issue from IDE
4. ✅ Clone a repository
5. ✅ Start collaborating with your team!

---

For more information:
- [Bitbucket API Documentation](https://developer.atlassian.com/cloud/bitbucket/rest/)
- [Jira API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
