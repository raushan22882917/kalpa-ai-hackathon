import { useState, useEffect, useCallback } from 'react';
import { FileSystemService, FileNode } from '../services/fileSystemService';
import { nativeFileSystem } from '../services/nativeFileSystemService';
import { notificationService } from '../services/notificationService';
import { recentFilesService } from '../services/recentFilesService';
import './FileExplorer.css';

interface OutlineItem {
  name: string;
  kind: string;
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  children?: OutlineItem[];
}

export interface FileExplorerProps {
  fileSystem: FileSystemService;
  onFileClick: (path: string, content: string) => void;
  theme?: 'light' | 'dark';
  workspacePath?: string | null;
  currentFile?: { fileName: string; content: string } | null;
  monacoEditor?: any;
  monaco?: any;
  onWorkspaceChange?: (workspacePath: string | null) => void;
}

interface TreeNodeProps {
  node: FileNode;
  path: string;
  fileSystem: FileSystemService;
  onFileClick: (path: string, content: string) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode, path: string) => void;
  level: number;
  selectedPath?: string;
}

const TreeNode = ({ node, path, fileSystem, onFileClick, onContextMenu, level, selectedPath }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<FileNode[]>([]);
  const isSelected = selectedPath === path;

  // Real-time file watching - refresh every 2 seconds when expanded
  useEffect(() => {
    if (node.type === 'directory' && isExpanded) {
      const loadChildren = () => {
        try {
          const items = fileSystem.listDirectory(path);
          setChildren(items.sort((a, b) => {
            // Directories first, then files
            if (a.type !== b.type) {
              return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          }));
        } catch (error) {
          console.error('Error listing directory:', error);
          setChildren([]);
        }
      };

      // Initial load
      loadChildren();

      // Set up polling for real-time updates
      const interval = setInterval(loadChildren, 2000);

      return () => clearInterval(interval);
    }
  }, [node, path, fileSystem, isExpanded]);

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsExpanded(!isExpanded);
    } else {
      try {
        const content = fileSystem.readFile(path);
        onFileClick(path, content);
      } catch (error) {
        console.error('Error reading file:', error);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, node, path);
  };

  const getFileIcon = () => {
    if (node.type === 'directory') {
      return isExpanded ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="folder-icon">
          <path d="M1.5 1h4.07l.85.85.36.15H14.5l.5.5v10l-.5.5h-13l-.5-.5v-11l.5-.5zm6.5 1H2v10h12V3H7.5l-.86-.85L6.29 2H2V1h4.29l.85.85.36.15H14v.5l-.5.5H8z"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="folder-icon">
          <path d="M14.5 2H7.71l-.85-.85L6.51 1h-5l-.5.5v11l.5.5h13l.5-.5v-9l-.5-.5zM13 12H2V2h4.29l.85.85.36.15H13v9z"/>
        </svg>
      );
    }
    
    // File type icons
    const ext = node.name.split('.').pop()?.toLowerCase();
    const fileName = node.name.toLowerCase();
    
    // Special files
    if (fileName === 'package.json') return '📦';
    if (fileName === '.gitignore' || fileName === '.git') return '🔧';
    if (fileName === 'readme.md' || fileName === 'readme') return '📖';
    if (fileName.startsWith('.env')) return '🔐';
    if (fileName === 'dockerfile') return '🐳';
    
    // By extension
    switch (ext) {
      case 'js':
      case 'jsx':
        return '🟨';
      case 'ts':
      case 'tsx':
        return '🔷';
      case 'json':
        return '📋';
      case 'html':
        return '🌐';
      case 'css':
      case 'scss':
      case 'sass':
        return '🎨';
      case 'md':
        return '📝';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return '🖼️';
      case 'py':
        return '🐍';
      case 'java':
        return '☕';
      case 'cpp':
      case 'c':
      case 'h':
        return '⚙️';
      case 'go':
        return '🔵';
      case 'rs':
        return '🦀';
      case 'sh':
      case 'bash':
        return '💻';
      case 'yml':
      case 'yaml':
        return '⚙️';
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="file-icon">
            <path d="M13.5 1H6.5l-.5.5V3h1V2h6v11h-6v-1H6v1.5l.5.5h7l.5-.5v-12l-.5-.5z"/>
            <path d="M5 4v8H4V4h1zm-2 0v8H2V4h1z"/>
          </svg>
        );
    }
  };

  return (
    <div className="tree-node">
      <div
        className={`tree-node-label ${node.type} ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <span className="tree-node-icon">{getFileIcon()}</span>
        <span className="tree-node-name">{node.name}</span>
      </div>
      {node.type === 'directory' && isExpanded && (
        <div className="tree-node-children">
          {children.map((child) => {
            const childPath = path === '/' ? `/${child.name}` : `${path}/${child.name}`;
            return (
              <TreeNode
                key={childPath}
                node={child}
                path={childPath}
                fileSystem={fileSystem}
                onFileClick={onFileClick}
                onContextMenu={onContextMenu}
                level={level + 1}
                selectedPath={selectedPath}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ContextMenuProps {
  x: number;
  y: number;
  node: FileNode;
  path: string;
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const ContextMenu = ({ x, y, node, onClose, onNewFile, onNewFolder, onRename, onDelete }: ContextMenuProps) => {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div
      className="context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {node.type === 'directory' && (
        <>
          <div className="context-menu-item" onClick={onNewFile}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M9.5 1.1l3.4 3.5.1.4v2h-1V6H8V2H3v11h4v1H2.5l-.5-.5v-12l.5-.5h6.7l.3.1zM9 2v3h2.9L9 2zm4 14h-1v-3H9v-1h3V9h1v3h3v1h-3v3z"/>
            </svg>
            <span>New File</span>
          </div>
          <div className="context-menu-item" onClick={onNewFolder}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14.5 2H7.71l-.85-.85L6.51 1h-5l-.5.5v11l.5.5H7v-1H1.99V6h4.49l.35-.15.86-.86H14v1.5l-.001.51h1.011V2.5L14.5 2zm-.51 2h-6.5l-.35.15-.86.86H2V2h4.29l.85.85.36.15H14l-.01.5v.5zM13 16h-1v-3H9v-1h3V9h1v3h3v1h-3v3z"/>
            </svg>
            <span>New Folder</span>
          </div>
          <div className="context-menu-divider" />
        </>
      )}
      <div className="context-menu-item" onClick={onRename}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.23 1h-1.46L3.52 9.25l-.16.22L1 13.59 2.41 15l4.12-2.36.22-.16L15 4.23V2.77L13.23 1zM2.41 13.59l1.51-3 1.45 1.45-2.96 1.55zm3.83-2.06L4.47 9.76l8-8 1.77 1.77-8 8z"/>
        </svg>
        <span>Rename</span>
      </div>
      <div className="context-menu-item" onClick={onDelete}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z"/>
        </svg>
        <span>Delete</span>
      </div>
    </div>
  );
};

const FileExplorer = ({ 
  fileSystem, 
  onFileClick, 
  theme = 'dark',
  workspacePath,
  currentFile,
  monacoEditor,
  monaco,
  onWorkspaceChange
}: FileExplorerProps) => {
  const [rootChildren, setRootChildren] = useState<FileNode[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileNode;
    path: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    explorer: true,
    outline: true,
    timeline: true,
  });
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | undefined>();

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    try {
      const items = fileSystem.listDirectory('/');
      setRootChildren(items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }));
    } catch (error) {
      console.error('Error loading root directory:', error);
      setRootChildren([]);
    }
  }, [fileSystem, refreshKey]);

  // Load outline from Monaco editor
  useEffect(() => {
    const loadOutline = async () => {
      if (!monacoEditor || !monaco || !currentFile) {
        setOutlineItems([]);
        return;
      }

      try {
        const model = monacoEditor.getModel();
        if (!model) {
          setOutlineItems([]);
          return;
        }

        // Get document symbols using Monaco's document symbol provider
        const providers = monaco.languages.getDocumentSymbolProvider(model.getLanguageId());
        if (!providers || providers.length === 0) {
          setOutlineItems([]);
          return;
        }

        // Use the first provider
        const provider = providers[0];
        const symbols = await provider.provideDocumentSymbols(model, monaco.CancellationToken.None);

        if (symbols && symbols.length > 0) {
          // Convert to outline items
          const items: OutlineItem[] = symbols.map((symbol: any) => ({
            name: symbol.name,
            kind: symbol.kind?.toString() || '0',
            range: symbol.range || symbol.location?.range || {
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: 1,
              endColumn: 1,
            },
            children: symbol.children?.map((child: any) => ({
              name: child.name,
              kind: child.kind?.toString() || '0',
              range: child.range || child.location?.range || {
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: 1,
                endColumn: 1,
              },
            })),
          }));
          setOutlineItems(items);
        } else {
          // Fallback: try to extract basic structure from the file
          const content = model.getValue();
          const lines = content.split('\n');
          const basicItems: OutlineItem[] = [];
          
          // Simple regex patterns for common structures
          const functionPattern = /^(export\s+)?(async\s+)?function\s+(\w+)/;
          const classPattern = /^(export\s+)?class\s+(\w+)/;
          
          lines.forEach((line: string, index: number) => {
            const funcMatch = line.match(functionPattern);
            if (funcMatch) {
              basicItems.push({
                name: funcMatch[3] || funcMatch[2],
                kind: '12', // Function
                range: {
                  startLineNumber: index + 1,
                  startColumn: 1,
                  endLineNumber: index + 1,
                  endColumn: line.length,
                },
              });
            }
            
            const classMatch = line.match(classPattern);
            if (classMatch) {
              basicItems.push({
                name: classMatch[2],
                kind: '5', // Class
                range: {
                  startLineNumber: index + 1,
                  startColumn: 1,
                  endLineNumber: index + 1,
                  endColumn: line.length,
                },
              });
            }
          });
          
          setOutlineItems(basicItems);
        }
      } catch (error) {
        console.error('Error loading outline:', error);
        setOutlineItems([]);
      }
    };

    loadOutline();
    
    // Also listen for model changes
    if (monacoEditor) {
      const model = monacoEditor.getModel();
      if (model) {
        const disposable = model.onDidChangeContent(() => {
          loadOutline();
        });
        return () => disposable.dispose();
      }
    }
  }, [monacoEditor, monaco, currentFile?.fileName]);

  const getWorkspaceName = () => {
    if (!workspacePath) return 'No Folder Opened';
    const parts = workspacePath.split(/[/\\]/);
    return parts[parts.length - 1] || workspacePath;
  };

  const toggleSection = (section: 'explorer' | 'outline' | 'timeline') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleOutlineClick = (item: OutlineItem) => {
    if (monacoEditor && item.range) {
      monacoEditor.setPosition({
        lineNumber: item.range.startLineNumber,
        column: item.range.startColumn,
      });
      monacoEditor.revealLineInCenter(item.range.startLineNumber);
    }
  };

  const getSymbolIcon = (kind: string) => {
    // Monaco SymbolKind enum values
    const kindNum = parseInt(kind);
    if (kindNum >= 0 && kindNum <= 25) {
      const icons = ['📄', '📦', '📁', '🔧', '⚙️', '🔌', '🎨', '📝', '📚', '🔍', '📊', '🎯', '🔗', '📌', '📍', '🎪', '🏷️', '📋', '🔖', '📑', '📃', '📗', '📘', '📙', '📕', '📔'];
      return icons[kindNum] || '📄';
    }
    return '📄';
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode, path: string) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
      path,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleNewFile = () => {
    if (!contextMenu) return;
    
    const fileName = prompt('Enter file name:');
    if (fileName) {
      try {
        const newPath = contextMenu.path === '/' 
          ? `/${fileName}` 
          : `${contextMenu.path}/${fileName}`;
        fileSystem.createFile(newPath, '');
        refresh();
      } catch (error) {
        alert(`Error creating file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    closeContextMenu();
  };

  const handleNewFolder = () => {
    if (!contextMenu) return;
    
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      try {
        const newPath = contextMenu.path === '/' 
          ? `/${folderName}` 
          : `${contextMenu.path}/${folderName}`;
        fileSystem.createDirectory(newPath);
        refresh();
      } catch (error) {
        alert(`Error creating folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    closeContextMenu();
  };

  const handleRename = () => {
    if (!contextMenu) return;
    
    const newName = prompt('Enter new name:', contextMenu.node.name);
    if (newName && newName !== contextMenu.node.name) {
      try {
        fileSystem.rename(contextMenu.path, newName);
        refresh();
      } catch (error) {
        alert(`Error renaming: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    closeContextMenu();
  };

  const handleDelete = () => {
    if (!contextMenu) return;
    
    const confirmDelete = confirm(`Are you sure you want to delete "${contextMenu.node.name}"?`);
    if (confirmDelete) {
      try {
        fileSystem.delete(contextMenu.path);
        refresh();
      } catch (error) {
        alert(`Error deleting: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    closeContextMenu();
  };

  const handleOpenFile = async () => {
    try {
      // Use File System Access API to open a file
      const [fileHandle] = await (window as any).showOpenFilePicker({
        multiple: false,
      });
      
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      // Add file to virtual file system
      const fileName = file.name;
      const filePath = `/${fileName}`;
      
      if (fileSystem.exists(filePath)) {
        fileSystem.updateFile(filePath, content);
      } else {
        fileSystem.createFile(filePath, content);
      }
      
      refresh();
      onFileClick(filePath, content);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error opening file:', error);
        alert('Error opening file. Make sure your browser supports the File System Access API.');
      }
    }
  };

  const handleOpenFolder = async () => {
    try {
      // Use native file system service to open workspace
      const result = await nativeFileSystem.openWorkspace();
      
      if (result.success && result.data) {
        // Clear virtual file system first to remove any old/default project files
        fileSystem.clear();
        
        // Notify parent component about workspace change
        if (onWorkspaceChange) {
          onWorkspaceChange(result.data);
        }
        
        notificationService.success(`Opened folder: ${result.data}`);
        
        // Add to recent folders
        recentFilesService.addFolder(result.data);
        
        // Load ALL files from the opened folder into the virtual file system
        try {
          // Recursive function to load all files and directories
          const loadFilesRecursively = async (dirPath: string, basePath: string = '') => {
            const dirEntries = await nativeFileSystem.readDirectory(dirPath);
            if (dirEntries.success && dirEntries.data) {
              for (const entry of dirEntries.data) {
                // Skip hidden files and common ignore patterns (but allow .gitignore, .env, etc.)
                if (entry.name.startsWith('.') && 
                    entry.name !== '.gitignore' && 
                    entry.name !== '.env' && 
                    entry.name !== '.env.example' &&
                    !entry.name.startsWith('.vscode') &&
                    !entry.name.startsWith('.devai')) {
                  continue;
                }
                
                const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
                
                if (entry.type === 'file') {
                  try {
                    const fileResult = await nativeFileSystem.readFile(entry.path);
                    if (fileResult.success && fileResult.data !== undefined) {
                      const virtualPath = `/${relativePath}`;
                      fileSystem.createFile(virtualPath, fileResult.data);
                    }
                  } catch (fileError) {
                    console.warn(`Could not read file ${entry.path}:`, fileError);
                    // Continue with other files
                  }
                } else if (entry.type === 'directory') {
                  const virtualDirPath = `/${relativePath}`;
                  try {
                    fileSystem.createDirectory(virtualDirPath);
                    // Recursively load subdirectories
                    await loadFilesRecursively(entry.path, relativePath);
                  } catch (dirError) {
                    console.warn(`Could not create directory ${virtualDirPath}:`, dirError);
                  }
                }
              }
            }
          };
          
          // Start loading from the root of the opened folder
          await loadFilesRecursively(result.data);
          
          notificationService.info('Folder loaded successfully');
        } catch (loadError) {
          console.warn('Could not load all files from folder:', loadError);
          notificationService.warning('Some files could not be loaded. The folder is still opened.');
        }
        
        refresh();
      } else {
        if (result.error && !result.error.includes('cancelled') && !result.error.includes('AbortError')) {
          notificationService.warning(result.error || 'No folder selected');
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError' && (error as Error).message !== 'Folder selection cancelled') {
        console.error('Error opening folder:', error);
        notificationService.error('Failed to open folder. Make sure your browser supports folder access or use Electron mode.');
      }
    }
  };

  return (
    <div className={`file-explorer ${theme}`}>
      {/* Workspace Name */}
      <div className="workspace-name">
        <span className="workspace-icon">📁</span>
        <span className="workspace-text" title={workspacePath || 'No folder opened'}>
          {getWorkspaceName()}
        </span>
      </div>

      {/* Explorer Section */}
      <div className="explorer-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('explorer')}
        >
          <span className="section-toggle">
            {expandedSections.explorer ? '▼' : '▶'}
          </span>
          <span className="section-title">EXPLORER</span>
          <div className="header-actions">
            <button 
              className="action-button refresh-button" 
              onClick={(e) => {
                e.stopPropagation();
                refresh();
                notificationService.success('File tree refreshed');
              }}
              title="Refresh File Tree (Real-time updates every 2s)"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.451 5.609l-.579-.939-1.068.812-.076.094c-.335.415-.927 1.341-1.124 2.876l-.021.165.033.163.071.345c0 1.654-1.346 3-3 3-.795 0-1.545-.311-2.107-.868-.563-.567-.873-1.317-.873-2.111 0-1.431 1.007-2.632 2.351-2.929v2.498l2.528-2.134-2.528-2.134v2.11C4.919 6.868 3.5 8.489 3.5 10.5c0 1.06.421 2.078 1.172 2.828A4.008 4.008 0 0 0 7.5 14.5c2.206 0 4-1.794 4-4 .218-1.618.845-2.811 1.258-3.45l.693.548z"/>
              </svg>
            </button>
            <button 
              className="action-button" 
              onClick={(e) => {
                e.stopPropagation();
                const fileName = prompt('Enter file name:');
                if (fileName) {
                  try {
                    fileSystem.createFile(`/${fileName}`, '');
                    refresh();
                  } catch (error) {
                    alert(`Error creating file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }
              }}
              title="New File"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9.5 1.1l3.4 3.5.1.4v2h-1V6H8V2H3v11h4v1H2.5l-.5-.5v-12l.5-.5h6.7l.3.1zM9 2v3h2.9L9 2zm4 14h-1v-3H9v-1h3V9h1v3h3v1h-3v3z"/>
              </svg>
            </button>
            <button 
              className="action-button" 
              onClick={(e) => {
                e.stopPropagation();
                const folderName = prompt('Enter folder name:');
                if (folderName) {
                  try {
                    fileSystem.createDirectory(`/${folderName}`);
                    refresh();
                  } catch (error) {
                    alert(`Error creating folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }
              }}
              title="New Folder"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14.5 2H7.71l-.85-.85L6.51 1h-5l-.5.5v11l.5.5H7v-1H1.99V6h4.49l.35-.15.86-.86H14v1.5l-.001.51h1.011V2.5L14.5 2zm-.51 2h-6.5l-.35.15-.86.86H2V2h4.29l.85.85.36.15H14l-.01.5v.5zM13 16h-1v-3H9v-1h3V9h1v3h3v1h-3v3z"/>
              </svg>
            </button>
            <button 
              className="action-button" 
              onClick={(e) => {
                e.stopPropagation();
                refresh();
              }}
              title="Refresh Explorer"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.451 5.609l-.579-.939-1.068.812-.076.094c-.335.415-.927 1.341-1.124 2.876l-.021.165.033.163.071.345c0 1.654-1.346 3-3 3-.795 0-1.545-.311-2.107-.868-.563-.567-.873-1.317-.873-2.111 0-1.431 1.007-2.632 2.351-2.929v2.498l2.528-2.134-2.528-2.133v2.209c-2.156.321-3.851 2.188-3.851 4.489 0 1.264.492 2.451 1.386 3.346.894.9 2.081 1.396 3.346 1.396 2.609 0 4.731-2.122 4.731-4.732v-.463c.232-2.002 1.117-3.342 1.621-4.001l.099-.134zM9.734 3.659L7.206 5.793l2.528 2.134V5.429c.001 0 .001 0 .001-.001v-.002l-.001.033z"/>
              </svg>
            </button>
            <button 
              className="action-button" 
              onClick={(e) => {
                e.stopPropagation();
                handleOpenFolder();
              }}
              title="Open Folder"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14.5 2H7.71l-.85-.85L6.51 1h-5l-.5.5v11l.5.5H7v-1H1.99V6h4.49l.35-.15.86-.86H14v1.5l-.001.51h1.011V2.5L14.5 2zm-.51 2h-6.5l-.35.15-.86.86H2V2h4.29l.85.85.36.15H14l-.01.5v.5zM11 9h5v1h-5v5h-1v-5H5V9h5V4h1v5z"/>
              </svg>
            </button>
          </div>
        </div>
        {expandedSections.explorer && (
          <div className="file-explorer-tree">
            {rootChildren.map((child) => {
              const childPath = `/${child.name}`;
              return (
                <TreeNode
                  key={childPath}
                  node={child}
                  path={childPath}
                  fileSystem={fileSystem}
                  onFileClick={(path, content) => {
                    setSelectedFilePath(path);
                    onFileClick(path, content);
                  }}
                  onContextMenu={handleContextMenu}
                  level={0}
                  selectedPath={selectedFilePath}
                />
              );
            })}
            {rootChildren.length === 0 && (
              <div className="empty-explorer">
                <p>No files or folders</p>
                <p className="hint">Right-click to create files</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Outline Section */}
      <div className="outline-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('outline')}
        >
          <span className="section-toggle">
            {expandedSections.outline ? '▼' : '▶'}
          </span>
          <span className="section-title">OUTLINE</span>
        </div>
        {expandedSections.outline && (
          <div className="outline-tree">
            {outlineItems.length > 0 ? (
              outlineItems.map((item, index) => (
                <div key={index} className="outline-item">
                  <div 
                    className="outline-item-label"
                    onClick={() => handleOutlineClick(item)}
                    title={`${item.name} (Line ${item.range.startLineNumber})`}
                  >
                    <span className="outline-icon">{getSymbolIcon(item.kind)}</span>
                    <span className="outline-name">{item.name}</span>
                  </div>
                  {item.children && item.children.length > 0 && (
                    <div className="outline-children">
                      {item.children.map((child, childIndex) => (
                        <div 
                          key={childIndex}
                          className="outline-item outline-item-child"
                          onClick={() => handleOutlineClick(child)}
                          title={`${child.name} (Line ${child.range.startLineNumber})`}
                        >
                          <span className="outline-icon">{getSymbolIcon(child.kind)}</span>
                          <span className="outline-name">{child.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-outline">
                <p>No symbols found</p>
                <p className="hint">Open a file to see outline</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div className="timeline-section">
        <div 
          className="section-header"
          onClick={() => toggleSection('timeline')}
        >
          <span className="section-toggle">
            {expandedSections.timeline ? '▼' : '▶'}
          </span>
          <span className="section-title">TIMELINE</span>
        </div>
        {expandedSections.timeline && (
          <div className="timeline-tree">
            <div className="empty-timeline">
              <p>No timeline data</p>
              <p className="hint">File history will appear here</p>
            </div>
          </div>
        )}
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          path={contextMenu.path}
          onClose={closeContextMenu}
          onNewFile={handleNewFile}
          onNewFolder={handleNewFolder}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default FileExplorer;
