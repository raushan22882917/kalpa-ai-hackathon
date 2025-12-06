import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createError } from '../middleware/errorHandler';

export interface AIRequest {
  command: 'explain' | 'fix' | 'document' | 'complete';
  code: string;
  language: string;
  context?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  provider?: 'openai' | 'anthropic' | 'gemini' | 'deepseek';
  model?: string; // Optional: override default model for the provider
}

export interface AIResponse {
  result: string;
  suggestions?: Array<{
    range?: { start: number; end: number };
    newText: string;
    description: string;
  }>;
  error?: string;
  provider?: string;
  model?: string;
  fallbackUsed?: boolean;
  originalProvider?: string;
  fallbackProvider?: string;
}

class AIService {
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;
  private geminiClient: GoogleGenerativeAI | null = null;
  private deepseekClient: OpenAI | null = null;
  private defaultProvider: 'openai' | 'anthropic' | 'gemini' | 'deepseek';
  private timeout: number;

  constructor() {
    this.defaultProvider = (process.env.AI_PROVIDER as 'openai' | 'anthropic' | 'gemini' | 'deepseek') || 'openai';
    this.timeout = parseInt(process.env.AI_REQUEST_TIMEOUT || '30000', 10);

    // Debug: Log environment variable status
    console.log('[AIService] Initializing with provider:', this.defaultProvider);
    console.log('[AIService] OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
    console.log('[AIService] OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);

    // Initialize clients based on available API keys
    if (process.env.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      console.log('[AIService] OpenAI client initialized successfully');
    } else {
      console.warn('[AIService] OpenAI API key not found in environment');
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    if (process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    if (process.env.DEEPSEEK_API_KEY) {
      this.deepseekClient = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
      });
    }
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): Array<{ name: string; available: boolean; models: string[] }> {
    return [
      {
        name: 'openai',
        available: !!this.openaiClient,
        models: ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo']
      },
      {
        name: 'anthropic',
        available: !!this.anthropicClient,
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
      },
      {
        name: 'gemini',
        available: !!this.geminiClient,
        models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash']
      },
      {
        name: 'deepseek',
        available: !!this.deepseekClient,
        models: ['deepseek-chat', 'deepseek-coder']
      }
    ];
  }

  /**
   * Process an AI request with timeout handling and automatic fallback
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(createError('AI request timed out. Please try again.', 408));
      }, this.timeout);
    });

    // Use requested provider or default
    const provider = request.provider || this.defaultProvider;

    try {
      let responsePromise: Promise<AIResponse>;
      
      switch (provider) {
        case 'openai':
          responsePromise = this.processWithOpenAI(request);
          break;
        case 'anthropic':
          responsePromise = this.processWithAnthropic(request);
          break;
        case 'gemini':
          responsePromise = this.processWithGemini(request);
          break;
        case 'deepseek':
          responsePromise = this.processWithDeepSeek(request);
          break;
        default:
          throw createError('Unsupported AI provider', 400);
      }

      const response = await Promise.race([responsePromise, timeoutPromise]);
      return response;
    } catch (error: any) {
      if (error.statusCode === 408) {
        throw error; // Re-throw timeout errors
      }
      
      console.error(`AI Service Error (${provider}):`, error);
      
      // Smart fallback: OpenAI -> Gemini -> Default
      if (provider === 'openai' && this.geminiClient) {
        console.log('⚠️  OpenAI failed, automatically switching to Gemini...');
        try {
          const geminiResponse = await this.processRequest({ 
            ...request, 
            provider: 'gemini',
            model: request.model || 'gemini-2.0-flash-exp' 
          });
          console.log('✅ Gemini fallback successful!');
          return {
            ...geminiResponse,
            fallbackUsed: true,
            originalProvider: 'openai',
            fallbackProvider: 'gemini'
          } as AIResponse;
        } catch (geminiError) {
          console.error('❌ Gemini fallback also failed:', geminiError);
        }
      }
      
      // Try fallback to default provider if available and different
      if (provider !== this.defaultProvider && provider !== 'gemini') {
        console.log(`Attempting fallback to ${this.defaultProvider}...`);
        try {
          return await this.processRequest({ ...request, provider: this.defaultProvider });
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
      
      throw createError(
        error.message || 'Failed to process AI request',
        error.statusCode || 500
      );
    }
  }

  /**
   * Process request using OpenAI
   */
  private async processWithOpenAI(request: AIRequest): Promise<AIResponse> {
    if (!this.openaiClient) {
      throw createError('OpenAI API key not configured', 401);
    }

    const systemPrompt = this.getSystemPrompt(request.command);
    const userPrompt = this.formatUserPrompt(request);
    // Use custom model if provided, otherwise use environment default
    const model = request.model || process.env.OPENAI_MODEL || 'gpt-4';

    console.log(`[AIService] Using OpenAI model: ${model}`);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if provided
    if (request.conversationHistory) {
      messages.push(
        ...request.conversationHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }))
      );
    }

    messages.push({ role: 'user', content: userPrompt });

    const completion = await this.openaiClient.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const result = completion.choices[0]?.message?.content || '';

