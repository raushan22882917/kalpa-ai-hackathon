import React, { useState, useEffect } from 'react';
import './DeploymentPanel.css';
import { deploymentService, type DeploymentProvider } from '../services/deploymentService';
import { notificationService } from '../services/notificationService';

interface DeploymentPanelProps {
  onClose?: () => void;
}

const DeploymentPanel: React.FC<DeploymentPanelProps> = ({ onClose }) => {
  const [providers, setProviders] = useState<DeploymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = () => {
    const allProviders = deploymentService.getProviders();
    setProviders(allProviders);
  };

  const handleConnect = (providerId: string) => {
    setSelectedProvider(providerId);
    setShowConnectDialog(true);
    setApiKey('');
    setProjectId('');
  };

  const handleConfirmConnect = async () => {
    if (!selectedProvider || !apiKey.trim()) {
      notificationService.error('Please enter an API key');
      return;
    }

    setLoading(true);
    try {
      const success = await deploymentService.connectProvider(
        selectedProvider,
        apiKey,
        projectId || undefined
      );

      if (success) {
        setShowConnectDialog(false);
        loadProviders();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = (providerId: string) => {
    deploymentService.disconnectProvider(providerId);
    loadProviders();
  };

  const handleDeploy = async (_providerId: string) => {
    notificationService.info('Deployment feature will collect workspace files and deploy');
    // This would integrate with the file system to get all files
    // const files = await getWorkspaceFiles();
    // await deploymentService.deploy(providerId, config, files);
  };

  const getProviderInstructions = (providerId: string): string => {
    switch (providerId) {
      case 'vercel':
        return 'Get your API token from: Settings → Tokens → Create Token';
      case 'netlify':
        return 'Get your API token from: User Settings → Applications → Personal access tokens';
      case 'github-pages':
        return 'Connect your GitHub account first, then enable Pages in repository settings';
      case 'railway':
        return 'Get your API token from: Account Settings → Tokens';
      case 'render':
        return 'Get your API key from: Account Settings → API Keys';
      default:
        return 'Follow the provider\'s documentation to get your API key';
    }
  };

  return (
    <div className="deployment-panel">
      <div className="deployment-panel-header">
        <h2>Deploy Your Project</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>✕</button>
        )}
      </div>

      <div className="deployment-intro">
        <p>Connect your deployment platform and deploy your project with one click.</p>
        <p className="intro-subtitle">Similar to Lovable.dev, connect your own accounts for full control.</p>
      </div>

      <div className="providers-grid">
        {providers.map((provider) => (
          <div 
            key={provider.id} 
            className={`provider-card ${provider.connected ? 'connected' : ''}`}
          >
            <div className="provider-header">
              <div className="provider-icon">{provider.icon}</div>
              <div className="provider-info">
                <h3>{provider.name}</h3>
                {provider.connected && (
                  <span className="status-badge connected">✓ Connected</span>
                )}
              </div>
            </div>

            <div className="provider-actions">
              {provider.connected ? (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleDeploy(provider.id)}
                  >
                    🚀 Deploy
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleDisconnect(provider.id)}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleConnect(provider.id)}
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="deployment-info">
        <h3>Why Connect Your Own Accounts?</h3>
        <ul>
          <li>✅ Full control over your deployments</li>
          <li>✅ Your data stays in your accounts</li>
          <li>✅ Use your own free tiers and quotas</li>
          <li>✅ No middleman - direct deployment</li>
        </ul>
      </div>

      {/* Connect Dialog */}
      {showConnectDialog && selectedProvider && (
        <div className="dialog-overlay" onClick={() => setShowConnectDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h3>Connect to {providers.find(p => p.id === selectedProvider)?.name}</h3>
              <button className="close-btn" onClick={() => setShowConnectDialog(false)}>
                ✕
              </button>
            </div>

            <div className="dialog-content">
              <div className="input-group">
                <label htmlFor="api-key">API Key / Token</label>
                <input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  autoFocus
                />
                <p className="input-hint">
                  {getProviderInstructions(selectedProvider)}
                </p>
              </div>

              {selectedProvider === 'netlify' && (
                <div className="input-group">
                  <label htmlFor="project-id">Site ID (Optional)</label>
                  <input
                    id="project-id"
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    placeholder="Leave empty to create new site"
                  />
                </div>
              )}

              <div className="security-note">
                <span className="security-icon">🔒</span>
                <p>Your API key is stored securely in your browser and never sent to our servers.</p>
              </div>
            </div>

            <div className="dialog-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConnectDialog(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmConnect}
                disabled={!apiKey.trim() || loading}
              >
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeploymentPanel;
