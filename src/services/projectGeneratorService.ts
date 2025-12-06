/**
 * Project Generator Service
 * 
 * Orchestrates the project creation workflow through a state machine.
 * Manages phase transitions: stack-selection → theme-selection → description → 
 * requirements → design → tasks → image-generation → execution
 */

import type {
  ProjectSession,
  TechStack,
  ColorTheme,
  RequirementsDoc,
  DesignDoc,
  TaskList,
  ChatMessage,
} from '../types/projectGenerator';
import { getContextManager } from './contextManagerService';
import planCreatorService from './planCreatorService';

export type Phase = ProjectSession['phase'];
export type DocumentType = 'requirements' | 'design' | 'tasks';

export interface PhaseTransition {
  from: Phase;
  to: Phase;
  condition?: () => boolean;
}

/**
 * Project Generator Service
 * Manages the workflow state machine for project generation
 */
export class ProjectGeneratorService {
  private contextManager = getContextManager();

  /**
   * Valid phase transitions in the workflow
   */
  private readonly phaseTransitions: PhaseTransition[] = [
    { from: 'stack-selection', to: 'theme-selection' },
    { from: 'theme-selection', to: 'description' },
    { from: 'description', to: 'requirements' },
    { from: 'requirements', to: 'design' },
    { from: 'design', to: 'tasks' },
    { from: 'tasks', to: 'image-generation' },
    { from: 'image-generation', to: 'execution' },
    { from: 'execution', to: 'complete' },
  ];

  /**
   * Start a new project generation session
   * Initial phase is 'stack-selection'
   */
  async startNewProject(): Promise<string> {
    // Create a temporary session with placeholder values
    // These will be updated when stack and theme are selected
    const placeholderStack: TechStack = {
      id: 'placeholder',
      name: 'Placeholder',
      level: 'beginner',
      levelNumber: 1,
      frontend: 'React',
      database: 'Supabase',
      benefits: [],
      useCases: [],
      packageManager: 'npm',
    };

    const placeholderTheme: ColorTheme = {
      id: 'placeholder',
      name: 'Placeholder',
      primary: '#000000',
      secondary: '#000000',
      accent: '#000000',
      background: '#FFFFFF',
      text: '#000000',
      description: 'Placeholder theme',
    };

    const sessionId = await this.contextManager.createSession(
      '', // description will be added later
      placeholderStack,
      placeholderTheme
    );

    // Update phase to stack-selection
    await this.contextManager.updatePhase(sessionId, 'stack-selection');

    return sessionId;
  }

