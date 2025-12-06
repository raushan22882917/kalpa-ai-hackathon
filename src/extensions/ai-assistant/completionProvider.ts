/**
 * AI Completion Provider
 * Provides AI-powered inline code completion
 */

import type * as Monaco from 'monaco-editor';
import { AIService } from './aiService';

export interface CompletionContext {
  document: Monaco.editor.ITextModel;
  position: Monaco.Position;
  triggerKind: Monaco.languages.CompletionTriggerKind;
}

export interface AICompletionItem extends Monaco.languages.CompletionItem {
  aiGenerated: boolean;
  confidence: number;
}

/**
 * Debounce utility
 */
// function debounce<T extends (...args: any[]) => any>(
//   func: T,
//   wait: number
// ): (...args: Parameters<T>) => void {
//   let timeout: NodeJS.Timeout | null = null;

//   return (...args: Parameters<T>) => {
//     if (timeout) {
//       clearTimeout(timeout);
//     }

//     timeout = setTimeout(() => {
//       func(...args);
//       timeout = null;
//     }, wait);
//   };
// }

/**
 * AI Completion Provider
 */
export class AICompletionProvider implements Monaco.languages.CompletionItemProvider {
  private aiService: AIService;
  private monaco: typeof Monaco;
  private pendingRequest: AbortController | null = null;
  private aiBackendAvailable: boolean = true;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor(monaco: typeof Monaco, aiService: AIService, _debounceTime: number = 300) {
    this.monaco = monaco;
    this.aiService = aiService;
  }

  /**
   * Check if AI backend is available
   */
  private async checkBackendAvailability(): Promise<boolean> {
    const now = Date.now();
    
    // Only check periodically to avoid excessive requests
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.aiBackendAvailable;
    }

    this.lastHealthCheck = now;

    try {
      // Simple health check - try to send a minimal request
      const response = await this.aiService.sendRequest({
        command: 'complete',
        code: 'test',
        language: 'javascript',
      });

      this.aiBackendAvailable = !response.error;
      return this.aiBackendAvailable;
    } catch (error) {
      this.aiBackendAvailable = false;
      return false;
    }
  }

  /**
   * Provide completion items
   */
  async provideCompletionItems(
    model: Monaco.editor.ITextModel,
    position: Monaco.Position,
    _context: Monaco.languages.CompletionContext,
    _token: Monaco.CancellationToken
  ): Promise<Monaco.languages.CompletionList | null> {
    // Check if AI backend is available
    const isAvailable = await this.checkBackendAvailability();

    if (!isAvailable) {
      console.log('AI backend unavailable, falling back to standard Monaco autocomplete');
      // Return null to let Monaco's default completion providers handle it
      return null;
    }

    // Cancel any pending request
    if (this.pendingRequest) {
      this.pendingRequest.abort();
    }

    // Get surrounding lines for context
    const startLine = Math.max(1, position.lineNumber - 10);
    const endLine = Math.min(model.getLineCount(), position.lineNumber + 5);
    const surroundingCode = model.getValueInRange({
      startLineNumber: startLine,
      startColumn: 1,
      endLineNumber: endLine,
      endColumn: model.getLineMaxColumn(endLine),
    });

    const language = model.getLanguageId();

    try {
      // Create abort controller for this request
      this.pendingRequest = new AbortController();

      // Request AI completion
      const response = await this.aiService.sendRequest({
        command: 'complete',
        code: surroundingCode,
        language,
        context: `Cursor at line ${position.lineNumber}, column ${position.column}`,
      });

      // Clear pending request
      this.pendingRequest = null;

      if (response.error || !response.result) {
        // Mark backend as unavailable on error
        this.aiBackendAvailable = false;
        console.log('AI completion failed, falling back to standard autocomplete');
        return null;
      }

      // Parse AI response and create completion items
      const completionItems = this.parseCompletionResponse(
        response.result,
        position,
        model
      );

      return {
        suggestions: completionItems,
        incomplete: false,
      };
    } catch (error) {
      console.error('AI completion error:', error);
      this.pendingRequest = null;
      this.aiBackendAvailable = false;
      // Fall back to standard Monaco autocomplete
      return null;
    }
  }

  /**
   * Parse AI response into completion items
   */
  private parseCompletionResponse(
    response: string,
    position: Monaco.Position,
    model: Monaco.editor.ITextModel
  ): AICompletionItem[] {
    const items: AICompletionItem[] = [];

    // Split response into suggestions (assuming newline-separated)
    const suggestions = response.split('\n').filter(s => s.trim().length > 0);

    suggestions.forEach((suggestion, index) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      items.push({
        label: suggestion.trim(),
        kind: this.monaco.languages.CompletionItemKind.Text,
        documentation: 'AI-generated suggestion',
        insertText: suggestion.trim(),
        range,
        sortText: `0${index}`, // Prioritize AI suggestions
        aiGenerated: true,
        confidence: 1.0 - (index * 0.1), // Decrease confidence for later suggestions
      });
    });

    return items;
  }

  /**
   * Resolve completion item (optional)
   */
  resolveCompletionItem?(
    item: Monaco.languages.CompletionItem,
    _token: Monaco.CancellationToken
  ): Monaco.languages.ProviderResult<Monaco.languages.CompletionItem> {
    return item;
  }

  /**
   * Get backend availability status
   */
  isBackendAvailable(): boolean {
    return this.aiBackendAvailable;
  }

  /**
   * Manually set backend availability (useful for testing)
   */
  setBackendAvailability(available: boolean): void {
    this.aiBackendAvailable = available;
    this.lastHealthCheck = Date.now();
  }
}

/**
 * Register AI completion provider with debouncing
 */
export function registerAICompletionProvider(
  monaco: typeof Monaco,
  _editor: Monaco.editor.IStandaloneCodeEditor,
  aiService: AIService,
  debounceTime: number = 300
): Monaco.IDisposable {
  const provider = new AICompletionProvider(monaco, aiService, debounceTime);

  // Register for all languages
  return monaco.languages.registerCompletionItemProvider('*', provider);
}
