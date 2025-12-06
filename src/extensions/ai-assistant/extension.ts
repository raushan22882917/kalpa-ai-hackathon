/**
 * AI Assistant Extension for Monaco Editor
 * Provides AI-powered code assistance features
 */

import type * as Monaco from 'monaco-editor';
import { AIService } from './aiService';
import { getCodeSelection } from './codeSelection';
import {
  registerSlashCommandProvider,
  detectSlashCommand,
  executeSlashCommand,
  removeSlashCommandText,
  type SlashCommand,
} from './slashCommands';
import { registerAICompletionProvider } from './completionProvider';
import { setupErrorIndicators } from './errorDetection';
import { registerEnhancedErrorHoverProvider } from './errorHoverProvider';
import { registerFixCodeActionProvider } from './fixApplication';
import { notificationService } from '../../services/notificationService';

export interface ExtensionContext {
  monaco: typeof Monaco;
  editor: Monaco.editor.IStandaloneCodeEditor;
  config: {
    aiBackendUrl: string;
    apiKey: string;
  };
  onShowPanel?: () => void;
  onAddMessage?: (message: any) => void;
  onGetConversationContext?: () => any[];
}

export interface Extension {
  activate(context: ExtensionContext): void;
  deactivate(): void;
}

/**
 * AI Assistant Extension
 * Integrates AI features into Monaco Editor
 */
export class AIAssistantExtension implements Extension {
  private context: ExtensionContext | null = null;
  private disposables: Monaco.IDisposable[] = [];
  private aiService: AIService | null = null;
  private aiFeaturesDisabled: boolean = false;

  activate(context: ExtensionContext): void {
    this.context = context;
    this.aiService = new AIService(context.config.aiBackendUrl, context.config.apiKey);

    // Register AI button actions
    this.registerAIActions();

    // Register slash commands
    this.registerSlashCommands();

    // Register inline completion provider
    this.registerCompletionProvider();

    // Setup error detection and indicators
    this.setupErrorDetection();

    console.log('AI Assistant Extension activated');
  }

  deactivate(): void {
    // Dispose all registered handlers
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
    this.context = null;
    this.aiService = null;
    console.log('AI Assistant Extension deactivated');
  }

  /**
   * Register AI actions (context menu items)
   */
  private registerAIActions(): void {
    const { editor } = this.getContext();

    // Add AI Explain action
    editor.addAction({
      id: 'ai.explain',
      label: 'AI: Explain Code',
      contextMenuGroupId: 'ai',
      contextMenuOrder: 1,
      precondition: undefined,
      keybindingContext: undefined,
      run: async (ed) => {
        await this.handleAICommand('explain', ed as Monaco.editor.IStandaloneCodeEditor);
      },
    });

    // Add AI Fix action
    editor.addAction({
      id: 'ai.fix',
      label: 'AI: Fix Code',
      contextMenuGroupId: 'ai',
      contextMenuOrder: 2,
      precondition: undefined,
      keybindingContext: undefined,
      run: async (ed) => {
        await this.handleAICommand('fix', ed as Monaco.editor.IStandaloneCodeEditor);
      },
    });

    // Add AI Document action
    editor.addAction({
      id: 'ai.document',
      label: 'AI: Generate Documentation',
      contextMenuGroupId: 'ai',
      contextMenuOrder: 3,
      precondition: undefined,
      keybindingContext: undefined,
      run: async (ed) => {
        await this.handleAICommand('document', ed as Monaco.editor.IStandaloneCodeEditor);
      },
    });

    console.log('AI actions registered in context menu');
  }

  /**
   * Handle AI command execution
   */
  private async handleAICommand(
    command: 'explain' | 'fix' | 'document',
    editor: Monaco.editor.IStandaloneCodeEditor
  ): Promise<void> {
    const { monaco } = this.getContext();

    if (!this.aiService) {
      console.error('AI Service not initialized');
      notificationService.error('AI Service not initialized');
      return;
    }

    // Check if AI features are disabled
    if (this.aiFeaturesDisabled) {
      notificationService.error('AI features are disabled due to authentication failure. Please check your API key in settings.');
      return;
    }

    // Get code selection
    const codeContext = getCodeSelection(editor, monaco);
    if (!codeContext || !codeContext.selectedCode) {
      console.warn('No code selected');
      notificationService.warning('Please select code to use AI features');
      return;
    }

    console.log(`Executing AI command: ${command}`, {
      code: codeContext.selectedCode,
      language: codeContext.language,
    });

    try {
      // Get conversation context for follow-up questions
      const conversationHistory = this.context?.onGetConversationContext?.() || [];

      // Send request to AI backend
      const response = await this.aiService.sendRequest({
        command,
        code: codeContext.selectedCode,
        language: codeContext.language,
        context: codeContext.surroundingCode
          ? `${codeContext.surroundingCode.before}\n${codeContext.surroundingCode.after}`
          : undefined,
        conversationHistory,
      });

      if (response.error) {
        console.error('AI request error:', response.error);
        
        // Check for authentication errors
        if (response.error.includes('Authentication failed')) {
          this.aiFeaturesDisabled = true;
          notificationService.error('Authentication failed. Please check your API key in settings. AI features have been disabled.');
        } else {
          notificationService.error(response.error);
        }
        return;
      }

      console.log('AI response received:', response.result);
      
      // Display response in AI panel
      this.displayInPanel(command, codeContext.selectedCode, response.result, response.suggestions);
    } catch (error) {
      console.error('Failed to execute AI command:', error);
      notificationService.error('Failed to execute AI command. Please try again.');
    }
  }

  protected registerDisposable(disposable: Monaco.IDisposable): void {
    this.disposables.push(disposable);
  }

