/**
 * Project Workspace Manager
 * Detects if a directory is opened and provides appropriate UI
 */

import { useState, useEffect } from 'react';
import { FileSystemService } from '../services/fileSystemService';
import ProjectAnalysisChat from './ProjectAnalysisChat';
import ProjectGeneratorChat from './ProjectGeneratorChat';
import './ProjectWorkspaceManager.css';

interface ProjectWorkspaceManagerProps {
  fileSystem: FileSystemService;
  onOpenTerminal?: () => void;
  onExecuteCommand?: (command: string) => Promise<void>;
  onOpenProject?: (projectPath: string) => Promise<void>;
  onLoadProjectFiles?: (projectPath: string) => Promise<void>;
  theme?: 'light' | 'dark';
}

interface WorkspaceInfo {
  isOpen: boolean;
  path?: string;
  name?: string;
  isEmpty?: boolean;
  fileCount?: number;
}

const ProjectWorkspaceManager = ({
  fileSystem,
  onOpenTerminal,
  onExecuteCommand,
  onOpenProject,
  onLoadProjectFiles,
  theme = 'dark'
}: ProjectWorkspaceManagerProps) => {
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo>({
    isOpen: false
  });
  const [isChecking, setIsChecking] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    checkWorkspace();
  }, []);

  const checkWorkspace = async () => {
    setIsChecking(true);
    try {
      // Check if root directory exists and has files
      const rootExists = fileSystem.exists('/');
      
      if (rootExists) {
        const files = fileSystem.listDirectory('/');
        const fileCount = files.length;
        const isEmpty = fileCount === 0;
        
        setWorkspaceInfo({
          isOpen: true,
          path: '/',
          name: 'Workspace',
          isEmpty,
          fileCount
        });
        
        // Auto-show chat if workspace is open
        setShowChat(true);
      } else {
        setWorkspaceInfo({
          isOpen: false
        });
      }
    } catch (error) {
      console.error('Error checking workspace:', error);
      setWorkspaceInfo({
        isOpen: false
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleOpenFolder = async () => {
    try {
      // Request directory access
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite'
        });
        
        // Load directory into file system
        await loadDirectoryIntoFileSystem(dirHandle, '/');
        
        // Re-check workspace
        await checkWorkspace();
      } else {
        alert('Your browser does not support the File System Access API. Please use Chrome, Edge, or another compatible browser.');
      }
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  };

  const loadDirectoryIntoFileSystem = async (
    dirHandle: FileSystemDirectoryHandle,
    path: string
  ) => {
    // Use the async iterator properly
    const entries: FileSystemHandle[] = [];
    for await (const entry of (dirHandle as any).values()) {
      entries.push(entry);
    }

    for (const entry of entries) {
      const entryPath = `${path}${entry.name}`;
      
      if (entry.kind === 'file') {
        const file = await (entry as FileSystemFileHandle).getFile();
        const content = await file.text();
        fileSystem.createFile(entryPath, content);
      } else if (entry.kind === 'directory') {
        fileSystem.createDirectory(entryPath);
        await loadDirectoryIntoFileSystem(
          entry as FileSystemDirectoryHandle,
          `${entryPath}/`
        );
      }
    }
  };

  if (isChecking) {
    return (
      <div className={`workspace-manager ${theme}`}>
        <div className="workspace-loading">
          <div className="loading-spinner"></div>
          <p>Checking workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspaceInfo.isOpen) {
    return (
      <div className={`workspace-manager ${theme}`}>
        <div className="workspace-welcome">
          <div className="welcome-icon">📁</div>
          <h2>Welcome to Kalpa AI</h2>
          <p>Open a folder to get started, or create a new project with AI assistance</p>
          
          <div className="welcome-actions">
            <button className="primary-action" onClick={handleOpenFolder}>
              📂 Open Folder
            </button>
            <button className="secondary-action" onClick={() => setShowChat(true)}>
              ✨ Create New Project with AI
            </button>
          </div>

          <div className="welcome-features">
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <h3>AI-Powered Development</h3>
              <p>Get intelligent code suggestions and project generation</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <h3>Integrated Terminal</h3>
              <p>Run commands directly in your browser</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎨</span>
              <h3>Modern UI</h3>
              <p>Beautiful, responsive interface for all devices</p>
            </div>
          </div>
        </div>

        {showChat && (
          <div className="chat-overlay">
            <ProjectGeneratorChat
              onClose={() => setShowChat(false)}
            />
          </div>
        )}
      </div>
    );
  }

  // Workspace is open - show chat interface
  return (
    <div className={`workspace-manager ${theme} workspace-open`}>
      <ProjectAnalysisChat
        fileSystem={fileSystem}
        theme={theme}
        workspacePath={workspaceInfo.path}
        onSendToTerminal={(command: string) => {
          if (onOpenTerminal) {
            onOpenTerminal();
          }
          if (onExecuteCommand) {
            onExecuteCommand(command);
          }
          console.log('Sending to terminal:', command);
        }}
      />
    </div>
  );
};

export default ProjectWorkspaceManager;
