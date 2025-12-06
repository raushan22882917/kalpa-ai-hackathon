# GitHub Integration Setup Guide

This guide will help you set up GitHub OAuth integration for Kalpa AI Editor, allowing users to connect their own GitHub accounts.

## Overview

The GitHub integration allows users to:
- Connect their personal GitHub account
- View all their repositories
- Clone repositories directly to workspace
- Set an active repository for push/pull operations
- Push code changes to GitHub
- Pull latest code from GitHub
- Manage branches and commits

## Prerequisites

- A GitHub account
- Admin access to create a GitHub OAuth App
- Kalpa AI Editor running locally or deployed

## Step 1: Create a GitHub OAuth App

1. **Go to GitHub Settings**
   - Navigate to https://github.com/settings/developers
   - Or: GitHub → Settings → Developer settings → OAuth Apps

2. **Create New OAuth App**
   - Click "New OAuth App"
   - Fill in the application details:

   ```
   Application name: Kalpa AI Editor
   Homepage URL: http://localhost:5173 (or your deployed URL)
   Application description: AI-powered code editor with GitHub integration
   Authorization callback URL: http://localhost:5173/github-callback
   ```

3. **Get Your Credentials**
   - After creating the app, you'll see:
     - **Client ID**: Copy this
     - **Client Secret**: Generate and copy this (keep it secure!)

## Step 2: Configure Environment Variables

1. **Update `.env` file**

   ```env
   # GitHub OAuth Configuration
   VITE_GITHUB_CLIENT_ID=your_client_id_here
   VITE_GITHUB_CLIENT_SECRET=your_client_secret_here
   ```

2. **For Production Deployment**
   
   Update your hosting platform's environment variables:
   
   **Vercel:**
   ```bash
   vercel env add VITE_GITHUB_CLIENT_ID
   vercel env add VITE_GITHUB_CLIENT_SECRET
   ```

   **Netlify:**
   - Go to Site settings → Build & deploy → Environment
   - Add the variables

   **Other platforms:**
   - Add environment variables through your platform's dashboard

## Step 3: Update Callback URL for Production

If deploying to production, update your GitHub OAuth App:

1. Go to your OAuth App settings
2. Update the Authorization callback URL:
   ```
   https://your-domain.com/github-callback
   ```

## Step 4: Test the Integration

1. **Start the Application**
   ```bash
   npm run dev
   ```

2. **Connect to GitHub**
   - Open the app in your browser
   - Click the Source Control icon (Git branch icon)
   - Click "Connect with GitHub"
   - Authorize the application
   - You should be redirected back with your profile loaded

3. **Verify Functionality**
   - Check if your profile appears
   - Verify repositories are listed
   - Try cloning a repository
   - Set an active repository
   - Test push/pull buttons

## How It Works

### Authentication Flow

```
1. User clicks "Connect with GitHub"
   ↓
2. Redirected to GitHub OAuth page
   ↓
3. User authorizes the app
   ↓
4. GitHub redirects to /github-callback with code
   ↓
5. Code is exchanged for access token
   ↓
6. Token stored in localStorage
   ↓
7. User profile and repos loaded
```

### API Permissions

The app requests these GitHub scopes:
- `repo`: Full control of private repositories
- `user`: Read user profile data
- `gist`: Create and manage gists (optional)

### Data Storage

- **Access Token**: Stored in browser's localStorage
- **User Profile**: Cached in memory
- **Active Repository**: Stored in localStorage
- **Workspace Data**: Stored in IndexedDB

## User Workflow

### 1. Connect GitHub Account

```typescript
// User clicks connect button
githubService.authenticate()
  ↓
// OAuth flow completes
  ↓
// Token stored automatically
  ↓
// Profile and repos loaded
```

### 2. Clone a Repository

```typescript
// User clicks clone button on a repo
gitCloneService.cloneRepository(repo.clone_url)
  ↓
// Repository cloned to selected folder
  ↓
// Workspace automatically opened
```

### 3. Set Active Repository

```typescript
// User clicks star icon on a repo
githubService.setActiveRepo(repo)
  ↓
// Repository set as active
  ↓
// Push/Pull buttons enabled
```

### 4. Push Code Changes

```typescript
// User clicks Push button
  ↓
// Enter commit message
  ↓
// Modified files collected from workspace
  ↓
githubService.pushFiles(files, commitMessage)
  ↓
// Files pushed to GitHub
```

### 5. Pull Latest Code

```typescript
// User clicks Pull button
  ↓
// Latest files fetched from GitHub
  ↓
// Workspace files updated
  ↓
// User notified of changes
```

## Security Best Practices

### 1. Never Commit Secrets

```bash
# Add to .gitignore
.env
.env.local
.env.production
```

### 2. Use Environment Variables

```javascript
// ✅ Good
const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;

// ❌ Bad
const clientId = 'abc123...';
```

### 3. Validate Tokens

```typescript
// Check token validity before API calls
if (!githubService.isAuthenticated()) {
  // Prompt user to reconnect
}
```

### 4. Handle Token Expiration

```typescript
// Catch authentication errors
try {
  await githubService.getUserRepos();
} catch (error) {
  if (error.status === 401) {
    // Token expired, prompt re-authentication
    githubService.signOut();
  }
}
```

## Troubleshooting

### Issue: "OAuth App not found"

**Solution:**
- Verify Client ID is correct in `.env`
- Check if OAuth App is active in GitHub settings
- Ensure callback URL matches exactly

### Issue: "Redirect URI mismatch"

**Solution:**
- Update callback URL in GitHub OAuth App settings
- Must match exactly: `http://localhost:5173/github-callback`
- For production: `https://your-domain.com/github-callback`

### Issue: "Failed to fetch repositories"

**Solution:**
- Check if token is valid
- Verify `repo` scope was granted
- Check browser console for API errors
- Try disconnecting and reconnecting

### Issue: "Clone failed"

**Solution:**
- Ensure git is installed on the system
- Check if repository is accessible
- Verify network connection
- Try cloning via HTTPS instead of SSH

### Issue: "Push/Pull not working"

**Solution:**
- Verify active repository is set
- Check if workspace has modified files
- Ensure repository permissions allow push
- Check GitHub API rate limits

## API Rate Limits

GitHub API has rate limits:
- **Authenticated**: 5,000 requests per hour
- **Unauthenticated**: 60 requests per hour

The app automatically handles rate limiting by:
- Caching repository data
- Batching API requests
- Showing rate limit warnings

## Advanced Configuration

### Custom OAuth Scopes

Edit `src/services/githubService.ts`:

```typescript
const scope = 'repo,user,gist,workflow'; // Add more scopes
```

### Auto-Sync Configuration

```typescript
githubService.updateAutoSyncConfig({
  enabled: true,
  autoCommit: true,
  commitInterval: 5, // minutes
  defaultBranch: 'main',
  isPrivate: false
});
```

### Branch Configuration

```typescript
githubService.setBranchConfig({
  production: 'main',
  staging: 'staging',
  development: 'dev'
});
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/raushan22882917/Kalpa-ai/issues
- Documentation: https://github.com/raushan22882917/Kalpa-ai/docs
- Email: support@kalpa-ai.com

## Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [OAuth Best Practices](https://oauth.net/2/best-practices/)
