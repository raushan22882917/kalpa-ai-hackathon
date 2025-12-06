/**
 * Conversation History Service
 * Handles persistence of conversation history in project directory (like VS Code/Cursor)
 * Saves data in .devai folder within the open project directory
 */

import type { ChatMessage } from '../types/projectGenerator';
import { nativeFileSystem } from './nativeFileSystemService';

export type ConversationMessage = ChatMessage;

export interface Conversation {
  id: string;
  title: string;
  messages: ConversationMessage[];
  isProject: boolean;
  createdAt: Date;
  updatedAt: Date;
  sessionId?: string | null;
  phase?: string;
}

export interface PersistedConversationState {
  conversations: Conversation[];
  currentConversationId: string | null;
  lastSaved: Date;
}

class ConversationHistoryService {
  private static readonly CONVERSATIONS_FILE = '.devai/conversations.json';
  private autoSaveInterval: number | null = null;
  private currentState: PersistedConversationState | null = null;
  private workspacePath: string | null = null;

  /**
   * Set workspace path (project directory)
   */
  setWorkspacePath(workspacePath: string | null): void {
    this.workspacePath = workspacePath;
    // Reload state from new workspace
    if (workspacePath) {
      this.loadState();
    }
  }

  /**
   * Get workspace path
   */
  getWorkspacePath(): string | null {
    if (this.workspacePath) {
      return this.workspacePath;
    }
    // Try to get from native file system
    return nativeFileSystem.getWorkspace();
  }

  /**
   * Get conversations file path
   */
  private getConversationsFilePath(): string | null {
    const workspace = this.getWorkspacePath();
    if (!workspace) {
      return null;
    }
    
    // Simple path construction (works for both Electron and browser)
    const separator = workspace.includes('\\') ? '\\' : '/';
    const parts = ConversationHistoryService.CONVERSATIONS_FILE.split('/');
    return workspace + separator + parts.join(separator);
  }

  /**
   * Ensure .devai directory exists
   */
  private async ensureDevaiDirectory(): Promise<boolean> {
    const workspace = this.getWorkspacePath();
    if (!workspace) {
      return false;
    }

    try {
      const devaiPath = workspace.includes('/') 
        ? `${workspace}/.devai`
        : `${workspace}\\.devai`;
      
      const existsResult = await nativeFileSystem.exists(devaiPath);
      if (!existsResult.data) {
        await nativeFileSystem.createDirectory(devaiPath);
      }
      return true;
    } catch (error) {
      console.error('Failed to create .devai directory:', error);
      return false;
    }
  }

  /**
   * Initialize the service and start auto-save
   */
  initialize(autoSaveIntervalMs: number = 3000, workspacePath?: string | null): void {
    if (workspacePath !== undefined) {
      this.setWorkspacePath(workspacePath);
    } else {
      // Try to get workspace from native file system
      const workspace = nativeFileSystem.getWorkspace();
      this.setWorkspacePath(workspace);
    }
    this.startAutoSave(autoSaveIntervalMs);
  }

  /**
   * Load conversation state from project directory
   */
  async loadState(): Promise<PersistedConversationState> {
    const filePath = this.getConversationsFilePath();
    
    // If no workspace, return default state
    if (!filePath) {
      this.currentState = {
        conversations: [],
        currentConversationId: null,
        lastSaved: new Date(),
      };
      return this.currentState;
    }

    try {
      const result = await nativeFileSystem.readFile(filePath);
      if (result.success && result.data) {
        const parsed = JSON.parse(result.data);
        // Convert date strings back to Date objects
        this.currentState = {
          ...parsed,
          lastSaved: new Date(parsed.lastSaved),
          conversations: parsed.conversations.map((conv: any) => ({
            ...conv,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          })),
        };
        return this.currentState!;
      }
    } catch (error) {
      // File doesn't exist yet, that's okay
      console.log('Conversations file not found, starting fresh');
    }

    // Return default state if loading fails
    this.currentState = {
      conversations: [],
      currentConversationId: null,
      lastSaved: new Date(),
    };
    return this.currentState;
  }