  /**
   * Handle stack selection phase
   */
  async selectStack(sessionId: string, stack: TechStack): Promise<void> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'stack-selection') {
      throw new Error(`Cannot select stack in phase: ${session.phase}`);
    }

    // Update session with selected stack
    await this.contextManager.updateSession(sessionId, {
      selectedStack: stack,
    });

    // Add system message about stack selection
    await this.addSystemMessage(
      sessionId,
      `Stack selected: ${stack.name}`,
      'stack-selection',
      { stack }
    );

    // Transition to theme selection
    await this.transitionPhase(sessionId, 'theme-selection');
  }

  /**
   * Handle theme selection phase
   */
  async selectTheme(sessionId: string, theme: ColorTheme): Promise<void> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'theme-selection') {
      throw new Error(`Cannot select theme in phase: ${session.phase}`);
    }

    // Update session with selected theme
    await this.contextManager.updateSession(sessionId, {
      selectedTheme: theme,
    });

    // Add system message about theme selection
    await this.addSystemMessage(
      sessionId,
      `Theme selected: ${theme.name}`,
      'theme-selection',
      { theme }
    );

    // Transition to description phase
    await this.transitionPhase(sessionId, 'description');
  }

  /**
   * Handle project description submission
   */
  async submitDescription(sessionId: string, description: string): Promise<void> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'description') {
      throw new Error(`Cannot submit description in phase: ${session.phase}`);
    }

    // Update session with description
    await this.contextManager.updateSession(sessionId, {
      description,
      plan: {
        ...session.plan,
        projectName: this.extractProjectName(description),
      },
    });

    // Add user message
    await this.addUserMessage(sessionId, description);

    // Transition to requirements generation
    await this.transitionPhase(sessionId, 'requirements');
  }

  /**
   * Generate requirements document
   */
  async generateRequirements(sessionId: string): Promise<RequirementsDoc> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'requirements') {
      throw new Error(`Cannot generate requirements in phase: ${session.phase}`);
    }

    // Get context for AI
    const context = await this.contextManager.getContext(sessionId);

    // Generate requirements using plan creator
    const requirements = await planCreatorService.createRequirements(
      session.description,
      session.selectedStack,
      session.selectedTheme,
      [context]
    );

    // Update session with requirements
    await this.contextManager.updateSession(sessionId, {
      plan: {
        ...session.plan,
        requirements,
      },
    });

    // Add assistant message with requirements
    await this.addAssistantMessage(
      sessionId,
      this.formatRequirementsForDisplay(requirements),
      'plan',
      {
        documentType: 'requirements',
        document: requirements,
      }
    );

    return requirements;
  }

  /**
   * Update requirements based on user feedback
   */
  async updateRequirements(
    sessionId: string,
    feedback: string
  ): Promise<RequirementsDoc> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'requirements') {
      throw new Error(`Cannot update requirements in phase: ${session.phase}`);
    }

    if (!session.plan.requirements) {
      throw new Error('No requirements to update');
    }

    // Add user feedback message
    await this.addUserMessage(sessionId, feedback);

    // For now, regenerate requirements with feedback in context
    // In a real implementation, this would use AI to modify the existing requirements
    const context = await this.contextManager.getContext(sessionId);
    const updatedRequirements = await planCreatorService.createRequirements(
      session.description + '\n\nFeedback: ' + feedback,
      session.selectedStack,
      session.selectedTheme,
      [context]
    );

    // Update session
    await this.contextManager.updateSession(sessionId, {
      plan: {
        ...session.plan,
        requirements: updatedRequirements,
      },
    });

    // Add assistant message with updated requirements
    await this.addAssistantMessage(
      sessionId,
      this.formatRequirementsForDisplay(updatedRequirements),
      'plan',
      {
        documentType: 'requirements',
        document: updatedRequirements,
      }
    );

    return updatedRequirements;
  }

  /**
   * Approve requirements and move to design phase
   */
  async approveRequirements(sessionId: string): Promise<void> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'requirements') {
      throw new Error(`Cannot approve requirements in phase: ${session.phase}`);
    }

    if (!session.plan.requirements) {
      throw new Error('No requirements to approve');
    }

    // Add approval message
    await this.addSystemMessage(
      sessionId,
      'Requirements approved',
      'approval',
      {
        approvalType: 'requirements',
        approved: true,
      }
    );

    // Transition to design phase
    await this.transitionPhase(sessionId, 'design');
  }

  /**
   * Generate design document
   */
  async generateDesign(sessionId: string): Promise<DesignDoc> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'design') {
      throw new Error(`Cannot generate design in phase: ${session.phase}`);
    }

    if (!session.plan.requirements) {
      throw new Error('Requirements must be approved before generating design');
    }

    // Generate design using plan creator
    const design = await planCreatorService.createDesign(
      session.plan.requirements,
      session.selectedStack,
      session.selectedTheme
    );

    // Update session with design
    await this.contextManager.updateSession(sessionId, {
      plan: {
        ...session.plan,
        design,
      },
    });

    // Add assistant message with design
    await this.addAssistantMessage(
      sessionId,
      this.formatDesignForDisplay(design),
      'plan',
      {
        documentType: 'design',
        document: design,
      }
    );

    return design;
  }

  /**
   * Update design based on user feedback
   */
  async updateDesign(sessionId: string, feedback: string): Promise<DesignDoc> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'design') {
      throw new Error(`Cannot update design in phase: ${session.phase}`);
    }

    if (!session.plan.design || !session.plan.requirements) {
      throw new Error('No design to update');
    }

    // Add user feedback message
    await this.addUserMessage(sessionId, feedback);

    // Regenerate design with feedback
    // In a real implementation, this would use AI to modify the existing design
    const updatedDesign = await planCreatorService.createDesign(
      session.plan.requirements,
      session.selectedStack,
      session.selectedTheme
    );

    // Update session
    await this.contextManager.updateSession(sessionId, {
      plan: {
        ...session.plan,
        design: updatedDesign,
      },
    });

    // Add assistant message with updated design
    await this.addAssistantMessage(
      sessionId,
      this.formatDesignForDisplay(updatedDesign),
      'plan',
      {
        documentType: 'design',
        document: updatedDesign,
      }
    );

    return updatedDesign;
  }

  /**
   * Approve design and move to tasks phase
   */
  async approveDesign(sessionId: string): Promise<void> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'design') {
      throw new Error(`Cannot approve design in phase: ${session.phase}`);
    }

    if (!session.plan.design) {
      throw new Error('No design to approve');
    }

    // Add approval message
    await this.addSystemMessage(
      sessionId,
      'Design approved',
      'approval',
      {
        approvalType: 'design',
        approved: true,
      }
    );

    // Transition to tasks phase
    await this.transitionPhase(sessionId, 'tasks');
  }

  /**
   * Generate task list
   */
  async generateTasks(sessionId: string): Promise<TaskList> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'tasks') {
      throw new Error(`Cannot generate tasks in phase: ${session.phase}`);
    }

    if (!session.plan.design) {
      throw new Error('Design must be approved before generating tasks');
    }

    // Generate tasks using plan creator
    const tasks = await planCreatorService.createTasks(
      session.plan.design,
      session.selectedStack,
      session.selectedTheme
    );

    // Update session with tasks
    await this.contextManager.updateSession(sessionId, {
      plan: {
        ...session.plan,
        tasks,
      },
    });

    // Add assistant message with tasks
    await this.addAssistantMessage(
      sessionId,
      this.formatTasksForDisplay(tasks),
      'plan',
      {
        documentType: 'tasks',
        document: tasks,
      }
    );

    return tasks;
  }

  /**
   * Update tasks based on user feedback
   */
  async updateTasks(sessionId: string, feedback: string): Promise<TaskList> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'tasks') {
      throw new Error(`Cannot update tasks in phase: ${session.phase}`);
    }

    if (!session.plan.tasks || !session.plan.design) {
      throw new Error('No tasks to update');
    }

    // Add user feedback message
    await this.addUserMessage(sessionId, feedback);

    // Regenerate tasks with feedback
    const updatedTasks = await planCreatorService.createTasks(
      session.plan.design,
      session.selectedStack,
      session.selectedTheme
    );

    // Update session
    await this.contextManager.updateSession(sessionId, {
      plan: {
        ...session.plan,
        tasks: updatedTasks,
      },
    });

    // Add assistant message with updated tasks
    await this.addAssistantMessage(
      sessionId,
      this.formatTasksForDisplay(updatedTasks),
      'plan',
      {
        documentType: 'tasks',
        document: updatedTasks,
      }
    );

    return updatedTasks;
  }

  /**
   * Approve tasks and move to image generation phase
   */
  async approveTasks(sessionId: string): Promise<void> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'tasks') {
      throw new Error(`Cannot approve tasks in phase: ${session.phase}`);
    }

    if (!session.plan.tasks) {
      throw new Error('No tasks to approve');
    }

    // Add approval message
    await this.addSystemMessage(
      sessionId,
      'Tasks approved',
      'approval',
      {
        approvalType: 'tasks',
        approved: true,
      }
    );

    // Transition to image generation phase
    await this.transitionPhase(sessionId, 'image-generation');
  }

  /**
   * Offer image generation to user
   */
  async offerImageGeneration(sessionId: string): Promise<void> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'image-generation') {
      throw new Error(`Cannot offer image generation in phase: ${session.phase}`);
    }

    // Add system message offering image generation
    await this.addAssistantMessage(
      sessionId,
      'Would you like me to generate images for your project (logo, hero image, icons)?',
      'image',
      {}
    );
  }

  /**
   * Skip image generation and move to execution
   */
  async skipImageGeneration(sessionId: string): Promise<void> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'image-generation') {
      throw new Error(`Cannot skip image generation in phase: ${session.phase}`);
    }

    // Add system message
    await this.addSystemMessage(
      sessionId,
      'Image generation skipped',
      'system'
    );

    // Transition to execution phase
    await this.transitionPhase(sessionId, 'execution');
  }

  /**
   * Accept image generation and transition to execution
   * (Actual image generation would be handled by ImageGeneratorService)
   */
  async acceptImageGeneration(sessionId: string): Promise<void> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (session.phase !== 'image-generation') {
      throw new Error(`Cannot accept image generation in phase: ${session.phase}`);
    }

    // Add system message
    await this.addSystemMessage(
      sessionId,
      'Image generation accepted. Images will be generated.',
      'system'
    );

    // Transition to execution phase
    await this.transitionPhase(sessionId, 'execution');
  }

  /**
   * Get current session state
   */
  async getSessionState(sessionId: string): Promise<ProjectSession> {
    return this.contextManager.getSession(sessionId);
  }

  /**
   * Get current phase
   */
  async getCurrentPhase(sessionId: string): Promise<Phase> {
    const session = await this.contextManager.getSession(sessionId);
    return session.phase;
  }

  /**
   * Check if a phase transition is valid
   */
  private isValidTransition(from: Phase, to: Phase): boolean {
    return this.phaseTransitions.some(
      (transition) => transition.from === from && transition.to === to
    );
  }

  /**
   * Transition to a new phase
   */
  private async transitionPhase(sessionId: string, newPhase: Phase): Promise<void> {
    const session = await this.contextManager.getSession(sessionId);
    
    if (!this.isValidTransition(session.phase, newPhase)) {
      throw new Error(
        `Invalid phase transition: ${session.phase} -> ${newPhase}`
      );
    }

    await this.contextManager.updatePhase(sessionId, newPhase);
  }

  /**
   * Add a user message to the conversation
   */
  private async addUserMessage(
    sessionId: string,
    content: string,
    metadata?: ChatMessage['metadata']
  ): Promise<void> {
    const message: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date(),
      metadata,
    };

    await this.contextManager.addMessage(sessionId, message);
  }

  /**
   * Add an assistant message to the conversation
   */
  private async addAssistantMessage(
    sessionId: string,
    content: string,
    type?: string,
    data?: any
  ): Promise<void> {
    const message: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      metadata: type ? { type: type as any, data } : undefined,
    };

    await this.contextManager.addMessage(sessionId, message);
  }

  /**
   * Add a system message to the conversation
   */
  private async addSystemMessage(
    sessionId: string,
    content: string,
    type?: string,
    data?: any
  ): Promise<void> {
    const message: ChatMessage = {
      id: this.generateMessageId(),
      role: 'system',
      content,
      timestamp: new Date(),
      metadata: type ? { type: type as any, data } : undefined,
    };

    await this.contextManager.addMessage(sessionId, message);
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract project name from description
   */
  private extractProjectName(description: string): string {
    const words = description.trim().split(/\s+/).slice(0, 3);
    return words.join(' ') || 'Untitled Project';
  }

  /**
   * Format requirements for display
   */
  private formatRequirementsForDisplay(requirements: RequirementsDoc): string {
    let output = '# Requirements Document\n\n';
    output += `## Introduction\n\n${requirements.introduction}\n\n`;
    output += '## Glossary\n\n';
    
    for (const [term, definition] of Object.entries(requirements.glossary)) {
      output += `- **${term}**: ${definition}\n`;
    }
    
    output += '\n## Requirements\n\n';
    
    for (const req of requirements.requirements) {
      output += `### Requirement ${req.number}\n\n`;
      output += `**User Story:** ${req.userStory}\n\n`;
      output += '#### Acceptance Criteria\n\n';
      
      for (let i = 0; i < req.acceptanceCriteria.length; i++) {
        output += `${i + 1}. ${req.acceptanceCriteria[i]}\n`;
      }
      
      output += '\n';
    }
    
    return output;
  }

  /**
   * Format design for display
   */
  private formatDesignForDisplay(design: DesignDoc): string {
    let output = '# Design Document\n\n';
    output += `## Overview\n\n${design.overview}\n\n`;
    output += `## Architecture\n\n${design.architecture}\n\n`;
    output += '## Components\n\n';
    
    for (const component of design.components) {
      output += `### ${component.name}\n\n`;
      output += `${component.description}\n\n`;
      output += '**Responsibilities:**\n';
      
      for (const resp of component.responsibilities) {
        output += `- ${resp}\n`;
      }
      
      output += '\n';
    }
    
    output += '## Data Models\n\n';
    
    for (const model of design.dataModels) {
      output += `### ${model.name}\n\n`;
      output += `${model.description}\n\n`;
      output += '**Fields:**\n';
      
      for (const [field, type] of Object.entries(model.fields)) {
        output += `- ${field}: ${type}\n`;
      }
      
      output += '\n';
    }
    
    output += `## Error Handling\n\n${design.errorHandling}\n\n`;
    output += `## Testing Strategy\n\n${design.testingStrategy}\n\n`;
    
    return output;
  }

  /**
   * Format tasks for display
   */
  private formatTasksForDisplay(taskList: TaskList): string {
    let output = '# Implementation Tasks\n\n';
    
    for (const task of taskList.tasks) {
      output += `- [ ] ${task.number}. ${task.description}\n`;
      
      for (const detail of task.details) {
        output += `  - ${detail}\n`;
      }
      
      output += `  - _Requirements: ${task.requirements.join(', ')}_\n\n`;
    }
    
    return output;
  }
}

// Singleton instance
let projectGeneratorInstance: ProjectGeneratorService | null = null;

export const getProjectGenerator = (): ProjectGeneratorService => {
  if (!projectGeneratorInstance) {
    projectGeneratorInstance = new ProjectGeneratorService();
  }
  return projectGeneratorInstance;
};

export const resetProjectGenerator = (): void => {
  projectGeneratorInstance = null;
};
