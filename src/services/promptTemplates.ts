/**
 * AI Prompt Templates Service
 * 
 * Provides structured prompt templates for all AI interactions in the project generator.
 * Templates are stack and theme-aware, ensuring consistent and context-rich AI responses.
 */

import type {
  TechStack,
  ColorTheme,
  RequirementsDoc,
  DesignDoc,
  Task,
  ProjectSession,
} from '../types/projectGenerator';

/**
 * Template context for requirements generation
 */
export interface RequirementsTemplateContext {
  description: string;
  stack: TechStack;
  theme: ColorTheme;
  conversationHistory?: Array<{ role: string; content: string }>;
}

/**
 * Template context for design generation
 */
export interface DesignTemplateContext {
  requirements: RequirementsDoc;
  stack: TechStack;
  theme: ColorTheme;
  conversationHistory?: Array<{ role: string; content: string }>;
}

/**
 * Template context for task generation
 */
export interface TaskTemplateContext {
  design: DesignDoc;
  requirements: RequirementsDoc;
  stack: TechStack;
  theme: ColorTheme;
  conversationHistory?: Array<{ role: string; content: string }>;
}

/**
 * Template context for task execution
 */
export interface TaskExecutionTemplateContext {
  task: Task;
  session: ProjectSession;
  completedTasks: Task[];
  conversationHistory?: Array<{ role: string; content: string }>;
}

/**
 * Template context for image generation
 */
export interface ImageGenerationTemplateContext {
  projectName: string;
  description: string;
  theme: ColorTheme;
  imageType: 'logo' | 'hero' | 'icon';
}

/**
 * Prompt Templates Service
 */
export class PromptTemplatesService {
  /**
   * Generate prompt for requirements document creation
   */
  generateRequirementsPrompt(context: RequirementsTemplateContext): string {
    const { description, stack, theme, conversationHistory } = context;

    let prompt = `# Requirements Generation Task

You are an expert software requirements analyst. Generate a comprehensive requirements document following the EARS (Easy Approach to Requirements Syntax) patterns and INCOSE quality rules.

## Project Context

**Description:** ${description}

**Technology Stack:**
- Name: ${stack.name}
- Level: ${stack.level} (Level ${stack.levelNumber})
- Frontend: ${stack.frontend}
${stack.backend ? `- Backend: ${stack.backend}` : ''}
- Database: ${stack.database}
${stack.mobile ? `- Mobile: ${stack.mobile}` : ''}
- Package Manager: ${stack.packageManager}

**Color Theme:**
- Name: ${theme.name}
- Primary: ${theme.primary}
- Secondary: ${theme.secondary}
- Accent: ${theme.accent}
- Background: ${theme.background}
- Text: ${theme.text}
- Description: ${theme.description}

## Requirements Document Structure

Generate a requirements document with the following structure:

### 1. Introduction
- Summarize the project purpose and goals
- Reference the selected technology stack
- Mention the color theme that will be applied

### 2. Glossary
- Define all technical terms and system names
- Include stack-specific terminology
- Define "Theme" as the selected color scheme

### 3. Requirements
Each requirement must include:
- A user story: "As a [role], I want [feature], so that [benefit]"
- 2-5 acceptance criteria using EARS patterns

## EARS Patterns (use these exactly)

1. **Ubiquitous:** THE <system> SHALL <response>
2. **Event-driven:** WHEN <trigger>, THEN THE <system> SHALL <response>
3. **State-driven:** WHILE <condition>, THE <system> SHALL <response>
4. **Unwanted event:** IF <condition>, THEN THE <system> SHALL <response>
5. **Optional feature:** WHERE <option>, THE <system> SHALL <response>
6. **Complex:** [WHERE] [WHILE] [WHEN/IF] THE <system> SHALL <response>

## INCOSE Quality Rules

- Use active voice
- No vague terms ("quickly", "adequate")
- No escape clauses ("where possible")
- No negative statements ("SHALL not...")
- One thought per requirement
- Explicit and measurable conditions
- Consistent terminology
- No pronouns
- No absolutes ("never", "always")
- Solution-free (focus on what, not how)

## Stack-Specific Considerations

${this.getStackSpecificRequirementsGuidance(stack)}

## Theme Integration

- Include requirements for UI components to use the ${theme.name} theme colors
- Specify that color consistency must be maintained across all UI elements
- Reference theme colors in acceptance criteria where appropriate

## Output Format

Provide the complete requirements document in Markdown format with proper headings and formatting.

${conversationHistory && conversationHistory.length > 0 ? '\n## Previous Conversation\n\n' + this.formatConversationHistory(conversationHistory) : ''}
`;

    return prompt;
  }

