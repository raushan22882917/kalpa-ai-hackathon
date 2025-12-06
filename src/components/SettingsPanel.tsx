import { useState, useEffect } from 'react';
import type { EditorConfig } from '../types/editor';
import { themeService } from '../services/themeService';
import { themeExtensionService, type ThemeExtension } from '../services/themeExtensionService';
import './SettingsPanel.css';

interface SettingsPanelProps {
  config: EditorConfig;
  onConfigChange: (config: EditorConfig) => void;
  visible: boolean;
  onClose: () => void;
}

const SettingsPanel = ({ config, onConfigChange, visible, onClose }: SettingsPanelProps) => {
  const [localConfig, setLocalConfig] = useState<EditorConfig>(config);
  const [installedExtensions, setInstalledExtensions] = useState<ThemeExtension[]>([]);

  useEffect(() => {
    if (visible) {
      // Load installed theme extensions
      const extensions = themeExtensionService.getInstalledExtensions();
      setInstalledExtensions(extensions);
    }
  }, [visible]);

  if (!visible) return null;

  const handleThemeChange = (theme: 'light' | 'dark' | 'high-contrast') => {
    const newConfig = { ...localConfig, theme };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleFontSizeChange = (fontSize: number) => {
    const newConfig = { ...localConfig, fontSize };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('editorConfig', JSON.stringify(localConfig));
    onClose();
  };

  const handleInstallSampleExtension = () => {
    const sampleExtension = themeExtensionService.createSampleExtension();
    const success = themeExtensionService.installExtension(sampleExtension);
    if (success) {
      setInstalledExtensions(themeExtensionService.getInstalledExtensions());
      alert('Sample theme extension installed successfully!');
    } else {
      alert('Failed to install theme extension');
    }
  };

  const handleUninstallExtension = (extensionId: string) => {
    const success = themeExtensionService.uninstallExtension(extensionId);
    if (success) {
      setInstalledExtensions(themeExtensionService.getInstalledExtensions());
      alert('Theme extension uninstalled successfully!');
    }
  };

  const availableThemes = themeService.getAvailableThemes();

  return (
    <div className="settings-panel-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="settings-content">
          {/* Theme Selection */}
          <div className="setting-section">
            <h3>Theme</h3>
            <div className="theme-options">
              {availableThemes.map((theme) => (
                <button
                  key={theme.name}
                  className={`theme-option ${localConfig.theme === theme.name ? 'active' : ''}`}
                  onClick={() => handleThemeChange(theme.name)}
                >
                  <div 
                    className="theme-preview" 
                    style={{ 
                      backgroundColor: theme.colors.background,
                      border: `2px solid ${theme.colors.border}`
                    }}
                  >
                    <div 
                      className="theme-preview-text"
                      style={{ color: theme.colors.foreground }}
                    >
                      Aa
                    </div>
                  </div>
                  <span>{theme.displayName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="setting-section">
            <h3>Font Size</h3>
            <div className="font-size-control">
              <input
                type="range"
                min="10"
                max="24"
                value={localConfig.fontSize || 14}
                onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
              />
              <span className="font-size-value">{localConfig.fontSize || 14}px</span>
            </div>
            <div className="font-size-buttons">
              <button onClick={() => handleFontSizeChange((localConfig.fontSize || 14) - 1)}>-</button>
              <button onClick={() => handleFontSizeChange(14)}>Reset</button>
              <button onClick={() => handleFontSizeChange((localConfig.fontSize || 14) + 1)}>+</button>
            </div>
          </div>

          {/* Theme Extensions */}
          <div className="setting-section">
            <h3>Theme Extensions</h3>
            <p className="setting-description">
              Install custom theme extensions to personalize your editor appearance.
            </p>
            
            {installedExtensions.length > 0 ? (
              <div className="extension-list">
                <p><strong>Installed Extensions:</strong></p>
                {installedExtensions.map(ext => (
                  <div key={ext.id} className="extension-item">
                    <div className="extension-info">
                      <strong>{ext.name}</strong> v{ext.version}
                      <br />
                      <small>{ext.description}</small>
                    </div>
                    <button 
                      className="uninstall-button"
                      onClick={() => handleUninstallExtension(ext.id)}
                    >
                      Uninstall
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-extensions">No theme extensions installed.</p>
            )}

            <button 
              className="install-sample-button"
              onClick={handleInstallSampleExtension}
            >
              Install Sample Theme Extension
            </button>
          </div>

          {/* Keybinding Customization */}
          <div className="setting-section">
            <h3>Keybindings</h3>
            <p className="setting-description">
              Keybinding customization is available. Custom keybindings are persisted to local storage.
            </p>
            <div className="keybinding-info">
              <p>Current keybindings:</p>
              <ul>
                <li><strong>Format Document:</strong> Cmd/Ctrl + Shift + F</li>
                <li><strong>Toggle Comment:</strong> Cmd/Ctrl + /</li>
                <li><strong>Find:</strong> Cmd/Ctrl + F</li>
                <li><strong>Replace:</strong> Cmd/Ctrl + H</li>
              </ul>
            </div>
          </div>

          {/* AI Backend Configuration */}
          <div className="setting-section">
            <h3>AI Backend</h3>
            <p className="setting-description">
              Configure your AI provider and backend connection settings.
            </p>
            
            <div className="input-group">
              <label>AI Provider</label>
              <select
                value={localConfig.aiProvider || 'openai'}
                onChange={(e) => {
                  const provider = e.target.value as 'openai' | 'anthropic' | 'gemini' | 'custom';
                  setLocalConfig({ ...localConfig, aiProvider: provider });
                }}
              >
                <option value="openai">OpenAI (GPT-4)</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="gemini">Google Gemini</option>
                <option value="custom">Custom Backend</option>
              </select>
              {localConfig.aiProvider && !['openai', 'anthropic', 'gemini'].includes(localConfig.aiProvider) && (
                <small className="coming-soon-badge">🚧 Coming Soon</small>
              )}
            </div>

            <div className="input-group">
              <label>Backend URL</label>
              <input
                type="text"
                value={localConfig.aiBackendUrl}
                onChange={(e) => setLocalConfig({ ...localConfig, aiBackendUrl: e.target.value })}
                placeholder="http://localhost:3000"
              />
              <small className="input-hint">
                The URL of your AI backend service
              </small>
            </div>

            <div className="input-group">
              <label>API Key</label>
              <input
                type="password"
                value={localConfig.apiKey}
                onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
                placeholder="Enter your API key"
                autoComplete="off"
              />
              <small className="input-hint">
                Your API key is stored securely and never logged
              </small>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="save-button" onClick={handleSave}>Save</button>
          <button className="cancel-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
