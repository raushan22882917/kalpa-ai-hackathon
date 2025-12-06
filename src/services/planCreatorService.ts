import type {
  TechStack,
  ColorTheme,
  RequirementsDoc,
  DesignDoc,
  TaskList,
  Task,
  Dependency,
} from '../types/projectGenerator';
import projectScaffoldingService from './projectScaffoldingService';
import promptTemplates from './promptTemplates';
import { clientAIService } from './clientAIService';

/**
 * Plan Creator Service
 * 
 * Generates requirements, design, and task documents for projects
 * based on user descriptions, selected tech stacks, and color themes.
 */
class PlanCreatorService {
  /**
   * Create requirements document from project description, stack, and theme
   */
  async createRequirements(
    description: string,
    stack: TechStack,
    theme: ColorTheme,
    context: string[] = []
  ): Promise<RequirementsDoc> {
    // Generate prompt using template
    const prompt = promptTemplates.generateRequirementsPrompt({
      description,
      stack,
      theme,
      conversationHistory: context.map(c => ({ role: 'user', content: c })),
    });

    // Call AI service to generate requirements
    const response = await clientAIService.processRequest({
      command: 'complete',
      code: prompt,
      language: 'markdown',
      context: 'Generate a requirements document following EARS patterns',
    });

    // Parse the AI response into structured requirements
    return this.parseRequirementsFromAI(response.result, description, stack, theme);
  }