  /**
   * Generate prompt for design document creation
   */
  generateDesignPrompt(context: DesignTemplateContext): string {
    const { requirements, stack, theme, conversationHistory } = context;

    let prompt = `# Design Document Generation Task

You are an expert software architect. Generate a comprehensive design document based on the requirements, technology stack, and color theme.

## Requirements Summary

${this.formatRequirementsSummary(requirements)}

## Technology Stack

- Name: ${stack.name}
- Level: ${stack.level} (Level ${stack.levelNumber})
- Frontend: ${stack.frontend}
${stack.backend ? `- Backend: ${stack.backend}` : ''}
- Database: ${stack.database}
${stack.mobile ? `- Mobile: ${stack.mobile}` : ''}
- Package Manager: ${stack.packageManager}

**Stack Benefits:**
${stack.benefits.map(b => `- ${b}`).join('\n')}

**Use Cases:**
${stack.useCases.map(u => `- ${u}`).join('\n')}

## Color Theme

- Name: ${theme.name}
- Primary: ${theme.primary}
- Secondary: ${theme.secondary}
- Accent: ${theme.accent}
- Background: ${theme.background}
- Text: ${theme.text}
- Description: ${theme.description}

## Design Document Structure

Generate a design document with the following sections:

### 1. Overview
- High-level description of the system
- Reference the technology stack and its benefits
- Mention the color theme and how it will be applied
- Explain the overall architecture approach

### 2. Architecture
- Describe the system architecture (client-server, monolithic, microservices, etc.)
- Include a Mermaid diagram showing component relationships
- Explain data flow between components
- Reference stack-specific architectural patterns

### 3. Components and Interfaces
For each major component:
- Name and purpose
- Responsibilities
- Interface/API definition
- Technology used (from the stack)
- Theme integration (for UI components)

### 4. Data Models
- Define all data entities
- Specify fields and types
- Describe relationships
- Include database schema considerations for ${stack.database}

### 5. Error Handling
- Error handling strategy
- User-facing error messages
- Logging and monitoring approach
- Stack-specific error handling patterns

### 6. Testing Strategy
- Unit testing approach
- Property-based testing with fast-check
- Integration testing
- End-to-end testing
- Stack-specific testing tools

## Stack-Specific Design Guidance

${this.getStackSpecificDesignGuidance(stack)}

## Theme Application Guidelines

- All UI components must use the ${theme.name} color palette
- Primary color (${theme.primary}) for main actions and branding
- Secondary color (${theme.secondary}) for supporting elements
- Accent color (${theme.accent}) for highlights and calls-to-action
- Background color (${theme.background}) for page backgrounds
- Text color (${theme.text}) for readable content
- Ensure sufficient contrast ratios for accessibility

## Output Format

Provide the complete design document in Markdown format with proper headings, code blocks, and Mermaid diagrams where appropriate.

${conversationHistory && conversationHistory.length > 0 ? '\n## Previous Conversation\n\n' + this.formatConversationHistory(conversationHistory) : ''}
`;

    return prompt;
  }

