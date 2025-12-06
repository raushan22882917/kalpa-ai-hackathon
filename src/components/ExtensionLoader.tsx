import { useState, useEffect } from 'react';
import { extensionLoaderService, VSCodeExtension } from '../services/extensionLoaderService';
import { notificationService } from '../services/notificationService';
import './ExtensionLoader.css';

export default function ExtensionLoader() {
  const [extensions, setExtensions] = useState<VSCodeExtension[]>([]);
  const [searchResults, setSearchResults] = useState<VSCodeExtension[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'installed' | 'search'>('installed');

  useEffect(() => {
    // Load initial extensions
    setExtensions(extensionLoaderService.getLoadedExtensions());

    // Subscribe to extension changes
    const unsubscribe = extensionLoaderService.subscribe((updatedExtensions) => {
      setExtensions(updatedExtensions);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const results = await extensionLoaderService.searchExtensions(searchQuery);
      setSearchResults(results);
    } catch (error) {
      notificationService.error('Failed to search extensions');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExtension = async (extensionId: string) => {
    setLoading(true);
    try {
      await extensionLoaderService.loadExtension(extensionId);
    } catch (error) {
      // Error already handled by service
    } finally {
      setLoading(false);
    }
  };

  const handleUnloadExtension = async (extensionId: string) => {
    await extensionLoaderService.unloadExtension(extensionId);
  };

  const handleToggleExtension = async (extensionId: string, enabled: boolean) => {
    await extensionLoaderService.toggleExtension(extensionId, enabled);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.vsix')) {
      notificationService.error('Please select a .vsix file');
      return;
    }

    setLoading(true);
    try {
      await extensionLoaderService.loadExtensionFromFile(file);
    } catch (error) {
      // Error already handled by service
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset input
    }
  };

  return (
    <div className="extension-loader">
      <div className="extension-loader-header">
        <h3>Extensions</h3>
        <div className="extension-tabs">
          <button
            className={`tab-button ${activeTab === 'installed' ? 'active' : ''}`}
            onClick={() => setActiveTab('installed')}
          >
            Installed ({extensions.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            Marketplace
          </button>
        </div>
      </div>

      {activeTab === 'installed' && (
        <div className="extension-content">
          <div className="extension-actions">
            <label className="file-upload-button">
              📁 Load from File (.vsix)
              <input
                type="file"
                accept=".vsix"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {extensions.length === 0 ? (
            <div className="empty-state">
              <p>No extensions loaded</p>
              <p className="empty-state-hint">
                Search for extensions in the Marketplace tab or load a .vsix file
              </p>
            </div>
          ) : (
            <div className="extension-list">
              {extensions.map((ext) => (
                <div key={ext.id} className="extension-item">
                  <div className="extension-info">
                    <div className="extension-name">{ext.name}</div>
                    <div className="extension-meta">
                      {ext.publisher} • v{ext.version}
                    </div>
                    {ext.description && (
                      <div className="extension-description">{ext.description}</div>
                    )}
                  </div>
                  <div className="extension-actions-inline">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={ext.enabled}
                        onChange={(e) => handleToggleExtension(ext.id, e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <button
                      className="unload-button"
                      onClick={() => handleUnloadExtension(ext.id)}
                      title="Unload extension"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="extension-content">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search VS Code extensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={loading}>
              {loading ? '⏳' : '🔍'}
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="empty-state">
              <p>Search for extensions in the VS Code Marketplace</p>
            </div>
          ) : (
            <div className="extension-list">
              {searchResults.map((ext) => (
                <div key={ext.id} className="extension-item">
                  <div className="extension-info">
                    <div className="extension-name">{ext.name}</div>
                    <div className="extension-meta">
                      {ext.publisher} • v{ext.version}
                    </div>
                    {ext.description && (
                      <div className="extension-description">{ext.description}</div>
                    )}
                  </div>
                  <div className="extension-actions-inline">
                    {ext.installed ? (
                      <span className="installed-badge">✓ Installed</span>
                    ) : (
                      <button
                        className="install-button"
                        onClick={() => handleLoadExtension(ext.id)}
                        disabled={loading}
                      >
                        Install
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
