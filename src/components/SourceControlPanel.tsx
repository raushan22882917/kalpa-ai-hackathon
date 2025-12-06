/**
 * Source Control Panel Component
 * Git integration and version control with GitHub
 */

import { useState, useEffect } from 'react';
import { githubService, type GitHubRepo, type GitHubCommit, type GitHubBranch, type BranchConfig } from '../services/githubService';
import { notificationService } from '../services/notificationService';
import './SourceControlPanel.css';

export interface SourceControlPanelProps {
  theme?: 'light' | 'dark';
}

const SourceControlPanel = ({ theme = 'dark' }: SourceControlPanelProps) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [branchConfig, setBranchConfig] = useState<BranchConfig>({ production: 'main' });
  const [showBranchManager, setShowBranchManager] = useState(false);
  const [showRepoList, setShowRepoList] = useState(false);

  useEffect(() => {
    checkAuth();
    
    // Load auto-sync config
    const config = githubService.getAutoSyncConfig();
    setAutoSyncEnabled(config.enabled);

    // Subscribe to connection changes
    const unsubscribe = githubService.onConnectionChange((connected) => {
      setIsAuthenticated(connected);
      if (connected) {
        loadRepos();
        // Load active repo if exists
        const activeRepo = githubService.getActiveRepo();
        if (activeRepo) {
          setSelectedRepo(activeRepo);
          loadCommits(activeRepo);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const authenticated = githubService.isAuthenticated();
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      loadRepos();
    }
  };

  const handleAuth = async () => {
    try {
      await githubService.authenticate();
    } catch (error: any) {
      notificationService.error(`Authentication failed: ${error.message}`);
    }
  };

  const handleSignOut = () => {
    githubService.signOut();
    setIsAuthenticated(false);
    setRepos([]);
    setSelectedRepo(null);
    setCommits([]);
  };

  const loadRepos = async () => {
    setLoading(true);
    try {
      const userRepos = await githubService.getUserRepos();
      setRepos(userRepos);
    } catch (error: any) {
      notificationService.error(`Failed to load repositories: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadCommits = async (repo: GitHubRepo, branch?: string) => {
    setLoading(true);
    try {
      const [owner, repoName] = repo.full_name.split('/');
      const branchToUse = branch || currentBranch || repo.default_branch;
      const repoCommits = await githubService.getCommits(owner, repoName, branchToUse);
      setCommits(repoCommits);
    } catch (error: any) {
      notificationService.error(`Failed to load commits: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async (repo: GitHubRepo) => {
    setLoading(true);
    try {
      const [owner, repoName] = repo.full_name.split('/');
      const repoBranches = await githubService.getBranches(owner, repoName);
      setBranches(repoBranches);
      
      // Load branch config
      const config = githubService.getBranchConfig();
      setBranchConfig(config);
      setCurrentBranch(config.production || repo.default_branch);
    } catch (error: any) {
      notificationService.error(`Failed to load branches: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoSelect = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    githubService.setActiveRepo(repo);
    loadBranches(repo);
    loadCommits(repo);
    setShowRepoList(false);
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    
    // Push files with commit message
    const success = await githubService.quickPush(commitMessage);
    if (success) {
      setCommitMessage('');
      if (selectedRepo) {
        loadCommits(selectedRepo);
      }
    }
  };

  const handleToggleAutoSync = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    githubService.updateAutoSyncConfig({ enabled: newValue });
    
    if (newValue) {
      notificationService.success('Auto-sync enabled - your code will be automatically pushed to GitHub');
    } else {
      notificationService.info('Auto-sync disabled');
    }
  };

  const handleCreateRepo = async () => {
    const repoName = prompt('Enter repository name:');
    if (!repoName) return;

    setLoading(true);
    try {
      const newRepo = await githubService.createRepo(
        repoName,
        'Created from Kalpa AI Editor',
        false
      );

      if (newRepo) {
        await loadRepos();
        setSelectedRepo(newRepo);
        githubService.setActiveRepo(newRepo);
        loadBranches(newRepo);
      }
    } catch (error: any) {
      notificationService.error(`Failed to create repository: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!selectedRepo) return;
    
    const branchName = prompt('Enter new branch name:');
    if (!branchName) return;

    const [owner, repoName] = selectedRepo.full_name.split('/');
    const success = await githubService.createBranch(owner, repoName, branchName, currentBranch);
    
    if (success) {
      loadBranches(selectedRepo);
    }
  };

  const handleDeleteBranch = async (branchName: string) => {
    if (!selectedRepo) return;
    if (branchName === branchConfig.production) {
      notificationService.error('Cannot delete production branch');
      return;
    }

    if (!confirm(`Delete branch "${branchName}"?`)) return;

    const [owner, repoName] = selectedRepo.full_name.split('/');
    const success = await githubService.deleteBranch(owner, repoName, branchName);
    
    if (success) {
      loadBranches(selectedRepo);
    }
  };

  const handleBranchChange = (branchName: string) => {
    setCurrentBranch(branchName);
    if (selectedRepo) {
      loadCommits(selectedRepo, branchName);
    }
  };

  const handleSetBranchRole = (role: 'production' | 'staging' | 'development', branchName: string) => {
    const newConfig = { ...branchConfig, [role]: branchName };
    setBranchConfig(newConfig);
    githubService.setBranchConfig(newConfig);
  };

  const handleAIPush = async () => {
    if (!selectedRepo) return;
    
    // This would integrate with your file system to get modified files
    // For now, showing a placeholder
    notificationService.info('AI Push: This will automatically push AI-generated code to the selected branch');
    
    // Example usage:
    // const files = [{ path: 'src/example.ts', content: 'AI generated code' }];
    // await githubService.aiPushToRepo(files, currentBranch, 'AI-generated update');
  };

  const handlePushToProduction = async () => {
    if (!selectedRepo) return;
    
    if (!confirm('Push to production branch? This will deploy your code.')) return;
    
    notificationService.info('Pushing to production...');
    // Example: await githubService.pushToProduction(files, 'Deploy to production');
  };

  if (!isAuthenticated) {
    return (
      <div className={`source-control-panel ${theme}`}>
        <div className="source-control-header">
          <h3>Source Control</h3>
        </div>
        
        <div className="source-control-content">
          <div className="auth-prompt">
            <div className="github-icon">🐙</div>
            <h4>Connect to GitHub</h4>
            <p>Sign in to access your repositories</p>
            <button className="github-auth-btn" onClick={handleAuth}>
              Sign in with GitHub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`source-control-panel ${theme}`}>
      <div className="source-control-header">
        <div className="header-left">
          <h3>Source Control (GitHub)</h3>
          {isAuthenticated && autoSyncEnabled && (
            <span className="sync-badge enabled" title="Auto-sync enabled">
              🔄 Auto-sync ON
            </span>
          )}
        </div>
        <div className="header-right">
          {isAuthenticated && (
            <button
              className="auto-sync-toggle"
              onClick={handleToggleAutoSync}
              title={autoSyncEnabled ? 'Disable auto-sync' : 'Enable auto-sync'}
            >
              {autoSyncEnabled ? '🔗' : '⛓️‍💥'}
            </button>
          )}
          <button className="sign-out-btn" onClick={handleSignOut} title="Sign out">
            🚪
          </button>
        </div>
      </div>
      
      <div className="source-control-content">
        {/* Repository Selection */}
        <div className="repo-section">
          <div className="section-header">
            <span>📦 Repository</span>
            <button 
              className="toggle-btn" 
              onClick={() => setShowRepoList(!showRepoList)}
              title={showRepoList ? 'Hide repositories' : 'Show all repositories'}
            >
              {showRepoList ? '▼' : '▶'}
            </button>
          </div>
          
          {showRepoList && (
            <div className="repo-list">
              <div className="repo-list-header">
                <span>Your Repositories ({repos.length})</span>
                <div className="repo-actions">
                  <button className="icon-btn" onClick={loadRepos} disabled={loading} title="Refresh">
                    🔄
                  </button>
                  <button className="icon-btn" onClick={handleCreateRepo} disabled={loading} title="Create new repository">
                    ➕
                  </button>
                </div>
              </div>
              <div className="repo-items">
                {repos.map(repo => (
                  <div 
                    key={repo.id} 
                    className={`repo-item ${selectedRepo?.id === repo.id ? 'active' : ''}`}
                    onClick={() => handleRepoSelect(repo)}
                  >
                    <div className="repo-info">
                      <div className="repo-name">{repo.name}</div>
                      <div className="repo-meta">
                        {repo.private ? '🔒' : '🌐'} {repo.default_branch}
                      </div>
                    </div>
                    {selectedRepo?.id === repo.id && <span className="check-mark">✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedRepo && !showRepoList && (
            <div className="selected-repo">
              <div className="repo-badge">
                {selectedRepo.private ? '🔒' : '🌐'} {selectedRepo.name}
              </div>
              <button 
                className="change-repo-btn" 
                onClick={() => setShowRepoList(true)}
                title="Change repository"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {selectedRepo && (
          <>
            {/* Branch Management */}
            <div className="branch-section">
              <div className="section-header">
                <span>🌿 Branch</span>
                <button 
                  className="toggle-btn" 
                  onClick={() => setShowBranchManager(!showBranchManager)}
                  title="Manage branches"
                >
                  ⚙️
                </button>
              </div>

              <div className="branch-selector">
                <select 
                  value={currentBranch} 
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="branch-select"
                >
                  {branches.map(branch => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                      {branch.name === branchConfig.production && ' (Production)'}
                      {branch.name === branchConfig.staging && ' (Staging)'}
                      {branch.name === branchConfig.development && ' (Dev)'}
                    </option>
                  ))}
                </select>
                <button 
                  className="icon-btn" 
                  onClick={handleCreateBranch}
                  title="Create new branch"
                >
                  ➕
                </button>
              </div>

              {showBranchManager && (
                <div className="branch-manager">
                  <div className="branch-config">
                    <h4>Branch Configuration</h4>
                    {branches.map(branch => (
                      <div key={branch.name} className="branch-config-item">
                        <span className="branch-name">{branch.name}</span>
                        <div className="branch-roles">
                          <button
                            className={`role-btn ${branchConfig.production === branch.name ? 'active' : ''}`}
                            onClick={() => handleSetBranchRole('production', branch.name)}
                            title="Set as production"
                          >
                            🚀 Prod
                          </button>
                          <button
                            className={`role-btn ${branchConfig.staging === branch.name ? 'active' : ''}`}
                            onClick={() => handleSetBranchRole('staging', branch.name)}
                            title="Set as staging"
                          >
                            🧪 Stage
                          </button>
                          <button
                            className={`role-btn ${branchConfig.development === branch.name ? 'active' : ''}`}
                            onClick={() => handleSetBranchRole('development', branch.name)}
                            title="Set as development"
                          >
                            🔧 Dev
                          </button>
                          {branch.name !== branchConfig.production && (
                            <button
                              className="delete-branch-btn"
                              onClick={() => handleDeleteBranch(branch.name)}
                              title="Delete branch"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="commit-section">
              <textarea
                className="commit-message-input"
                placeholder="Message (Ctrl+Enter to commit)"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === 'Enter') {
                    handleCommit();
                  }
                }}
                rows={3}
              />
              <button 
                className="commit-btn" 
                disabled={!commitMessage.trim()}
                onClick={handleCommit}
              >
                ✓ Commit
              </button>
            </div>

            <div className="changes-section">
              <div className="changes-header">
                <span>Recent Commits</span>
                <span className="changes-count">{commits.length}</span>
              </div>
              <div className="changes-list">
                {commits.length === 0 ? (
                  <div className="empty-changes">
                    <p>No commits</p>
                  </div>
                ) : (
                  commits.slice(0, 10).map(commit => (
                    <div key={commit.sha} className="commit-item">
                      <div className="commit-message">{commit.message}</div>
                      <div className="commit-meta">
                        <span className="commit-author">{commit.author}</span>
                        <span className="commit-date">
                          {new Date(commit.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="git-actions">
              <button className="git-action-btn ai-push" onClick={handleAIPush} title="AI will automatically push code">
                <span>🤖</span> AI Push
              </button>
              <button 
                className="git-action-btn production" 
                onClick={handlePushToProduction}
                disabled={!branchConfig.production}
                title="Push to production branch"
              >
                <span>🚀</span> Deploy
              </button>
              <button className="git-action-btn" onClick={() => window.open(selectedRepo.html_url, '_blank')}>
                <span>🔗</span> Open
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SourceControlPanel;
