import React, { useState } from 'react';
import { nativeFileSystem } from '../services/nativeFileSystemService';

/**
 * Demo component showing native file system capabilities
 */
export const NativeFileSystemDemo: React.FC = () => {
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const handleOpenWorkspace = async () => {
    const result = await nativeFileSystem.openWorkspace();
    if (result.success && result.data) {
      setWorkspace(result.data);
      setStatus(`Opened workspace: ${result.data}`);
      loadFiles(result.data);
    } else {
      setStatus(`Error: ${result.error}`);
    }
  };

  const loadFiles = async (dirPath: string) => {
    const result = await nativeFileSystem.readDirectory(dirPath);
    if (result.success && result.data) {
      setFiles(result.data);
    } else {
      setStatus(`Error loading files: ${result.error}`);
    }
  };

  const handleFileClick = async (filePath: string, type: string) => {
    if (type === 'directory') {
      loadFiles(filePath);
      return;
    }

    setSelectedFile(filePath);
    const result = await nativeFileSystem.readFile(filePath);
    if (result.success && result.data) {
      setFileContent(result.data);
      setStatus(`Loaded: ${filePath}`);
    } else {
      setStatus(`Error reading file: ${result.error}`);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;

    const result = await nativeFileSystem.writeFile(selectedFile, fileContent);
    if (result.success) {
      setStatus(`Saved: ${selectedFile}`);
    } else {
      setStatus(`Error saving file: ${result.error}`);
    }
  };

  const handleCreateFile = async () => {
    if (!workspace) return;

    const fileName = prompt('Enter file name:');
    if (!fileName) return;

    const filePath = `${workspace}/${fileName}`;
    const result = await nativeFileSystem.writeFile(filePath, '// New file\n');
    if (result.success) {
      setStatus(`Created: ${filePath}`);
      loadFiles(workspace);
    } else {
      setStatus(`Error creating file: ${result.error}`);
    }
  };

  const handleCreateFolder = async () => {
    if (!workspace) return;

    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    const folderPath = `${workspace}/${folderName}`;
    const result = await nativeFileSystem.createDirectory(folderPath);
    if (result.success) {
      setStatus(`Created folder: ${folderPath}`);
      loadFiles(workspace);
    } else {
      setStatus(`Error creating folder: ${result.error}`);
    }
  };

  const handleDelete = async (filePath: string) => {
    if (!confirm(`Delete ${filePath}?`)) return;

    const result = await nativeFileSystem.delete(filePath);
    if (result.success) {
      setStatus(`Deleted: ${filePath}`);
      if (workspace) loadFiles(workspace);
    } else {
      setStatus(`Error deleting: ${result.error}`);
    }
  };

  if (!nativeFileSystem.isAvailable()) {
    return (
      <div style={{ padding: '20px', color: '#ff6b6b' }}>
        <h2>Native File System Not Available</h2>
        <p>Please use Electron or a browser that supports File System Access API (Chrome/Edge)</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Native File System Demo</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleOpenWorkspace} style={{ marginRight: '10px' }}>
          Open Workspace
        </button>
        <button onClick={handleCreateFile} disabled={!workspace} style={{ marginRight: '10px' }}>
          New File
        </button>
        <button onClick={handleCreateFolder} disabled={!workspace}>
          New Folder
        </button>
      </div>

      {workspace && (
        <div style={{ marginBottom: '10px', color: '#4CAF50' }}>
          Workspace: {workspace}
        </div>
      )}

      {status && (
        <div style={{ marginBottom: '10px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
          {status}
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1, border: '1px solid #ccc', padding: '10px', maxHeight: '400px', overflow: 'auto' }}>
          <h3>Files</h3>
          {files.map((file, index) => (
            <div
              key={index}
              style={{
                padding: '5px',
                cursor: 'pointer',
                background: selectedFile === file.path ? '#e3f2fd' : 'transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span onClick={() => handleFileClick(file.path, file.type)}>
                {file.type === 'directory' ? '📁' : '📄'} {file.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(file.path);
                }}
                style={{ fontSize: '12px', padding: '2px 8px' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        <div style={{ flex: 2, border: '1px solid #ccc', padding: '10px' }}>
          <h3>Editor</h3>
          {selectedFile && (
            <>
              <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                {selectedFile}
              </div>
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                style={{
                  width: '100%',
                  height: '300px',
                  fontFamily: 'monospace',
                  padding: '10px',
                  border: '1px solid #ddd'
                }}
              />
              <button onClick={handleSaveFile} style={{ marginTop: '10px' }}>
                Save File
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
