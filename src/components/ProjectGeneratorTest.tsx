/**
 * Project Generator Test Component
 * Tests the complete flow with a single prompt
 */

import { useState } from 'react';
import { FileSystemService } from '../services/fileSystemService';
import ProjectWorkspaceManager from './ProjectWorkspaceManager';
import Terminal from './Terminal';
import { terminalCommandService } from '../services/terminalCommandService';
import './ProjectGeneratorTest.css';

const ProjectGeneratorTest = () => {
  const [fileSystem] = useState(() => new FileSystemService());
  const [terminalVisible, setTerminalVisible] = useState(false);
  const [testPrompt] = useState('Create a modern weather app with React and TypeScript');

  const handleOpenTerminal = () => {
    setTerminalVisible(true);
  };

  const handleExecuteCommand = async (command: string): Promise<void> => {
    console.log('Executing command:', command);
    
    // Open terminal
    setTerminalVisible(true);
    
    // Execute through terminal service
    try {
      const result = await terminalCommandService.executeCommand(command);
      console.log('Command result:', result);
    } catch (error) {
      console.error('Command execution failed:', error);
    }
  };

  const handleOpenProject = async (projectPath: string): Promise<void> => {
    console.log('Opening project:', projectPath);
    
    // In a real implementation, this would:
    // 1. Update the workspace path
    // 2. Refresh file explorer
    // 3. Open main files in editor
    
    // For now, just log
    console.log('Project opened in editor:', projectPath);
  };

  const handleLoadProjectFiles = async (projectPath: string): Promise<void> => {
    console.log('Loading project files from:', projectPath);
    
    // In a real implementation, this would:
    // 1. Read files from the project directory
    // 2. Load them into the virtual file system
    // 3. Update the file explorer
    
    // Simulate loading files
    try {
      // Create some example files in the virtual file system
      const exampleFiles = [
        { path: '/package.json', content: '{\n  "name": "project",\n  "version": "1.0.0"\n}' },
        { path: '/README.md', content: '# Project\n\nGenerated project' },
        { path: '/src/App.tsx', content: 'import React from "react";\n\nexport default function App() {\n  return <div>Hello</div>;\n}' },
      ];

      for (const file of exampleFiles) {
        fileSystem.createFile(file.path, file.content);
      }

      console.log('Project files loaded into virtual file system');
    } catch (error) {
      console.error('Failed to load project files:', error);
    }
  };

  return (
    <div className="project-generator-test">
      <div className="test-header">
        <h1>🧪 Project Generator Test</h1>
        <div className="test-info">
          <p><strong>Test Prompt:</strong> "{testPrompt}"</p>
          <p><strong>Expected:</strong> AI generates project name, commands, and creates files</p>
        </div>
      </div>

      <div className="test-content">
        {/* Left side: 70% - Editor, File Manager, Terminal */}
        <div className="workspace-section">
          <div className="workspace-header">
            <h3>📁 Workspace</h3>
            <span className="workspace-status">Ready</span>
          </div>
          
          <div className="workspace-content">
            {/* File Explorer placeholder */}
            <div className="file-explorer-placeholder">
              <h4>📂 File Explorer</h4>
              <p>Files will appear here after project creation</p>
            </div>

            {/* Editor placeholder */}
            <div className="editor-placeholder">
              <h4>📝 Editor</h4>
              <p>Files will open here automatically</p>
            </div>
          </div>

          {/* Terminal at bottom */}
          {terminalVisible && (
            <div className="terminal-section">
              <Terminal
                visible={terminalVisible}
                onClose={() => setTerminalVisible(false)}
                problems={[]}
              />
            </div>
          )}
        </div>

        {/* Right side: 30% - Chat Panel (Fixed) */}
        <div className="chat-panel-section">
          <ProjectWorkspaceManager
            fileSystem={fileSystem}
            onOpenTerminal={handleOpenTerminal}
            onExecuteCommand={handleExecuteCommand}
            onOpenProject={handleOpenProject}
            onLoadProjectFiles={handleLoadProjectFiles}
            theme="dark"
          />
        </div>
      </div>

      <div className="test-instructions">
        <h3>📋 Test Instructions:</h3>
        <ol>
          <li>Click "Create New Project" button</li>
          <li>Select a tech stack (e.g., "React + Vite")</li>
          <li>Optionally select a color theme</li>
          <li>Enter the test prompt: "{testPrompt}"</li>
          <li>Press Enter or click Send</li>
          <li>Watch AI generate project name and commands</li>
          <li>Files will be created in Downloads folder</li>
          <li>Commands will execute in the terminal</li>
        </ol>

        <div className="test-checklist">
          <h4>✅ Success Criteria:</h4>
          <ul>
            <li>AI generates a unique project name</li>
            <li>Setup commands are generated</li>
            <li>Files are created in Downloads folder</li>
            <li>File structure is displayed</li>
            <li>Commands can be executed individually or all at once</li>
            <li>Terminal opens and shows command output</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProjectGeneratorTest;
