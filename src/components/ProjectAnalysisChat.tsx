/**
 * Project Analysis Chat Component
 * Automatically detects and analyzes the project when opened
 * Shows analysis results in a chat interface
 */

import { useState, useEffect, useRef } from 'react';
import { FileSystemService } from '../services/fileSystemService';
import { ProjectAnalysisService, ProjectAnalysis } from '../services/projectAnalysisService';
import { clientAIService } from '../services/clientAIService';
import { TechStack } from '../types/projectGenerator';
import { PREDEFINED_STACKS } from '../data/predefinedStacks';
import { projectArchitectService } from '../services/projectArchitectService';
import { smartTerminalExecutor } from '../services/smartTerminalExecutor';

import './ProjectAnalysisChat.css';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  analysis?: ProjectAnalysis;
  projectName?: string;
  commands?: string[];
  canRun?: boolean;
}

interface ProjectAnalysisChatProps {
  fileSystem: FileSystemService;
  onClose?: () => void;
  theme?: 'light' | 'dark';
  workspacePath?: string;
  onSendToTerminal?: (command: string) => void;
}

const ProjectAnalysisChat = ({ 
  fileSystem, 
  onClose, 
  theme = 'dark',
  workspacePath,
  onSendToTerminal
}: ProjectAnalysisChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [projectPath, setProjectPath] = useState<string>('');
  const [selectedStack, setSelectedStack] = useState<TechStack | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const analysisService = useRef(new ProjectAnalysisService(fileSystem));

  // Auto-analyze project on mount
  useEffect(() => {
    analyzeProject();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Analyzes the project structure and path
   */
  const analyzeProject = async () => {
    setIsAnalyzing(true);
    
    const systemMessage: ChatMessage = {
      id: 'system-1',
      role: 'system',
      content: 'Analyzing project...',
      timestamp: new Date(),
    };
    setMessages([systemMessage]);

    try {
      // Get project analysis
      const projectAnalysis = await analysisService.current.analyzeProject('/');
      setAnalysis(projectAnalysis);

      // Detect project path - use downloads folder if no workspace
      const defaultPath = '/Users/raushankumar/downloads';
      const detectedPath = workspacePath || defaultPath;
      setProjectPath(detectedPath);

      // Build analysis prompt for AI
      const analysisPrompt = `Analyze this project and provide a helpful summary:

Project Path: ${detectedPath}
Project Type: ${projectAnalysis.projectType || 'Unknown'}
Is Blank: ${projectAnalysis.isBlank}
Technologies: ${projectAnalysis.technologies.join(', ') || 'None detected'}
Total Directories: ${projectAnalysis.structure.totalDirectories}
Total Files: ${projectAnalysis.structure.totalFiles}
Key Files: ${Object.entries(projectAnalysis.keyFiles).filter(([_, exists]) => exists).map(([key]) => key).join(', ') || 'None'}

Provide a concise, friendly analysis summary that:
1. Shows the project path
2. Identifies the project type and purpose
3. Lists detected technologies
4. Highlights key files and structure
5. Offers helpful next steps

Keep it conversational and helpful.`;

      let analysisContent = '';
      
      try {
        const aiResponse = await clientAIService.processRequest({
          command: 'explain',
          code: analysisPrompt,
          language: 'text',
          context: 'Project analysis',
        });
        
        analysisContent = aiResponse.result || 'Unable to generate analysis.';
      } catch (aiError) {
        // Fallback to basic summary
        analysisContent = `Project Path: ${detectedPath}\n\nProject Type: ${projectAnalysis.projectType || 'Unknown'}\n\nTechnologies: ${projectAnalysis.technologies.join(', ') || 'None detected'}\n\nStructure: ${projectAnalysis.structure.totalDirectories} directories, ${projectAnalysis.structure.totalFiles} files`;
      }

      const analysisMessage: ChatMessage = {
        id: 'analysis-1',
        role: 'assistant',
        content: analysisContent,
        timestamp: new Date(),
        analysis: projectAnalysis,
      };

      setMessages([analysisMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: 'error-1',
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to analyze project'}`,
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Sends a user message and gets AI response
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userPrompt = inputValue;
    setInputValue('');
    setIsProcessing(true);

    try {
      // If tech stack is selected, generate project setup
      if (selectedStack) {
        await generateProjectSetup(userPrompt, selectedStack);
      } else {
        // Regular project question
        const projectContext = analysis 
          ? `Project Path: ${projectPath}\nProject Type: ${analysis.projectType || 'Unknown'}\nTechnologies: ${analysis.technologies.join(', ')}\nTotal Files: ${analysis.structure.totalFiles}`
          : 'Project analysis not available';

        const response = await clientAIService.processRequest({
          command: 'explain',
          code: userPrompt,
          language: 'text',
          context: `User question about their project. Context: ${projectContext}`,
          conversationHistory: messages
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content,
            })),
        });

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.result || 'Unable to generate response.',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process request'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Generates project setup in one step: analyze, name, commands, and architecture
   */
  const generateProjectSetup = async (prompt: string, stack: TechStack) => {
    const thinkingMessage: ChatMessage = {
      id: `thinking-${Date.now()}`,
      role: 'assistant',
      content: '🔄 Analyzing your idea and designing complete project architecture...',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, thinkingMessage]);

    try {
      // Check if stack uses Supabase and get credentials
      let supabaseEnvVars = '';
      if (stack.database === 'Supabase') {
        const supabaseConfig = (await import('../services/supabaseService')).supabaseService.getConfig();
        if (supabaseConfig) {
          supabaseEnvVars = `\nVITE_SUPABASE_URL=${supabaseConfig.url}\nVITE_SUPABASE_ANON_KEY=${supabaseConfig.anonKey}`;
        } else {
          // Show warning if Supabase not configured
          const warningMessage: ChatMessage = {
            id: `warning-${Date.now()}`,
            role: 'system',
            content: '⚠️ Supabase credentials not found. Please configure Supabase in the Supabase panel first, or the .env file will be created without Supabase credentials.',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, warningMessage]);
        }
      }

      // Generate complete project architecture
      const architecture = await projectArchitectService.generateArchitecture(prompt, stack);
      
      // Show architecture preview
      const archMessage: ChatMessage = {
        id: `arch-${Date.now()}`,
        role: 'assistant',
        content: `📐 **Project Architecture Designed!**\n\n**Name:** ${architecture.projectName}\n**Type:** ${architecture.projectType}\n\n**Pages:** ${architecture.pages.map(p => p.name).join(', ')}\n**Components:** ${architecture.components.map(c => c.name).join(', ')}\n**Services:** ${architecture.services.map(s => s.name).join(', ')}\n${architecture.routes.length > 0 ? `**API Routes:** ${architecture.routes.length} endpoints\n` : ''}${architecture.database.length > 0 ? `**Database Tables:** ${architecture.database.map(t => t.tableName).join(', ')}` : ''}\n\nGenerating setup commands...`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, archMessage]);
      // Generate setup commands based on stack
      const projectName = architecture.projectName;
      const projectType = architecture.projectType;
      
      // Base setup commands for frontend
      const frontendCommands: string[] = [];
      const backendCommands: string[] = [];
      const setupCommands: string[] = [];

      // Create frontend directory and initialize
      setupCommands.push('mkdir frontend');
      frontendCommands.push('cd frontend');
      
      // Frontend initialization based on stack
      if (stack.frontend === 'React') {
        frontendCommands.push('npm create vite@latest . -- --template react-ts -y');
      } else if (stack.frontend === 'Next.js') {
        frontendCommands.push('npx create-next-app@latest . --typescript --tailwind --app --yes');
      } else if (stack.frontend === 'React Native') {
        frontendCommands.push('npx create-expo-app . --template blank-typescript');
      }
      
      frontendCommands.push('npm install -y');
      
      // Add Supabase client if needed
      if (stack.database === 'Supabase') {
        frontendCommands.push('npm install @supabase/supabase-js -y');
      }
      
      frontendCommands.push('cd ..');

      // Backend setup if needed
      if (stack.backend) {
        setupCommands.push('mkdir backend');
        backendCommands.push('cd backend');
        
        if (stack.backend.includes('Node.js') || stack.backend.includes('Express')) {
          backendCommands.push('npm init -y');
          backendCommands.push('npm install express cors dotenv -y');
        } else if (stack.backend.includes('FastAPI')) {
          backendCommands.push('python -m venv venv');
          backendCommands.push('source venv/bin/activate || .\\venv\\Scripts\\activate');
          backendCommands.push('pip install fastapi uvicorn');
        } else if (stack.backend.includes('Django')) {
          backendCommands.push('python -m venv venv');
          backendCommands.push('source venv/bin/activate || .\\venv\\Scripts\\activate');
          backendCommands.push('pip install django djangorestframework');
        }
        
        backendCommands.push('cd ..');
      }

      // Generate file creation commands from architecture
      const fileCommands = projectArchitectService.generateFileCommands(architecture, supabaseEnvVars);
      
      // Combine all commands
      const commands = [...setupCommands, ...frontendCommands, ...backendCommands, ...fileCommands];

      // Show result with run button
      const supabaseInfo = supabaseEnvVars ? '\n\n🔐 **Supabase:** Credentials will be added to .env file automatically' : '';
      const resultMessage: ChatMessage = {
        id: `result-${Date.now()}`,
        role: 'assistant',
        content: `✅ Project Setup Ready!\n\n📦 **Project Name:** ${projectName}\n📱 **Type:** ${projectType}\n🛠️ **Tech Stack:** ${stack.name}\n📁 **Location:** ${projectPath}/${projectName}${supabaseInfo}\n\n**Commands to execute:**\n${commands.map((cmd, i) => `${i + 1}. ${cmd}`).join('\n')}\n\nClick "Run Commands" to execute in terminal.`,
        timestamp: new Date(),
        projectName,
        commands,
        canRun: true,
      };

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = resultMessage;
        return updated;
      });

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to generate setup'}`,
        timestamp: new Date(),
      };
      
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = errorMessage;
        return updated;
      });
    }
  };

  /**
   * Runs the commands in terminal with intelligent waiting and completion detection
   * Creates separate terminals for frontend and backend
   */
  const handleRunCommands = async (commands: string[], projectName: string) => {
    if (!onSendToTerminal) {
      alert('Terminal not available');
      return;
    }

    const projectDir = `${projectPath}/${projectName}`;
    
    // Separate commands into setup, frontend, and backend
    const setupCommands: string[] = [];
    const frontendCommands: string[] = [];
    const backendCommands: string[] = [];
    
    let currentSection: 'setup' | 'frontend' | 'backend' = 'setup';
    
    for (const cmd of commands) {
      const lowerCmd = cmd.toLowerCase();
      
      // Detect section changes
      if (lowerCmd.includes('cd frontend') || lowerCmd.includes('cd ./frontend')) {
        currentSection = 'frontend';
        continue;
      } else if (lowerCmd.includes('cd backend') || lowerCmd.includes('cd ./backend')) {
        currentSection = 'backend';
        continue;
      } else if (lowerCmd === 'cd ..' && currentSection !== 'setup') {
        currentSection = 'setup';
        continue;
      }
      
      // Add command to appropriate section
      if (currentSection === 'frontend') {
        frontendCommands.push(cmd);
      } else if (currentSection === 'backend') {
        backendCommands.push(cmd);
      } else {
        setupCommands.push(cmd);
      }
    }
    
    // Show starting message
    const startMessage: ChatMessage = {
      id: `start-${Date.now()}`,
      role: 'system',
      content: `🚀 Starting intelligent command execution...\n\nProject: ${projectDir}\n\n📦 Setup: ${setupCommands.length} commands\n🎨 Frontend: ${frontendCommands.length} commands\n⚙️ Backend: ${backendCommands.length} commands\n\n⏱️ Commands will wait for completion before proceeding...`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, startMessage]);

    // Clear terminal output buffer
    smartTerminalExecutor.clearOutput();

    // Step 1: Navigate to project location
    onSendToTerminal(`cd "${projectPath}"`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onSendToTerminal(`mkdir ${projectName}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onSendToTerminal(`cd ${projectName}`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Execute setup commands with smart waiting
    if (setupCommands.length > 0) {
      const setupCmdDefs = smartTerminalExecutor.categorizeCommands(setupCommands);
      
      await smartTerminalExecutor.executeCommands(
        setupCmdDefs,
        onSendToTerminal,
        {
          onProgress: (msg) => {
            const execMessage: ChatMessage = {
              id: `exec-setup-${Date.now()}`,
              role: 'system',
              content: `📦 ${msg}`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, execMessage]);
          }
        }
      );
    }

    // Step 3: Execute frontend commands
    if (frontendCommands.length > 0) {
      const frontendMessage: ChatMessage = {
        id: `frontend-start-${Date.now()}`,
        role: 'system',
        content: `🎨 Starting Frontend Setup...\n\nThis may take a few minutes. Commands will wait for completion.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, frontendMessage]);

      onSendToTerminal(`cd frontend`);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const frontendCmdDefs = smartTerminalExecutor.categorizeCommands(frontendCommands);
      
      await smartTerminalExecutor.executeCommands(
        frontendCmdDefs,
        onSendToTerminal,
        {
          onProgress: (msg) => {
            const execMessage: ChatMessage = {
              id: `exec-frontend-${Date.now()}`,
              role: 'system',
              content: `🎨 ${msg}`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, execMessage]);
          }
        }
      );

      onSendToTerminal(`cd ..`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Step 4: Instructions for backend in new terminal
    if (backendCommands.length > 0) {
      const backendMessage: ChatMessage = {
        id: `backend-start-${Date.now()}`,
        role: 'system',
        content: `⚙️ Backend Setup Required\n\nCreate a NEW terminal (click + button) and run:\n\ncd "${projectDir}/backend"\n${backendCommands.map(cmd => cmd).join('\n')}\n\nThis keeps frontend and backend terminals separate for easier development.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, backendMessage]);
    }

    // Show completion message
    const confirmMessage: ChatMessage = {
      id: `confirm-${Date.now()}`,
      role: 'system',
      content: `✅ Frontend setup complete!\n\n${backendCommands.length > 0 ? '⚠️ Remember to create a new terminal for backend commands above.\n\n' : ''}Project location: ${projectDir}\n\n💡 Tip: All commands waited for completion before proceeding.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMessage]);
  };





  /**
   * Handles Enter key press
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`project-analysis-chat ${theme}`}>
      <div className="chat-header">
        <div className="header-left">
          <h2>Project Analysis</h2>
          {projectPath && (
            <div className="project-path-display">
              <span className="path-icon">📁</span>
              <span className="path-text" title={projectPath}>{projectPath}</span>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button
            className="refresh-button"
            onClick={analyzeProject}
            title="Re-analyze project"
            disabled={isAnalyzing}
          >
            🔄
          </button>
          {onClose && (
            <button
              className="close-button"
              onClick={onClose}
              title="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="chat-content">
        <div className="messages-container">
          {messages.length === 0 && isAnalyzing && (
            <div className="empty-state">
              <div className="loading-spinner"></div>
              <p>Analyzing project...</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-header">
                <span className="message-role">
                  {message.role === 'user' ? 'You' : message.role === 'system' ? 'System' : 'Assistant'}
                </span>
                <span className="message-timestamp">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">
                {message.content.split('\n').map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
              
              {message.analysis && !message.analysis.isBlank && (
                <div className="analysis-details">
                  <details>
                    <summary>View Details</summary>
                    <div className="structure-tree">
                      <div className="structure-item">
                        <strong>Directories:</strong> {message.analysis.structure.totalDirectories}
                      </div>
                      <div className="structure-item">
                        <strong>Files:</strong> {message.analysis.structure.totalFiles}
                      </div>
                      {message.analysis.technologies.length > 0 && (
                        <div className="structure-item">
                          <strong>Technologies:</strong>
                          <div className="tech-tags">
                            {message.analysis.technologies.map((tech, idx) => (
                              <span key={idx} className="tech-tag">{tech}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {message.canRun && message.commands && message.projectName && (
                <div className="run-commands-panel">
                  <button
                    className="run-commands-button"
                    onClick={() => handleRunCommands(message.commands!, message.projectName!)}
                  >
                    ▶ Run Commands in Terminal
                  </button>
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="message assistant">
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

        <div className="input-container">
          <div className="tech-stack-selector">
            <label htmlFor="tech-stack-dropdown">Tech Stack:</label>
            <select
              id="tech-stack-dropdown"
              className="tech-stack-dropdown"
              value={selectedStack?.id || ''}
              onChange={(e) => {
                const stack = PREDEFINED_STACKS.find(s => s.id === e.target.value);
                setSelectedStack(stack || null);
              }}
              disabled={isProcessing || isAnalyzing}
            >
              <option value="">Select Tech Stack (Optional)</option>
              {PREDEFINED_STACKS.map(stack => (
                <option key={stack.id} value={stack.id}>
                  {stack.name} - {stack.frontend}
                </option>
              ))}
            </select>
          </div>

          {selectedStack && (
            <div className="selected-stack-info">
              <span className="stack-badge">
                🛠️ {selectedStack.name}
              </span>
              <span className="stack-hint">
                Describe your project idea to generate a name
              </span>
            </div>
          )}

          <div className="input-wrapper">
            <textarea
              className="message-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedStack 
                  ? "Describe your project idea (e.g., 'A task management app for teams')..." 
                  : "Ask about your project..."
              }
              rows={3}
              disabled={isProcessing || isAnalyzing}
            />
            <button
              className="send-button"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing || isAnalyzing}
              title="Send message (Enter)"
            >
              {selectedStack ? 'Generate Name' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalysisChat;

