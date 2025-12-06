/**
 * Floating Preview Component
 * Draggable, resizable preview window that floats over the editor
 */

import { useState, useEffect, useRef } from 'react';
import './FloatingPreview.css';

export interface FloatingPreviewProps {
  visible: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  initialUrl?: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'custom';

interface PreviewTab {
  id: string;
  url: string;
  title: string;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const FloatingPreview = ({ visible, onClose, theme = 'dark', initialUrl }: FloatingPreviewProps) => {
  const [tabs, setTabs] = useState<PreviewTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 100, y: 100 });
  const [size, setSize] = useState<Size>({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [savedPosition, setSavedPosition] = useState<Position | null>(null);
  const [savedSize, setSavedSize] = useState<Size | null>(null);
  
  const windowRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeTab = tabs.find(tab => tab.id === activeTabId);
  const previewUrl = activeTab?.url || 'http://localhost:5173';

  const deviceSizes: Record<DeviceType, Size> = {
    desktop: { width: 1200, height: 800 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 },
    custom: size,
  };

  // Create initial tab
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

  // Center window on first open
  useEffect(() => {
    if (visible && windowRef.current) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const centerX = (windowWidth - size.width) / 2;
      const centerY = (windowHeight - size.height) / 2;
      setPosition({ x: Math.max(0, centerX), y: Math.max(0, centerY) });
    }
  }, [visible]);

  // Handle device type change
  const handleDeviceChange = (device: DeviceType) => {
    setDeviceType(device);
    if (device !== 'custom') {
      setSize(deviceSizes[device]);
    }
  };

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.preview-header-drag')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep window within viewport
      const maxX = window.innerWidth - 200;
      const maxY = window.innerHeight - 100;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    }

    if (isResizing && resizeDirection) {
      handleResize(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
    setResizeStart(null);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, position]);

  // Handle resizing
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    });
    setDeviceType('custom');
  };

  const handleResize = (e: MouseEvent) => {
    if (!resizeStart || !resizeDirection) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    let newX = position.x;
    let newY = position.y;

    // Handle different resize directions
    if (resizeDirection.includes('e')) {
      newWidth = Math.max(400, resizeStart.width + deltaX);
    }
    if (resizeDirection.includes('w')) {
      newWidth = Math.max(400, resizeStart.width - deltaX);
      newX = position.x + (resizeStart.width - newWidth);
    }
    if (resizeDirection.includes('s')) {
      newHeight = Math.max(300, resizeStart.height + deltaY);
    }
    if (resizeDirection.includes('n')) {
      newHeight = Math.max(300, resizeStart.height - deltaY);
      newY = position.y + (resizeStart.height - newHeight);
    }

    setSize({ width: newWidth, height: newHeight });
    setPosition({ x: newX, y: newY });
  };

  // Handle maximize/restore
  const handleMaximize = () => {
    if (isMaximized) {
      // Restore
      if (savedPosition && savedSize) {
        setPosition(savedPosition);
        setSize(savedSize);
      }
      setIsMaximized(false);
    } else {
      // Maximize
      setSavedPosition(position);
      setSavedSize(size);
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight });
      setIsMaximized(true);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleUrlChange = () => {
    if (customUrl) {
      let url = customUrl;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
      }

      if (activeTab) {
        setTabs(prev => prev.map(tab => 
          tab.id === activeTab.id 
            ? { ...tab, url, title: new URL(url).hostname }
            : tab
        ));
      } else {
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

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="floating-preview-backdrop" onClick={onClose} />
      
      {/* Floating Window */}
      <div
        ref={windowRef}
        className={`floating-preview-window ${theme} ${isMaximized ? 'maximized' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Window Header */}
        <div className="floating-preview-header preview-header-drag">
          <div className="window-title">
            <span className="window-icon">🌐</span>
            <span className="window-text">Live Preview</span>
          </div>
          
          <div className="window-controls">
            <button className="window-control-btn" onClick={handleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
              {isMaximized ? '❐' : '□'}
            </button>
            <button className="window-control-btn close" onClick={onClose} title="Close">
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 0 && (
          <div className="floating-preview-tabs">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`floating-tab ${tab.id === activeTabId ? 'active' : ''}`}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span className="tab-icon">🌐</span>
                <span className="tab-title">{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    className="tab-close"
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
            <button className="tab-new" onClick={handleNewTab} title="New Tab">
              +
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="floating-preview-toolbar">
          {/* Device Selector */}
          <div className="device-selector">
            <button
              className={`device-btn ${deviceType === 'desktop' ? 'active' : ''}`}
              onClick={() => handleDeviceChange('desktop')}
              title="Desktop (1200x800)"
            >
              🖥️
            </button>
            <button
              className={`device-btn ${deviceType === 'tablet' ? 'active' : ''}`}
              onClick={() => handleDeviceChange('tablet')}
              title="Tablet (768x1024)"
            >
              📱
            </button>
            <button
              className={`device-btn ${deviceType === 'mobile' ? 'active' : ''}`}
              onClick={() => handleDeviceChange('mobile')}
              title="Mobile (375x667)"
            >
              📱
            </button>
          </div>

          {/* URL Bar */}
          <div className="url-bar">
            {showUrlInput ? (
              <div className="url-input-group">
                <input
                  type="text"
                  className="url-input"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlChange()}
                  placeholder="Enter URL..."
                  autoFocus
                />
                <button className="url-btn" onClick={handleUrlChange}>Go</button>
                <button className="url-btn" onClick={() => setShowUrlInput(false)}>✕</button>
              </div>
            ) : (
              <div className="url-display" onClick={() => setShowUrlInput(true)}>
                <span className="url-text">{previewUrl}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="toolbar-actions">
            <button className="toolbar-btn" onClick={handleRefresh} title="Refresh">
              🔄
            </button>
            <button className="toolbar-btn" onClick={() => window.open(previewUrl, '_blank')} title="Open in Browser">
              ↗️
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="floating-preview-content">
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
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        </div>

        {/* Status Bar */}
        <div className="floating-preview-status">
          <span className="status-info">
            {deviceType === 'desktop' && `🖥️ Desktop (${size.width}x${size.height})`}
            {deviceType === 'tablet' && '📱 Tablet (768x1024)'}
            {deviceType === 'mobile' && '📱 Mobile (375x667)'}
            {deviceType === 'custom' && `📐 Custom (${size.width}x${size.height})`}
          </span>
          <span className="status-state">
            {isLoading ? '⏳ Loading...' : '✓ Ready'}
          </span>
        </div>

        {/* Resize Handles */}
        {!isMaximized && (
          <>
            <div className="resize-handle resize-n" onMouseDown={(e) => handleResizeStart(e, 'n')} />
            <div className="resize-handle resize-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
            <div className="resize-handle resize-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
            <div className="resize-handle resize-w" onMouseDown={(e) => handleResizeStart(e, 'w')} />
            <div className="resize-handle resize-ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
            <div className="resize-handle resize-nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
            <div className="resize-handle resize-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
            <div className="resize-handle resize-sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
          </>
        )}
      </div>
    </>
  );
};

export default FloatingPreview;
