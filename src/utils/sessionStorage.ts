import { ProjectSession, SessionSummary, ChatMessage } from '../types/projectGenerator';

const SESSION_STORAGE_DIR = '.kiro/project-sessions';

/**
 * Utility functions for managing project session storage
 */

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get the directory path for a session
 */
export function getSessionDirectory(sessionId: string): string {
  return `${SESSION_STORAGE_DIR}/${sessionId}`;
}

/**
 * Get the path for session metadata file
 */
export function getSessionMetadataPath(sessionId: string): string {
  return `${getSessionDirectory(sessionId)}/session.json`;
}

/**
 * Get the path for conversation history file
 */
export function getConversationPath(sessionId: string): string {
  return `${getSessionDirectory(sessionId)}/conversation.json`;
}

/**
 * Get the path for requirements document
 */
export function getRequirementsPath(sessionId: string): string {
  return `${getSessionDirectory(sessionId)}/requirements.md`;
}

/**
 * Get the path for design document
 */
export function getDesignPath(sessionId: string): string {
  return `${getSessionDirectory(sessionId)}/design.md`;
}

/**
 * Get the path for tasks document
 */
export function getTasksPath(sessionId: string): string {
  return `${getSessionDirectory(sessionId)}/tasks.md`;
}

/**
 * Serialize a session to JSON, handling Date objects
 */
export function serializeSession(session: ProjectSession): string {
  return JSON.stringify(session, (_key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }, 2);
}

/**
 * Deserialize a session from JSON, handling Date objects
 */
export function deserializeSession(json: string): ProjectSession {
  return JSON.parse(json, (key, value) => {
    // Convert ISO date strings back to Date objects
    if (key === 'createdAt' || key === 'updatedAt' || key === 'timestamp' || key === 'lastUpdated') {
      return new Date(value);
    }
    return value;
  });
}

/**
 * Serialize conversation history to JSON
 */
export function serializeConversation(messages: ChatMessage[]): string {
  return JSON.stringify(messages, (_key, value) => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }, 2);
}

/**
 * Deserialize conversation history from JSON
 */
export function deserializeConversation(json: string): ChatMessage[] {
  return JSON.parse(json, (key, value) => {
    if (key === 'timestamp') {
      return new Date(value);
    }
    return value;
  });
}

/**
 * Create a session summary from a full session
 */
export function createSessionSummary(session: ProjectSession): SessionSummary {
  let taskProgress = '0/0 tasks';
  if (session.plan.tasks) {
    const total = session.plan.tasks.tasks.length;
    const completed = session.plan.tasks.tasks.filter(
      t => t.status === 'completed' || t.status === 'skipped'
    ).length;
    taskProgress = `${completed}/${total} tasks complete`;
  }

  return {
    id: session.id,
    projectName: session.plan.projectName,
    phase: session.phase,
    lastUpdated: session.updatedAt,
    taskProgress,
    selectedStack: session.selectedStack,
    selectedTheme: session.selectedTheme
  };
}

/**
 * Validate session directory structure
 * This is a placeholder - actual implementation would check file existence
 * using the file system service
 * Required files: session.json, conversation.json
 */
export function validateSessionDirectory(_sessionId: string): {
  valid: boolean;
  missingFiles: string[];
} {
  return {
    valid: true,
    missingFiles: []
  };
}

/**
 * Get all session IDs from storage directory
 * This is a helper that would be used by the context manager service
 */
export function parseSessionIdFromPath(path: string): string | null {
  const match = path.match(/\.kiro\/project-sessions\/([^/]+)/);
  return match ? match[1] : null;
}