  /**
   * Generate prompt for task list creation
   */
  generateTasksPrompt(context: TaskTemplateContext): string {
    const { design, requirements, stack, theme, conversationHistory } = context;

    let prompt = `# Task List Generation Task

You are an expert project manager and software architect. Generate a comprehensive, actionable task list for implementing the project.

## Design Summary

${this.formatDesignSummary(design)}

## Requirements Summary

${this.formatRequirementsSummary(requirements)}

## Technology Stack

- Name: ${stack.name}
- Level: ${stack.level} (Level ${stack.levelNumber})
- Frontend: ${stack.frontend}
${stack.backend ? `- Backend: ${stack.backend}` : ''}
- Database: ${stack.database}
${stack.mobile ? `- Mobile: ${stack.mobile}` : ''}
- Package Manager: ${stack.packageManager}

## Color Theme

- Name: ${theme.name}
- Colors: Primary ${theme.primary}, Secondary ${theme.secondary}, Accent ${theme.accent}

## Task List Requirements

### Structure
- Use numbered tasks (1, 2, 3, etc.)
- Use sub-tasks with decimal notation (1.1, 1.2, 2.1, etc.)
- Maximum two levels of hierarchy
- Each task must be a checkbox item

### Task Content
Each task must include:
- Clear, actionable description
- Specific implementation details as sub-bullets
- References to requirements (e.g., "_Requirements: 1.1, 2.3_")
- Stack-specific commands and setup steps
- Theme color integration for UI tasks

### Task Sequencing
1. Start with project setup and dependencies
2. Create directory structure following ${stack.name} best practices
3. Implement core components
4. Add backend/API functionality (if applicable)
5. Integrate database (${stack.database})
6. Apply ${theme.name} theme throughout
7. Add error handling
8. Include testing tasks
9. Add checkpoints every 3-4 tasks

### Stack-Specific Commands

Use the correct package manager (${stack.packageManager}) for all installation commands:
${this.getPackageManagerExamples(stack.packageManager)}

### Theme Integration Tasks

- Ensure tasks include applying theme colors to UI components
- Reference specific color values in task details
- Include CSS/styling tasks that use the theme palette

## Stack-Specific Task Guidance

${this.getStackSpecificTaskGuidance(stack)}

## Output Format

Provide the task list in Markdown format with checkboxes:

\`\`\`markdown
- [ ] 1. Task description
  - Detail 1
  - Detail 2
  - _Requirements: 1.1_

- [ ] 1.1 Sub-task description
  - Detail 1
  - _Requirements: 1.1_
\`\`\`

${conversationHistory && conversationHistory.length > 0 ? '\n## Previous Conversation\n\n' + this.formatConversationHistory(conversationHistory) : ''}
`;

    return prompt;
  }

  /**
   * Generate prompt for task execution
   */
  generateTaskExecutionPrompt(context: TaskExecutionTemplateContext): string {
    const { task, session, completedTasks, conversationHistory } = context;

    let prompt = `# Task Implementation

You are an expert software developer. Implement the following task according to the project specifications.

## Current Task

**Task ${task.number}:** ${task.description}

**Details:**
${task.details.map(d => `- ${d}`).join('\n')}

**Requirements:** ${task.requirements.join(', ')}

## Project Context

**Description:** ${session.description}

**Technology Stack:**
- Frontend: ${session.selectedStack.frontend}
${session.selectedStack.backend ? `- Backend: ${session.selectedStack.backend}` : ''}
- Database: ${session.selectedStack.database}
${session.selectedStack.mobile ? `- Mobile: ${session.selectedStack.mobile}` : ''}
- Package Manager: ${session.selectedStack.packageManager}

**Color Theme:**
- Name: ${session.selectedTheme.name}
- Primary: ${session.selectedTheme.primary}
- Secondary: ${session.selectedTheme.secondary}
- Accent: ${session.selectedTheme.accent}
- Background: ${session.selectedTheme.background}
- Text: ${session.selectedTheme.text}

## Design Context

${session.plan.design ? this.formatDesignSummary(session.plan.design) : 'Design not yet available'}

## Previously Completed Tasks

${completedTasks.length > 0 ? completedTasks.map(t => `- ${t.number}. ${t.description}`).join('\n') : 'No tasks completed yet'}

## Implementation Guidelines

### Code Quality
- Write clean, maintainable code
- Follow ${session.selectedStack.name} best practices
- Use TypeScript for type safety (if applicable)
- Add appropriate comments and documentation

### Theme Integration
**IMPORTANT:** All UI code must use the ${session.selectedTheme.name} theme colors:
- Primary color: ${session.selectedTheme.primary}
- Secondary color: ${session.selectedTheme.secondary}
- Accent color: ${session.selectedTheme.accent}
- Background color: ${session.selectedTheme.background}
- Text color: ${session.selectedTheme.text}

Do not use hardcoded colors. Always reference the theme colors.

### File Operations
When creating or modifying files, use these markers:
- \`CREATE FILE: path/to/file.ext\` - for new files
- \`MODIFY FILE: path/to/file.ext\` - for existing files
- \`RUN COMMAND: command here\` - for commands to execute

### Stack-Specific Guidelines
${this.getStackSpecificImplementationGuidance(session.selectedStack)}

## Output Format

Provide:
1. File operations with markers
2. Complete code for each file
3. Commands to run (if any)
4. Brief explanation of what was implemented

${conversationHistory && conversationHistory.length > 0 ? '\n## Previous Conversation\n\n' + this.formatConversationHistory(conversationHistory) : ''}
`;

    return prompt;
  }

