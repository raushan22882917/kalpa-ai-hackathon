/**
 * Context Manager Service
 * Manages project sessions including creation, persistence, and retrieval
 */

import { 
  ProjectSession, 
  SessionSummary, 
  ChatMessage,
  TechStack,
  ColorTheme,
  GeneratedImage
} from '../types/projectGenerator';
import {
  generateSessionId,
  getSessionDirectory,
  getSessionMetadataPath,
  getConversationPath,
  getRequirementsPath,
  getDesignPath,
  getTasksPath,
  serializeSession,
  deserializeSession,
  serializeConversation,
  deserializeConversation,
  createSessionSummary
} from '../utils/sessionStorage';
import { getFileSystem } from './fileSystemService';

export class ContextManagerService {
  private fileSystem = getFileSystem();

  /**
   * Create a new project session
   */
  async createSession(
    description: string,
    selectedStack: TechStack,
    selectedTheme: ColorTheme
  ): Promise<string> {
    const sessionId = generateSessionId();
    const now = new Date();

    const session: ProjectSession = {
      id: sessionId,
      selectedStack,
      selectedTheme,
      generatedImages: [],
      description,
      plan: {
        projectName: this.extractProjectName(description)
      },
      phase: 'description',
      conversationHistory: [],
      createdAt: now,
      updatedAt: now
    };

    // Create session directory
    const sessionDir = getSessionDirectory(sessionId);
    this.ensureDirectoryExists(sessionDir);

    // Save session metadata
    await this.saveSession(sessionId, session);

    return sessionId;
  }

