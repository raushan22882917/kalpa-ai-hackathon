/**
 * AI Service
 * Handles communication with the AI backend
 */

export interface AIRequest {
  command: 'explain' | 'fix' | 'document' | 'complete';
  code: string;
  language: string;
  context?: string;
  conversationHistory?: Message[];
}

export interface AIResponse {
  result: string;
  suggestions?: CodeSuggestion[];
  error?: string;
}

export interface CodeSuggestion {
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  newText: string;
  description: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeSuggestions?: CodeSuggestion[];
}

export class AIService {
  private backendUrl: string;
  private apiKey: string;
  private timeout: number;
  private offlineMode: boolean;

  constructor(backendUrl: string, apiKey: string, timeout: number = 10000) {
    this.backendUrl = backendUrl;
    this.apiKey = apiKey;
    this.timeout = timeout;
    this.offlineMode = false;
  }

  /**
   * Set offline mode
   */
  setOfflineMode(offline: boolean): void {
    this.offlineMode = offline;
  }

  /**
   * Check if in offline mode
   */
  isOffline(): boolean {
    return this.offlineMode;
  }

  /**
   * Send a request to the AI backend
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    // Check if offline mode is enabled
    if (this.offlineMode) {
      return {
        result: '',
        error: 'AI features are disabled in offline mode.',
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const endpoint = this.getEndpoint(request.command);
      const response = await fetch(`${this.backendUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
        body: JSON.stringify({
          code: request.code,
          language: request.language,
          context: request.context,
          conversationHistory: request.conversationHistory,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your API key.');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`AI request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        result: data.result || data.explanation || data.fixedCode || data.documentation || data.completion || '',
        suggestions: data.suggestions,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            result: '',
            error: 'AI request timed out. Please try again.',
          };
        }
        return {
          result: '',
          error: error.message,
        };
      }

      return {
        result: '',
        error: 'An unknown error occurred',
      };
    }
  }

  /**
   * Get the API endpoint for a command
   */
  private getEndpoint(command: string): string {
    switch (command) {
      case 'explain':
        return '/api/ai/explain';
      case 'fix':
        return '/api/ai/fix';
      case 'document':
        return '/api/ai/document';
      case 'complete':
        return '/api/ai/complete';
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  /**
   * Update backend URL
   */
  updateBackendUrl(url: string): void {
    this.backendUrl = url;
  }

  /**
   * Update API key
   */
  updateApiKey(key: string): void {
    this.apiKey = key;
  }
}