  /**
   * Generate prompt for image generation
   */
  generateImagePrompt(context: ImageGenerationTemplateContext): string {
    const { projectName, description, theme, imageType } = context;

    const prompts = {
      logo: `Create a modern, professional logo for "${projectName}". ${description}. 
Use a color palette with primary color ${theme.primary}, secondary color ${theme.secondary}, 
and accent color ${theme.accent}. The logo should be simple, memorable, and work well at small sizes. 
Style: flat design, minimalist, vector-style. No text in the logo.`,

      hero: `Create a hero banner image for "${projectName}". ${description}. 
Use a color palette with primary color ${theme.primary}, secondary color ${theme.secondary}, 
accent color ${theme.accent}, and background color ${theme.background}. 
The image should be modern, professional, and visually appealing. 
Style: abstract, geometric, gradient, tech-inspired. Wide format suitable for website hero section.`,

      icon: `Create a simple app icon for "${projectName}". 
Use primary color ${theme.primary} and accent color ${theme.accent}. 
The icon should be clean, recognizable, and work well at small sizes. 
Style: flat design, minimalist, centered on solid background. Square format.`,
    };

    return prompts[imageType];
  }

  // Private helper methods

  /**
   * Format conversation history for inclusion in prompts
   */
  private formatConversationHistory(
    history: Array<{ role: string; content: string }>
  ): string {
    return history
      .map(msg => `**${msg.role}:** ${msg.content}`)
      .join('\n\n');
  }

  /**
   * Format requirements summary
   */
  private formatRequirementsSummary(requirements: RequirementsDoc): string {
    let summary = `**Introduction:** ${requirements.introduction}\n\n`;
    summary += `**Requirements:**\n`;
    
    for (const req of requirements.requirements) {
      summary += `\n${req.number}. ${req.userStory}\n`;
      summary += `Acceptance Criteria:\n`;
      for (const criteria of req.acceptanceCriteria) {
        summary += `- ${criteria}\n`;
      }
    }

    return summary;
  }

  /**
   * Format design summary
   */
  private formatDesignSummary(design: DesignDoc): string {
    let summary = `**Overview:** ${design.overview}\n\n`;
    summary += `**Architecture:** ${design.architecture}\n\n`;
    
    if (design.components && design.components.length > 0) {
      summary += `**Components:**\n`;
      for (const component of design.components) {
        summary += `- ${component.name}: ${component.description}\n`;
      }
    }

    return summary;
  }

  /**
   * Get stack-specific requirements guidance
   */
  private getStackSpecificRequirementsGuidance(stack: TechStack): string {
    let guidance = '';

    if (stack.frontend.includes('React')) {
      guidance += '- Include requirements for React component structure and state management\n';
      guidance += '- Consider requirements for component reusability and composition\n';
    }

    if (stack.frontend.includes('Next.js')) {
      guidance += '- Include requirements for server-side rendering and routing\n';
      guidance += '- Consider requirements for API routes and data fetching\n';
    }

    if (stack.backend?.includes('Express')) {
      guidance += '- Include requirements for REST API endpoints\n';
      guidance += '- Consider requirements for middleware and error handling\n';
    }

    if (stack.backend?.includes('NestJS')) {
      guidance += '- Include requirements for modular architecture\n';
      guidance += '- Consider requirements for dependency injection and services\n';
    }

    if (stack.backend?.includes('FastAPI')) {
      guidance += '- Include requirements for async API endpoints\n';
      guidance += '- Consider requirements for data validation with Pydantic\n';
    }

    if (stack.database.includes('Supabase')) {
      guidance += '- Include requirements for real-time subscriptions\n';
      guidance += '- Consider requirements for authentication and row-level security\n';
    }

    if (stack.mobile?.includes('Expo')) {
      guidance += '- Include requirements for mobile-specific features (camera, location, etc.)\n';
      guidance += '- Consider requirements for cross-platform compatibility\n';
    }

    return guidance || '- Follow general web application best practices\n';
  }

