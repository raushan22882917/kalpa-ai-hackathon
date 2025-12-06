# GitHub Integration - User Guide

Learn how to connect your GitHub account and manage your repositories directly from Kalpa AI Editor.

## Getting Started

### 1. Connect Your GitHub Account

1. Click the **Source Control** icon (🌿) in the activity bar
2. Click **"Connect with GitHub"** button
3. You'll be redirected to GitHub
4. Click **"Authorize"** to grant access
5. You'll be redirected back to the editor

**That's it!** Your GitHub account is now connected.

## Features

### View Your Profile

Once connected, you'll see:
- Your profile picture
- Your name and username
- Your bio
- Your email address
- Repository statistics

### Browse Your Repositories

All your repositories are displayed with:
- Repository name
- Description
- Private/Public badge
- Default branch
- Last updated date

**Search:** Use the search bar to quickly find repositories

### Clone a Repository

To clone any repository to your local workspace:

1. Find the repository in the list
2. Click the **📥 Clone** button
3. Select a folder on your computer
4. Wait for the clone to complete
5. The repository opens automatically as your workspace

### Set Active Repository

To work with a specific repository:

1. Click the **⭐ Star** icon next to the repository
2. The repository is now marked as "Active"
3. Push/Pull buttons become available

### Push Your Changes

To push code changes to GitHub:

1. Make sure you have an active repository set
2. Click the **⬆️ Push** button
3. Enter a commit message (e.g., "Updated homepage design")
4. Click **"Push Changes"**
5. Your changes are now on GitHub!

**Example commit messages:**
- "Fixed login bug"
- "Added new feature: dark mode"
- "Updated documentation"
- "Refactored authentication code"

### Pull Latest Changes

To get the latest code from GitHub:

1. Make sure you have an active repository set
2. Click the **⬇️ Pull** button
3. Latest changes are downloaded to your workspace
4. Your local files are updated

### Open in GitHub

To view a repository on GitHub.com:

1. Click the **🔗 Link** icon next to any repository
2. The repository opens in your browser

## Tips & Tricks

### Quick Actions

- **Ctrl/Cmd + K**: Open command palette
- **Ctrl/Cmd + Shift + G**: Open source control panel
- **Ctrl/Cmd + Enter**: Quick commit (when in commit message)

### Best Practices

**Commit Often:**
- Make small, focused commits
- Write clear commit messages
- Commit related changes together

**Pull Before Push:**
- Always pull latest changes before pushing
- Prevents merge conflicts
- Keeps your code up to date

**Use Descriptive Messages:**
```
✅ Good: "Fixed navigation menu on mobile devices"
❌ Bad: "Fixed stuff"

✅ Good: "Added user authentication with JWT"
❌ Bad: "Updates"
```

### Working with Branches

The active repository shows its default branch (usually `main` or `master`). 

**To work with other branches:**
1. Clone the repository
2. Use the integrated terminal
3. Run: `git checkout branch-name`

### Private Repositories

Private repositories are marked with a 🔒 icon. You can:
- Clone them to your workspace
- Push and pull changes
- All operations work the same as public repos

## Common Workflows

### Workflow 1: Start a New Project

```
1. Create repository on GitHub.com
2. Refresh repository list in editor
3. Clone the new repository
4. Start coding!
5. Push changes when ready
```

### Workflow 2: Contribute to Existing Project

```
1. Find the repository in your list
2. Clone it to your workspace
3. Make your changes
4. Commit with descriptive message
5. Push to GitHub
```

### Workflow 3: Sync with Team

```
1. Pull latest changes (⬇️ Pull button)
2. Make your changes
3. Pull again to get any new updates
4. Push your changes (⬆️ Push button)
```

### Workflow 4: Quick Fix

```
1. Set repository as active (⭐)
2. Make the fix in your code
3. Click Push (⬆️)
4. Enter message: "Fixed bug in login"
5. Done!
```

## Troubleshooting

### "Not connected to GitHub"

**Solution:** Click "Connect with GitHub" and authorize the app

### "Repository not found"

**Solution:** 
- Check if repository exists on GitHub
- Verify you have access to the repository
- Try refreshing the repository list

### "Push failed"

**Solution:**
- Make sure you have write access to the repository
- Check if you're connected to the internet
- Try pulling latest changes first
- Verify the repository isn't archived

### "Clone failed"

**Solution:**
- Check your internet connection
- Verify you have access to the repository
- Make sure you have enough disk space
- Try cloning via the terminal instead

### "Can't see my repositories"

**Solution:**
- Click the refresh button (↻)
- Disconnect and reconnect your GitHub account
- Check if you granted the correct permissions

## Privacy & Security

### What Data is Stored?

- **Access Token**: Stored locally in your browser
- **Profile Info**: Cached temporarily
- **Repository List**: Cached temporarily
- **Active Repository**: Stored locally

### What Data is Sent to GitHub?

- **Code Changes**: Only when you click Push
- **Commit Messages**: Only when you click Push
- **API Requests**: To fetch your profile and repositories

### Can Others See My Code?

- **Private Repos**: Only you and collaborators can see
- **Public Repos**: Anyone can see
- **Local Changes**: Stored only on your computer until you push

### Disconnect Anytime

To disconnect your GitHub account:
1. Click the **"Disconnect"** button in your profile section
2. Your access token is removed
3. You can reconnect anytime

## Need Help?

- **Documentation**: Check the full docs at `/docs`
- **Issues**: Report bugs on GitHub Issues
- **Support**: Email support@kalpa-ai.com
- **Community**: Join our Discord server

## What's Next?

Now that you're connected to GitHub, you can:
- ✅ Clone any of your repositories
- ✅ Make changes in the editor
- ✅ Push updates to GitHub
- ✅ Collaborate with your team
- ✅ Keep your code synced across devices

Happy coding! 🚀
