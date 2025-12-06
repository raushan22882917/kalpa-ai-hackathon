/**
 * Task Executor Service
 * 
 * Executes individual tasks from the task list, coordinating with AI service
 * for code generation, tracking file changes, and managing task status.
 */

import type {
  Task,
  TaskResult,
  CommandResult,
  ProjectSession,
} from '../types/projectGenerator';
import { getContextManager } from './contextManagerService';
import { clientAIService } from './clientAIService';
import promptTemplates from './promptTemplates';

export interface TaskExecutionOptions {
  retryCount?: number;
  skipValidation?: boolean;
}

/**
 * Task Executor Service
 * Manages task execution lifecycle and coordinates with AI for implementation
 */
export class TaskExecutorService {
  private contextManager = getContextManager();

  /**
   * Execute a specific task
   */
  async executeTask(
    sessionId: string,
    taskId: string,
    _options: TaskExecutionOptions = {}
  ): Promise<TaskResult> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'execution') {
      throw new Error(`Cannot execute tasks in phase: ${session.phase}`);
    }

    const task = this.findTask(session, taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status === 'completed') {
      throw new Error(`Task already completed: ${taskId}`);
    }

    // Update task status to in-progress
    await this.updateTaskStatus(sessionId, taskId, 'in-progress');

    try {
      // Execute the task
      const result = await this.performTaskExecution(session, task);

      // Update task status based on result
      if (result.success) {
        await this.updateTaskStatus(sessionId, taskId, 'completed', result);
      } else {
        await this.updateTaskStatus(sessionId, taskId, 'failed', result);
      }

      return result;
    } catch (error: any) {
      const errorResult: TaskResult = {
        success: false,
        filesCreated: [],
        filesModified: [],
        commandsRun: [],
        error: error.message || 'Unknown error occurred',
      };

      await this.updateTaskStatus(sessionId, taskId, 'failed', errorResult);
      return errorResult;
    }
  }

  /**
   * Retry a failed task
   */
  async retryTask(
    sessionId: string,
    taskId: string,
    modifications?: string
  ): Promise<TaskResult> {
    const session = await this.contextManager.getSession(sessionId);
    const task = this.findTask(session, taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status !== 'failed') {
      throw new Error(`Can only retry failed tasks. Current status: ${task.status}`);
    }

    // Reset task status to pending
    await this.updateTaskStatus(sessionId, taskId, 'pending');

    // If modifications provided, add them to context
    if (modifications) {
      await this.contextManager.addMessage(sessionId, {
        id: this.generateMessageId(),
        role: 'user',
        content: `Retry task ${taskId} with modifications: ${modifications}`,
        timestamp: new Date(),
      });
    }

    // Execute the task again
    return this.executeTask(sessionId, taskId);
  }

  /**
   * Skip a task
   */
  async skipTask(sessionId: string, taskId: string): Promise<void> {
    const session = await this.contextManager.getSession(sessionId);
    const task = this.findTask(session, taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    if (task.status === 'completed') {
      throw new Error(`Cannot skip completed task: ${taskId}`);
    }

    await this.updateTaskStatus(sessionId, taskId, 'skipped');
  }

  /**
   * Get task status
   */
  async getTaskStatus(sessionId: string, taskId: string): Promise<Task['status']> {
    const session = await this.contextManager.getSession(sessionId);
    const task = this.findTask(session, taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return task.status;
  }

  /**
   * Get all tasks for a session
   */
  async getAllTasks(sessionId: string): Promise<Task[]> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (!session.plan.tasks) {
      return [];
    }

    return session.plan.tasks.tasks;
  }

  /**
   * Perform the actual task execution
   */
  private async performTaskExecution(
    session: ProjectSession,
    task: Task
  ): Promise<TaskResult> {
    const result: TaskResult = {
      success: true,
      filesCreated: [],
      filesModified: [],
      commandsRun: [],
    };

    try {
      // Get completed tasks for context
      const completedTasks = session.plan.tasks?.tasks.filter(
        t => t.status === 'completed'
      ) || [];

      // Generate prompt using template
      const prompt = promptTemplates.generateTaskExecutionPrompt({
        task,
        session,
        completedTasks,
        conversationHistory: this.buildConversationHistory(session),
      });

      // Generate implementation using AI
      const aiResponse = await clientAIService.processRequest({
        command: 'complete',
        code: prompt,
        language: this.detectLanguage(session),
        context: 'Implement the task according to specifications',
      });

      // Parse AI response for file operations and commands
      const operations = this.parseAIResponse(aiResponse.result);

      // Track file changes
      result.filesCreated = operations.filesCreated;
      result.filesModified = operations.filesModified;
      result.commandsRun = operations.commands;
      result.output = aiResponse.result;

      // Check if any operations failed
      const hasFailedCommands = operations.commands.some(cmd => cmd.exitCode !== 0);
      if (hasFailedCommands) {
        result.success = false;
        result.error = 'Some commands failed during execution';
      }

      return result;
    } catch (error: any) {
      result.success = false;
      result.error = error.message || 'Task execution failed';
      return result;
    }
  }

  /**
   * Build context for AI task execution
   */
  // private async buildTaskContext(
  //   session: ProjectSession,
  //   task: Task
  // ): Promise<string> {
  //   let context = '';

  //   // Add stack information
  //   context += `Technology Stack: ${session.selectedStack.name}\n`;
  //   context += `Frontend: ${session.selectedStack.frontend}\n`;
  //   if (session.selectedStack.backend) {
  //     context += `Backend: ${session.selectedStack.backend}\n`;
  //   }
  //   context += `Database: ${session.selectedStack.database}\n`;
  //   context += `Package Manager: ${session.selectedStack.packageManager}\n\n`;

  //   // Add theme information
  //   context += this.buildThemeContext(session.selectedTheme);

  //   // Add project description
  //   context += `Project Description: ${session.description}\n\n`;

  //   // Add task details
  //   context += `Task: ${task.number}. ${task.description}\n`;
  //   context += 'Details:\n';
  //   for (const detail of task.details) {
  //     context += `- ${detail}\n`;
  //   }
  //   context += '\n';

  //   // Add requirements context
  //   context += `Requirements: ${task.requirements.join(', ')}\n\n`;

  //   // Add design context if available
  //   if (session.plan.design) {
  //     context += 'Design Overview:\n';
  //     context += session.plan.design.overview + '\n\n';
  //   }

  //   // Add completed tasks context
  //   const completedTasks = session.plan.tasks?.tasks.filter(
  //     t => t.status === 'completed'
  //   ) || [];
    
  //   if (completedTasks.length > 0) {
  //     context += 'Previously Completed Tasks:\n';
  //     for (const completedTask of completedTasks) {
  //       context += `- ${completedTask.number}. ${completedTask.description}\n`;
  //     }
  //     context += '\n';
  //   }

  //   return context;
  // }

  /**
   * Build theme context for AI
   */
  // private buildThemeContext(theme: ColorTheme): string {
  //   let context = 'Color Theme:\n';
  //   context += `- Name: ${theme.name}\n`;
  //   context += `- Primary: ${theme.primary}\n`;
  //   context += `- Secondary: ${theme.secondary}\n`;
  //   context += `- Accent: ${theme.accent}\n`;
  //   context += `- Background: ${theme.background}\n`;
  //   context += `- Text: ${theme.text}\n`;
  //   context += 'Note: Ensure all generated UI code uses these theme colors.\n\n';
  //   return context;
  // }

  /**
   * Build conversation history for AI context
   */
  private buildConversationHistory(
    session: ProjectSession
  ): Array<{ role: string; content: string }> {
    // Get last 10 messages for context
    const recentMessages = session.conversationHistory.slice(-10);
    
    return recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * Detect programming language from stack
   */
  private detectLanguage(session: ProjectSession): string {
    const stack = session.selectedStack;
    
    // Check for TypeScript/JavaScript stacks
    if (
      stack.frontend.includes('React') ||
      stack.frontend.includes('Next') ||
      stack.backend?.includes('Express') ||
      stack.backend?.includes('NestJS')
    ) {
      return 'typescript';
    }

    // Check for Python stacks
    if (stack.backend?.includes('FastAPI') || stack.backend?.includes('Django')) {
      return 'python';
    }

    // Default to TypeScript
    return 'typescript';
  }

  /**
   * Parse AI response for file operations and commands
   */
  private parseAIResponse(response: string): {
    filesCreated: string[];
    filesModified: string[];
    commands: CommandResult[];
  } {
    const result = {
      filesCreated: [] as string[],
      filesModified: [] as string[],
      commands: [] as CommandResult[],
    };

    // Parse for file creation markers
    const createFileRegex = /CREATE FILE:\s*([^\n]+)/gi;
    let match;
    while ((match = createFileRegex.exec(response)) !== null) {
      result.filesCreated.push(match[1].trim());
    }

    // Parse for file modification markers
    const modifyFileRegex = /MODIFY FILE:\s*([^\n]+)/gi;
    while ((match = modifyFileRegex.exec(response)) !== null) {
      result.filesModified.push(match[1].trim());
    }

    // Parse for command execution markers
    const commandRegex = /RUN COMMAND:\s*([^\n]+)/gi;
    while ((match = commandRegex.exec(response)) !== null) {
      result.commands.push({
        command: match[1].trim(),
        exitCode: 0, // Assume success for now
        stdout: '',
        stderr: '',
      });
    }

    return result;
  }

  /**
   * Find a task by ID in the session
   */
  private findTask(session: ProjectSession, taskId: string): Task | undefined {
    if (!session.plan.tasks) {
      return undefined;
    }

    return session.plan.tasks.tasks.find(t => t.id === taskId);
  }

  /**
   * Update task status in the session
   */
  private async updateTaskStatus(
    sessionId: string,
    taskId: string,
    status: Task['status'],
    result?: TaskResult
  ): Promise<void> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (!session.plan.tasks) {
      throw new Error('No tasks in session');
    }

    const taskIndex = session.plan.tasks.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Update task
    session.plan.tasks.tasks[taskIndex].status = status;
    if (result) {
      session.plan.tasks.tasks[taskIndex].result = result;
    }

    // Save updated session
    await this.contextManager.updateSession(sessionId, {
      plan: session.plan,
    });

    // Add message about status change
    await this.contextManager.addMessage(sessionId, {
      id: this.generateMessageId(),
      role: 'system',
      content: `Task ${taskId} status: ${status}`,
      timestamp: new Date(),
      metadata: {
        type: 'task',
        data: {
          taskId,
          taskStatus: status,
        },
      },
    });
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let taskExecutorInstance: TaskExecutorService | null = null;

export const getTaskExecutor = (): TaskExecutorService => {
  if (!taskExecutorInstance) {
    taskExecutorInstance = new TaskExecutorService();
  }
  return taskExecutorInstance;
};

export const resetTaskExecutor = (): void => {
  taskExecutorInstance = null;
};