  /**
   * Parse AI-generated requirements into structured format
   */
  private parseRequirementsFromAI(
    aiResponse: string,
    description: string,
    stack: TechStack,
    theme: ColorTheme
  ): RequirementsDoc {
    // Fallback to generated requirements if AI parsing fails
    try {
      // Extract introduction (text between # Introduction and ## Glossary)
      const introMatch = aiResponse.match(/# Introduction\s+([\s\S]*?)(?=##|$)/i);
      const introduction = introMatch 
        ? introMatch[1].trim() 
        : this.generateIntroduction(description, stack, theme);

      // Extract glossary
      const glossaryMatch = aiResponse.match(/## Glossary\s+([\s\S]*?)(?=##|$)/i);
      const glossary = glossaryMatch
        ? this.parseGlossary(glossaryMatch[1])
        : this.generateGlossary(description, stack, theme);

      // Extract requirements
      const requirementsMatch = aiResponse.match(/## Requirements\s+([\s\S]*?)$/i);
      const requirements = requirementsMatch
        ? this.parseRequirements(requirementsMatch[1])
        : this.generateRequirements(description, stack, theme);

      return {
        introduction,
        glossary,
        requirements,
      };
    } catch (error) {
      // Fallback to basic generation
      return {
        introduction: this.generateIntroduction(description, stack, theme),
        glossary: this.generateGlossary(description, stack, theme),
        requirements: this.generateRequirements(description, stack, theme),
      };
    }
  }

  /**
   * Parse glossary from AI response
   */
  private parseGlossary(glossaryText: string): Record<string, string> {
    const glossary: Record<string, string> = {};
    const lines = glossaryText.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^[-*]\s*\*\*(.+?)\*\*:\s*(.+)$/);
      if (match) {
        glossary[match[1].trim()] = match[2].trim();
      }
    }

    return Object.keys(glossary).length > 0 ? glossary : {
      'System': 'The application being developed',
      'User': 'A person who interacts with the system',
    };
  }

  /**
   * Parse requirements from AI response
   */
  private parseRequirements(requirementsText: string): any[] {
    const requirements = [];
    const reqBlocks = requirementsText.split(/###\s+Requirement\s+(\d+)/i);
    
    for (let i = 1; i < reqBlocks.length; i += 2) {
      const number = parseInt(reqBlocks[i]);
      const content = reqBlocks[i + 1];
      
      const userStoryMatch = content.match(/\*\*User Story:\*\*\s*(.+?)(?=\n|$)/i);
      const userStory = userStoryMatch ? userStoryMatch[1].trim() : '';
      
      const criteriaMatch = content.match(/####\s*Acceptance Criteria\s+([\s\S]*?)(?=###|$)/i);
      const acceptanceCriteria: string[] = [];
      
      if (criteriaMatch) {
        const criteriaLines = criteriaMatch[1].split('\n');
        for (const line of criteriaLines) {
          const match = line.match(/^\d+\.\s*(.+)$/);
          if (match) {
            acceptanceCriteria.push(match[1].trim());
          }
        }
      }
      
      if (userStory && acceptanceCriteria.length > 0) {
        requirements.push({
          number,
          userStory,
          acceptanceCriteria,
        });
      }
    }

    return requirements.length > 0 ? requirements : this.generateRequirements('', { name: '' } as TechStack, { name: '' } as ColorTheme);
  }

  /**
   * Create design document from requirements, stack, and theme
   */
  async createDesign(
    requirements: RequirementsDoc,
    stack: TechStack,
    theme: ColorTheme
  ): Promise<DesignDoc> {
    // Generate prompt using template
    const prompt = promptTemplates.generateDesignPrompt({
      requirements,
      stack,
      theme,
    });

    // Call AI service to generate design
    const response = await clientAIService.processRequest({
      command: 'complete',
      code: prompt,
      language: 'markdown',
      context: 'Generate a comprehensive design document',
    });

    // Parse the AI response into structured design
    return this.parseDesignFromAI(response.result, requirements, stack, theme);
  }

  /**
   * Parse AI-generated design into structured format
   */
  private parseDesignFromAI(
    aiResponse: string,
    requirements: RequirementsDoc,
    stack: TechStack,
    theme: ColorTheme
  ): DesignDoc {
    // Fallback to generated design if AI parsing fails
    try {
      const overview = this.extractSection(aiResponse, 'Overview') || 
        this.generateDesignOverview(requirements, stack, theme);
      
      const architecture = this.extractSection(aiResponse, 'Architecture') || 
        this.generateArchitecture(requirements, stack);
      
      const components = this.parseComponents(aiResponse) || 
        this.generateComponents(requirements, stack, theme);
      
      const dataModels = this.parseDataModels(aiResponse) || 
        this.generateDataModels(requirements, stack);
      
      const errorHandling = this.extractSection(aiResponse, 'Error Handling') || 
        this.generateErrorHandling(stack);
      
      const testingStrategy = this.extractSection(aiResponse, 'Testing Strategy') || 
        this.generateTestingStrategy(stack);

      return {
        overview,
        architecture,
        components,
        dataModels,
        errorHandling,
        testingStrategy,
      };
    } catch (error) {
      // Fallback to basic generation
      return {
        overview: this.generateDesignOverview(requirements, stack, theme),
        architecture: this.generateArchitecture(requirements, stack),
        components: this.generateComponents(requirements, stack, theme),
        dataModels: this.generateDataModels(requirements, stack),
        errorHandling: this.generateErrorHandling(stack),
        testingStrategy: this.generateTestingStrategy(stack),
      };
    }
  }

  /**
   * Extract a section from AI response
   */
  private extractSection(text: string, sectionName: string): string | null {
    const regex = new RegExp(`##\\s+${sectionName}\\s+([\\s\\S]*?)(?=##|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Parse components from AI response
   */
  private parseComponents(text: string): any[] | null {
    const section = this.extractSection(text, 'Components');
    if (!section) return null;

    const components = [];
    const componentBlocks = section.split(/###\s+/);
    
    for (const block of componentBlocks) {
      if (!block.trim()) continue;
      
      const lines = block.split('\n');
      const name = lines[0].trim();
      
      components.push({
        name,
        description: `Component for ${name}`,
        responsibilities: [],
        interface: 'Component interface',
      });
    }

    return components.length > 0 ? components : null;
  }

  /**
   * Parse data models from AI response
   */
  private parseDataModels(text: string): any[] | null {
    const section = this.extractSection(text, 'Data Models');
    if (!section) return null;

    const models = [];
    const modelBlocks = section.split(/###\s+/);
    
    for (const block of modelBlocks) {
      if (!block.trim()) continue;
      
      const lines = block.split('\n');
      const name = lines[0].trim();
      
      models.push({
        name,
        description: `Data model for ${name}`,
        fields: {},
      });
    }

    return models.length > 0 ? models : null;
  }

  /**
   * Create task list from design, stack, and theme
   */
  async createTasks(
    design: DesignDoc,
    stack: TechStack,
    theme: ColorTheme,
    requirements?: RequirementsDoc
  ): Promise<TaskList> {
    // Generate prompt using template
    const prompt = promptTemplates.generateTasksPrompt({
      design,
      requirements: requirements || { introduction: '', glossary: {}, requirements: [] },
      stack,
      theme,
    });

    // Call AI service to generate tasks
    const response = await clientAIService.processRequest({
      command: 'complete',
      code: prompt,
      language: 'markdown',
      context: 'Generate an actionable task list',
    });

    // Parse the AI response into structured tasks
    return this.parseTasksFromAI(response.result, design, stack, theme);
  }

  /**
   * Parse AI-generated tasks into structured format
   */
  private parseTasksFromAI(
    aiResponse: string,
    design: DesignDoc,
    stack: TechStack,
    theme: ColorTheme
  ): TaskList {
    try {
      const tasks = this.parseTaskList(aiResponse);
      const checkpoints = this.identifyCheckpoints(tasks);

      return {
        tasks: tasks.length > 0 ? tasks : this.generateTasks(design, stack, theme),
        checkpoints,
      };
    } catch (error) {
      // Fallback to basic generation
      const tasks = this.generateTasks(design, stack, theme);
      return {
        tasks,
        checkpoints: this.identifyCheckpoints(tasks),
      };
    }
  }

  /**
   * Parse task list from AI response
   */
  private parseTaskList(text: string): Task[] {
    const tasks: Task[] = [];
    const lines = text.split('\n');
    
    let currentTask: Partial<Task> | null = null;
    let taskNumber = 0;
    
    for (const line of lines) {
      // Match task line: - [ ] 1. Task description
      const taskMatch = line.match(/^-\s*\[\s*\]\s*(\d+(?:\.\d+)?)\.\s*(.+)$/);
      if (taskMatch) {
        // Save previous task if exists
        if (currentTask && currentTask.description) {
          tasks.push(currentTask as Task);
        }
        
        taskNumber++;
        currentTask = {
          id: `task-${taskNumber}`,
          number: taskMatch[1],
          description: taskMatch[2].trim(),
          details: [],
          requirements: [],
          status: 'pending',
        };
        continue;
      }
      
      // Match detail line: - Detail text or _Requirements: 1.1_
      if (currentTask) {
        const detailMatch = line.match(/^\s*-\s*(.+)$/);
        if (detailMatch) {
          const detail = detailMatch[1].trim();
          
          // Check if it's a requirements reference
          const reqMatch = detail.match(/_Requirements?:\s*(.+)_/i);
          if (reqMatch) {
            currentTask.requirements = reqMatch[1].split(',').map(r => r.trim());
          } else {
            currentTask.details?.push(detail);
          }
        }
      }
    }
    
    // Save last task
    if (currentTask && currentTask.description) {
      tasks.push(currentTask as Task);
    }
    
    return tasks;
  }

  /**
   * Identify dependencies and commands based on stack
   */
  async identifyDependencies(
    stack: TechStack,
    _requirements: RequirementsDoc
  ): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];
    const packageManager = projectScaffoldingService.getPackageManager(stack);

    // Add base dependencies based on stack
    if (stack.frontend.includes('React')) {
      dependencies.push({
        name: 'react',
        type: packageManager === 'pip' ? 'npm' : packageManager,
        installCommand: projectScaffoldingService.generateInstallCommand(
          ['react', 'react-dom'],
          stack,
          false
        ),
        version: '^18.0.0',
      });
    }

    if (stack.frontend.includes('Next.js')) {
      dependencies.push({
        name: 'next',
        type: packageManager === 'pip' ? 'npm' : packageManager,
        installCommand: projectScaffoldingService.generateInstallCommand(
          ['next', 'react', 'react-dom'],
          stack,
          false
        ),
        version: '^14.0.0',
      });
    }

    if (stack.backend?.includes('Express')) {
      dependencies.push({
        name: 'express',
        type: packageManager === 'pip' ? 'npm' : packageManager,
        installCommand: projectScaffoldingService.generateInstallCommand(
          ['express'],
          stack,
          false
        ),
        version: '^4.18.0',
      });
    }

    if (stack.backend?.includes('NestJS')) {
      dependencies.push({
        name: '@nestjs/core',
        type: packageManager === 'pip' ? 'npm' : packageManager,
        installCommand: projectScaffoldingService.generateInstallCommand(
          ['@nestjs/core', '@nestjs/common', '@nestjs/platform-express'],
          stack,
          false
        ),
        version: '^10.0.0',
      });
    }

    if (stack.backend?.includes('FastAPI')) {
      dependencies.push({
        name: 'fastapi',
        type: 'pip',
        installCommand: projectScaffoldingService.generateInstallCommand(
          ['fastapi', 'uvicorn'],
          stack,
          false
        ),
        version: '>=0.100.0',
      });
    }

    if (stack.database.includes('Supabase')) {
      dependencies.push({
        name: '@supabase/supabase-js',
        type: packageManager === 'pip' ? 'npm' : packageManager,
        installCommand: projectScaffoldingService.generateInstallCommand(
          ['@supabase/supabase-js'],
          stack,
          false
        ),
        version: '^2.38.0',
      });
    }

    if (stack.mobile?.includes('Expo')) {
      dependencies.push({
        name: 'expo',
        type: packageManager === 'pip' ? 'npm' : packageManager,
        installCommand: projectScaffoldingService.generateInstallCommand(
          ['expo'],
          stack,
          false
        ),
        version: '~49.0.0',
      });
    }

    return dependencies;
  }

  // Private helper methods

  // private extractProjectName(description: string): string {
  //   // Extract first few words as project name
  //   const words = description.trim().split(/\s+/).slice(0, 3);
  //   return words.join(' ');
  // }

  private generateIntroduction(
    description: string,
    stack: TechStack,
    theme: ColorTheme
  ): string {
    return `This project aims to ${description}. It will be built using ${stack.name} (${stack.frontend}${stack.backend ? ` with ${stack.backend}` : ''} and ${stack.database}) with a ${theme.name} color scheme.`;
  }

  private generateGlossary(
    _description: string,
    stack: TechStack,
    theme: ColorTheme
  ): Record<string, string> {
    const glossary: Record<string, string> = {
      'System': 'The application being developed',
      'User': 'A person who interacts with the system',
    };

    // Add stack-specific terms
    if (stack.frontend.includes('React')) {
      glossary['Component'] = 'A reusable React UI element';
    }

    if (stack.database.includes('Supabase')) {
      glossary['Database'] = 'Supabase PostgreSQL database';
    }

    // Add theme reference
    glossary['Theme'] = `The ${theme.name} color scheme applied throughout the UI`;

    return glossary;
  }

  private generateRequirements(
    description: string,
    stack: TechStack,
    theme: ColorTheme
  ): any[] {
    // Generate basic requirements based on description and stack
    const requirements = [];

    // Requirement 1: Basic functionality
    requirements.push({
      number: 1,
      userStory: `As a user, I want to use the application, so that I can ${description}`,
      acceptanceCriteria: [
        'WHEN a user accesses the application THEN the System SHALL display the main interface',
        'WHEN the user interacts with the interface THEN the System SHALL respond appropriately',
        `WHEN displaying UI elements THEN the System SHALL use the ${theme.name} color scheme`,
      ],
    });

    // Add stack-specific requirements
    if (stack.backend) {
      requirements.push({
        number: 2,
        userStory: 'As a user, I want the application to communicate with a backend, so that data is persisted and processed',
        acceptanceCriteria: [
          'WHEN the user performs an action THEN the System SHALL send requests to the backend API',
          'WHEN the backend responds THEN the System SHALL update the UI accordingly',
          'WHEN network errors occur THEN the System SHALL display appropriate error messages',
        ],
      });
    }

    if (stack.database.includes('Supabase')) {
      requirements.push({
        number: requirements.length + 1,
        userStory: 'As a user, I want my data to be stored securely, so that I can access it later',
        acceptanceCriteria: [
          'WHEN data is created THEN the System SHALL store it in the Database',
          'WHEN data is requested THEN the System SHALL retrieve it from the Database',
          'WHEN data is updated THEN the System SHALL persist changes to the Database',
        ],
      });
    }

    return requirements;
  }

  private generateDesignOverview(
    _requirements: RequirementsDoc,
    stack: TechStack,
    theme: ColorTheme
  ): string {
    return `This application is built using ${stack.name}. The frontend uses ${stack.frontend}${stack.backend ? `, the backend uses ${stack.backend}` : ''}, and data is stored in ${stack.database}. The UI follows the ${theme.name} color scheme with primary color ${theme.primary}.`;
  }

  private generateArchitecture(
    _requirements: RequirementsDoc,
    stack: TechStack
  ): string {
    let architecture = '## Architecture\n\n';
    
    if (stack.backend) {
      architecture += `This is a client-server architecture with:\n`;
      architecture += `- Frontend: ${stack.frontend}\n`;
      architecture += `- Backend: ${stack.backend}\n`;
      architecture += `- Database: ${stack.database}\n`;
    } else {
      architecture += `This is a frontend-focused architecture with:\n`;
      architecture += `- Frontend: ${stack.frontend}\n`;
      architecture += `- Database: ${stack.database}\n`;
    }

    return architecture;
  }

  private generateComponents(
    _requirements: RequirementsDoc,
    stack: TechStack,
    theme: ColorTheme
  ): any[] {
    const components = [];

    // Main App component
    components.push({
      name: 'App',
      description: 'Main application component',
      responsibilities: [
        'Render the main UI',
        `Apply ${theme.name} theme colors`,
        'Handle routing and navigation',
      ],
      interface: 'React component',
    });

    // Add backend component if applicable
    if (stack.backend) {
      components.push({
        name: 'API Server',
        description: `${stack.backend} server`,
        responsibilities: [
          'Handle HTTP requests',
          'Process business logic',
          'Interact with database',
        ],
        interface: 'REST API',
      });
    }

    return components;
  }

  private generateDataModels(
    _requirements: RequirementsDoc,
    _stack: TechStack
  ): any[] {
    // Generate basic data models
    return [
      {
        name: 'User',
        description: 'Represents a user of the system',
        fields: {
          id: 'string (UUID)',
          email: 'string',
          createdAt: 'timestamp',
        },
      },
    ];
  }

  private generateErrorHandling(_stack: TechStack): string {
    return `Error handling will use try-catch blocks and display user-friendly error messages. Network errors will be caught and retried with exponential backoff.`;
  }

  private generateTestingStrategy(_stack: TechStack): string {
    return `Testing will include:\n- Unit tests for individual functions\n- Integration tests for API endpoints\n- Property-based tests using fast-check\n- End-to-end tests for critical user flows`;
  }

  private generateTasks(
    _design: DesignDoc,
    stack: TechStack,
    theme: ColorTheme
  ): Task[] {
    const tasks: Task[] = [];
    let taskNumber = 1;

    // Get scaffolding information
    const structure = projectScaffoldingService.getProjectStructure(stack);
    const packageManager = projectScaffoldingService.getPackageManager(stack);
    const bestPractices = projectScaffoldingService.getStackBestPractices(stack);

    // Task 1: Setup project
    const setupDetails = [
      `Initialize ${stack.frontend} project`,
      `Install dependencies using ${packageManager}`,
      'Configure build tools',
      `Set up ${theme.name} theme colors in configuration`,
    ];

    // Add configuration files to setup
    if (structure.files.length > 0) {
      setupDetails.push(`Create configuration files: ${structure.files.map(f => f.name).join(', ')}`);
    }

    tasks.push({
      id: `task-${taskNumber}`,
      number: `${taskNumber}`,
      description: 'Set up project structure and dependencies',
      details: setupDetails,
      requirements: ['1.1'],
      status: 'pending',
    });
    taskNumber++;

    // Task 1.1: Create directory structure
    if (structure.directories.length > 0) {
      tasks.push({
        id: `task-${taskNumber}`,
        number: `${taskNumber}`,
        description: 'Create project directory structure',
        details: [
          `Create directories: ${structure.directories.join(', ')}`,
          'Organize code following stack best practices',
          ...bestPractices.slice(0, 2), // Include first 2 best practices
        ],
        requirements: ['1.1'],
        status: 'pending',
      });
      taskNumber++;
    }

    // Task 2: Create main components
    tasks.push({
      id: `task-${taskNumber}`,
      number: `${taskNumber}`,
      description: 'Create main UI components',
      details: [
        'Create App component',
        `Apply ${theme.name} theme colors (${theme.primary}, ${theme.secondary})`,
        'Set up routing',
      ],
      requirements: ['1.1'],
      status: 'pending',
    });
    taskNumber++;

    // Add backend tasks if applicable
    if (stack.backend) {
      tasks.push({
        id: `task-${taskNumber}`,
        number: `${taskNumber}`,
        description: `Set up ${stack.backend} server`,
        details: [
          `Initialize ${stack.backend} project`,
          'Configure server and middleware',
          'Set up database connection',
        ],
        requirements: ['2.1'],
        status: 'pending',
      });
      taskNumber++;

      tasks.push({
        id: `task-${taskNumber}`,
        number: `${taskNumber}`,
        description: 'Create API endpoints',
        details: [
          'Define API routes',
          'Implement request handlers',
          'Add error handling',
        ],
        requirements: ['2.1', '2.2'],
        status: 'pending',
      });
      taskNumber++;
    }

    // Task: Database setup
    if (stack.database.includes('Supabase')) {
      tasks.push({
        id: `task-${taskNumber}`,
        number: `${taskNumber}`,
        description: 'Set up Supabase database',
        details: [
          'Create Supabase project',
          'Define database schema',
          'Configure authentication',
        ],
        requirements: ['3.1'],
        status: 'pending',
      });
      taskNumber++;
    }

    return tasks;
  }

  private identifyCheckpoints(tasks: Task[]): number[] {
    // Add checkpoints after every 3-4 tasks
    const checkpoints: number[] = [];
    for (let i = 3; i < tasks.length; i += 4) {
      checkpoints.push(i);
    }
    return checkpoints;
  }
}

export default new PlanCreatorService();
