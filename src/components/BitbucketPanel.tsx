import React, { useState, useEffect } from 'react';
import { bitbucketService, BitbucketRepository, BitbucketPullRequest } from '../services/bitbucketService';
import './BitbucketPanel.css';

interface BitbucketPanelProps {
  theme?: 'light' | 'dark';
}

export const BitbucketPanel: React.FC<BitbucketPanelProps> = ({ theme = 'dark' }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [repositories, setRepositories] = useState<BitbucketRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<BitbucketRepository | null>(null);
  const [pullRequests, setPullRequests] = useState<BitbucketPullRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Configuration form
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [workspace, setWorkspace] = useState('');

  useEffect(() => {
    const configured = bitbucketService.isConfigured();
    setIsConfigured(configured);

    if (configured) {
      const config = bitbucketService.getConfig();
      if (config) {
        setUsername(config.username);
        setWorkspace(config.workspace);
      }
      loadRepositories();
    }
  }, []);

  const loadRepositories = async () => {
    setLoading(true);
    const repos = await bitbucketService.getRepositories();
    setRepositories(repos);
    setLoading(false);
  };

  const handleConfigure = () => {
    if (!username || !appPassword || !workspace) {
      alert('Please fill in all fields');
      return;
    }

    bitbucketService.configure(username, appPassword, workspace);
    setIsConfigured(true);
    setShowConfig(false);
    loadRepositories();
  };

  const handleSelectRepo = async (repo: BitbucketRepository) => {
    setSelectedRepo(repo);
    setLoading(true);
    const prs = await bitbucketService.getPullRequests(repo.name, 'OPEN');
    setPullRequests(prs);
    setLoading(false);
  };

  const handleClone = (repo: BitbucketRepository) => {
    const cloneUrl = bitbucketService.getCloneUrl(repo.name);
    navigator.clipboard.writeText(cloneUrl);
    alert(`Clone URL copied: ${cloneUrl}`);
  };

  if (!isConfigured || showConfig) {
    return (
      <div className={`bitbucket-panel ${theme}`}>
        <div className="bitbucket-config">
          <h2>Configure Bitbucket</h2>
          <p className="help-text">
            Enter your Bitbucket credentials to connect your repositories.
          </p>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-username"
            />
          </div>

          <div className="form-group">
            <label>App Password</label>
            <input
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="Create in Bitbucket Settings > App passwords"
            />
            <small>
              <a
                href="https://bitbucket.org/account/settings/app-passwords/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Create App Password
              </a>
            </small>
          </div>

          <div className="form-group">
            <label>Workspace</label>
            <input
              type="text"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              placeholder="your-workspace"
            />
          </div>

          <div className="button-group">
            <button onClick={handleConfigure} className="btn-primary">
              Connect
            </button>
            {isConfigured && (
              <button onClick={() => setShowConfig(false)} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bitbucket-panel ${theme}`}>
      <div className="bitbucket-header">
        <h2>Bitbucket</h2>
        <button onClick={() => setShowConfig(true)} className="btn-icon" title="Settings">
          ⚙️
        </button>
      </div>

      {loading && !selectedRepo && <div className="loading">Loading repositories...</div>}

      <div className="bitbucket-content">
        <div className="repo-list">
          <h3>Repositories ({repositories.length})</h3>
          {repositories.map((repo) => (
            <div
              key={repo.uuid}
              className={`repo-item ${selectedRepo?.uuid === repo.uuid ? 'selected' : ''}`}
              onClick={() => handleSelectRepo(repo)}
            >
              <div className="repo-name">{repo.name}</div>
              <div className="repo-meta">
                {repo.is_private && <span className="badge">Private</span>}
                {repo.language && <span className="language">{repo.language}</span>}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClone(repo);
                }}
                className="btn-small"
                title="Copy clone URL"
              >
                Clone
              </button>
            </div>
          ))}
        </div>

        {selectedRepo && (
          <div className="repo-details">
            <h3>{selectedRepo.name}</h3>
            <p>{selectedRepo.description}</p>

            <div className="repo-info">
              <div className="info-item">
                <strong>Main Branch:</strong> {selectedRepo.mainbranch?.name || 'main'}
              </div>
              <div className="info-item">
                <strong>Language:</strong> {selectedRepo.language || 'N/A'}
              </div>
              <div className="info-item">
                <strong>Updated:</strong> {new Date(selectedRepo.updated_on).toLocaleDateString()}
              </div>
            </div>

            <div className="pull-requests">
              <h4>Open Pull Requests ({pullRequests.length})</h4>
              {loading ? (
                <div className="loading">Loading pull requests...</div>
              ) : pullRequests.length === 0 ? (
                <div className="empty-state">No open pull requests</div>
              ) : (
                <div className="pr-list">
                  {pullRequests.map((pr) => (
                    <div key={pr.id} className="pr-item">
                      <div className="pr-title">#{pr.id} {pr.title}</div>
                      <div className="pr-meta">
                        <span>{pr.author.display_name}</span>
                        <span>{pr.source.branch.name} → {pr.destination.branch.name}</span>
                      </div>
                      <a
                        href={pr.links.html.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-small"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
