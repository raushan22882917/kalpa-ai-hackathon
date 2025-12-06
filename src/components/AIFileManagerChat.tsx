import React, { useState, useRef, useEffect } from 'react';
import { getFileSystem } from '../services/fileSystemService';
import { terminalCommandService } from '../services/terminalCommandService';
import { simpleAIProjectGenerator } from '../services/simpleAIProjectGenerator';
import './AIFileManagerChat.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: FileAction[];
  mentionedFiles?: string[];
}

interface FileAction {
  type: 'create_file' | 'create_folder' | 'delete' | 'rename' | 'update';
  path: string;
  content?: string;
  newName?: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

interface AIFileManagerChatProps {
  onClose?: () => void;
  currentPath?: string;
  fileSystem?: any;
  workspacePath?: string | null;
}

interface FileSuggestion {
  path: string;
  type: 'file' | 'directory';
  name: string;
}

const AIFileManagerChat: React.FC<AIFileManagerChatProps> = ({ onClose, currentPath = '/', fileSystem: externalFileSystem, workspacePath }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fileSuggestions, setFileSuggestions] = useState<FileSuggestion[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [terminalConnected, setTerminalConnected] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileSystem = externalFileSystem || getFileSystem();

  useEffect(() => {
    addSystemMessage(
      '👋 Welcome to AI File Manager!\n\n' +
      'I can help you create, manage, and organize files and folders using natural language.\n\n' +
      '**What I can do:**\n' +
      '• Create files and folders\n' +
      '• Write code to files\n' +
      '• Delete or rename files\n' +
      '• Generate complete projects with AI\n' +
      '• Update file contents\n' +
      '• Run terminal commands\n\n' +
      '**AI Project Generation:**\n' +
      '• "Create a todo app with React and Node.js"\n' +
      '• "Build a blog platform with Next.js and FastAPI"\n' +
      '• "Generate a mobile app with React Native"\n' +
      '• I\'ll automatically choose the tech stack and app name!\n' +
      '• Projects are created in your current workspace folder\n\n' +
      '**Test Terminal:**\n' +
      '• Type "test terminal" to verify commands work\n' +
      '• Make sure backend is running: `npm run server`\n\n' +
      '**Use @ to mention files:**\n' +
      '• Type @ to see file suggestions\n' +
      '• "Update @src/App.tsx to add a new component"\n' +
      '• "Add authentication to @src/services/api.ts"\n\n' +
      '**Other commands:**\n' +
      '• "Create a file called index.html"\n' +
      '• "Make a folder named components"\n' +
      '• "Delete old-file.txt"\n' +
      '• "Rename config.js to config.ts"'
    );
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check terminal connection status
  useEffect(() => {
    const checkConnection = () => {
      const connected = terminalCommandService.isConnected();
      setTerminalConnected(connected);
    };

    // Check immediately
    checkConnection();

    // Check every 3 seconds
    const interval = setInterval(checkConnection, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleTestConnection = async () => {
    setIsCheckingConnection(true);
    try {
      await terminalCommandService.connect(workspacePath || undefined);
      setTerminalConnected(true);
      addAssistantMessage('✅ Terminal connection successful! You can now generate projects.');
    } catch (error) {
      setTerminalConnected(false);
      addAssistantMessage(
        '❌ Terminal connection failed.\n\n' +
        '**Please start the backend server:**\n' +
        '```bash\n' +
        'npm run server\n' +
        '```\n\n' +
        'The server should be running on port 3001.'
      );
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addSystemMessage = (content: string) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'system',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  };

  const addAssistantMessage = (content: string, actions?: FileAction[]) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      actions,
    };
    setMessages(prev => [...prev, message]);
  };

  // Extract @mentions from input
  const extractMentions = (input: string): string[] => {
    const mentionRegex = /@([^\s]+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(input)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  };

  // Get all files recursively
  const getAllFiles = (path: string = '/', prefix: string = ''): FileSuggestion[] => {
    const files: FileSuggestion[] = [];
    
    try {
      const items = fileSystem.listDirectory(path);
      
      for (const item of items) {
        const fullPath = path === '/' ? `/${item.name}` : `${path}/${item.name}`;
        const displayPath = prefix ? `${prefix}/${item.name}` : item.name;
        
        files.push({
          path: fullPath,
          type: item.type,
          name: displayPath
        });
        
        if (item.type === 'directory') {
          files.push(...getAllFiles(fullPath, displayPath));
        }
      }
    } catch (error) {
      console.error('Error listing files:', error);
    }
    
    return files;
  };

  // Handle @ mention input
  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // Check if user is typing @ mention
    const cursorPos = inputRef.current?.selectionStart || 0;
    setCursorPosition(cursorPos);
    
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if we're still in the mention (no space after @)
      if (!textAfterAt.includes(' ')) {
        const allFiles = getAllFiles();
        const filtered = allFiles.filter(file => 
          file.name.toLowerCase().includes(textAfterAt.toLowerCase())
        ).slice(0, 10);
        
        setFileSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Insert file mention
  const insertMention = (file: FileSuggestion) => {
    const cursorPos = cursorPosition;
    const textBeforeCursor = inputValue.substring(0, cursorPos);
    const textAfterCursor = inputValue.substring(cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const newValue = 
        inputValue.substring(0, lastAtIndex) + 
        `@${file.name} ` + 
        textAfterCursor;
      
      setInputValue(newValue);
      setShowSuggestions(false);
      
      // Focus back on input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleTestTerminal = async () => {
    addAssistantMessage('🧪 Testing terminal connection...');
    
    try {
      await terminalCommandService.connect(workspacePath || undefined);
      addAssistantMessage('✅ Terminal connected successfully!');
      
      // Test with a simple command
      addAssistantMessage('⚙️ Running test command: `echo "Hello from terminal!"`');
      const result = await terminalCommandService.executeCommand('echo "Hello from terminal!"');
      
      if (result.success) {
        addAssistantMessage(
          `✅ **Terminal is working!**\n\n` +
          `Output: \`${result.output || 'Command executed'}\`\n\n` +
          `You can now generate projects. Try:\n` +
          `• "Create a weather app with React"\n` +
          `• "Build a todo list with Next.js"`
        );
      } else {
        addAssistantMessage(
          `❌ Test command failed: ${result.error}\n\n` +
          `**Please check:**\n` +
          `• Backend server is running: \`npm run server\`\n` +
          `• Server shows: "Terminal WebSocket available at ws://localhost:3001/terminal"`
        );
      }
    } catch (error) {
      addAssistantMessage(
        `❌ Terminal connection failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
        `**To fix this:**\n` +
        `1. Open a new terminal\n` +
        `2. Run: \`npm run server\`\n` +
        `3. Wait for "Terminal WebSocket available..."\n` +
        `4. Try again`
      );
    }
  };

  const parseUserIntent = (input: string): {
    action: 'create_file' | 'create_folder' | 'delete' | 'rename' | 'update' | 'generate_project' | 'test_terminal' | 'unknown';
    targets: string[];
    content?: string;
    fileType?: string;
    mentionedFiles?: string[];
    projectDescription?: string;
  } => {
    const lowerInput = input.toLowerCase();
    const mentions = extractMentions(input);

    // Test terminal
    if (lowerInput.match(/test\s+(terminal|connection|commands?)/)) {
      return {
        action: 'test_terminal',
        targets: []
      };
    }

    // Update file (with @mention)
    if (mentions.length > 0 && lowerInput.match(/update|modify|change|edit|add|refactor|fix/)) {
      return {
        action: 'update',
        targets: mentions,
        mentionedFiles: mentions
      };
    }

    // Create file
    if (lowerInput.match(/create|make|add|new/) && lowerInput.match(/file|component|class|function|script/)) {
      const fileMatch = input.match(/(?:file|component|class|function|script)\s+(?:called|named)?\s*['"]?([a-zA-Z0-9_.-]+)['"]?/i);
      const fileName = fileMatch ? fileMatch[1] : null;
      
      // Detect file type
      let fileType = 'file';
      if (lowerInput.includes('component') || lowerInput.includes('react')) fileType = 'component';
      if (lowerInput.includes('class')) fileType = 'class';
      if (lowerInput.includes('function')) fileType = 'function';
      
      return {
        action: 'create_file',
        targets: fileName ? [fileName] : [],
        fileType
      };
    }

    // Create folder
    if (lowerInput.match(/create|make|add|new/) && lowerInput.match(/folder|directory|dir/)) {
      const folderMatch = input.match(/(?:folder|directory|dir)\s+(?:called|named)?\s*['"]?([a-zA-Z0-9_.-]+)['"]?/i);
      const folderName = folderMatch ? folderMatch[1] : null;
      
      return {
        action: 'create_folder',
        targets: folderName ? [folderName] : []
      };
    }

    // Delete
    if (lowerInput.match(/delete|remove|rm/)) {
      const fileMatch = input.match(/(?:delete|remove|rm)\s+(?:the\s+)?['"]?([a-zA-Z0-9_./\-]+)['"]?/i);
      const fileName = fileMatch ? fileMatch[1] : null;
      
      return {
        action: 'delete',
        targets: fileName ? [fileName] : []
      };
    }

    // Rename
    if (lowerInput.match(/rename|mv|move/)) {
      const renameMatch = input.match(/(?:rename|mv|move)\s+['"]?([a-zA-Z0-9_./\-]+)['"]?\s+(?:to|as)\s+['"]?([a-zA-Z0-9_./\-]+)['"]?/i);
      if (renameMatch) {
        return {
          action: 'rename',
          targets: [renameMatch[1], renameMatch[2]]
        };
      }
    }

    // Generate project - detect various patterns
    if (lowerInput.match(/generate|scaffold|setup|create|build/) && 
        lowerInput.match(/project|app|application|website|api|backend|frontend/)) {
      return {
        action: 'generate_project',
        targets: [],
        projectDescription: input
      };
    }

    return {
      action: 'unknown',
      targets: [],
      mentionedFiles: mentions
    };
  };

  const executeFileAction = async (action: FileAction): Promise<FileAction> => {
    try {
      switch (action.type) {
        case 'create_file':
          fileSystem.createFile(action.path, action.content || '');
          return { ...action, status: 'success' };

        case 'create_folder':
          fileSystem.createDirectory(action.path);
          return { ...action, status: 'success' };

        case 'delete':
          fileSystem.delete(action.path);
          return { ...action, status: 'success' };

        case 'rename':
          if (action.newName) {
            fileSystem.rename(action.path, action.newName);
            return { ...action, status: 'success' };
          }
          throw new Error('New name not provided');

        case 'update':
          fileSystem.updateFile(action.path, action.content || '');
          return { ...action, status: 'success' };

        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      return {
        ...action,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const generateFileContent = async (fileName: string, fileType: string): Promise<string> => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    // Generate React component
    if (fileType === 'component' || ext === 'tsx' || ext === 'jsx') {
      const componentName = fileName.replace(/\.(tsx|jsx|ts|js)$/, '').replace(/[^a-zA-Z0-9]/g, '');
      return `import React from 'react';\nimport './${componentName}.css';\n\ninterface ${componentName}Props {\n  // Add props here\n}\n\nconst ${componentName}: React.FC<${componentName}Props> = (props) => {\n  return (\n    <div className="${componentName.toLowerCase()}">\n      <h2>${componentName}</h2>\n      {/* Add content here */}\n    </div>\n  );\n};\n\nexport default ${componentName};\n`;
    }

    // Generate HTML
    if (ext === 'html') {
      return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>\n`;
    }

    // Generate CSS
    if (ext === 'css') {
      return `/* Styles for ${fileName} */\n\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: Arial, sans-serif;\n  line-height: 1.6;\n}\n`;
    }

    // Generate JavaScript/TypeScript
    if (ext === 'js' || ext === 'ts') {
      return `// ${fileName}\n\nexport const main = () => {\n  console.log('Hello from ${fileName}');\n};\n\nmain();\n`;
    }

    // Generate JSON
    if (ext === 'json') {
      return `{\n  "name": "project",\n  "version": "1.0.0"\n}\n`;
    }

    // Generate Markdown
    if (ext === 'md') {
      return `# ${fileName.replace('.md', '')}\n\nDescription goes here.\n\n## Features\n\n- Feature 1\n- Feature 2\n\n## Usage\n\n\`\`\`bash\nnpm install\n\`\`\`\n`;
    }

    return `// ${fileName}\n`;
  };

  const generateUpdatedContent = async (filePath: string, currentContent: string, instruction: string): Promise<string> => {
    // This is a simplified version - in production, you'd use actual AI API
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    // For demo purposes, we'll add comments or simple modifications
    if (instruction.toLowerCase().includes('add') && instruction.toLowerCase().includes('component')) {
      // Add a new component import and usage
      if (ext === 'tsx' || ext === 'jsx') {
        const componentName = instruction.match(/component\s+(?:called|named)?\s*([A-Z][a-zA-Z0-9]*)/i)?.[1] || 'NewComponent';
        
        // Add import at the top
        let updated = currentContent;
        if (!updated.includes(`import ${componentName}`)) {
          const importLine = `import ${componentName} from './${componentName}';\n`;
          const firstImportIndex = updated.indexOf('import');
          if (firstImportIndex !== -1) {
            const endOfImports = updated.indexOf('\n\n', firstImportIndex);
            updated = updated.slice(0, endOfImports) + '\n' + importLine + updated.slice(endOfImports);
          } else {
            updated = importLine + updated;
          }
        }
        
        return updated;
      }
    }
    
    if (instruction.toLowerCase().includes('authentication') || instruction.toLowerCase().includes('auth')) {
      if (ext === 'ts' || ext === 'tsx') {
        // Add auth-related code
        return currentContent + '\n\n// Authentication functionality\nexport const authenticateUser = async (credentials: any) => {\n  // TODO: Implement authentication\n  return true;\n};\n';
      }
    }
    
    if (instruction.toLowerCase().includes('refactor')) {
      // Add refactoring comment
      return `// Refactored based on: ${instruction}\n${currentContent}`;
    }
    
    // Default: add a comment with the instruction
    return `${currentContent}\n\n// Updated: ${instruction}\n`;
  };

  const generateProjectStructure = async (projectType: string): Promise<FileAction[]> => {
    const actions: FileAction[] = [];

    if (projectType.includes('express') || projectType.includes('api')) {
      // Express API structure
      actions.push(
        { type: 'create_folder', path: '/src', status: 'pending' },
        { type: 'create_folder', path: '/src/routes', status: 'pending' },
        { type: 'create_folder', path: '/src/controllers', status: 'pending' },
        { type: 'create_folder', path: '/src/models', status: 'pending' },
        { type: 'create_folder', path: '/src/middleware', status: 'pending' },
        { type: 'create_file', path: '/src/index.ts', content: `import express from 'express';\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.use(express.json());\n\napp.get('/', (req, res) => {\n  res.json({ message: 'API is running' });\n});\n\napp.listen(PORT, () => {\n  console.log(\`Server running on port \${PORT}\`);\n});\n`, status: 'pending' },
        { type: 'create_file', path: '/package.json', content: `{\n  "name": "express-api",\n  "version": "1.0.0",\n  "main": "src/index.ts",\n  "scripts": {\n    "dev": "ts-node src/index.ts",\n    "build": "tsc"\n  },\n  "dependencies": {\n    "express": "^4.18.0"\n  },\n  "devDependencies": {\n    "@types/express": "^4.17.0",\n    "typescript": "^5.0.0",\n    "ts-node": "^10.0.0"\n  }\n}\n`, status: 'pending' }
      );
    } else if (projectType.includes('react')) {
      // React project structure
      actions.push(
        { type: 'create_folder', path: '/src', status: 'pending' },
        { type: 'create_folder', path: '/src/components', status: 'pending' },
        { type: 'create_folder', path: '/src/services', status: 'pending' },
        { type: 'create_folder', path: '/src/types', status: 'pending' },
        { type: 'create_folder', path: '/public', status: 'pending' },
        { type: 'create_file', path: '/src/App.tsx', content: await generateFileContent('App.tsx', 'component'), status: 'pending' },
        { type: 'create_file', path: '/src/main.tsx', content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n);\n`, status: 'pending' }
      );
    }

    return actions;
  };

  const generateProjectWithAI = async (description: string) => {
    // Check terminal connection first
    if (!terminalConnected) {
      addAssistantMessage(
        '⚠️ **Terminal Not Connected**\n\n' +
        'Project generation requires a terminal connection to execute commands.\n\n' +
        '**To fix this:**\n' +
        '1. Start the backend server: `npm run server`\n' +
        '2. Click the "🔌 Connect" button above\n' +
        '3. Try your request again\n\n' +
        'The backend server must be running on port 3001.'
      );
      return;
    }

    addAssistantMessage(
      '🤖 **AI is analyzing your request...**\n\n' +
      `Your request: "${description}"\n\n` +
      'The AI will:\n' +
      '• Understand what you want to build\n' +
      '• Design the complete architecture\n' +
      '• Choose the best tech stack\n' +
      '• Generate all code and files\n' +
      '• Set up everything automatically'
    );

    try {
      // Use simple AI project generator
      const result = await simpleAIProjectGenerator.generateProject({
        userQuery: description,
        workspacePath: workspacePath || undefined,
      });

      if (result.success) {
        addAssistantMessage(
          `🎉 **Project "${result.projectName}" created successfully!**\n\n` +
          `**Project Location:**\n` +
          `\`${result.projectPath}\`\n\n` +
          `**Tech Stack:**\n` +
          `${result.techStack}\n\n` +
          `**Files Created:**\n` +
          `${result.filesCreated.length} files\n\n` +
          `**Next Steps:**\n` +
          `• Navigate to project: \`cd ${result.projectName}\`\n` +
          `• Start development: \`npm run dev\`\n\n` +
          `Your project is ready to use!`
        );
      } else {
        addAssistantMessage(
          `❌ **Project generation failed**\n\n` +
          `Error: ${result.error}\n\n` +
          `**Please try:**\n` +
          `• Make sure backend server is running\n` +
          `• Check your internet connection\n` +
          `• Try a simpler description`
        );
      }
    } catch (error) {
      addAssistantMessage(
        `❌ **Error during project generation**\n\n` +
        `${error instanceof Error ? error.message : 'Unknown error'}\n\n` +
        `**Troubleshooting:**\n` +
        `• Ensure backend server is running: \`npm run server\`\n` +
        `• Check terminal connection status above\n` +
        `• Try the "test terminal" command first`
      );
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userInput = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    try {
      addUserMessage(userInput);

      const intent = parseUserIntent(userInput);
      const actions: FileAction[] = [];

      switch (intent.action) {
        case 'test_terminal': {
          await handleTestTerminal();
          break;
        }

        case 'create_file': {
          if (intent.targets.length === 0) {
            addAssistantMessage('Please specify a file name. For example: "Create a file called index.html"');
            break;
          }

          const fileName = intent.targets[0];
          const fullPath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`;
          const content = await generateFileContent(fileName, intent.fileType || 'file');

          const action: FileAction = {
            type: 'create_file',
            path: fullPath,
            content,
            status: 'pending'
          };

          const result = await executeFileAction(action);
          actions.push(result);

          if (result.status === 'success') {
            addAssistantMessage(
              `✅ Created file: **${fileName}**\n\nI've generated some starter code for you. The file is ready to use!`,
              [result]
            );
          } else {
            addAssistantMessage(
              `❌ Failed to create file: ${result.error}`,
              [result]
            );
          }
          break;
        }

        case 'create_folder': {
          if (intent.targets.length === 0) {
            addAssistantMessage('Please specify a folder name. For example: "Create a folder called components"');
            break;
          }

          const folderName = intent.targets[0];
          const fullPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;

          const action: FileAction = {
            type: 'create_folder',
            path: fullPath,
            status: 'pending'
          };

          const result = await executeFileAction(action);
          actions.push(result);

          if (result.status === 'success') {
            addAssistantMessage(
              `✅ Created folder: **${folderName}**\n\nThe folder is ready to use!`,
              [result]
            );
          } else {
            addAssistantMessage(
              `❌ Failed to create folder: ${result.error}`,
              [result]
            );
          }
          break;
        }

        case 'delete': {
          if (intent.targets.length === 0) {
            addAssistantMessage('Please specify what to delete. For example: "Delete old-file.txt"');
            break;
          }

          const targetPath = intent.targets[0];
          const fullPath = targetPath.startsWith('/') ? targetPath : `${currentPath}/${targetPath}`;

          const action: FileAction = {
            type: 'delete',
            path: fullPath,
            status: 'pending'
          };

          const result = await executeFileAction(action);
          actions.push(result);

          if (result.status === 'success') {
            addAssistantMessage(
              `✅ Deleted: **${targetPath}**`,
              [result]
            );
          } else {
            addAssistantMessage(
              `❌ Failed to delete: ${result.error}`,
              [result]
            );
          }
          break;
        }

        case 'rename': {
          if (intent.targets.length < 2) {
            addAssistantMessage('Please specify both old and new names. For example: "Rename config.js to config.ts"');
            break;
          }

          const oldPath = intent.targets[0];
          const newName = intent.targets[1].split('/').pop() || intent.targets[1];
          const fullPath = oldPath.startsWith('/') ? oldPath : `${currentPath}/${oldPath}`;

          const action: FileAction = {
            type: 'rename',
            path: fullPath,
            newName,
            status: 'pending'
          };

          const result = await executeFileAction(action);
          actions.push(result);

          if (result.status === 'success') {
            addAssistantMessage(
              `✅ Renamed **${oldPath}** to **${newName}**`,
              [result]
            );
          } else {
            addAssistantMessage(
              `❌ Failed to rename: ${result.error}`,
              [result]
            );
          }
          break;
        }

        case 'update': {
          if (intent.mentionedFiles && intent.mentionedFiles.length > 0) {
            const filePath = intent.mentionedFiles[0];
            const fullPath = filePath.startsWith('/') ? filePath : `${currentPath}/${filePath}`;

            try {
              // Check if file exists
              if (!fileSystem.exists(fullPath)) {
                addAssistantMessage(`❌ File not found: **${filePath}**\n\nPlease check the file path and try again.`);
                break;
              }

              // Read current content
              const currentContent = fileSystem.readFile(fullPath);
              
              addAssistantMessage(
                `📝 Updating **${filePath}**...\n\n` +
                `I'll analyze your request and update the file accordingly.\n\n` +
                `**Current file size:** ${currentContent.length} characters\n` +
                `**Your request:** ${userInput.replace(/@[^\s]+/g, '').trim()}`
              );

              // Generate updated content based on user request
              const updateInstruction = userInput.replace(/@[^\s]+/g, '').trim();
              const updatedContent = await generateUpdatedContent(fullPath, currentContent, updateInstruction);

              const action: FileAction = {
                type: 'update',
                path: fullPath,
                content: updatedContent,
                status: 'pending'
              };

              const result = await executeFileAction(action);
              actions.push(result);

              if (result.status === 'success') {
                addAssistantMessage(
                  `✅ Successfully updated **${filePath}**!\n\n` +
                  `**Changes applied:**\n` +
                  `• ${updateInstruction}\n\n` +
                  `The file has been updated with your requested changes.`,
                  [result]
                );
              } else {
                addAssistantMessage(
                  `❌ Failed to update file: ${result.error}`,
                  [result]
                );
              }
            } catch (error) {
              addAssistantMessage(
                `❌ Error updating file: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          } else {
            addAssistantMessage(
              'Please mention a file using @ to update it.\n\n' +
              'For example: "Update @src/App.tsx to add a new component"'
            );
          }
          break;
        }

        case 'generate_project': {
          if (intent.projectDescription) {
            // Use AI-powered project generation
            await generateProjectWithAI(intent.projectDescription);
          } else {
            // Fallback to simple structure generation
            addAssistantMessage('🚀 Generating project structure...');
            
            const projectActions = await generateProjectStructure(userInput);
            const results: FileAction[] = [];

            for (const action of projectActions) {
              const result = await executeFileAction(action);
              results.push(result);
            }

            const successCount = results.filter(r => r.status === 'success').length;
            const errorCount = results.filter(r => r.status === 'error').length;

            addAssistantMessage(
              `✅ Project structure generated!\n\n` +
              `**Created:** ${successCount} items\n` +
              `**Errors:** ${errorCount} items\n\n` +
              `Your project is ready to use!`,
              results
            );
          }
          break;
        }

        default:
          addAssistantMessage(
            'I\'m not sure what you want me to do. Try one of these:\n\n' +
            '• "Create a file called index.html"\n' +
            '• "Make a folder named components"\n' +
            '• "Delete old-file.txt"\n' +
            '• "Rename config.js to config.ts"\n' +
            '• "Update @src/App.tsx to add a header"\n' +
            '• "Generate an Express API structure"'
          );
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addAssistantMessage(
        '❌ Sorry, I encountered an error. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getWorkspaceName = () => {
    if (!workspacePath) return 'No Workspace';
    return workspacePath.split('/').pop() || workspacePath;
  };

  return (
    <div className="ai-file-manager-chat">
      <div className="chat-header">
        <div className="header-content">
          <div className="header-top">
            <h2>AI File Manager</h2>
            <div className="connection-status">
              <div className={`status-indicator ${terminalConnected ? 'connected' : 'disconnected'}`}>
                <span className="status-dot"></span>
                <span className="status-text">
                  {terminalConnected ? 'Terminal Connected' : 'Terminal Disconnected'}
                </span>
              </div>
              {!terminalConnected && (
                <button 
                  className="test-connection-btn"
                  onClick={handleTestConnection}
                  disabled={isCheckingConnection}
                  title="Test terminal connection"
                >
                  {isCheckingConnection ? '⏳ Testing...' : '🔌 Connect'}
                </button>
              )}
            </div>
          </div>
          {workspacePath && (
            <div className="workspace-info">
              <span className="workspace-icon">📁</span>
              <div className="workspace-details">
                <span className="workspace-name">{getWorkspaceName()}</span>
                <span className="workspace-path" title={workspacePath}>{workspacePath}</span>
              </div>
            </div>
          )}
        </div>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message message-${message.role}`}
          >
            <div className="message-header">
              <span className="message-role">
                {message.role === 'user' ? '👤 You' : 
                 message.role === 'assistant' ? '🤖 AI Assistant' : 
                 '💡 System'}
              </span>
              <span className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">
              {message.content.split('\n').map((line, idx) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={idx}><strong>{line.slice(2, -2)}</strong></p>;
                }
                if (line.startsWith('•')) {
                  return <li key={idx}>{line.slice(1).trim()}</li>;
                }
                return <p key={idx}>{line}</p>;
              })}
            </div>
            {message.actions && message.actions.length > 0 && (
              <div className="message-actions">
                <h4>Actions Performed:</h4>
                {message.actions.map((action, idx) => (
                  <div key={idx} className={`action-item action-${action.status}`}>
                    <span className="action-icon">
                      {action.status === 'success' ? '✅' : '❌'}
                    </span>
                    <span className="action-type">{action.type.replace('_', ' ')}</span>
                    <span className="action-path">{action.path}</span>
                    {action.error && <span className="action-error">{action.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="message message-assistant">
            <div className="message-header">
              <span className="message-role">🤖 AI Assistant</span>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="input-wrapper">
          {showSuggestions && fileSuggestions.length > 0 && (
            <div className="file-suggestions">
              <div className="suggestions-header">
                <span>📁 Files & Folders</span>
                <span className="suggestions-hint">Click to insert</span>
              </div>
              {fileSuggestions.map((file, idx) => (
                <div
                  key={idx}
                  className="suggestion-item"
                  onClick={() => insertMention(file)}
                >
                  <span className="suggestion-icon">
                    {file.type === 'directory' ? '📁' : '📄'}
                  </span>
                  <span className="suggestion-path">{file.name}</span>
                  <span className="suggestion-type">{file.type}</span>
                </div>
              ))}
            </div>
          )}
          
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Type @ to mention files, or describe what you want to create..."
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isProcessing}
            rows={2}
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
          >
            {isProcessing ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIFileManagerChat;