  /**
   * Add a message to the session's conversation history
   */
  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const session = await this.loadSession(sessionId);
    session.conversationHistory.push(message);
    session.updatedAt = new Date();
    await this.saveSession(sessionId, session);
  }

  /**
   * Get context for AI prompts (recent conversation history)
   */
  async getContext(sessionId: string, maxMessages: number = 20): Promise<string> {
    const session = await this.loadSession(sessionId);
    const recentMessages = session.conversationHistory.slice(-maxMessages);
    
    return recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');
  }

  /**
   * Save session state to file system
   */
  async saveSession(sessionId: string, session: ProjectSession): Promise<void> {
    const sessionDir = getSessionDirectory(sessionId);
    this.ensureDirectoryExists(sessionDir);

    // Save session metadata
    const metadataPath = getSessionMetadataPath(sessionId);
    const sessionData = serializeSession(session);
    
    if (this.fileSystem.exists(metadataPath)) {
      this.fileSystem.updateFile(metadataPath, sessionData);
    } else {
      this.fileSystem.createFile(metadataPath, sessionData);
    }

    // Save conversation history separately
    const conversationPath = getConversationPath(sessionId);
    const conversationData = serializeConversation(session.conversationHistory);
    
    if (this.fileSystem.exists(conversationPath)) {
      this.fileSystem.updateFile(conversationPath, conversationData);
    } else {
      this.fileSystem.createFile(conversationPath, conversationData);
    }

    // Save plan documents if they exist
    if (session.plan.requirements) {
      await this.saveRequirements(sessionId, session.plan.requirements);
    }
    if (session.plan.design) {
      await this.saveDesign(sessionId, session.plan.design);
    }
    if (session.plan.tasks) {
      await this.saveTasks(sessionId, session.plan.tasks);
    }
  }

  /**
   * Load session state from file system
   */
  async loadSession(sessionId: string): Promise<ProjectSession> {
    const metadataPath = getSessionMetadataPath(sessionId);
    
    if (!this.fileSystem.exists(metadataPath)) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const sessionData = this.fileSystem.readFile(metadataPath);
    const session = deserializeSession(sessionData);

    // Load conversation history
    const conversationPath = getConversationPath(sessionId);
    if (this.fileSystem.exists(conversationPath)) {
      const conversationData = this.fileSystem.readFile(conversationPath);
      session.conversationHistory = deserializeConversation(conversationData);
    }

    return session;
  }

  /**
   * List all sessions
   */
  async listSessions(): Promise<SessionSummary[]> {
    const sessionsDir = '.kiro/project-sessions';
    
    if (!this.fileSystem.exists(sessionsDir)) {
      return [];
    }

    const sessionDirs = this.fileSystem.listDirectory(sessionsDir);
    const summaries: SessionSummary[] = [];

    for (const dir of sessionDirs) {
      if (dir.type === 'directory') {
        try {
          const session = await this.loadSession(dir.name);
          summaries.push(createSessionSummary(session));
        } catch (error) {
          // Skip invalid sessions
          console.error(`Failed to load session ${dir.name}:`, error);
        }
      }
    }

    // Sort by last updated, most recent first
    summaries.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());

    return summaries;
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const sessionDir = getSessionDirectory(sessionId);
    
    if (!this.fileSystem.exists(sessionDir)) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Delete all files in the session directory
    const files = this.fileSystem.listDirectory(sessionDir);
    for (const file of files) {
      const filePath = `${sessionDir}/${file.name}`;
      this.fileSystem.delete(filePath);
    }

    // Delete the directory itself
    this.fileSystem.delete(sessionDir);
  }

  /**
   * Update session phase
   */
  async updatePhase(
    sessionId: string, 
    phase: ProjectSession['phase']
  ): Promise<void> {
    const session = await this.loadSession(sessionId);
    session.phase = phase;
    session.updatedAt = new Date();
    await this.saveSession(sessionId, session);
  }

  /**
   * Store generated images in session
   */
  async storeImages(sessionId: string, images: GeneratedImage[]): Promise<void> {
    const session = await this.loadSession(sessionId);
    session.generatedImages = [...(session.generatedImages || []), ...images];
    session.updatedAt = new Date();
    await this.saveSession(sessionId, session);
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ProjectSession> {
    return this.loadSession(sessionId);
  }

  /**
   * Update session data
   */
  async updateSession(sessionId: string, updates: Partial<ProjectSession>): Promise<void> {
    const session = await this.loadSession(sessionId);
    Object.assign(session, updates);
    session.updatedAt = new Date();
    await this.saveSession(sessionId, session);
  }

  /**
   * Private helper: Ensure directory exists
   */
  private ensureDirectoryExists(path: string): void {
    if (this.fileSystem.exists(path)) {
      return;
    }

    // Create parent directories recursively
    const segments = path.split('/').filter(s => s);
    let currentPath = '';
    
    for (const segment of segments) {
      currentPath += '/' + segment;
      if (!this.fileSystem.exists(currentPath)) {
        this.fileSystem.createDirectory(currentPath);
      }
    }
  }

  /**
   * Private helper: Extract project name from description
   */
  private extractProjectName(description: string): string {
    // Simple extraction - take first few words
    const words = description.trim().split(/\s+/).slice(0, 3);
    return words.join(' ') || 'Untitled Project';
  }

  /**
   * Private helper: Save requirements document
   */
  private async saveRequirements(sessionId: string, requirements: any): Promise<void> {
    const path = getRequirementsPath(sessionId);
    const content = this.formatRequirements(requirements);
    
    if (this.fileSystem.exists(path)) {
      this.fileSystem.updateFile(path, content);
    } else {
      this.fileSystem.createFile(path, content);
    }
  }

  /**
   * Private helper: Save design document
   */
  private async saveDesign(sessionId: string, design: any): Promise<void> {
    const path = getDesignPath(sessionId);
    const content = this.formatDesign(design);
    
    if (this.fileSystem.exists(path)) {
      this.fileSystem.updateFile(path, content);
    } else {
      this.fileSystem.createFile(path, content);
    }
  }

  /**
   * Private helper: Save tasks document
   */
  private async saveTasks(sessionId: string, tasks: any): Promise<void> {
    const path = getTasksPath(sessionId);
    const content = this.formatTasks(tasks);
    
    if (this.fileSystem.exists(path)) {
      this.fileSystem.updateFile(path, content);
    } else {
      this.fileSystem.createFile(path, content);
    }
  }

  /**
   * Private helper: Format requirements as markdown
   */
  private formatRequirements(requirements: any): string {
    return JSON.stringify(requirements, null, 2);
  }

  /**
   * Private helper: Format design as markdown
   */
  private formatDesign(design: any): string {
    return JSON.stringify(design, null, 2);
  }

  /**
   * Private helper: Format tasks as markdown
   */
  private formatTasks(tasks: any): string {
    return JSON.stringify(tasks, null, 2);
  }
}

// Singleton instance
let contextManagerInstance: ContextManagerService | null = null;

export const getContextManager = (): ContextManagerService => {
  if (!contextManagerInstance) {
    contextManagerInstance = new ContextManagerService();
  }
  return contextManagerInstance;
};

export const resetContextManager = (): void => {
  contextManagerInstance = null;
};

