import React, { useState, useEffect } from 'react';
import './GitHubPanel.css';
import { githubService, type GitHubUser, type GitHubRepo } from '../services/githubService';
import { notificationService } from '../services/notificationService';
import { gitCloneService } from '../services/gitCloneService';
import { workspaceService } from '../services/workspaceService';

interface GitHubPanelProps {
  onClose?: () => void;
}

const GitHubPanel: React.FC<GitHubPanelProps> = ({ onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [activeRepo, setActiveRepo] = useState<GitHubRepo | null>(null);
  const [showPushDialog, setShowPushDialog] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

  useEffect(() => {
    checkConnection();
    
    // Load active repo
    const active = githubService.getActiveRepo();
    setActiveRepo(active);
    
    // Subscribe to connection changes
    const unsubscribe = githubService.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        loadUserData();
      } else {
        setUser(null);
        setRepos([]);
        setActiveRepo(null);
      }
    });

    return unsubscribe;
  }, []);

  const checkConnection = async () => {
    const connected = githubService.isAuthenticated();
    setIsConnected(connected);
    
    if (connected) {
      await loadUserData();
    }
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      const userData = await githubService.getCurrentUser();
      setUser(userData);
      
      if (userData) {
        const userRepos = await githubService.getUserRepos();
        setRepos(userRepos);
      }
    } catch (error) {
      console.error('Failed to load GitHub data:', error);
      notificationService.error('Failed to load GitHub data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      await githubService.authenticate();
    } catch (error) {
      notificationService.error('Failed to connect to GitHub');
    }
  };

  const handleDisconnect = () => {
    githubService.signOut();
    setUser(null);
    setRepos([]);
    setIsConnected(false);
  };

  const handleCloneRepo = async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setLoading(true);
    
    try {
      const result = await gitCloneService.cloneRepository(repo.clone_url);
      
      if (result.success && result.path) {
        await workspaceService.setWorkspace(result.path);
        notificationService.success(`Cloned ${repo.name} successfully`);
        onClose?.();
      }
    } catch (error) {
      notificationService.error('Failed to clone repository');
    } finally {
      setLoading(false);
      setSelectedRepo(null);
    }
  };

  const handleOpenInBrowser = (url: string) => {
    window.open(url, '_blank');
  };

  const handleSetActiveRepo = (repo: GitHubRepo) => {
    githubService.setActiveRepo(repo);
    setActiveRepo(repo);
    notificationService.success(`Active repository set to ${repo.name}`);
  };

  const handlePushCode = () => {
    if (!activeRepo) {
      notificationService.error('Please select an active repository first');
      return;
    }
    setShowPushDialog(true);
  };

  const handleConfirmPush = async () => {
    if (!activeRepo || !commitMessage.trim()) {
      notificationService.error('Please enter a commit message');
      return;
    }

    setLoading(true);
    try {
      // This would integrate with the file system to get modified files
      // For now, we'll show a placeholder
      notificationService.info('Push functionality will sync with your workspace files');
      
      // Example of how it would work:
      // const files = await getModifiedFiles();
      // await githubService.pushFiles(files, commitMessage);
      
      setShowPushDialog(false);
      setCommitMessage('');
    } catch (error) {
      notificationService.error('Failed to push code');
    } finally {
      setLoading(false);
    }
  };

  const handlePullCode = async () => {
    if (!activeRepo) {
      notificationService.error('Please select an active repository first');
      return;
    }

    setLoading(true);
    try {
      notificationService.info('Pull functionality will sync repository files to your workspace');
      // This would fetch files from the repo and update the workspace
    } catch (error) {
      notificationService.error('Failed to pull code');
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isConnected) {
    return (
      <div className="github-panel">
        <div className="github-panel-header">
          <h2>GitHub Integration</h2>
          {onClose && (
            <button className="close-btn" onClick={onClose}>✕</button>
          )}
        </div>

        <div className="github-connect-container">
          <div className="github-icon">
            <svg width="64" height="64" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
          </div>
          <h3>Connect to GitHub</h3>
          <p>Access your repositories, clone projects, and sync your code with GitHub.</p>
          
          <button className="btn btn-primary" onClick={handleConnect}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            Connect with GitHub
          </button>

          <div className="github-features">
            <div className="feature-item">
              <span className="feature-icon">📦</span>
              <span>Clone repositories</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔄</span>
              <span>Sync your code</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🌿</span>
              <span>Manage branches</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="github-panel">
      <div className="github-panel-header">
        <h2>GitHub</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>✕</button>
        )}
      </div>

      {loading && !user ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading GitHub data...</p>
        </div>
      ) : (
        <>
          {/* User Profile Section */}
          {user && (
            <div className="github-user-profile">
              <img 
                src={user.avatar_url} 
                alt={user.name} 
                className="user-avatar"
              />
              <div className="user-info">
                <h3>{user.name || user.login}</h3>
                <p className="user-login">@{user.login}</p>
                {user.bio && <p className="user-bio">{user.bio}</p>}
                {user.email && (
                  <p className="user-email">
                    <span className="email-icon">✉️</span>
                    {user.email}
                  </p>
                )}
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleDisconnect}
              >
                Disconnect
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          {/* Repository Stats */}
          <div className="repo-stats">
            <div className="stat-item">
              <span className="stat-value">{repos.length}</span>
              <span className="stat-label">Repositories</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {repos.filter(r => r.private).length}
              </span>
              <span className="stat-label">Private</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {repos.filter(r => !r.private).length}
              </span>
              <span className="stat-label">Public</span>
            </div>
          </div>

          {/* Active Repository Actions */}
          {activeRepo && (
            <div className="active-repo-section">
              <div className="active-repo-header">
                <div className="active-repo-info">
                  <span className="active-badge">Active</span>
                  <h4>{activeRepo.name}</h4>
                </div>
              </div>
              <div className="repo-actions-bar">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handlePushCode}
                  disabled={loading}
                >
                  ⬆️ Push
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={handlePullCode}
                  disabled={loading}
                >
                  ⬇️ Pull
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleOpenInBrowser(activeRepo.html_url)}
                >
                  🔗 Open
                </button>
              </div>
            </div>
          )}

          {/* Repositories List */}
          <div className="repos-container">
            <div className="repos-header">
              <h3>Your Repositories</h3>
              <button 
                className="btn btn-sm"
                onClick={loadUserData}
                disabled={loading}
              >
                {loading ? '⟳' : '↻'} Refresh
              </button>
            </div>

            {filteredRepos.length === 0 ? (
              <div className="empty-state">
                <p>
                  {searchQuery 
                    ? 'No repositories match your search' 
                    : 'No repositories found'}
                </p>
              </div>
            ) : (
              <div className="repos-list">
                {filteredRepos.map((repo) => (
                  <div 
                    key={repo.id} 
                    className="repo-item"
                  >
                    <div className="repo-header">
                      <div className="repo-name-container">
                        <h4 className="repo-name">{repo.name}</h4>
                        {repo.private && (
                          <span className="repo-badge private">🔒 Private</span>
                        )}
                        {activeRepo?.id === repo.id && (
                          <span className="repo-badge active">✓ Active</span>
                        )}
                      </div>
                      <div className="repo-actions">
                        <button
                          className="btn-icon"
                          onClick={() => handleSetActiveRepo(repo)}
                          title="Set as active repository"
                          disabled={activeRepo?.id === repo.id}
                        >
                          {activeRepo?.id === repo.id ? '✓' : '⭐'}
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenInBrowser(repo.html_url)}
                          title="Open in GitHub"
                        >
                          🔗
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleCloneRepo(repo)}
                          disabled={loading && selectedRepo?.id === repo.id}
                          title="Clone repository"
                        >
                          {loading && selectedRepo?.id === repo.id ? '⟳' : '📥'}
                        </button>
                      </div>
                    </div>
                    
                    {repo.description && (
                      <p className="repo-description">{repo.description}</p>
                    )}
                    
                    <div className="repo-meta">
                      <span className="meta-item">
                        <span className="meta-icon">🌿</span>
                        {repo.default_branch}
                      </span>
                      <span className="meta-item">
                        <span className="meta-icon">📅</span>
                        {new Date(repo.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Push Dialog */}
      {showPushDialog && (
        <div className="dialog-overlay" onClick={() => setShowPushDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Push to {activeRepo?.name}</h3>
              <button className="close-btn" onClick={() => setShowPushDialog(false)}>
                ✕
              </button>
            </div>
            <div className="dialog-content">
              <label htmlFor="commit-message">Commit Message</label>
              <textarea
                id="commit-message"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Update files from Kalpa AI Editor"
                rows={4}
                autoFocus
              />
              <p className="dialog-hint">
                This will push all modified files in your workspace to the repository.
              </p>
            </div>
            <div className="dialog-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowPushDialog(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmPush}
                disabled={!commitMessage.trim() || loading}
              >
                {loading ? 'Pushing...' : 'Push Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitHubPanel;