    return {
      result,
      suggestions: this.extractSuggestions(result, request.command),
      provider: 'openai',
      model,
    };
  }

  /**
   * Process request using DeepSeek
   */
  private async processWithDeepSeek(request: AIRequest): Promise<AIResponse> {
    if (!this.deepseekClient) {
      throw createError('DeepSeek API key not configured', 401);
    }

    const systemPrompt = this.getSystemPrompt(request.command);
    const userPrompt = this.formatUserPrompt(request);
    // Use custom model if provided, otherwise use environment default
    const model = request.model || process.env.DEEPSEEK_MODEL || 'deepseek-chat';

    console.log(`[AIService] Using DeepSeek model: ${model}`);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if provided
    if (request.conversationHistory) {
      messages.push(
        ...request.conversationHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }))
      );
    }

    messages.push({ role: 'user', content: userPrompt });

    const completion = await this.deepseekClient.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const result = completion.choices[0]?.message?.content || '';

    return {
      result,
      suggestions: this.extractSuggestions(result, request.command),
      provider: 'deepseek',
      model,
    };
  }

  /**
   * Process request using Anthropic Claude
   */
  private async processWithAnthropic(request: AIRequest): Promise<AIResponse> {
    if (!this.anthropicClient) {
      throw createError('Anthropic API key not configured', 401);
    }

    const systemPrompt = this.getSystemPrompt(request.command);
    const userPrompt = this.formatUserPrompt(request);
    // Use custom model if provided, otherwise use environment default
    const model = request.model || process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';

    console.log(`[AIService] Using Anthropic model: ${model}`);

    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history if provided
    if (request.conversationHistory) {
      messages.push(
        ...request.conversationHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }))
      );
    }

    messages.push({ role: 'user', content: userPrompt });

    const completion = await this.anthropicClient.messages.create({
      model,
      system: systemPrompt,
      messages,
      max_tokens: 2000,
    });

    const result =
      completion.content[0]?.type === 'text' ? completion.content[0].text : '';

    return {
      result,
      suggestions: this.extractSuggestions(result, request.command),
      provider: 'anthropic',
      model,
    };
  }

  /**
   * Process request using Google Gemini
   */
  private async processWithGemini(request: AIRequest): Promise<AIResponse> {
    if (!this.geminiClient) {
      throw createError('Gemini API key not configured', 401);
    }

    const systemPrompt = this.getSystemPrompt(request.command);
    const userPrompt = this.formatUserPrompt(request);
    // Use custom model if provided, otherwise use environment default
    const modelName = request.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

    console.log(`[AIService] Using Gemini model: ${modelName}`);

    const model = this.geminiClient.getGenerativeModel({ 
      model: modelName,
    });

    // Build the full prompt with system instructions and conversation history
    let fullPrompt = `${systemPrompt}\n\n`;
    
    if (request.conversationHistory) {
      request.conversationHistory.forEach((msg) => {
        const role = msg.role === 'assistant' ? 'Assistant' : 'User';
        fullPrompt += `${role}: ${msg.content}\n\n`;
      });
    }
    
    fullPrompt += `User: ${userPrompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    return {
      result: text,
      suggestions: this.extractSuggestions(text, request.command),
      provider: 'gemini',
      model: modelName,
    };
  }

  /**
   * Get system prompt based on command type
   */
  private getSystemPrompt(command: string): string {
    const prompts = {
      explain:
        'You are a code explanation assistant. Provide clear, concise explanations of code functionality in natural language. Focus on what the code does, not how to improve it.',
      fix: 'You are a code fixing assistant. Analyze the provided code for errors, bugs, or issues. Provide corrected code with explanations of what was wrong and how you fixed it.',
      document:
        'You are a code documentation assistant. Generate clear, comprehensive documentation comments for the provided code in the appropriate format for the language (JSDoc, docstrings, etc.).',
      complete:
        'You are a code completion assistant. Provide intelligent code suggestions based on the context. Return only the code that should be inserted, without explanations.',
    };

    return prompts[command as keyof typeof prompts] || prompts.explain;
  }

  /**
   * Format user prompt with code and context
   */
  private formatUserPrompt(request: AIRequest): string {
    let prompt = `Language: ${request.language}\n\n`;

    if (request.context) {
      prompt += `Context:\n${request.context}\n\n`;
    }

    prompt += `Code:\n\`\`\`${request.language}\n${request.code}\n\`\`\``;

    return prompt;
  }

  /**
   * Extract code suggestions from AI response
   */
  private extractSuggestions(
    result: string,
    command: string
  ): Array<{ newText: string; description: string }> | undefined {
    if (command !== 'fix' && command !== 'complete') {
      return undefined;
    }

    // Extract code blocks from markdown
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const matches = [...result.matchAll(codeBlockRegex)];

    if (matches.length === 0) {
      return undefined;
    }

    return matches.map((match, index) => ({
      newText: match[1].trim(),
      description: `Suggestion ${index + 1}`,
    }));
  }
}

// Export a singleton instance with lazy initialization
let instance: AIService | null = null;

export default {
  get instance(): AIService {
    if (!instance) {
      instance = new AIService();
    }
    return instance;
  },
  
  // Proxy all methods to the singleton instance
  getAvailableProviders() {
    return this.instance.getAvailableProviders();
  },
  
  async processRequest(request: AIRequest): Promise<AIResponse> {
    return this.instance.processRequest(request);
  }
};