  /**
   * Save conversation state to project directory
   */
  async saveState(state: PersistedConversationState): Promise<void> {
    const filePath = this.getConversationsFilePath();
    
    // If no workspace, can't save
    if (!filePath) {
      console.warn('No workspace open, cannot save conversation history');
      return;
    }

    try {
      // Ensure .devai directory exists
      await this.ensureDevaiDirectory();
      
      const stateToSave = {
        ...state,
        lastSaved: new Date(),
      };
      
      const jsonContent = JSON.stringify(stateToSave, null, 2);
      const result = await nativeFileSystem.writeFile(filePath, jsonContent);
      
      if (result.success) {
        this.currentState = stateToSave;
        console.log('Conversation history saved to project directory:', filePath);
      } else {
        console.error('Failed to save conversation history:', result.error);
      }
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }

  /**
   * Get current state (from memory or load from storage)
   */
  async getCurrentState(): Promise<PersistedConversationState> {
    if (!this.currentState) {
      return await this.loadState();
    }
    return { ...this.currentState };
  }

  /**
   * Get current state synchronously (from memory only)
   */
  getCurrentStateSync(): PersistedConversationState {
    if (!this.currentState) {
      // Return default state if not loaded yet
      return {
        conversations: [],
        currentConversationId: null,
        lastSaved: new Date(),
      };
    }
    return { ...this.currentState };
  }

  /**
   * Create a new conversation
   */
  async createConversation(title: string = 'New Conversation', isProject: boolean = false): Promise<string> {
    const state = await this.getCurrentState();
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newConversation: Conversation = {
      id: conversationId,
      title,
      messages: [],
      isProject,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    state.conversations.push(newConversation);
    state.currentConversationId = conversationId;
    await this.saveState(state);
    
    return conversationId;
  }

  /**
   * Get a conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const state = await this.getCurrentState();
    return state.conversations.find(c => c.id === conversationId) || null;
  }

  /**
   * Get a conversation by ID (synchronous, from memory)
   */
  getConversationSync(conversationId: string): Conversation | null {
    const state = this.getCurrentStateSync();
    return state.conversations.find(c => c.id === conversationId) || null;
  }

  /**
   * Get all conversations
   */
  async getAllConversations(): Promise<Conversation[]> {
    const state = await this.getCurrentState();
    return [...state.conversations].sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  /**
   * Get all conversations (synchronous, from memory)
   */
  getAllConversationsSync(): Conversation[] {
    const state = this.getCurrentStateSync();
    return [...state.conversations].sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  /**
   * Get current conversation
   */
  async getCurrentConversation(): Promise<Conversation | null> {
    const state = await this.getCurrentState();
    if (!state.currentConversationId) {
      return null;
    }
    return this.getConversation(state.currentConversationId);
  }

  /**
   * Set current conversation
   */
  async setCurrentConversation(conversationId: string): Promise<void> {
    const state = await this.getCurrentState();
    if (state.conversations.find(c => c.id === conversationId)) {
      state.currentConversationId = conversationId;
      await this.saveState(state);
    }
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(conversationId: string, message: ConversationMessage): Promise<void> {
    const state = await this.getCurrentState();
    const conversation = state.conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      conversation.messages.push(message);
      conversation.updatedAt = new Date();
      
      // Auto-generate title from first user message if still default
      if (conversation.title === 'New Conversation' && message.role === 'user') {
        conversation.title = message.content.substring(0, 50) + 
          (message.content.length > 50 ? '...' : '');
      }
      
      await this.saveState(state);
    }
  }

  /**
   * Update a conversation
   */
  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<void> {
    const state = await this.getCurrentState();
    const conversation = state.conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      Object.assign(conversation, updates);
      conversation.updatedAt = new Date();
      await this.saveState(state);
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const state = await this.getCurrentState();
    state.conversations = state.conversations.filter(c => c.id !== conversationId);
    
    // Clear current conversation if it was deleted
    if (state.currentConversationId === conversationId) {
      state.currentConversationId = state.conversations.length > 0 
        ? state.conversations[0].id 
        : null;
    }
    
    await this.saveState(state);
  }

  /**
   * Search conversations by query
   */
  async searchConversations(query: string): Promise<Conversation[]> {
    const conversations = await this.getAllConversations();
    const lowerQuery = query.toLowerCase();
    
    return conversations.filter(conv => 
      conv.title.toLowerCase().includes(lowerQuery) ||
      conv.messages.some(msg => msg.content.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get conversations by type (project or chat)
   */
  async getConversationsByType(isProject: boolean): Promise<Conversation[]> {
    return (await this.getAllConversations()).filter(c => c.isProject === isProject);
  }

  /**
   * Clean up old conversations (keep only last N conversations)
   */
  async cleanupOldConversations(maxConversations: number = 50): Promise<void> {
    const state = await this.getCurrentState();
    const sorted = [...state.conversations].sort((a, b) => 
      b.updatedAt.getTime() - a.updatedAt.getTime()
    );
    
    // Keep only the most recent conversations
    state.conversations = sorted.slice(0, maxConversations);
    
    // Update current conversation if it was removed
    if (state.currentConversationId && 
        !state.conversations.find(c => c.id === state.currentConversationId)) {
      state.currentConversationId = state.conversations.length > 0 
        ? state.conversations[0].id 
        : null;
    }
    
    await this.saveState(state);
    console.log(`Cleaned up conversations. Kept ${state.conversations.length} most recent.`);
  }

  /**
   * Export a conversation to JSON
   */
  async exportConversation(conversationId: string): Promise<string | null> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return null;
    }
    
    return JSON.stringify(conversation, null, 2);
  }

  /**
   * Import a conversation from JSON
   */
  async importConversation(json: string): Promise<string | null> {
    try {
      const conversation = JSON.parse(json) as Conversation;
      
      // Convert date strings to Date objects
      conversation.createdAt = new Date(conversation.createdAt);
      conversation.updatedAt = new Date(conversation.updatedAt);
      conversation.messages = conversation.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      
      // Generate new ID to avoid conflicts
      const newId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      conversation.id = newId;
      
      const state = await this.getCurrentState();
      state.conversations.push(conversation);
      await this.saveState(state);
      
      return newId;
    } catch (error) {
      console.error('Failed to import conversation:', error);
      return null;
    }
  }

  /**
   * Clear all conversations
   */
  async clearAllConversations(): Promise<void> {
    try {
      this.currentState = {
        conversations: [],
        currentConversationId: null,
        lastSaved: new Date(),
      };
      await this.saveState(this.currentState);
      console.log('All conversations cleared');
    } catch (error) {
      console.error('Failed to clear conversations:', error);
    }
  }

  /**
   * Get conversation statistics
   */
  async getStatistics(): Promise<{
    totalConversations: number;
    totalMessages: number;
    projectConversations: number;
    chatConversations: number;
    oldestConversation: Date | null;
    newestConversation: Date | null;
  }> {
    const conversations = await this.getAllConversations();
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    const projectConversations = conversations.filter(c => c.isProject).length;
    const chatConversations = conversations.filter(c => !c.isProject).length;
    
    const dates = conversations.map(c => c.createdAt);
    const oldest = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
    const newest = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
    
    return {
      totalConversations: conversations.length,
      totalMessages,
      projectConversations,
      chatConversations,
      oldestConversation: oldest,
      newestConversation: newest,
    };
  }

  /**
   * Check if workspace is open
   */
  hasWorkspace(): boolean {
    return this.getWorkspacePath() !== null;
  }

  /**
   * Start auto-save interval
   */
  private startAutoSave(intervalMs: number): void {
    if (this.autoSaveInterval !== null) {
      window.clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = window.setInterval(async () => {
      if (this.currentState && this.hasWorkspace()) {
        await this.saveState(this.currentState);
      }
    }, intervalMs);
  }

  /**
   * Stop auto-save interval
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval !== null) {
      window.clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopAutoSave();
    this.currentState = null;
  }
}

export const conversationHistoryService = new ConversationHistoryService();

