import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createError } from '../middleware/errorHandler';
class AIService {
    constructor() {
        this.openaiClient = null;
        this.anthropicClient = null;
        this.provider = process.env.AI_PROVIDER || 'openai';
        this.timeout = parseInt(process.env.AI_REQUEST_TIMEOUT || '10000', 10);
        // Initialize clients based on available API keys
        if (process.env.OPENAI_API_KEY) {
            this.openaiClient = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
        }
        if (process.env.ANTHROPIC_API_KEY) {
            this.anthropicClient = new Anthropic({
                apiKey: process.env.ANTHROPIC_API_KEY,
            });
        }
    }
    /**
     * Process an AI request with timeout handling
     */
    async processRequest(request) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(createError('AI request timed out. Please try again.', 408));
            }, this.timeout);
        });
        try {
            const responsePromise = this.provider === 'openai'
                ? this.processWithOpenAI(request)
                : this.processWithAnthropic(request);
            const response = await Promise.race([responsePromise, timeoutPromise]);
            return response;
        }
        catch (error) {
            if (error.statusCode === 408) {
                throw error; // Re-throw timeout errors
            }
            console.error('AI Service Error:', error);
            throw createError(error.message || 'Failed to process AI request', error.statusCode || 500);
        }
    }
    /**
     * Process request using OpenAI
     */
    async processWithOpenAI(request) {
        if (!this.openaiClient) {
            throw createError('OpenAI API key not configured', 401);
        }
        const systemPrompt = this.getSystemPrompt(request.command);
        const userPrompt = this.formatUserPrompt(request);
        const messages = [
            { role: 'system', content: systemPrompt },
        ];
        // Add conversation history if provided
        if (request.conversationHistory) {
            messages.push(...request.conversationHistory.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })));
        }
        messages.push({ role: 'user', content: userPrompt });
        const completion = await this.openaiClient.chat.completions.create({
            model: 'gpt-4',
            messages,
            temperature: 0.7,
            max_tokens: 2000,
        });
        const result = completion.choices[0]?.message?.content || '';
        return {
            result,
            suggestions: this.extractSuggestions(result, request.command),
        };
    }
    /**
     * Process request using Anthropic Claude
     */
    async processWithAnthropic(request) {
        if (!this.anthropicClient) {
            throw createError('Anthropic API key not configured', 401);
        }
        const systemPrompt = this.getSystemPrompt(request.command);
        const userPrompt = this.formatUserPrompt(request);
        const messages = [];
        // Add conversation history if provided
        if (request.conversationHistory) {
            messages.push(...request.conversationHistory.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })));
        }
        messages.push({ role: 'user', content: userPrompt });
        const completion = await this.anthropicClient.messages.create({
            model: 'claude-3-sonnet-20240229',
            system: systemPrompt,
            messages,
            max_tokens: 2000,
        });
        const result = completion.content[0]?.type === 'text' ? completion.content[0].text : '';
        return {
            result,
            suggestions: this.extractSuggestions(result, request.command),
        };
    }
    /**
     * Get system prompt based on command type
     */
    getSystemPrompt(command) {
        const prompts = {
            explain: 'You are a code explanation assistant. Provide clear, concise explanations of code functionality in natural language. Focus on what the code does, not how to improve it.',
            fix: 'You are a code fixing assistant. Analyze the provided code for errors, bugs, or issues. Provide corrected code with explanations of what was wrong and how you fixed it.',
            document: 'You are a code documentation assistant. Generate clear, comprehensive documentation comments for the provided code in the appropriate format for the language (JSDoc, docstrings, etc.).',
            complete: 'You are a code completion assistant. Provide intelligent code suggestions based on the context. Return only the code that should be inserted, without explanations.',
        };
        return prompts[command] || prompts.explain;
    }
    /**
     * Format user prompt with code and context
     */
    formatUserPrompt(request) {
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
    extractSuggestions(result, command) {
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
export default new AIService();
