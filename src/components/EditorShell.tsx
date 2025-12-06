import { useState, useEffect, useRef } from 'react';
import Editor, { BeforeMount } from '@monaco-editor/react';
import type { EditorShellProps, EditorState } from '../types/editor';
import { configureMonacoEditor, getLanguageFromFileName } from '../services/monacoConfig';
import { isTerminalSupported } from '../services/terminalService';
import { registerKeybindings, keybindingCustomizationService } from '../services/keybindingService';
import { themeService } from '../services/themeService';
import { themeExtensionService } from '../services/themeExtensionService';
import { extensionManager } from '../extensions/extensionManager';
import { AIAssistantExtension } from '../extensions/ai-assistant';
import { editorStateService } from '../services/editorStateService';
import { FileSystemService } from '../services/fileSystemService';
import { FileDownloadService } from '../services/fileDownloadService';
import { notificationService } from '../services/notificationService';
import { recentFilesService } from '../services/recentFilesService';
import ActivityBar, { type ActivityView } from './ActivityBar';
import Sidebar from './Sidebar';
import Terminal from './Terminal';
import FloatingPreview from './FloatingPreview';
import EditorToolbar from './EditorToolbar';
import MobilePreview from './MobilePreview';
import CommandPalette, { type Command } from './CommandPalette';
import ProjectAnalysisChat from './ProjectAnalysisChat';
import ResizableSplitView from './ResizableSplitView';
import WelcomeScreen from './WelcomeScreen';
import type { Message } from '../extensions/ai-assistant/aiService';
import { codeExecutionService } from '../services/codeExecutionService';
import { conversationHistoryService } from '../services/conversationHistoryService';
import { nativeFileSystem } from '../services/nativeFileSystemService';

