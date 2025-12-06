/**
 * Client-side AI Service
 * Makes HTTP requests to the server AI API
 */

export interface AIRequest {
  command: 'explain' | 'fix' | 'document' | 'complete';
  code: string;
  language: string;
  context?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface AIResponse {
  result: string;
  suggestions?: Array<{ newText: string; description: string }>;
  error?: string;
}

class ClientAIService {
  private backendUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(backendUrl: string = 'http://localhost:3001', apiKey: string = '', timeout: number = 30000) {
    this.backendUrl = backendUrl;
    this.apiKey = apiKey;
    this.timeout = timeout;
  }

  /**
   * Process an AI request by making HTTP call to server
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      // Map command to endpoint
      const endpoint = this.getEndpoint(request.command);
      const url = `${this.backendUrl}${endpoint}`;

      const response = await fetch(url, {
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
        const errorText = await response.text();
        throw new Error(`AI request failed: ${response.statusText} - ${errorText}`);
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

// Get config from localStorage or use defaults
function getConfig() {
  try {
    const configStr = localStorage.getItem('editorConfig');
    if (configStr) {
      const config = JSON.parse(configStr);
      return {
        backendUrl: config.aiBackendUrl || 'http://localhost:3001',
        apiKey: config.apiKey || '',
      };
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return {
    backendUrl: 'http://localhost:3001',
    apiKey: '',
  };
}

const config = getConfig();
export const clientAIService = new ClientAIService(config.backendUrl, config.apiKey);

