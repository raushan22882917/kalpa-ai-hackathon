/**
 * Conversation Context Manager
 * Manages conversation history and context for AI requests
 */

import type { Message } from './aiService';

export interface ConversationContext {
  messages: Message[];
  maxMessages: number;
}

export class ConversationContextManager {
  private messages: Message[] = [];
  private readonly maxMessages: number;

  constructor(maxMessages: number = 20) {
    this.maxMessages = maxMessages;
  }

  /**
   * Add a message to the conversation history
   */
  addMessage(message: Message): void {
    this.messages.push(message);
    this.truncateIfNeeded();
  }

  /**
   * Get all messages in the conversation
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Get conversation context for follow-up questions
   * Returns the most recent messages up to the limit
   */
  getContext(): Message[] {
    return [...this.messages];
  }

  /**
   * Clear the conversation and start fresh
   */
  clearConversation(): void {
    this.messages = [];
  }

  /**
   * Get the number of messages in the conversation
   */
  getMessageCount(): number {
    return this.messages.length;
  }

  /**
   * Check if conversation is empty
   */
  isEmpty(): boolean {
    return this.messages.length === 0;
  }

  /**
   * Truncate conversation history to maintain the most recent messages
   * Keeps the most recent maxMessages messages
   */
  private truncateIfNeeded(): void {
    if (this.messages.length > this.maxMessages) {
      // Keep only the most recent maxMessages messages
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  /**
   * Get a summary of older messages (for future implementation)
   * This would be used when we want to summarize truncated messages
   */
  getSummary(): string | null {
    // Future: Implement summarization of older messages
    return null;
  }
}