  protected getContext(): ExtensionContext {
    if (!this.context) {
      throw new Error('Extension not activated');
    }
    return this.context;
  }

  /**
   * Register slash commands
   */
  private registerSlashCommands(): void {
    const { monaco, editor } = this.getContext();

    // Register completion provider for slash commands
    const completionProvider = registerSlashCommandProvider(monaco, editor);
    this.registerDisposable(completionProvider);

    // Listen for Enter key to execute slash commands
    const commandDisposable = editor.onKeyDown((e) => {
      if (e.keyCode === monaco.KeyCode.Enter) {
        const commandMatch = detectSlashCommand(editor, monaco);
        if (commandMatch) {
          e.preventDefault();
          e.stopPropagation();

          // Remove the slash command text
          removeSlashCommandText(editor, commandMatch);

          // Execute the command
          executeSlashCommand(
            commandMatch.command,
            editor,
            monaco,
            async (cmd, context) => {
              await this.handleSlashCommand(cmd, context);
            }
          );
        }
      }
    });

    this.registerDisposable(commandDisposable);

    console.log('Slash commands registered');
  }

  /**
   * Handle slash command execution
   */
  private async handleSlashCommand(command: SlashCommand, context: string): Promise<void> {
    const { editor } = this.getContext();

    if (!this.aiService) {
      console.error('AI Service not initialized');
      notificationService.error('AI Service not initialized');
      return;
    }

    // Check if AI features are disabled
    if (this.aiFeaturesDisabled) {
      notificationService.error('AI features are disabled due to authentication failure. Please check your API key in settings.');
      return;
    }

    const model = editor.getModel();
    if (!model) {
      return;
    }

    const language = model.getLanguageId();

    console.log(`Executing slash command: /${command}`, {
      context: context.substring(0, 100) + '...',
      language,
    });

    try {
      // Get conversation context for follow-up questions
      const conversationHistory = this.context?.onGetConversationContext?.() || [];

      // Send request to AI backend
      const response = await this.aiService.sendRequest({
        command,
        code: context,
        language,
        conversationHistory,
      });

      if (response.error) {
        console.error('AI request error:', response.error);
        
        // Check for authentication errors
        if (response.error.includes('Authentication failed')) {
          this.aiFeaturesDisabled = true;
          notificationService.error('Authentication failed. Please check your API key in settings. AI features have been disabled.');
        } else {
          notificationService.error(response.error);
        }
        return;
      }

      console.log('AI response received:', response.result);
      
      // Display response in AI panel
      this.displayInPanel(command, context, response.result, response.suggestions);
    } catch (error) {
      console.error('Failed to execute slash command:', error);
      notificationService.error('Failed to execute slash command. Please try again.');
    }
  }

  /**
   * Register inline completion provider
   */
  private registerCompletionProvider(): void {
    const { monaco, editor } = this.getContext();

    if (!this.aiService) {
      console.error('AI Service not initialized');
      return;
    }

    // Register AI completion provider with 300ms debounce
    const completionProvider = registerAICompletionProvider(
      monaco,
      editor,
      this.aiService,
      300
    );

    this.registerDisposable(completionProvider);

    console.log('AI completion provider registered');
  }

  /**
   * Setup error detection and indicators
   */
  private setupErrorDetection(): void {
    const { monaco, editor } = this.getContext();

    if (!this.aiService) {
      console.error('AI Service not initialized');
      return;
    }

    // Setup error indicator system
    const errorDisposable = setupErrorIndicators(editor, monaco);
    this.registerDisposable(errorDisposable);

    // Register hover provider for AI fix suggestions
    const hoverDisposable = registerEnhancedErrorHoverProvider(monaco, editor, this.aiService);
    this.registerDisposable(hoverDisposable);

    // Register code action provider for quick fixes
    const fixDisposable = registerFixCodeActionProvider(monaco, editor, this.aiService);
    this.registerDisposable(fixDisposable);

    console.log('Error detection system initialized with AI hover suggestions and quick fixes');
  }

  /**
   * Get the AI service instance
   */
  getAIService(): AIService | null {
    return this.aiService;
  }

  /**
   * Update configuration dynamically without reload
   */
  updateConfig(config: { aiBackendUrl?: string; apiKey?: string; offlineMode?: boolean }): void {
    if (!this.aiService) {
      console.error('AI Service not initialized');
      return;
    }

    if (config.aiBackendUrl) {
      this.aiService.updateBackendUrl(config.aiBackendUrl);
      console.log('AI backend URL updated:', config.aiBackendUrl);
    }

    if (config.apiKey !== undefined) {
      this.aiService.updateApiKey(config.apiKey);
      console.log('API key updated');
      
      // Re-enable AI features if they were disabled
      if (this.aiFeaturesDisabled && config.apiKey) {
        this.aiFeaturesDisabled = false;
        notificationService.success('AI features have been re-enabled');
      }
    }

    if (config.offlineMode !== undefined) {
      this.aiService.setOfflineMode(config.offlineMode);
      console.log('Offline mode updated:', config.offlineMode);
    }

    // Update context config
    if (this.context) {
      this.context.config = {
        ...this.context.config,
        ...config,
      };
    }
  }

  /**
   * Display message in AI panel
   */
  private displayInPanel(
    command: string,
    userCode: string,
    aiResponse: string,
    suggestions?: any[]
  ): void {
    const context = this.getContext();

    // Show panel if callback is provided
    if (context.onShowPanel) {
      context.onShowPanel();
    }

    // Add user message
    if (context.onAddMessage) {
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content: `/${command}\n\n${userCode}`,
        timestamp: new Date(),
      };
      context.onAddMessage(userMessage);

      // Add AI response message
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date(),
        codeSuggestions: suggestions,
      };
      context.onAddMessage(aiMessage);
    }
  }
}
