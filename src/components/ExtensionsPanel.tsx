/**
 * Extensions Panel Component
 * Manage and browse VS Code extensions marketplace with Firebase sync
 */

import { useState, useEffect } from 'react';
import { extensionLoaderService, type VSCodeExtension } from '../services/extensionLoaderService';
import { notificationService } from '../services/notificationService';
import './ExtensionsPanel.css';

export interface ExtensionsPanelProps {
  theme?: 'light' | 'dark';
}

const ExtensionsPanel = ({ theme = 'dark' }: ExtensionsPanelProps) => {
  const [view, setView] = useState<'installed' | 'marketplace'>('installed');
  const [searchQuery, setSearchQuery] = useState('');
  const [installedExtensions, setInstalledExtensions] = useState<VSCodeExtension[]>([]);
  const [marketplaceExtensions, setMarketplaceExtensions] = useState<VSCodeExtension[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInstalledExtensions();
  }, []);

  const loadInstalledExtensions = () => {
    const extensions = extensionLoaderService.getLoadedExtensions();
    setInstalledExtensions(extensions);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await extensionLoaderService.searchExtensions(searchQuery);
      setMarketplaceExtensions(results);
      setView('marketplace');
    } catch (error: any) {
      notificationService.error(`Search failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (extension: VSCodeExtension) => {
    setLoading(true);
    try {
      await extensionLoaderService.loadExtension(extension.id);
      loadInstalledExtensions();
      
      // Update marketplace view
      setMarketplaceExtensions(prev =>
        prev.map(ext => ext.id === extension.id ? { ...ext, installed: true } : ext)
      );
    } catch (error: any) {
      notificationService.error(`Installation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUninstall = async (extension: VSCodeExtension) => {
    setLoading(true);
    try {
      await extensionLoaderService.unloadExtension(extension.id);
      loadInstalledExtensions();
    } catch (error: any) {
      notificationService.error(`Uninstall failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (extension: VSCodeExtension) => {
    try {
      await extensionLoaderService.toggleExtension(extension.id, !extension.enabled);
      loadInstalledExtensions();
    } catch (error: any) {
      notificationService.error(`Toggle failed: ${error.message}`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      await extensionLoaderService.loadExtensionFromFile(file);
      loadInstalledExtensions();
    } catch (error: any) {
      notificationService.error(`Failed to load extension: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`extensions-panel ${theme}`}>
      <div className="extensions-header">
        <h3>Extensions</h3>
        <div className="extensions-tabs">
          <button
            className={`tab ${view === 'installed' ? 'active' : ''}`}
            onClick={() => setView('installed')}
          >
            Installed
          </button>
          <button
            className={`tab ${view === 'marketplace' ? 'active' : ''}`}
            onClick={() => setView('marketplace')}
          >
            Marketplace
          </button>
        </div>
      </div>

      <div className="extensions-search">
        <input
          type="text"
          placeholder="Search extensions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          🔍
        </button>
      </div>

      <div className="extensions-content">
        {view === 'installed' ? (
          <>
            <div className="extensions-actions">
              <label className="upload-btn">
                📦 Install from VSIX
                <input
                  type="file"
                  accept=".vsix"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {installedExtensions.length === 0 ? (
              <div className="empty-extensions">
                <p>No extensions installed</p>
                <p className="hint">Search the marketplace to install extensions</p>
              </div>
            ) : (
              <div className="extensions-list">
                {installedExtensions.map(ext => (
                  <div key={ext.id} className="extension-item">
                    <div className="extension-info">
                      <div className="extension-name">{ext.name}</div>
                      <div className="extension-meta">
                        <span className="extension-publisher">{ext.publisher}</span>
                        <span className="extension-version">v{ext.version}</span>
                      </div>
                      <div className="extension-description">{ext.description}</div>
                    </div>
                    <div className="extension-actions">
                      <button
                        className={`toggle-btn ${ext.enabled ? 'enabled' : 'disabled'}`}
                        onClick={() => handleToggle(ext)}
                        title={ext.enabled ? 'Disable' : 'Enable'}
                      >
                        {ext.enabled ? '✓' : '○'}
                      </button>
                      <button
                        className="uninstall-btn"
                        onClick={() => handleUninstall(ext)}
                        title="Uninstall"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="extensions-list">
            {loading ? (
              <div className="loading">Searching...</div>
            ) : marketplaceExtensions.length === 0 ? (
              <div className="empty-extensions">
                <p>No results</p>
                <p className="hint">Try a different search term</p>
              </div>
            ) : (
              marketplaceExtensions.map(ext => (
                <div key={ext.id} className="extension-item">
                  <div className="extension-info">
                    <div className="extension-name">{ext.name}</div>
                    <div className="extension-meta">
                      <span className="extension-publisher">{ext.publisher}</span>
                      <span className="extension-version">v{ext.version}</span>
                    </div>
                    <div className="extension-description">{ext.description}</div>
                  </div>
                  <div className="extension-actions">
                    {ext.installed ? (
                      <button className="installed-badge" disabled>
                        ✓ Installed
                      </button>
                    ) : (
                      <button
                        className="install-btn"
                        onClick={() => handleInstall(ext)}
                        disabled={loading}
                      >
                        ⬇️ Install
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtensionsPanel;
