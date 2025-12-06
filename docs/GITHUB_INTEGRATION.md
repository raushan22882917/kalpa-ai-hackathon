# GitHub Integration Guide

## Overview
The GitHub integration allows you to connect your IDE to GitHub repositories, manage branches, and automatically push AI-generated code.

## Features

### 1. **Sign in with GitHub**
- Click "Sign in with GitHub" in the Source Control panel
- Authorize the application to access your repositories
- Your GitHub account will be connected automatically

### 2. **Repository Management**

#### View All Repositories
- After signing in, click the "📦 Repository" section
- Click the toggle button (▶) to expand and see all your repositories
- Repositories show:
  - 🔒 Private repositories
  - 🌐 Public repositories
  - Default branch name

#### Connect to a Repository
- Click on any repository from the list
- The repository will be marked with a ✓ checkmark
- This becomes your active repository for code operations

#### Create New Repository
- Click the ➕ button in the repository section
- Enter a repository name
- The repository will be created and automatically selected

### 3. **Branch Management**

#### View Branches
- Select a repository first
- The "🌿 Branch" section shows the current branch
- Use the dropdown to switch between branches

#### Create New Branch
- Click the ➕ button next to the branch selector
- Enter a branch name
- The branch will be created from the current branch

#### Configure Branch Roles
- Click the ⚙️ button in the Branch section
- Assign roles to branches:
  - **🚀 Production**: Main deployment branch
  - **🧪 Staging**: Testing/staging environment
  - **🔧 Development**: Development branch

#### Delete Branch
- In the branch manager, click 🗑️ next to any branch
- Cannot delete the production branch
- Confirmation required before deletion

### 4. **AI-Powered Code Push**

#### AI Push
- Click the "🤖 AI Push" button
- AI will automatically push generated code to the current branch
- Commit message is auto-generated based on changes

#### Push to Production
- Click the "🚀 Deploy" button
- Pushes code to the configured production branch
- Confirmation required before deployment

#### Push to Specific Branches
The service provides methods to push to specific environments:
```typescript
// Push to production
await githubService.pushToProduction(files, 'Deploy v1.0');

// Push to staging
await githubService.pushToStaging(files, 'Test new features');

// Push to development
await githubService.pushToDevelopment(files, 'WIP: New feature');
```

### 5. **Auto-Sync Configuration**

#### Enable/Disable Auto-Sync
- Click the 🔗/⛓️‍💥 button in the header
- When enabled, code is automatically pushed at intervals
- Shows "🔄 Auto-sync ON" badge when active

#### Configure Auto-Sync
```typescript
githubService.updateAutoSyncConfig({
  enabled: true,
  autoCreateRepo: true,
  autoCommit: true,
  commitInterval: 5, // minutes
  defaultBranch: 'main',
  isPrivate: false
});
```

## Usage Examples

### Example 1: Connect and Push Code
```typescript
// 1. User signs in with GitHub
await githubService.authenticate();

// 2. Select a repository
const repos = await githubService.getUserRepos();
githubService.setActiveRepo(repos[0]);

// 3. Create a new branch
await githubService.createBranch('owner', 'repo', 'feature/new-ui', 'main');

// 4. Push AI-generated code
const files = [
  { path: 'src/components/NewComponent.tsx', content: '...' },
  { path: 'src/styles/NewComponent.css', content: '...' }
];
await githubService.aiPushToRepo(files, 'feature/new-ui', 'AI: Added new component');
```

### Example 2: Configure Production Deployment
```typescript
// 1. Set branch configuration
githubService.setBranchConfig({
  production: 'main',
  staging: 'staging',
  development: 'develop'
});

// 2. Push to production
await githubService.pushToProduction(files, 'Release v2.0');
```

### Example 3: Auto-Sync Setup
```typescript
// Enable auto-sync with custom settings
githubService.updateAutoSyncConfig({
  enabled: true,
  autoCommit: true,
  commitInterval: 10, // Push every 10 minutes
  defaultBranch: 'develop'
});
```

## API Reference

### GitHubService Methods

#### Authentication
- `authenticate()`: Start GitHub OAuth flow
- `setAccessToken(token)`: Set access token manually
- `signOut()`: Sign out from GitHub
- `isAuthenticated()`: Check authentication status

#### Repository Operations
- `getUserRepos()`: Get all user repositories
- `getRepo(owner, repo)`: Get specific repository
- `createRepo(name, description, isPrivate)`: Create new repository
- `setActiveRepo(repo)`: Set active repository
- `getActiveRepo()`: Get current active repository

#### Branch Operations
- `getBranches(owner, repo)`: Get all branches
- `createBranch(owner, repo, branchName, fromBranch)`: Create new branch
- `deleteBranch(owner, repo, branchName)`: Delete branch
- `setBranchConfig(config)`: Set branch configuration
- `getBranchConfig()`: Get branch configuration

#### Code Push Operations
- `aiPushToRepo(files, branch, message)`: Push files to specific branch
- `pushToProduction(files, message)`: Push to production branch
- `pushToStaging(files, message)`: Push to staging branch
- `pushToDevelopment(files, message)`: Push to development branch

#### File Operations
- `getFileContent(owner, repo, path, branch)`: Get file content
- `updateFile(owner, repo, path, content, message, branch, sha)`: Update/create file
- `pushFiles(files, commitMessage)`: Push multiple files

## Security Notes

1. **Access Token**: Stored securely in localStorage
2. **OAuth Flow**: Uses GitHub's official OAuth flow
3. **Permissions**: Requires `repo`, `user`, and `gist` scopes
4. **Private Repos**: Fully supported with proper authentication

## Troubleshooting

### Cannot see repositories
- Ensure you're signed in with GitHub
- Check that OAuth permissions were granted
- Refresh the repository list

### Branch creation fails
- Ensure you have write access to the repository
- Check that the branch name is valid (no spaces or special characters)
- Verify the source branch exists

### Push fails
- Ensure you have write access to the repository
- Check that the branch exists
- Verify file paths are correct

## Environment Variables

Add to your `.env` file:
```env
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id
```

To get a GitHub OAuth Client ID:
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set the callback URL to `http://localhost:5173/github-callback`
4. Copy the Client ID to your `.env` file
