/**
 * Project Architect Service
 * Plans complete project architecture including pages, components, and files
 * Generates starter code for all files
 */

import { clientAIService } from './clientAIService';
import { TechStack } from '../types/projectGenerator';

export interface ProjectArchitecture {
  projectName: string;
  projectType: 'app' | 'website';
  description: string;
  pages: PageDefinition[];
  components: ComponentDefinition[];
  services: ServiceDefinition[];
  routes: RouteDefinition[];
  database: DatabaseSchema[];
  fileStructure: FileStructure;
}

export interface PageDefinition {
  name: string;
  path: string;
  description: string;
  components: string[];
}

export interface ComponentDefinition {
  name: string;
  path: string;
  description: string;
  props?: string[];
}

export interface ServiceDefinition {
  name: string;
  path: string;
  description: string;
  methods: string[];
}

export interface RouteDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  handler: string;
}

export interface DatabaseSchema {
  tableName: string;
  columns: ColumnDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  required: boolean;
}

export interface FileStructure {
  frontend: FolderStructure;
  backend?: FolderStructure;
}

export interface FolderStructure {
  [key: string]: string[] | FolderStructure;
}

class ProjectArchitectService {
  /**
   * Generate complete project architecture based on description
   */
  async generateArchitecture(
    description: string,
    stack: TechStack
  ): Promise<ProjectArchitecture> {
    const prompt = `You are a senior software architect. Design a complete project architecture for this idea:

"${description}"

Tech Stack:
- Frontend: ${stack.frontend}
${stack.backend ? `- Backend: ${stack.backend}` : ''}
- Database: ${stack.database}

Generate a COMPLETE project architecture including:

1. PROJECT NAME (lowercase-with-hyphens, creative, 2-4 words)
2. PROJECT TYPE (app or website)
3. PAGES (all pages needed with routes)
4. COMPONENTS (reusable UI components)
5. SERVICES (API services, utilities)
6. BACKEND ROUTES (if backend exists)
7. DATABASE SCHEMA (tables and columns)
8. FILE STRUCTURE (complete folder organization)

Respond in this EXACT JSON format:
{
  "projectName": "example-app",
  "projectType": "app",
  "description": "Brief description",
  "pages": [
    {
      "name": "HomePage",
      "path": "/",
      "description": "Landing page",
      "components": ["Hero", "Features"]
    }
  ],
  "components": [
    {
      "name": "Hero",
      "path": "src/components/Hero.tsx",
      "description": "Hero section component",
      "props": ["title", "subtitle"]
    }
  ],
  "services": [
    {
      "name": "authService",
      "path": "src/services/authService.ts",
      "description": "Authentication service",
      "methods": ["login", "logout", "register"]
    }
  ],
  "routes": [
    {
      "path": "/api/auth/login",
      "method": "POST",
      "description": "User login",
      "handler": "authController.login"
    }
  ],
  "database": [
    {
      "tableName": "users",
      "columns": [
        {"name": "id", "type": "uuid", "required": true},
        {"name": "email", "type": "string", "required": true}
      ]
    }
  ],
  "fileStructure": {
    "frontend": {
      "src": {
        "pages": ["HomePage.tsx", "AboutPage.tsx"],
        "components": ["Hero.tsx", "Features.tsx"],
        "services": ["authService.ts"],
        "styles": ["App.css", "index.css"]
      },
      "public": ["index.html"]
    },
    "backend": {
      "src": {
        "controllers": ["authController.ts"],
        "routes": ["authRoutes.ts"],
        "models": ["User.ts"],
        "middleware": ["auth.ts"]
      }
    }
  }
}

Be thorough and professional. Include all necessary files for a production-ready project.`;

    try {
      const response = await clientAIService.processRequest({
        command: 'complete',
        code: prompt,
        language: 'json',
        context: 'Generate project architecture',
      });

      // Parse JSON response
      const jsonMatch = response.result?.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse architecture response');
      }

      const architecture: ProjectArchitecture = JSON.parse(jsonMatch[0]);
      return architecture;
    } catch (error) {
      console.error('Failed to generate architecture:', error);
      // Return minimal fallback architecture
      return this.getFallbackArchitecture(description, stack);
    }
  }

  /**
   * Generate file creation commands from architecture
   */
  generateFileCommands(architecture: ProjectArchitecture, supabaseEnvVars?: string): string[] {
    const commands: string[] = [];

    // Create .kalpa directory structure for project planning
    commands.push('mkdir -p .kalpa/specs');
    commands.push('mkdir -p .kalpa/docs');
    
    // Create .kalpa/README.md
    const kalpaReadme = this.generateKalpaReadme(architecture);
    commands.push(`cat > .kalpa/README.md << 'EOF'\n${kalpaReadme}\nEOF`);
    
    // Create .kalpa/specs/tasks.md
    const tasksContent = this.generateTasksFile(architecture);
    commands.push(`cat > .kalpa/specs/tasks.md << 'EOF'\n${tasksContent}\nEOF`);
    
    // Create .kalpa/specs/architecture.md
    const archContent = this.generateArchitectureDoc(architecture);
    commands.push(`cat > .kalpa/specs/architecture.md << 'EOF'\n${archContent}\nEOF`);

    // Create frontend structure
    commands.push(...this.generateFolderCommands('frontend', architecture.fileStructure.frontend));

    // Create backend structure if exists
    if (architecture.fileStructure.backend) {
      commands.push(...this.generateFolderCommands('backend', architecture.fileStructure.backend));
    }

    // Create .env file with Supabase credentials
    const envContent = `NODE_ENV=development${supabaseEnvVars || ''}`;
    commands.push(`echo "${envContent}" > .env`);

    // Create .gitignore
    commands.push(`echo "node_modules/\n.env\ndist/\nbuild/\n.kalpa/" > .gitignore`);

    // Create README with architecture
    const readmeContent = this.generateReadme(architecture);
    commands.push(`cat > README.md << 'EOF'\n${readmeContent}\nEOF`);

    return commands;
  }

  /**
   * Generate folder and file creation commands recursively
   */
  private generateFolderCommands(basePath: string, structure: FolderStructure, depth: number = 0): string[] {
    const commands: string[] = [];
    
    // Prevent infinite recursion
    if (depth > 10) {
      console.warn('Maximum folder depth reached, stopping recursion');
      return commands;
    }

    // Check if structure is valid
    if (!structure || typeof structure !== 'object') {
      return commands;
    }

    for (const [key, value] of Object.entries(structure)) {
      const currentPath = `${basePath}/${key}`;

      if (Array.isArray(value)) {
        // It's a list of files
        commands.push(`mkdir -p ${currentPath}`);
        
        for (const file of value) {
          if (typeof file === 'string') {
            const filePath = `${currentPath}/${file}`;
            const fileContent = this.generateFileContent(file, key);
            commands.push(`echo '${fileContent}' > ${filePath}`);
          }
        }
      } else if (value && typeof value === 'object') {
        // It's a nested folder
        commands.push(`mkdir -p ${currentPath}`);
        commands.push(...this.generateFolderCommands(currentPath, value as FolderStructure, depth + 1));
      }
    }

    return commands;
  }

  /**
   * Generate starter content for a file based on its name and type
   */
  private generateFileContent(fileName: string, folderType: string): string {
    const ext = fileName.split('.').pop();

    // React/TypeScript components
    if (ext === 'tsx' && folderType === 'components') {
      const componentName = fileName.replace('.tsx', '');
      return `import React from 'react';\\n\\ninterface ${componentName}Props {}\\n\\nconst ${componentName}: React.FC<${componentName}Props> = () => {\\n  return (\\n    <div className="${componentName.toLowerCase()}">\\n      <h2>${componentName}</h2>\\n    </div>\\n  );\\n};\\n\\nexport default ${componentName};`;
    }

    // React pages
    if (ext === 'tsx' && folderType === 'pages') {
      const pageName = fileName.replace('.tsx', '');
      return `import React from 'react';\\n\\nconst ${pageName}: React.FC = () => {\\n  return (\\n    <div className="${pageName.toLowerCase()}">\\n      <h1>${pageName}</h1>\\n    </div>\\n  );\\n};\\n\\nexport default ${pageName};`;
    }

    // TypeScript services
    if (ext === 'ts' && folderType === 'services') {
      const serviceName = fileName.replace('.ts', '');
      return `/**\\n * ${serviceName}\\n */\\n\\nclass ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} {\\n  // Add methods here\\n}\\n\\nexport const ${serviceName} = new ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}();`;
    }

    // CSS files
    if (ext === 'css') {
      return `/* ${fileName} */\\n\\n* {\\n  margin: 0;\\n  padding: 0;\\n  box-sizing: border-box;\\n}`;
    }

    // Backend controllers
    if (ext === 'ts' && folderType === 'controllers') {
      const controllerName = fileName.replace('.ts', '');
      return `import { Request, Response } from 'express';\\n\\nexport const ${controllerName} = {\\n  // Add controller methods here\\n};`;
    }

    // Backend routes
    if (ext === 'ts' && folderType === 'routes') {
      return `import { Router } from 'express';\\n\\nconst router = Router();\\n\\n// Add routes here\\n\\nexport default router;`;
    }

    // Default empty file
    return `// ${fileName}\\n`;
  }

  /**
   * Generate .kalpa/README.md
   */
  private generateKalpaReadme(architecture: ProjectArchitecture): string {
    const features = architecture.pages.slice(0, 5).map(p => `- ${p.name}: ${p.description}`).join('\\n');
    const dbInfo = architecture.database.length > 0 ? architecture.database.slice(0, 3).map(t => t.tableName).join(', ') : 'Not configured';
    
    return `# ${architecture.projectName} - Project Documentation\\n\\nThis directory contains project planning and architecture.\\n\\n**Name**: ${architecture.projectName}\\n**Type**: ${architecture.projectType}\\n\\n## Key Features\\n${features}\\n\\n## Tech Stack\\n- Frontend: frontend/ directory\\n${architecture.fileStructure.backend ? '- Backend: backend/ directory\\n' : ''}- Database: ${dbInfo}`;
  }

  /**
   * Generate .kalpa/specs/tasks.md (simplified to reduce memory)
   */
  private generateTasksFile(architecture: ProjectArchitecture): string {
    const pages = architecture.pages.slice(0, 5).map(p => `- [ ] ${p.name}`).join('\\n');
    const comps = architecture.components.slice(0, 5).map(c => `- [ ] ${c.name}`).join('\\n');
    
    return `# ${architecture.projectName} - Tasks\\n\\n## Setup\\n- [x] Structure created\\n- [ ] Configure environment\\n\\n## Frontend\\n${pages}\\n\\n## Components\\n${comps}\\n\\n## Testing\\n- [ ] Unit tests\\n- [ ] Integration tests`;
  }

  /**
   * Generate .kalpa/specs/architecture.md (simplified)
   */
  private generateArchitectureDoc(architecture: ProjectArchitecture): string {
    const pages = architecture.pages.slice(0, 3).map(p => `- ${p.name}: ${p.path}`).join('\\n');
    const comps = architecture.components.slice(0, 3).map(c => `- ${c.name}`).join('\\n');
    
    return `# ${architecture.projectName} - Architecture\\n\\n${architecture.description}\\n\\n## Pages\\n${pages}\\n\\n## Components\\n${comps}\\n\\n## Tech Stack\\n- Frontend: React/TypeScript\\n${architecture.fileStructure.backend ? '- Backend: Node.js\\n' : ''}- Database: Supabase`;
  }

  /**
   * Generate README content with architecture details
   */
  private generateReadme(architecture: ProjectArchitecture): string {
    let readme = `# ${architecture.projectName}\\n\\n`;
    readme += `${architecture.description}\\n\\n`;
    readme += `## Project Type\\n${architecture.projectType}\\n\\n`;
    readme += `## Pages\\n`;
    architecture.pages.forEach(page => {
      readme += `- **${page.name}** (${page.path}): ${page.description}\\n`;
    });
    readme += `\\n## Components\\n`;
    architecture.components.forEach(comp => {
      readme += `- **${comp.name}**: ${comp.description}\\n`;
    });
    if (architecture.routes.length > 0) {
      readme += `\\n## API Routes\\n`;
      architecture.routes.forEach(route => {
        readme += `- **${route.method} ${route.path}**: ${route.description}\\n`;
      });
    }
    readme += `\\n## Getting Started\\n\\n`;
    readme += `### Frontend\\n\`\`\`bash\\ncd frontend\\nnpm install\\nnpm run dev\\n\`\`\`\\n\\n`;
    if (architecture.fileStructure.backend) {
      readme += `### Backend\\n\`\`\`bash\\ncd backend\\nnpm install\\nnpm start\\n\`\`\`\\n`;
    }
    readme += `\\n## Documentation\\n\\nSee [\`.kalpa/\`](./.kalpa/) directory for detailed project documentation, architecture, and tasks.\\n`;
    return readme;
  }

  /**
   * Fallback architecture if AI generation fails
   */
  private getFallbackArchitecture(description: string, _stack: TechStack): ProjectArchitecture {
    const projectName = description.split(' ').slice(0, 2).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    
    return {
      projectName,
      projectType: 'app',
      description,
      pages: [
        {
          name: 'HomePage',
          path: '/',
          description: 'Home page',
          components: ['Hero']
        }
      ],
      components: [
        {
          name: 'Hero',
          path: 'src/components/Hero.tsx',
          description: 'Hero component',
          props: []
        }
      ],
      services: [],
      routes: [],
      database: [],
      fileStructure: {
        frontend: {
          src: {
            pages: ['HomePage.tsx'],
            components: ['Hero.tsx'],
            styles: ['App.css']
          }
        }
      }
    };
  }
}

export const projectArchitectService = new ProjectArchitectService();