const EditorShell = ({ config, file }: EditorShellProps) => {
  const [editorState, setEditorState] = useState<EditorState>({
    isLoading: true,
    error: null,
    isInitialized: false,
  });

  const [terminalVisible, setTerminalVisible] = useState(false);
  const [terminalSupported, setTerminalSupported] = useState(false);
  const [currentFile, setCurrentFile] = useState(file);
  const [openFiles, setOpenFiles] = useState<Array<{ fileName: string; content: string; language: string }>>([]);
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  const [fileSystem] = useState(() => new FileSystemService());
  const [activeView, setActiveView] = useState<ActivityView>('explorer');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('http://localhost:5173');
  const [chatVisible, setChatVisible] = useState(false);
  const [workspacePath, setWorkspacePath] = useState<string | undefined>(undefined);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isRunning, setIsRunning] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const [problems, setProblems] = useState<Array<{
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    source?: string;
  }>>([]);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  useEffect(() => {
    // Initialize editor
    const initializeEditor = async () => {
      try {
        setEditorState({
          isLoading: true,
          error: null,
          isInitialized: false,
        });

        // Check terminal support
        const terminalSupport = isTerminalSupported();
        setTerminalSupported(terminalSupport);

        // Detect workspace path (for Electron or browser)
        let detectedWorkspace: string | undefined = undefined;
        
        if ((window as any).electron) {
          // In Electron, we can get the current working directory
          // This will be set when user opens a folder
          const cwd = typeof process !== 'undefined' && process?.cwd ? process.cwd() : undefined;
          detectedWorkspace = cwd;
        } else {
          // In browser, the terminal will start in the server's working directory
          // which is the project root by default
          detectedWorkspace = undefined;
        }

        // Don't auto-create default project - let user open a folder manually
        // This prevents showing "my-project" when user opens their own folder

        setWorkspacePath(detectedWorkspace);

        // Initialize editor state service for offline persistence
        editorStateService.initialize(5000); // Auto-save every 5 seconds

        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 100));

        setEditorState({
          isLoading: false,
          error: null,
          isInitialized: true,
        });
      } catch (error) {
        setEditorState({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize editor',
          isInitialized: false,
        });
      }
    };

    initializeEditor();

    // Add keyboard shortcuts
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Command Palette: Ctrl+Shift+P
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setCommandPaletteVisible(true);
      }
      
      // Save: Ctrl+S
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && !e.shiftKey) {
        e.preventDefault();
        if (currentFile) {
          try {
            FileDownloadService.downloadFile(
              currentFile.fileName,
              currentFile.content,
              FileDownloadService.getMimeType(currentFile.fileName)
            );
            notificationService.success(`Saved ${currentFile.fileName}`);
          } catch (error) {
            notificationService.error('Failed to save file');
          }
        }
      }
      
      // Save As: Ctrl+Shift+S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (currentFile) {
          try {
            await FileDownloadService.saveFileWithFileSystem(
              currentFile.fileName,
              currentFile.content
            );
            notificationService.success('File saved');
          } catch (error) {
            if ((error as Error).name !== 'AbortError') {
              notificationService.error('Failed to save file');
            }
          }
        }
      }
      
      // Open: Ctrl+O
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        try {
          const file = await FileDownloadService.uploadFile();
          handleFileClick(file.name, file.content);
          notificationService.success(`Opened ${file.name}`);
        } catch (error) {
          if ((error as Error).message !== 'File selection cancelled') {
            notificationService.error('Failed to open file');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      editorStateService.destroy();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync workspace path with conversation history service
  useEffect(() => {
    if (workspacePath) {
      conversationHistoryService.setWorkspacePath(workspacePath);
      // Also update native file system service
      if ((window as any).electron) {
        // In Electron, the native file system service should already have it
        // but we'll ensure it's set
        (nativeFileSystem as any).currentWorkspace = workspacePath;
      }
    } else {
      conversationHistoryService.setWorkspacePath(null);
    }
  }, [workspacePath]);

  // Handle Electron folder open events
  useEffect(() => {
    if ((window as any).electron) {
      const handleFolderOpen = (folderPath: string) => {
        console.log('Folder opened:', folderPath);
        setWorkspacePath(folderPath);
        notificationService.success(`Opened folder: ${folderPath}`);
        
        // Add to recent folders cache
        recentFilesService.addFolder(folderPath);
        
        // Show folder path in terminal if visible
        if (terminalVisible) {
          // Terminal will show the workspace path automatically
        }
      };

      // Listen for folder open events from Electron menu
      (window as any).electron.onMenuOpenFolder?.(handleFolderOpen);
    }
  }, [terminalVisible]);

  // Update theme when config changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      themeService.setTheme(config.theme);
    }
  }, [config.theme]);

  // Update font size when config changes
  useEffect(() => {
    if (editorRef.current && config.fontSize) {
      editorRef.current.updateOptions({
        fontSize: config.fontSize,
      });
    }
  }, [config.fontSize]);

  // Update AI backend configuration when it changes
  useEffect(() => {
    const extension = extensionManager.getExtension('ai-assistant') as AIAssistantExtension | undefined;
    if (extension) {
      extension.updateConfig({
        aiBackendUrl: config.aiBackendUrl,
        apiKey: config.apiKey,
        offlineMode: config.offlineMode,
      });
    }
  }, [config.aiBackendUrl, config.apiKey, config.offlineMode]);

  const handleEditorWillMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco;
    configureMonacoEditor(monaco);
    
    // Initialize theme extension service
    themeExtensionService.initialize(monaco);
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Register standard keybindings
    if (monacoRef.current && editor) {
      registerKeybindings(monacoRef.current, editor);

      // Initialize keybinding customization service
      keybindingCustomizationService.initialize(monacoRef.current, editor);

      // Initialize theme service
      themeService.initialize(monacoRef.current, editor);
      themeService.setTheme(config.theme);

      // Track cursor position
      editor.onDidChangeCursorPosition((e: any) => {
        setCursorPosition({
          line: e.position.lineNumber,
          column: e.position.column,
        });
      });

      // Listen for marker changes (problems/diagnostics)
      const updateProblems = () => {
        const model = editor.getModel();
        if (model && monacoRef.current) {
          const markers = monacoRef.current.editor.getModelMarkers({ resource: model.uri });
          const problemsList = markers.map((marker: any) => ({
            file: model.uri.path.split('/').pop() || 'unknown',
            line: marker.startLineNumber,
            column: marker.startColumn,
            severity: marker.severity === 8 ? 'error' : marker.severity === 4 ? 'warning' : 'info',
            message: marker.message,
            source: marker.source || 'editor'
          }));
          setProblems(problemsList);
        }
      };

      // Update problems initially and on model content changes
      updateProblems();
      
      // Listen to marker changes directly
      const markerDisposable = monacoRef.current.editor.onDidChangeMarkers((uris: any[]) => {
        const model = editor.getModel();
        if (model && uris.some((uri: any) => uri.toString() === model.uri.toString())) {
          updateProblems();
        }
      });
      
      // Also update on content changes (for immediate feedback)
      const contentDisposable = editor.onDidChangeModelContent(() => {
        setTimeout(updateProblems, 500); // Debounce
      });
      
      // Store disposables for cleanup
      (editor as any)._markerDisposable = markerDisposable;
      (editor as any)._contentDisposable = contentDisposable;

      // Initialize extension manager and register AI Assistant extension
      extensionManager.initialize(monacoRef.current, editor, {
        aiBackendUrl: config.aiBackendUrl,
        apiKey: config.apiKey,
        onShowPanel: () => {
          // AI panel is always visible in the new layout
        },
        onAddMessage: (_message: Message) => {
          // AI Panel removed
        },
        onGetConversationContext: () => {
          // AI Panel removed
          return [];
        },
      });

      const aiExtension = new AIAssistantExtension();
      extensionManager.registerExtension('ai-assistant', aiExtension);
    }
  };

  // Toolbar action handlers
  const handleRun = async () => {
    if (!currentFile || !editorRef.current) return;

    const language = getLanguageFromFileName(currentFile.fileName);
    
    if (!codeExecutionService.isExecutable(language)) {
      notificationService.warning(`Cannot run ${language} files directly`);
      return;
    }

    setIsRunning(true);
    setTerminalVisible(true);

    try {
      // Save file first
      const content = editorRef.current.getValue();
      fileSystem.updateFile(currentFile.fileName, content);

      // Show execution message in terminal
      notificationService.success(`Running ${currentFile.fileName}...`);
      
      // The actual execution will happen in the terminal
      // User can manually run the command there
      const command = `# Run your file with the appropriate command\n# For example:\n`;
      console.log(command);
      
    } catch (error) {
      notificationService.error(`Failed to run: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDebug = () => {
    if (!currentFile) return;
    
    const language = getLanguageFromFileName(currentFile.fileName);
    const debugConfig = codeExecutionService.getDebugConfig(language, currentFile.fileName);
    
    if (!debugConfig) {
      notificationService.warning(`Debugging not yet supported for ${language}`);
      return;
    }

    notificationService.info('Debug feature coming soon!');
  };

  const handleFileClick = (path: string, content: string) => {
    const language = getLanguageFromFileName(path);
    const newFile = {
      fileName: path,
      content,
      language,
    };
    
    // Add to open files if not already open
    if (!openFiles.find(f => f.fileName === path)) {
      setOpenFiles([...openFiles, newFile]);
    }
    
    setCurrentFile(newFile);
    
    // Add to recent files cache
    recentFilesService.addFile(path);
  };

  const handleCloseFile = (fileName: string) => {
    const newOpenFiles = openFiles.filter(f => f.fileName !== fileName);
    setOpenFiles(newOpenFiles);
    
    // If closing the current file, switch to another open file
    if (currentFile?.fileName === fileName) {
      if (newOpenFiles.length > 0) {
        setCurrentFile(newOpenFiles[newOpenFiles.length - 1]);
      } else {
        setCurrentFile(undefined);
      }
    }
  };

  // Define available commands
  const commands: Command[] = [
    {
      id: 'open-file',
      label: 'Open File',
      description: 'Open a file from your device',
      category: 'File',
      action: async () => {
        try {
          const file = await FileDownloadService.uploadFile();
          handleFileClick(file.name, file.content);
          notificationService.success(`Opened ${file.name}`);
        } catch (error) {
          if ((error as Error).message !== 'File selection cancelled') {
            notificationService.error('Failed to open file');
          }
        }
      },
      keybinding: 'Ctrl+O',
    },
    {
      id: 'save-file',
      label: 'Save File',
      description: 'Save current file to your device',
      category: 'File',
      action: () => {
        if (currentFile) {
          try {
            FileDownloadService.downloadFile(
              currentFile.fileName,
              currentFile.content,
              FileDownloadService.getMimeType(currentFile.fileName)
            );
            notificationService.success(`Saved ${currentFile.fileName}`);
          } catch (error) {
            notificationService.error('Failed to save file');
          }
        } else {
          notificationService.warning('No file open to save');
        }
      },
      keybinding: 'Ctrl+S',
    },
    {
      id: 'save-file-as',
      label: 'Save File As',
      description: 'Save current file with a new name',
      category: 'File',
      action: async () => {
        if (currentFile) {
          try {
            await FileDownloadService.saveFileWithFileSystem(
              currentFile.fileName,
              currentFile.content
            );
            notificationService.success('File saved');
          } catch (error) {
            if ((error as Error).message !== 'AbortError') {
              notificationService.error('Failed to save file');
            }
          }
        } else {
          notificationService.warning('No file open to save');
        }
      },
      keybinding: 'Ctrl+Shift+S',
    },
    {
      id: 'open-folder',
      label: 'Open Folder',
      description: 'Open a project folder from your device disk',
      category: 'File',
      action: async () => {
        try {
          const result = await nativeFileSystem.openWorkspace();
          if (result.success && result.data) {
            // Clear virtual file system first to remove any default project files
            fileSystem.clear();
            
            setWorkspacePath(result.data);
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
                    // Skip hidden files and common ignore patterns
                    if (entry.name.startsWith('.') && entry.name !== '.gitignore' && entry.name !== '.env') {
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
          } else {
            notificationService.warning(result.error || 'No folder selected');
          }
        } catch (error) {
          if ((error as Error).name !== 'AbortError' && (error as Error).message !== 'Folder selection cancelled') {
            console.error('Failed to open folder:', error);
            notificationService.error('Failed to open folder. Make sure your browser supports folder access or use Electron mode.');
          }
        }
      },
      keybinding: 'Ctrl+K Ctrl+O',
    },
    {
      id: 'download-all',
      label: 'Download All Files',
      description: 'Download all open files',
      category: 'File',
      action: async () => {
        if (openFiles.length === 0) {
          notificationService.warning('No files to download');
          return;
        }
        try {
          await FileDownloadService.downloadAsZip(
            openFiles.map(f => ({ name: f.fileName, content: f.content }))
          );
          notificationService.success(`Downloaded ${openFiles.length} files`);
        } catch (error) {
          notificationService.error('Failed to download files');
        }
      },
    },
    {
      id: 'share-file',
      label: 'Share File',
      description: 'Share current file (mobile)',
      category: 'File',
      action: async () => {
        if (!currentFile) {
          notificationService.warning('No file open to share');
          return;
        }
        try {
          await FileDownloadService.shareFile(currentFile.fileName, currentFile.content);
        } catch (error) {
          notificationService.error('Sharing not supported on this device');
        }
      },
    },
    {
      id: 'toggle-terminal',
      label: 'Toggle Terminal',
      description: 'Show or hide the integrated terminal',
      category: 'View',
      action: () => setTerminalVisible(!terminalVisible),
      keybinding: 'Ctrl+`',
    },
    {
      id: 'format-document',
      label: 'Format Document',
      description: 'Format the current document',
      category: 'Editor',
      action: () => {
        if (editorRef.current) {
          editorRef.current.getAction('editor.action.formatDocument')?.run();
        }
      },
      keybinding: 'Shift+Alt+F',
    },
    {
      id: 'find',
      label: 'Find',
      description: 'Find in current file',
      category: 'Editor',
      action: () => {
        if (editorRef.current) {
          editorRef.current.getAction('actions.find')?.run();
        }
      },
      keybinding: 'Ctrl+F',
    },
    {
      id: 'replace',
      label: 'Replace',
      description: 'Find and replace in current file',
      category: 'Editor',
      action: () => {
        if (editorRef.current) {
          editorRef.current.getAction('editor.action.startFindReplaceAction')?.run();
        }
      },
      keybinding: 'Ctrl+H',
    },
    {
      id: 'go-to-line',
      label: 'Go to Line',
      description: 'Jump to a specific line number',
      category: 'Editor',
      action: () => {
        if (editorRef.current) {
          editorRef.current.getAction('editor.action.gotoLine')?.run();
        }
      },
      keybinding: 'Ctrl+G',
    },
    {
      id: 'toggle-comment',
      label: 'Toggle Line Comment',
      description: 'Comment or uncomment the current line',
      category: 'Editor',
      action: () => {
        if (editorRef.current) {
          editorRef.current.getAction('editor.action.commentLine')?.run();
        }
      },
      keybinding: 'Ctrl+/',
    },
    {
      id: 'close-file',
      label: 'Close File',
      description: 'Close the current file',
      category: 'File',
      action: () => {
        if (currentFile) {
          handleCloseFile(currentFile.fileName);
        }
      },
      keybinding: 'Ctrl+W',
    },
    {
      id: 'close-all-files',
      label: 'Close All Files',
      description: 'Close all open files',
      category: 'File',
      action: () => {
        setOpenFiles([]);
        setCurrentFile(undefined);
      },
    },
    {
      id: 'open-recent',
      label: 'Open Recent',
      description: 'Open a recently used file or folder',
      category: 'File',
      action: () => {
        const recentItems = recentFilesService.getRecentItems();
        if (recentItems.length === 0) {
          notificationService.info('No recent files or folders');
          return;
        }
        
        // Show recent items in notification
        const itemsList = recentItems.slice(0, 5).map(item => 
          `${item.type === 'folder' ? '📁' : '📄'} ${item.name}`
        ).join('\n');
        
        notificationService.info(`Recent items:\n${itemsList}`);
      },
      keybinding: 'Ctrl+R',
    },
    {
      id: 'clear-recent',
      label: 'Clear Recent Files',
      description: 'Clear the recent files and folders history',
      category: 'File',
      action: () => {
        recentFilesService.clearAll();
        notificationService.success('Recent files history cleared');
      },
    },
    {
      id: 'ai-explain',
      label: 'AI: Explain Code',
      description: 'Get AI explanation for selected code',
      category: 'AI',
      action: () => {
        if (editorRef.current) {
          editorRef.current.getAction('ai.explain')?.run();
        }
      },
    },
    {
      id: 'ai-fix',
      label: 'AI: Fix Code',
      description: 'Get AI suggestions to fix code issues',
      category: 'AI',
      action: () => {
        if (editorRef.current) {
          editorRef.current.getAction('ai.fix')?.run();
        }
      },
    },
    {
      id: 'ai-document',
      label: 'AI: Generate Documentation',
      description: 'Generate documentation for selected code',
      category: 'AI',
      action: () => {
        if (editorRef.current) {
          editorRef.current.getAction('ai.document')?.run();
        }
      },
    },
    {
      id: 'toggle-preview',
      label: 'Toggle Live Preview',
      description: 'Show or hide the live preview panel',
      category: 'View',
      action: () => setPreviewVisible(!previewVisible),
      keybinding: 'Ctrl+Shift+V',
    },
    {
      id: 'open-preview-url',
      label: 'Open Preview with Custom URL',
      description: 'Open preview panel with a custom URL',
      category: 'View',
      action: () => {
        const url = prompt('Enter preview URL:', previewUrl);
        if (url) {
          setPreviewUrl(url);
          setPreviewVisible(true);
          notificationService.success(`Preview opened at ${url}`);
        }
      },
    },
  ];

  if (editorState.isLoading) {
    return (
      <div className="editor-shell loading">
        <div className="loading-spinner">
          <p>Loading VS Code Editor...</p>
        </div>
      </div>
    );
  }

  if (editorState.error) {
    return (
      <div className="editor-shell error">
        <div className="error-message">
          <h2>Error Loading Editor</h2>
          <p>{editorState.error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  const handleEditorChange = (value: string | undefined) => {
    const activeFile = currentFile || file;
    const language = activeFile?.language || (activeFile?.fileName ? getLanguageFromFileName(activeFile.fileName) : 'javascript');
    
    if (value !== undefined && activeFile?.fileName) {
      // Save the current file state to local storage
      editorStateService.updateFile({
        fileName: activeFile.fileName,
        content: value,
        language: language,
        cursorPosition: editorRef.current ? {
          lineNumber: editorRef.current.getPosition()?.lineNumber || 1,
          column: editorRef.current.getPosition()?.column || 1,
        } : undefined,
        lastModified: new Date(),
      });
      
      // Update current file state
      setCurrentFile({
        ...activeFile,
        content: value,
      });
    }
  };

  // Handle clicking on a recent project
  const handleRecentProjectClick = async (projectPath: string) => {
    try {
      // Set the workspace path
      setWorkspacePath(projectPath);
      notificationService.info(`Opening project: ${projectPath}`);
      
      // Clear existing file system
      fileSystem.clear();
      
      // Load files from the project path
      const loadFilesRecursively = async (dirPath: string, basePath: string = '') => {
        const dirEntries = await nativeFileSystem.readDirectory(dirPath);
        if (dirEntries.success && dirEntries.data) {
          for (const entry of dirEntries.data) {
            // Skip hidden files except .gitignore and .env
            if (entry.name.startsWith('.') && entry.name !== '.gitignore' && entry.name !== '.env') {
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
              }
            } else if (entry.type === 'directory') {
              const virtualDirPath = `/${relativePath}`;
              try {
                fileSystem.createDirectory(virtualDirPath);
                await loadFilesRecursively(entry.path, relativePath);
              } catch (dirError) {
                console.warn(`Could not create directory ${virtualDirPath}:`, dirError);
              }
            }
          }
        }
      };
      
      // Load all files from the project
      await loadFilesRecursively(projectPath);
      
      // Update recent files
      recentFilesService.addFolder(projectPath);
      
      notificationService.success(`Opened project: ${projectPath}`);
      
      // Open a main file if available (e.g., README.md, index.html, App.tsx)
      const mainFiles = ['README.md', 'index.html', 'src/App.tsx', 'src/main.tsx', 'package.json'];
      for (const mainFile of mainFiles) {
        const filePath = `/${mainFile}`;
        if (fileSystem.exists(filePath)) {
          const content = fileSystem.readFile(filePath);
          handleFileClick(filePath, content);
          break;
        }
      }
    } catch (error) {
      console.error('Error opening recent project:', error);
      notificationService.error(`Failed to open project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Render the editor and terminal content
  const handleOpenProjectFromWelcome = async () => {
    try {
      const result = await nativeFileSystem.openWorkspace();
      if (result.success && result.data) {
        fileSystem.clear();
        setWorkspacePath(result.data);
        notificationService.success(`Opened folder: ${result.data}`);
        recentFilesService.addFolder(result.data);
        
        // Load files recursively
        const loadFilesRecursively = async (dirPath: string, basePath: string = '') => {
          const dirEntries = await nativeFileSystem.readDirectory(dirPath);
          if (dirEntries.success && dirEntries.data) {
            for (const entry of dirEntries.data) {
              if (entry.name.startsWith('.') && entry.name !== '.gitignore' && entry.name !== '.env') {
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
                }
              } else if (entry.type === 'directory') {
                const virtualDirPath = `/${relativePath}`;
                try {
                  fileSystem.createDirectory(virtualDirPath);
                  await loadFilesRecursively(entry.path, relativePath);
                } catch (dirError) {
                  console.warn(`Could not create directory ${virtualDirPath}:`, dirError);
                }
              }
            }
          }
        };
        
        await loadFilesRecursively(result.data);
        notificationService.info('Folder loaded successfully');
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError' && (error as Error).message !== 'Folder selection cancelled') {
        console.error('Failed to open folder:', error);
        notificationService.error('Failed to open folder');
      }
    }
  };

  const renderEditorContent = () => {
    const activeFile = currentFile || file;
    const hasFiles = openFiles.length > 0 || activeFile;
    const language = activeFile?.language || (activeFile?.fileName ? getLanguageFromFileName(activeFile.fileName) : 'javascript');
    const content = activeFile?.content || '// Welcome to Kalpa AI Editor\n// Select a file from the explorer or start coding here';

    // Show welcome screen if no files are open
    if (!hasFiles && !workspacePath) {
      return (
        <div className="center-panel">
          <WelcomeScreen
            onOpenProject={handleOpenProjectFromWelcome}
            onCloneRepository={() => notificationService.info('Clone repository feature coming soon!')}
            onConnectTo={() => notificationService.info('Connect to feature coming soon!')}
            onProjectClick={handleRecentProjectClick}
            recentProjects={recentFilesService.getRecentFolders().map(folder => ({
              name: folder.name,
              path: folder.path
            }))}
            theme={config.theme === 'light' ? 'light' : 'dark'}
          />
        </div>
      );
    }

    return (
      <div className="center-panel">
          {/* Editor Section */}
          <div className="editor-section">
            {/* Tab Bar */}
            {openFiles.length > 0 && (
              <div className="tab-bar">
                {openFiles.map((file) => (
                  <div
                    key={file.fileName}
                    className={`tab ${currentFile?.fileName === file.fileName ? 'active' : ''}`}
                    onClick={() => setCurrentFile(file)}
                  >
                    <span className="tab-icon">📄</span>
                    <span className="tab-name">{file.fileName.split('/').pop()}</span>
                    <button
                      className="tab-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseFile(file.fileName);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Breadcrumb Bar */}
            {activeFile && (
              <div className="breadcrumb-bar">
                <span className="breadcrumb-icon">📁</span>
                <span className="breadcrumb-path">{activeFile.fileName}</span>
                <span className="breadcrumb-language">{language.toUpperCase()}</span>
              </div>
            )}
        
            <div className="editor-container">
              {/* Editor */}
              <div className="editor-pane">
                {/* Editor Toolbar */}
                <EditorToolbar
                  fileName={activeFile?.fileName}
                  language={language}
                  lineNumber={cursorPosition.line}
                  columnNumber={cursorPosition.column}
                  onRun={handleRun}
                  isRunning={isRunning}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  previewUrl={previewUrl}
                />
                
                {/* Show Editor or Preview based on viewMode */}
                {viewMode === 'code' ? (
                  <Editor
            height="100%"
            language={language}
            value={content}
            path={activeFile?.fileName}
            theme={config.theme === 'dark' ? 'vs-dark-custom' : config.theme === 'high-contrast' ? 'hc-black-custom' : 'light-custom'}
            beforeMount={handleEditorWillMount}
            onMount={handleEditorDidMount}
            onChange={handleEditorChange}
            options={{
              // Editor appearance
              minimap: { enabled: true },
              fontSize: config.fontSize || 14,
              lineNumbers: 'on',
              glyphMargin: true,
              folding: true,
              foldingStrategy: 'indentation',
              showFoldingControls: 'mouseover',
              renderLineHighlight: 'all',
              renderWhitespace: 'selection',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              
              // Code editing features
              autoIndent: 'full',
              formatOnPaste: true,
              formatOnType: true,
              tabSize: 2,
              insertSpaces: true,
              detectIndentation: true,
              trimAutoWhitespace: true,
              
              // IntelliSense and suggestions
              quickSuggestions: {
                other: 'on',
                comments: 'off',
                strings: 'off',
              },
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnCommitCharacter: true,
              acceptSuggestionOnEnter: 'on',
              snippetSuggestions: 'top',
              wordBasedSuggestions: 'off',
              parameterHints: { enabled: true },
              
              // Code actions and refactoring
              lightbulb: { enabled: true },
              
              // Find and replace
              find: {
                seedSearchStringFromSelection: 'always',
                autoFindInSelection: 'never',
                addExtraSpaceOnTop: true,
              },
              
              // Bracket matching and colorization
              matchBrackets: 'always',
              guides: {
                bracketPairs: 'active',
                indentation: true,
              },
              
              // Selection and multi-cursor
              multiCursorModifier: 'alt',
              selectionHighlight: true,
              occurrencesHighlight: 'off',
              
              // Scrolling and viewport
              scrollBeyondLastLine: false,
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: true,
                verticalScrollbarSize: 14,
                horizontalScrollbarSize: 10,
              },
              
              // Word wrap
              wordWrap: 'on',
              wordWrapColumn: 80,
              wrappingIndent: 'indent',
              
              // Other features
              automaticLayout: true,
              readOnly: false,
              roundedSelection: false,
              links: true,
              mouseWheelZoom: true,
              contextmenu: true,
              copyWithSyntaxHighlighting: true,
              
              // Accessibility
              accessibilitySupport: 'auto',
            }}
                />
                ) : (
                  <MobilePreview 
                    url={previewUrl}
                    title={activeFile?.fileName || 'Preview'}
                  />
                )}
              </div>
            </div>
            
            {/* Status Bar */}
            <div className="status-bar">
              <div className="status-bar-left">
                <span className="status-item">
                  <span className="status-icon">📁</span>
                  {activeFile?.fileName || 'No file open'}
                </span>
                <span className="status-item">
                  <span className="status-icon">🔤</span>
                  {language.toUpperCase()}
                </span>
                {editorRef.current && (
                  <span className="status-item">
                    Ln {editorRef.current.getPosition()?.lineNumber || 1}, 
                    Col {editorRef.current.getPosition()?.column || 1}
                  </span>
                )}
              </div>
              <div className="status-bar-right">
                {config.offlineMode && (
                  <span className="status-item status-offline">
                    📡 Offline
                  </span>
                )}
                <span className="status-item">
                  UTF-8
                </span>
                <span className="status-item">
                  LF
                </span>
                {terminalSupported && (
                  <button 
                    className="status-item status-button"
                    onClick={() => setTerminalVisible(!terminalVisible)}
                    title={terminalVisible ? 'Hide Terminal (Ctrl+`)' : 'Show Terminal (Ctrl+`)'}
                  >
                    ⚡ {terminalVisible ? 'Hide Terminal' : 'Show Terminal'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Terminal at bottom (when visible) */}
          {terminalSupported && terminalVisible && (
            <div className="terminal-section terminal-bottom">
              <Terminal 
                visible={terminalVisible} 
                onClose={() => setTerminalVisible(false)}
                problems={problems}
                workspacePath={workspacePath}
                currentFilePath={currentFile?.fileName}
                language={language}
                onDebug={handleDebug}
                onPreviewDetected={(url) => {
                  setPreviewUrl(url);
                  // Auto-open preview if not already visible
                  if (!previewVisible) {
                    setPreviewVisible(true);
                  }
                }}
              />
            </div>
          )}
        </div>
    );
  };

  // Render the chat panel with full project creation features
  const renderChatPanel = () => (
    <div className="chat-panel-container" style={{ height: '100%', overflow: 'hidden' }}>
      <ProjectAnalysisChat
        fileSystem={fileSystem}
        onClose={() => setChatVisible(false)}
        theme={config.theme === 'light' ? 'light' : 'dark'}
        workspacePath={workspacePath}
        onSendToTerminal={(command: string) => {
          // Open terminal
          setTerminalVisible(true);
          // Wait a bit for terminal to be ready, then send command
          setTimeout(() => {
            if ((window as any).terminalExecuteCommand) {
              (window as any).terminalExecuteCommand(command);
            } else {
              console.log('Terminal not ready, command:', command);
            }
          }, 500);
        }}
      />
    </div>
  );

  return (
    <>
      <div className="editor-shell three-panel-layout">
        {/* Activity Bar - Icon sidebar */}
        <ActivityBar
          activeView={activeView}
          onViewChange={setActiveView}
          chatVisible={chatVisible}
          onChatToggle={() => setChatVisible(!chatVisible)}
          previewVisible={previewVisible}
          onPreviewToggle={() => setPreviewVisible(!previewVisible)}
          theme={config.theme === 'light' ? 'light' : 'dark'}
        />

        {/* Sidebar - Contains all views (Explorer, Search, etc.) */}
        <Sidebar
          activeView={activeView}
          fileSystem={fileSystem}
          onFileClick={handleFileClick}
          theme={config.theme === 'light' ? 'light' : 'dark'}
          workspacePath={workspacePath}
          currentFile={currentFile}
          monacoEditor={editorRef.current}
          monaco={monacoRef.current}
          onWorkspaceChange={(path) => setWorkspacePath(path || undefined)}
        />

        {/* Main Content Area - Editor (70%) + Chat (30%) with Resizable Split */}
        {chatVisible ? (
          <ResizableSplitView
            leftPanel={renderEditorContent()}
            rightPanel={renderChatPanel()}
            defaultLeftWidth={70}
            minLeftWidth={50}
            maxLeftWidth={85}
          />
        ) : (
          renderEditorContent()
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        visible={commandPaletteVisible}
        onClose={() => setCommandPaletteVisible(false)}
        commands={commands}
        theme={config.theme === 'light' ? 'light' : 'dark'}
      />

      {/* Floating Preview Window */}
      <FloatingPreview
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        theme={config.theme === 'light' ? 'light' : 'dark'}
        initialUrl={previewUrl}
      />
    </>
  );
};

export default EditorShell;
