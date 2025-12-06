/**
 * Simple AI Project Generator
 * AI understands user query and designs/generates everything
 */

import { terminalCommandService } from './terminalCommandService';

export interface ProjectGenerationRequest {
  userQuery: string; // "Create a weather website"
  workspacePath?: string;
}

export interface ProjectGenerationResult {
  success: boolean;
  projectName: string;
  projectPath: string;
  techStack: string;
  filesCreated: string[];
  error?: string;
}

class SimpleAIProjectGenerator {
  private aiBackendUrl = 'http://localhost:3001/api/ai/process';

  /**
   * Main function: AI understands query and generates complete project
   */
  async generateProject(request: ProjectGenerationRequest): Promise<ProjectGenerationResult> {
    const { userQuery, workspacePath } = request;

    try {
      // Step 1: AI analyzes the query and creates a complete plan
      const plan = await this.analyzeAndPlan(userQuery);

      // Step 2: Generate project name
      const projectName = await this.generateProjectName(userQuery);

      // Step 3: Execute the plan (run commands, create files)
      const result = await this.executePlan(plan, projectName, workspacePath);

      return {
        success: true,
        projectName,
        projectPath: workspacePath ? `${workspacePath}/${projectName}` : `./${projectName}`,
        techStack: plan.techStack,
        filesCreated: result.filesCreated,
      };
    } catch (error) {
      return {
        success: false,
        projectName: '',
        projectPath: '',
        techStack: '',
        filesCreated: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * AI analyzes user query and creates complete project plan
   */
  private async analyzeAndPlan(userQuery: string): Promise<any> {
    const prompt = `
You are a senior software architect. Analyze this project request and create a complete implementation plan.

User Request: "${userQuery}"

Provide a JSON response with:
{
  "projectType": "web app / mobile app / api / etc",
  "techStack": "React + Node.js / Next.js + FastAPI / etc",
  "features": ["feature 1", "feature 2"],
  "setupCommands": ["command 1", "command 2"],
  "filesToCreate": [
    {
      "path": "src/App.tsx",
      "content": "// complete file content here"
    }
  ]
}

Be specific and provide COMPLETE, WORKING code for all files.
`;

    const response = await fetch(this.aiBackendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'complete',
        code: prompt,
        language: 'text',
        provider: 'gemini',
      }),
    });

    if (!response.ok) {
      throw new Error('AI service unavailable');
    }

    const data = await response.json();
    
    // Parse AI response
    try {
      const jsonMatch = data.result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback to simple plan
      return this.createFallbackPlan(userQuery);
    }

    return this.createFallbackPlan(userQuery);
  }

  /**
   * Generate project name from user query
   */
  private async generateProjectName(userQuery: string): Promise<string> {
    const prompt = `Generate a short, kebab-case project name (2-3 words) for: "${userQuery}". Return ONLY the name, nothing else.`;

    try {
      const response = await fetch(this.aiBackendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'complete',
          code: prompt,
          language: 'text',
          provider: 'gemini',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let name = data.result.trim().toLowerCase();
        name = name.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (name.length > 2) return name;
      }
    } catch (e) {
      // Fallback
    }

    // Fallback name
    return 'my-project-' + Date.now();
  }

  /**
   * Execute the AI-generated plan
   */
  private async executePlan(
    plan: any,
    projectName: string,
    workspacePath?: string
  ): Promise<{ filesCreated: string[] }> {
    const filesCreated: string[] = [];

    // Connect to terminal
    await terminalCommandService.connect(workspacePath);

    // Run setup commands
    if (plan.setupCommands && Array.isArray(plan.setupCommands)) {
      for (const cmd of plan.setupCommands) {
        const command = cmd.replace(/PROJECT_NAME/g, projectName);
        await terminalCommandService.executeCommand(command);
      }
    }

    // Create files
    if (plan.filesToCreate && Array.isArray(plan.filesToCreate)) {
      for (const file of plan.filesToCreate) {
        const filePath = `${projectName}/${file.path}`;
        // Create file using terminal
        const content = file.content.replace(/\n/g, '\\n').replace(/"/g, '\\"');
        await terminalCommandService.executeCommand(
          `echo "${content}" > ${filePath}`
        );
        filesCreated.push(filePath);
      }
    }

    return { filesCreated };
  }

  /**
   * Fallback plan if AI fails
   */
  private createFallbackPlan(userQuery: string): any {
    const lowerQuery = userQuery.toLowerCase();

    // Detect project type
    let techStack = 'React + Node.js';
    let setupCommands = [
      'npx create-react-app PROJECT_NAME',
      'cd PROJECT_NAME',
      'npm install',
    ];

    if (lowerQuery.includes('next')) {
      techStack = 'Next.js';
      setupCommands = [
        'npx create-next-app@latest PROJECT_NAME',
        'cd PROJECT_NAME',
        'npm install',
      ];
    } else if (lowerQuery.includes('mobile') || lowerQuery.includes('react native')) {
      techStack = 'React Native + Expo';
      setupCommands = [
        'npx create-expo-app PROJECT_NAME',
        'cd PROJECT_NAME',
        'npm install',
      ];
    }

    return {
      projectType: 'web app',
      techStack,
      features: ['Basic setup', 'Ready to customize'],
      setupCommands,
      filesToCreate: [],
    };
  }
}

export const simpleAIProjectGenerator = new SimpleAIProjectGenerator();