  /**
   * Get stack-specific design guidance
   */
  private getStackSpecificDesignGuidance(stack: TechStack): string {
    let guidance = '';

    if (stack.frontend.includes('React')) {
      guidance += '- Use React hooks for state management\n';
      guidance += '- Follow component composition patterns\n';
      guidance += '- Consider using Context API or state management library\n';
    }

    if (stack.frontend.includes('Next.js')) {
      guidance += '- Leverage Next.js App Router or Pages Router\n';
      guidance += '- Use server components where appropriate\n';
      guidance += '- Implement proper data fetching strategies\n';
    }

    if (stack.backend?.includes('NestJS')) {
      guidance += '- Follow NestJS modular architecture\n';
      guidance += '- Use decorators for routing and dependency injection\n';
      guidance += '- Implement proper service layer separation\n';
    }

    if (stack.backend?.includes('FastAPI')) {
      guidance += '- Use FastAPI async capabilities\n';
      guidance += '- Implement Pydantic models for validation\n';
      guidance += '- Follow Python type hints best practices\n';
    }

    if (stack.database.includes('Supabase')) {
      guidance += '- Design database schema with RLS policies\n';
      guidance += '- Use Supabase client for real-time features\n';
      guidance += '- Implement proper authentication flow\n';
    }

    return guidance || '- Follow general software architecture best practices\n';
  }

  /**
   * Get stack-specific task guidance
   */
  private getStackSpecificTaskGuidance(stack: TechStack): string {
    let guidance = '';

    if (stack.frontend.includes('React')) {
      guidance += '- Create component files in src/components/\n';
      guidance += '- Set up React hooks and context providers\n';
      guidance += '- Configure build tools (Vite, Webpack, etc.)\n';
    }

    if (stack.frontend.includes('Next.js')) {
      guidance += '- Set up Next.js project structure\n';
      guidance += '- Create pages in app/ or pages/ directory\n';
      guidance += '- Configure next.config.js\n';
    }

    if (stack.backend?.includes('Express')) {
      guidance += '- Set up Express server with middleware\n';
      guidance += '- Create route handlers in routes/\n';
      guidance += '- Configure CORS and security middleware\n';
    }

    if (stack.backend?.includes('NestJS')) {
      guidance += '- Generate NestJS modules, controllers, and services\n';
      guidance += '- Set up dependency injection\n';
      guidance += '- Configure NestJS decorators\n';
    }

    if (stack.backend?.includes('FastAPI')) {
      guidance += '- Set up FastAPI application with routers\n';
      guidance += '- Create Pydantic models for validation\n';
      guidance += '- Configure CORS and middleware\n';
    }

    if (stack.database.includes('Supabase')) {
      guidance += '- Initialize Supabase client\n';
      guidance += '- Set up database migrations\n';
      guidance += '- Configure authentication\n';
    }

    return guidance || '- Follow standard project setup procedures\n';
  }

  /**
   * Get stack-specific implementation guidance
   */
  private getStackSpecificImplementationGuidance(stack: TechStack): string {
    let guidance = '';

    if (stack.frontend.includes('React')) {
      guidance += '- Use functional components with hooks\n';
      guidance += '- Implement proper prop types or TypeScript interfaces\n';
      guidance += '- Follow React best practices for performance\n';
    }

    if (stack.backend?.includes('FastAPI')) {
      guidance += '- Use async/await for all endpoints\n';
      guidance += '- Implement proper error handling with HTTPException\n';
      guidance += '- Use Pydantic models for request/response validation\n';
    }

    if (stack.database.includes('Supabase')) {
      guidance += '- Use Supabase client methods for database operations\n';
      guidance += '- Implement proper error handling for database queries\n';
      guidance += '- Use real-time subscriptions where appropriate\n';
    }

    return guidance || '- Follow language and framework best practices\n';
  }

  /**
   * Get package manager examples
   */
  private getPackageManagerExamples(packageManager: string): string {
    const examples = {
      npm: `- Install: \`npm install <package>\`
- Install dev: \`npm install -D <package>\`
- Run script: \`npm run <script>\``,
      yarn: `- Install: \`yarn add <package>\`
- Install dev: \`yarn add -D <package>\`
- Run script: \`yarn <script>\``,
      pnpm: `- Install: \`pnpm add <package>\`
- Install dev: \`pnpm add -D <package>\`
- Run script: \`pnpm <script>\``,
      pip: `- Install: \`pip install <package>\`
- Install from requirements: \`pip install -r requirements.txt\`
- Run script: \`python <script>.py\``,
    };

    return examples[packageManager as keyof typeof examples] || examples.npm;
  }
}

// Singleton instance
let promptTemplatesInstance: PromptTemplatesService | null = null;

export const getPromptTemplates = (): PromptTemplatesService => {
  if (!promptTemplatesInstance) {
    promptTemplatesInstance = new PromptTemplatesService();
  }
  return promptTemplatesInstance;
};

export const resetPromptTemplates = (): void => {
  promptTemplatesInstance = null;
};

export default new PromptTemplatesService();
