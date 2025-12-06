import React, { useState, useRef, useEffect } from 'react';
import { TechStack, ColorTheme, ChatMessage } from '../types/projectGenerator';
import { PREDEFINED_STACKS } from '../data/predefinedStacks';
import { PREDEFINED_THEMES } from '../data/predefinedThemes';
import AIModelSelector, { AIModel, AI_MODELS } from './AIModelSelector';
import './AIProjectChat.css';

interface AIProjectChatProps {
  onClose?: () => void;
}

const AIProjectChat: React.FC<AIProjectChatProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [_sessionId, setSessionId] = useState<string | null>(null);
  const [selectedStack, setSelectedStack] = useState<TechStack | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ColorTheme>(PREDEFINED_THEMES[0]);
  const [selectedModel, setSelectedModel] = useState<AIModel>(
    AI_MODELS.find(m => m.id === 'gemini-2.0-flash-exp') || AI_MODELS[0]
  );
  const [currentPhase, setCurrentPhase] = useState<string>('initial');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Add welcome message
    addSystemMessage(
      'Welcome to AI Project Generator! 🚀\n\n' +
      'I can help you create a complete project from scratch. Just tell me what you want to build!\n\n' +
      'For example:\n' +
      '- "Create a todo app with React and Firebase"\n' +
      '- "Build an e-commerce site with Next.js"\n' +
      '- "Make a blog with authentication"'
    );
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const addAssistantMessage = (content: string, metadata?: ChatMessage['metadata']) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      metadata,
    };
    setMessages(prev => [...prev, message]);
  };

  const analyzeUserIntent = async (input: string): Promise<{
    intent: 'create_project' | 'select_stack' | 'modify_requirements' | 'execute_task' | 'general_query';
    entities: {
      projectType?: string;
      techStack?: string;
      database?: string;
      features?: string[];
    };
  }> => {
    // Simple intent analysis (in production, this would use AI)
    const lowerInput = input.toLowerCase();
    
    // Check for project creation intent
    if (lowerInput.match(/create|build|make|develop|generate|weather|app|application|site|website|platform/)) {
      const entities: any = {};
      
      // Extract project type
      if (lowerInput.includes('todo') || lowerInput.includes('task')) {
        entities.projectType = 'todo app';
      } else if (lowerInput.includes('weather')) {
        entities.projectType = 'weather app';
      } else if (lowerInput.includes('blog')) {
        entities.projectType = 'blog';
      } else if (lowerInput.includes('ecommerce') || lowerInput.includes('shop')) {
        entities.projectType = 'e-commerce';
      } else if (lowerInput.includes('dashboard')) {
        entities.projectType = 'dashboard';
      } else if (lowerInput.includes('portfolio')) {
        entities.projectType = 'portfolio';
      } else if (lowerInput.includes('chat')) {
        entities.projectType = 'chat app';
      } else if (lowerInput.includes('social')) {
        entities.projectType = 'social media';
      } else {
        // Generic application
        entities.projectType = 'application';
      }
      
      // Extract tech stack preferences
      if (lowerInput.includes('react') && !lowerInput.includes('next')) {
        entities.techStack = 'react';
      } else if (lowerInput.includes('next')) {
        entities.techStack = 'nextjs';
      } else if (lowerInput.includes('vue')) {
        entities.techStack = 'vue';
      } else if (lowerInput.includes('angular')) {
        entities.techStack = 'angular';
      }
      
      // Extract database preferences
      if (lowerInput.includes('supabase')) {
        entities.database = 'supabase';
      } else if (lowerInput.includes('firebase')) {
        entities.database = 'firebase';
      } else if (lowerInput.includes('mongodb') || lowerInput.includes('mongo')) {
        entities.database = 'mongodb';
      }
      
      // Extract features
      entities.features = [];
      if (lowerInput.includes('auth')) entities.features.push('authentication');
      if (lowerInput.includes('database') || lowerInput.includes('db')) entities.features.push('database');
      if (lowerInput.includes('api')) entities.features.push('api');
      if (lowerInput.includes('dark mode')) entities.features.push('dark mode');
      if (lowerInput.includes('routing') || lowerInput.includes('navigation')) entities.features.push('routing');
      
      return { intent: 'create_project', entities };
    }
    
    return { intent: 'general_query', entities: {} };
  };

  const suggestTechStack = (projectType?: string, techPreference?: string, databasePreference?: string): TechStack => {
    // Smart stack suggestion based on project type and preferences
    
    // If user specified database, prioritize that
    if (databasePreference === 'supabase') {
      if (techPreference === 'nextjs') {
        return PREDEFINED_STACKS.find(s => s.id === 'nextjs-supabase') || PREDEFINED_STACKS[2];
      }
      return PREDEFINED_STACKS.find(s => s.database.toLowerCase().includes('supabase')) || PREDEFINED_STACKS[0];
    }
    
    if (databasePreference === 'firebase') {
      return PREDEFINED_STACKS.find(s => s.database.toLowerCase().includes('firebase')) || PREDEFINED_STACKS[0];
    }
    
    // If user specified frontend framework
    if (techPreference === 'nextjs') {
      return PREDEFINED_STACKS.find(s => s.id === 'nextjs-supabase') || PREDEFINED_STACKS[2];
    }
    
    if (techPreference === 'react') {
      return PREDEFINED_STACKS.find(s => s.frontend.includes('React') && !s.frontend.includes('Next')) || PREDEFINED_STACKS[0];
    }
    
    // Project type based suggestions
    if (projectType === 'blog' || projectType === 'portfolio') {
      return PREDEFINED_STACKS.find(s => s.id === 'nextjs-supabase') || PREDEFINED_STACKS[2];
    }
    
    if (projectType === 'e-commerce' || projectType === 'dashboard') {
      return PREDEFINED_STACKS.find(s => s.id === 'nextjs-supabase') || PREDEFINED_STACKS[2];
    }
    
    if (projectType === 'weather app' || projectType === 'chat app') {
      return PREDEFINED_STACKS.find(s => s.database.toLowerCase().includes('supabase')) || PREDEFINED_STACKS[0];
    }
    
    // Default to React + Supabase for beginners
    return PREDEFINED_STACKS[0];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userInput = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    try {
      addUserMessage(userInput);

      // Analyze user intent
      const { intent, entities } = await analyzeUserIntent(userInput);

      if (intent === 'create_project') {
        // Suggest tech stack
        const suggestedStack = suggestTechStack(entities.projectType, entities.techStack, entities.database);
        setSelectedStack(suggestedStack);

        addAssistantMessage(
          `Perfect! I'll help you create a ${entities.projectType || 'project'}. 🎯\n\n` +
          `Based on your requirements, I suggest using **${suggestedStack.name}**:\n` +
          `- Frontend: ${suggestedStack.frontend}\n` +
          `${suggestedStack.backend ? `- Backend: ${suggestedStack.backend}\n` : ''}` +
          `- Database: ${suggestedStack.database}\n\n` +
          `This stack is perfect for ${suggestedStack.useCases.join(', ')}.\n\n` +
          `Shall I proceed and generate your complete project? (Type "yes" to continue or "different stack" to see other options)`
        );

        setCurrentPhase('stack-confirmation');
      } else if (currentPhase === 'stack-confirmation') {
        if (userInput.toLowerCase().includes('yes') || userInput.toLowerCase().includes('proceed')) {
          // Start project generation
          await startProjectGeneration(userInput);
        } else if (userInput.toLowerCase().includes('different') || userInput.toLowerCase().includes('other')) {
          // Show stack selector
          addAssistantMessage(
            'No problem! Here are all available tech stacks:\n\n' +
            PREDEFINED_STACKS.map((stack, idx) => 
              `${idx + 1}. **${stack.name}** - ${stack.frontend} + ${stack.database}`
            ).join('\n') +
            '\n\nJust tell me the number or name of the stack you prefer.'
          );
          setCurrentPhase('stack-selection');
        }
      } else if (currentPhase === 'stack-selection') {
        // Parse stack selection
        const stackNumber = parseInt(userInput);
        let chosenStack: TechStack | undefined;
        
        if (!isNaN(stackNumber) && stackNumber > 0 && stackNumber <= PREDEFINED_STACKS.length) {
          chosenStack = PREDEFINED_STACKS[stackNumber - 1];
        } else {
          chosenStack = PREDEFINED_STACKS.find(s => 
            s.name.toLowerCase().includes(userInput.toLowerCase())
          );
        }
        
        if (chosenStack) {
          setSelectedStack(chosenStack);
          addAssistantMessage(
            `Perfect! I'll use **${chosenStack.name}**. Let's start building! 🚀`
          );
          await startProjectGeneration(userInput);
        } else {
          addAssistantMessage(
            'I couldn\'t find that stack. Please choose a number from 1 to ' + PREDEFINED_STACKS.length
          );
        }
      } else {
        addAssistantMessage(
          'I can help you create a project! Just describe what you want to build.\n\n' +
          'For example: "Create a todo app with React and Firebase"'
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

  const startProjectGeneration = async (description: string) => {
    if (!selectedStack) return;

    try {
      addAssistantMessage('🔄 Initializing AI-powered project generation...');

      // Import services
      const { getProjectGenerator } = await import('../services/projectGeneratorService');
      const { getAutoProjectSetup } = await import('../services/autoProjectSetupService');
      const { getAICodeGenerator } = await import('../services/aiCodeGeneratorService');
      
      const generator = getProjectGenerator();
      const autoSetup = getAutoProjectSetup();
      const codeGenerator = getAICodeGenerator();

      // Set up progress callback
      autoSetup.setProgressCallback((progress) => {
        console.log(`[${progress.phase}] ${progress.message} - ${progress.progress}%`);
      });

      // Create session
      const newSessionId = await generator.startNewProject();
      setSessionId(newSessionId);

      // Select stack and theme
      await generator.selectStack(newSessionId, selectedStack);
      await generator.selectTheme(newSessionId, selectedTheme);

      addAssistantMessage(
        `✅ Project initialized!\n\n` +
        `**Stack:** ${selectedStack.name}\n` +
        `**Theme:** ${selectedTheme.name}\n\n` +
        `Now I'll generate complete, production-ready code...`
      );

      // Extract project name and features
      const projectName = description.split(' ').slice(0, 3).join(' ') || 'My Project';
      const features: string[] = [];
      
      if (description.toLowerCase().includes('auth')) features.push('authentication');
      if (description.toLowerCase().includes('dark mode')) features.push('dark mode');
      if (description.toLowerCase().includes('routing')) features.push('routing');

      // Generate complete code using AI
      addAssistantMessage('🤖 Generating complete application code with AI...');
      
      const codeResult = await codeGenerator.generateProject({
        projectName,
        description,
        stack: selectedStack,
        theme: selectedTheme,
        features
      });

      addAssistantMessage(
        `✅ **Code Generation Complete!**\n\n` +
        `📄 **Files Generated:** ${codeResult.files.length}\n` +
        `📦 **Dependencies Required:** ${codeResult.dependencies.length}\n\n` +
        `**Generated Files:**\n` +
        codeResult.files.map(f => `- ${f.path}`).join('\n') +
        `\n\nNow setting up project structure...`
      );

      // Auto setup project structure
      addAssistantMessage('🏗️ Creating folders and installing dependencies...');
      
      const setupResult = await autoSetup.setupProject(projectName, selectedStack, description);

      // Write generated code files
      addAssistantMessage('📝 Writing generated code to files...');
      
      for (const file of codeResult.files) {
        try {
          const { nativeFileSystem } = await import('../services/nativeFileSystemService');
          if (nativeFileSystem && typeof nativeFileSystem.writeFile === 'function') {
            await nativeFileSystem.writeFile(file.path, file.content || '');
          } else {
            console.log(`Would write file: ${file.path}`);
          }
        } catch (error) {
          console.error(`Failed to write ${file.path}:`, error);
        }
      }

      if (setupResult.success) {
        addAssistantMessage(
          `🎉 **Project Created Successfully!**\n\n` +
          `📁 **Folders:** ${setupResult.structure.created.length}\n` +
          `📄 **Code Files:** ${codeResult.files.length}\n` +
          `📦 **Dependencies:** ${setupResult.dependencies.installed.length}\n\n` +
          `**Next Steps:**\n` +
          codeResult.instructions.map((inst, idx) => `${idx + 1}. ${inst}`).join('\n') +
          `\n\n**Your ${projectName} is ready to use!** 🚀`
        );
      } else {
        addAssistantMessage(
          `⚠️ **Project Created with Warnings**\n\n` +
          `Code generated successfully, but some setup steps had issues:\n` +
          setupResult.errors.map(e => `- ${e}`).join('\n') +
          `\n\nYou may need to manually install some dependencies.`
        );
      }

      setCurrentPhase('complete');
    } catch (error) {
      console.error('Error starting project generation:', error);
      addAssistantMessage(
        '❌ Failed to generate project. Please try again or check your configuration.'
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="ai-project-chat">
      <div className="chat-header">
        <div className="header-left">
          <h2>🤖 AI Project Generator</h2>
          {selectedStack && (
            <span className="current-stack">
              {selectedStack.name}
            </span>
          )}
        </div>
        <div className="header-actions">
          <AIModelSelector
            selectedModel={selectedModel}
            onModelSelected={setSelectedModel}
            placeholder="AI Model"
          />
          {onClose && (
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          )}
        </div>
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
              {message.content.split('\n').map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>
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
        {/* Quick Options Bar */}
        <div className="quick-options-bar">
          <div className="quick-options-section">
            <span className="options-label">💡 Quick Start:</span>
            <div className="quick-buttons">
              <button
                className="quick-btn"
                onClick={() => setInputValue('Create a todo app with React and Firebase')}
                disabled={isProcessing}
              >
                📝 Todo App
              </button>
              <button
                className="quick-btn"
                onClick={() => setInputValue('Build a weather app with React and Supabase')}
                disabled={isProcessing}
              >
                🌤️ Weather App
              </button>
              <button
                className="quick-btn"
                onClick={() => setInputValue('Create a blog with Next.js and Supabase')}
                disabled={isProcessing}
              >
                📰 Blog
              </button>
              <button
                className="quick-btn"
                onClick={() => setInputValue('Build an e-commerce site with Next.js')}
                disabled={isProcessing}
              >
                🛒 E-commerce
              </button>
            </div>
          </div>
          
          <div className="quick-options-section">
            <span className="options-label">🎨 Theme:</span>
            <div className="theme-selector-compact">
              {PREDEFINED_THEMES.slice(0, 5).map((theme) => (
                <button
                  key={theme.id}
                  className={`theme-btn ${selectedTheme.id === theme.id ? 'active' : ''}`}
                  onClick={() => setSelectedTheme(theme)}
                  style={{ borderColor: theme.primary }}
                  title={theme.name}
                  disabled={isProcessing}
                >
                  <span className="theme-color" style={{ backgroundColor: theme.primary }}></span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stack Combinations Helper */}
        <div className="stack-combinations-helper">
          <details className="combinations-dropdown">
            <summary>🔧 View All Tech Stack Combinations</summary>
            <div className="combinations-grid">
              <div className="combination-category">
                <h4>🟢 Beginner Friendly</h4>
                <button onClick={() => setInputValue('Create a project with React + Firebase')}>
                  React + Firebase
                </button>
                <button onClick={() => setInputValue('Create a project with React + Supabase')}>
                  React + Supabase
                </button>
                <button onClick={() => setInputValue('Create a project with HTML + CSS + JavaScript')}>
                  HTML + CSS + JS
                </button>
              </div>

              <div className="combination-category">
                <h4>🔵 Intermediate</h4>
                <button onClick={() => setInputValue('Build a project with React + Express + MongoDB')}>
                  React + Express + MongoDB
                </button>
                <button onClick={() => setInputValue('Build a project with Vue + Node.js + PostgreSQL')}>
                  Vue + Node.js + PostgreSQL
                </button>
                <button onClick={() => setInputValue('Build a project with React + Node.js + MySQL')}>
                  React + Node.js + MySQL
                </button>
              </div>

              <div className="combination-category">
                <h4>🟣 Advanced</h4>
                <button onClick={() => setInputValue('Create a project with Next.js + Supabase')}>
                  Next.js + Supabase
                </button>
                <button onClick={() => setInputValue('Create a project with Next.js + Firebase')}>
                  Next.js + Firebase
                </button>
                <button onClick={() => setInputValue('Create a project with Next.js + PostgreSQL')}>
                  Next.js + PostgreSQL
                </button>
              </div>

              <div className="combination-category">
                <h4>📱 Mobile + Web</h4>
                <button onClick={() => setInputValue('Build a project with React + React Native + Firebase')}>
                  React + React Native + Firebase
                </button>
                <button onClick={() => setInputValue('Build a project with Next.js + React Native + Supabase')}>
                  Next.js + React Native + Supabase
                </button>
              </div>

              <div className="combination-category">
                <h4>🚀 Ultimate Stack</h4>
                <button onClick={() => setInputValue('Create a project with Next.js + React Native + Supabase + TypeScript')}>
                  Next.js + React Native + Supabase + TS
                </button>
                <button onClick={() => setInputValue('Create a project with Next.js + Expo + Supabase + TypeScript')}>
                  Next.js + Expo + Supabase + TS
                </button>
              </div>
            </div>
          </details>
        </div>

        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Describe your project... (e.g., 'Create a todo app with React and Firebase') or click a suggestion above"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isProcessing}
          rows={3}
        />
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || isProcessing}
        >
          {isProcessing ? '⏳' : '🚀'} Send
        </button>
      </div>
    </div>
  );
};

export default AIProjectChat;
