/**
 * Recent Files Panel Component
 * Displays recently opened files and folders
 */

import { useState, useEffect } from 'react';
import { recentFilesService, type RecentItem } from '../services/recentFilesService';
import './RecentFilesPanel.css';

interface RecentFilesPanelProps {
  onFileClick: (path: string) => void;
  onFolderClick: (path: string) => void;
  theme?: 'light' | 'dark';
}

const RecentFilesPanel = ({ onFileClick, onFolderClick, theme = 'dark' }: RecentFilesPanelProps) => {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'files' | 'folders'>('all');

  useEffect(() => {
    loadRecentItems();
  }, [filter]);

  const loadRecentItems = () => {
    let items: RecentItem[];
    
    switch (filter) {
      case 'files':
        items = recentFilesService.getRecentFiles();
        break;
      case 'folders':
        items = recentFilesService.getRecentFolders();
        break;
      default:
        items = recentFilesService.getRecentItems();
    }
    
    setRecentItems(items);
  };

  const handleItemClick = (item: RecentItem) => {
    if (item.type === 'file') {
      onFileClick(item.path);
    } else {
      onFolderClick(item.path);
    }
  };

  const handleRemoveItem = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    recentFilesService.removeItem(path);
    loadRecentItems();
  };

  const handleClearAll = () => {
    if (confirm('Clear all recent files and folders?')) {
      recentFilesService.clearAll();
      loadRecentItems();
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={`recent-files-panel ${theme}`}>
      <div className="recent-files-header">
        <h3>Recent Files</h3>
        <div className="recent-files-actions">
          <button
            className="filter-btn"
            onClick={handleClearAll}
            title="Clear all"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="recent-files-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'files' ? 'active' : ''}`}
          onClick={() => setFilter('files')}
        >
          Files
        </button>
        <button
          className={`filter-btn ${filter === 'folders' ? 'active' : ''}`}
          onClick={() => setFilter('folders')}
        >
          Folders
        </button>
      </div>

      <div className="recent-files-list">
        {recentItems.length === 0 ? (
          <div className="no-recent-items">
            <p>No recent {filter === 'all' ? 'items' : filter}</p>
            <span className="hint">Open files or folders to see them here</span>
          </div>
        ) : (
          recentItems.map((item) => (
            <div
              key={item.path}
              className="recent-item"
              onClick={() => handleItemClick(item)}
              title={item.path}
            >
              <span className="recent-item-icon">
                {item.type === 'folder' ? '📁' : '📄'}
              </span>
              <div className="recent-item-info">
                <div className="recent-item-name">{item.name}</div>
                <div className="recent-item-path">{item.path}</div>
              </div>
              <div className="recent-item-meta">
                <span className="recent-item-time">{formatDate(item.lastOpened)}</span>
                <button
                  className="recent-item-remove"
                  onClick={(e) => handleRemoveItem(item.path, e)}
                  title="Remove from recent"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentFilesPanel;
