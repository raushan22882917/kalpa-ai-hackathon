/**
 * Preview Panel Component
 * Shows live preview of web apps and mobile views
 */

import { useState, useEffect, useRef } from 'react';
import './PreviewPanel.css';

export interface PreviewPanelProps {
  visible: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  initialUrl?: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface PreviewTab {
  id: string;
  url: string;
  title: string;
}

const PreviewPanel = ({ visible, onClose, theme = 'dark', initialUrl }: PreviewPanelProps) => {
  const [tabs, setTabs] = useState<PreviewTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Get active tab
  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const previewUrl = activeTab?.url || 'http://localhost:5173';

  // Create initial tab when initialUrl is provided
  useEffect(() => {
    if (initialUrl && visible) {
      const existingTab = tabs.find(tab => tab.url === initialUrl);
      if (existingTab) {
        setActiveTabId(existingTab.id);
      } else {
        const newTab: PreviewTab = {
          id: `tab-${Date.now()}`,
          url: initialUrl,
          title: new URL(initialUrl).hostname,
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
      }
      setIsLoading(true);
    }
  }, [initialUrl, visible]);

  // Create default tab if none exist
  useEffect(() => {
    if (visible && tabs.length === 0) {
      const defaultTab: PreviewTab = {
        id: `tab-${Date.now()}`,
        url: 'http://localhost:5173',
        title: 'localhost:5173',
      };
      setTabs([defaultTab]);
      setActiveTabId(defaultTab.id);
    }
  }, [visible, tabs.length]);

  const deviceSizes = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '667px' },
  };

  useEffect(() => {
    // Auto-detect local dev server
    const detectServer = async () => {
      const ports = [5173, 3000, 3001, 8080, 4200, 5000];
      for (const port of ports) {
        try {
          await fetch(`http://localhost:${port}`, { mode: 'no-cors' });
          // Server found, but we'll use tabs now instead of setPreviewUrl
          break;
        } catch (e) {
          // Continue to next port
        }
      }
    };

    if (visible && tabs.length === 0) {
      detectServer();
    }
  }, [visible, tabs.length]);

  const handleRefresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleUrlChange = () => {
    if (customUrl) {
      let url = customUrl;
      // Add http:// if no protocol specified
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
      }

      if (activeTab) {
        // Update existing tab
        setTabs(prev => prev.map(tab => 
          tab.id === activeTab.id 
            ? { ...tab, url, title: new URL(url).hostname }
            : tab
        ));
      } else {
        // Create new tab
        const newTab: PreviewTab = {
          id: `tab-${Date.now()}`,
          url,
          title: new URL(url).hostname,
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTab.id);
      }
      
      setShowUrlInput(false);
      setCustomUrl('');
      setIsLoading(true);
    }
  };

  const handleNewTab = () => {
    const newTab: PreviewTab = {
      id: `tab-${Date.now()}`,
      url: 'http://localhost:5173',
      title: 'New Tab',
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setIsLoading(true);
  };

  const handleCloseTab = (tabId: string) => {
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    if (activeTabId === tabId) {
      setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
    }
  };

  const handleDeviceChange = (device: DeviceType) => {
    setDeviceType(device);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className={`preview-panel ${theme}`}>
      {/* Tab Bar */}
      {tabs.length > 0 && (
        <div className="preview-tabs">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`preview-tab ${tab.id === activeTabId ? 'active' : ''}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <span className="preview-tab-icon">🌐</span>
              <span className="preview-tab-title">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  className="preview-tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseTab(tab.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button className="preview-tab-new" onClick={handleNewTab} title="New Tab">
            +
          </button>
        </div>
      )}

      <div className="preview-header">
        <div className="preview-title">
          <span>🌐 Live Preview</span>
        </div>
        
        <div className="preview-controls">
          {/* Device Type Selector */}
          <div className="device-selector">
            <button
              className={`device-btn ${deviceType === 'desktop' ? 'active' : ''}`}
              onClick={() => handleDeviceChange('desktop')}
              title="Desktop View"
            >
              🖥️
            </button>
            <button
              className={`device-btn ${deviceType === 'tablet' ? 'active' : ''}`}
              onClick={() => handleDeviceChange('tablet')}
              title="Tablet View"
            >
              📱
            </button>
            <button
              className={`device-btn ${deviceType === 'mobile' ? 'active' : ''}`}
              onClick={() => handleDeviceChange('mobile')}
              title="Mobile View"
            >
              📱
            </button>
          </div>

          {/* URL Bar */}
          <div className="preview-url-bar">
            {showUrlInput ? (
              <div className="url-input-group">
                <input
                  type="text"
                  className="url-input"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlChange()}
                  placeholder="Enter URL (e.g., http://localhost:3000)"
                  autoFocus
                />
                <button className="url-btn" onClick={handleUrlChange}>
                  Go
                </button>
                <button className="url-btn" onClick={() => setShowUrlInput(false)}>
                  ✕
                </button>
              </div>
            ) : (
              <div className="url-display" onClick={() => setShowUrlInput(true)}>
                <span className="url-text">{previewUrl}</span>
                <button className="url-edit-btn" title="Edit URL">
                  ✏️
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <button
            className="preview-action-btn"
            onClick={handleRefresh}
            title="Refresh (Ctrl+R)"
          >
            🔄
          </button>
          <button
            className="preview-action-btn"
            onClick={() => window.open(previewUrl, '_blank')}
            title="Open in New Tab"
          >
            ↗️
          </button>
          <button className="preview-close-btn" onClick={onClose} title="Close Preview">
            ✕
          </button>
        </div>
      </div>

      <div className="preview-content">
        <div
          className={`preview-frame-container ${deviceType}`}
          style={{
            width: deviceSizes[deviceType].width,
            height: deviceSizes[deviceType].height,
          }}
        >
          {isLoading && (
            <div className="preview-loading">
              <div className="loading-spinner"></div>
              <p>Loading preview...</p>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="preview-iframe"
            title="Live Preview"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
            }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        </div>
      </div>

      <div className="preview-footer">
        <span className="preview-info">
          {deviceType === 'desktop' && '🖥️ Desktop'}
          {deviceType === 'tablet' && '📱 Tablet (768x1024)'}
          {deviceType === 'mobile' && '📱 Mobile (375x667)'}
        </span>
        <span className="preview-status">
          {isLoading ? '⏳ Loading...' : '✓ Ready'}
        </span>
      </div>
    </div>
  );
};

export default PreviewPanel;
