import React, { useState, useEffect } from 'react';
import { FileEntry, TransferProgress } from '../types/device';
import './DeviceFileSystem.css';

interface DeviceFileSystemProps {
  deviceId: string;
  onError?: (error: string) => void;
}

export const DeviceFileSystem: React.FC<DeviceFileSystemProps> = ({ deviceId, onError }) => {
  const [currentPath, setCurrentPath] = useState<string>('/sdcard');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<FileEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<TransferProgress | null>(null);
  const [showRenameDialog, setShowRenameDialog] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [showCreateDirDialog, setShowCreateDirDialog] = useState<boolean>(false);
  const [newDirName, setNewDirName] = useState<string>('');

  // Load directory contents
  useEffect(() => {
    if (deviceId) {
      loadDirectory(currentPath);
    }
  }, [deviceId, currentPath]);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/filesystem/${deviceId}/list?path=${encodeURIComponent(path)}`
      );
      const data = await response.json();

      if (data.success) {
        // Convert date strings to Date objects
        const entriesWithDates = data.entries.map((entry: any) => ({
          ...entry,
          modified: new Date(entry.modified)
        }));
        setEntries(entriesWithDates);
      } else {
        onError?.(data.error || 'Failed to load directory');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to load directory');
    } finally {
      setLoading(false);
    }
  };

  const handleEntryClick = (entry: FileEntry) => {
    if (entry.type === 'directory') {
      setCurrentPath(entry.path);
      setSelectedEntry(null);
    } else {
      setSelectedEntry(entry);
    }
  };

  const handleEntryDoubleClick = (entry: FileEntry) => {
    if (entry.type === 'directory') {
      setCurrentPath(entry.path);
      setSelectedEntry(null);
    }
  };

  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    setCurrentPath(parentPath);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('devicePath', `${currentPath}/${file.name}`);

    try {
      setUploadProgress({
        bytesTransferred: 0,
        totalBytes: file.size,
        percentage: 0
      });

      const response = await fetch(
        `http://localhost:3001/api/filesystem/${deviceId}/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();

      if (data.success) {
        setUploadProgress(null);
        loadDirectory(currentPath);
      } else {
        setUploadProgress(null);
        onError?.(data.error || 'Failed to upload file');
      }
    } catch (error) {
      setUploadProgress(null);
      onError?.(error instanceof Error ? error.message : 'Failed to upload file');
    }
  };

  const handleDownload = async (entry: FileEntry) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/filesystem/${deviceId}/download?path=${encodeURIComponent(entry.path)}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = entry.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        onError?.(data.error || 'Failed to download file');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to download file');
    }
  };

  const handleDelete = async (entry: FileEntry) => {
    if (!confirm(`Are you sure you want to delete ${entry.name}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/filesystem/${deviceId}/delete`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ path: entry.path })
        }
      );

      const data = await response.json();

      if (data.success) {
        loadDirectory(currentPath);
        setSelectedEntry(null);
      } else {
        onError?.(data.error || 'Failed to delete file');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to delete file');
    }
  };

  const handleRename = async () => {
    if (!selectedEntry || !newName) return;

    const newPath = `${currentPath}/${newName}`;

    try {
      const response = await fetch(
        `http://localhost:3001/api/filesystem/${deviceId}/rename`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            oldPath: selectedEntry.path,
            newPath
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowRenameDialog(false);
        setNewName('');
        loadDirectory(currentPath);
        setSelectedEntry(null);
      } else {
        onError?.(data.error || 'Failed to rename file');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to rename file');
    }
  };

  const handleCreateDirectory = async () => {
    if (!newDirName) return;

    const newPath = `${currentPath}/${newDirName}`;

    try {
      const response = await fetch(
        `http://localhost:3001/api/filesystem/${deviceId}/mkdir`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ path: newPath })
        }
      );

      const data = await response.json();

      if (data.success) {
        setShowCreateDirDialog(false);
        setNewDirName('');
        loadDirectory(currentPath);
      } else {
        onError?.(data.error || 'Failed to create directory');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to create directory');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    // Upload first file only for now
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('devicePath', `${currentPath}/${file.name}`);

    try {
      setUploadProgress({
        bytesTransferred: 0,
        totalBytes: file.size,
        percentage: 0
      });

      const response = await fetch(
        `http://localhost:3001/api/filesystem/${deviceId}/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();

      if (data.success) {
        setUploadProgress(null);
        loadDirectory(currentPath);
      } else {
        setUploadProgress(null);
        onError?.(data.error || 'Failed to upload file');
      }
    } catch (error) {
      setUploadProgress(null);
      onError?.(error instanceof Error ? error.message : 'Failed to upload file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString();
  };

  return (
    <div className="device-filesystem">
      <div className="filesystem-toolbar">
        <button onClick={navigateUp} disabled={currentPath === '/'}>
          ↑ Up
        </button>
        <span className="current-path">{currentPath}</span>
        <button onClick={() => loadDirectory(currentPath)}>
          ↻ Refresh
        </button>
        <label className="upload-button">
          Upload
          <input
            type="file"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        <button onClick={() => setShowCreateDirDialog(true)}>
          + New Folder
        </button>
      </div>

      {uploadProgress && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress.percentage}%` }}
            />
          </div>
          <span>{uploadProgress.percentage.toFixed(0)}%</span>
        </div>
      )}

      <div
        className="filesystem-content"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <table className="file-list">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Modified</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.path}
                  className={`file-entry ${selectedEntry?.path === entry.path ? 'selected' : ''}`}
                  onClick={() => handleEntryClick(entry)}
                  onDoubleClick={() => handleEntryDoubleClick(entry)}
                >
                  <td className="file-name">
                    <span className={`file-icon ${entry.type}`}>
                      {entry.type === 'directory' ? '📁' : '📄'}
                    </span>
                    {entry.name}
                  </td>
                  <td>{entry.type === 'file' ? formatFileSize(entry.size) : '-'}</td>
                  <td>{formatDate(entry.modified)}</td>
                  <td className="permissions">{entry.permissions}</td>
                  <td className="actions">
                    {entry.type === 'file' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(entry);
                        }}
                        className="action-button"
                      >
                        ⬇
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEntry(entry);
                        setNewName(entry.name);
                        setShowRenameDialog(true);
                      }}
                      className="action-button"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry);
                      }}
                      className="action-button delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showRenameDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Rename {selectedEntry?.name}</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New name"
            />
            <div className="dialog-buttons">
              <button onClick={handleRename}>Rename</button>
              <button onClick={() => {
                setShowRenameDialog(false);
                setNewName('');
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateDirDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3>Create New Folder</h3>
            <input
              type="text"
              value={newDirName}
              onChange={(e) => setNewDirName(e.target.value)}
              placeholder="Folder name"
            />
            <div className="dialog-buttons">
              <button onClick={handleCreateDirectory}>Create</button>
              <button onClick={() => {
                setShowCreateDirDialog(false);
                setNewDirName('');
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
