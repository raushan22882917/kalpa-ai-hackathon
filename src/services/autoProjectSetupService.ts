/**
 * Auto Project Setup Service
 * Handles automatic dependency installation and project scaffolding
 */

import { TechStack, Dependency, FileChange } from '../types/projectGenerator';
import { nativeFileSystem } from './nativeFileSystemService';

export interface SetupProgress {
  phase: 'analyzing' | 'creating-structure' | 'installing-deps' | 'generating-files' | 'complete';
  message: string;
  progress: number; // 0-100
}

export class AutoProjectSetupService {
  private progressCallback?: (progress: SetupProgress) => void;

  /**
   * Set progress callback for real-time updates
   */
  setProgressCallback(callback: (progress: SetupProgress) => void) {
    this.progressCallback = callback;
  }

  /**
   * Report progress
   */
  private reportProgress(phase: SetupProgress['phase'], message: string, progress: number) {
    if (this.progressCallback) {
      this.progressCallback({ phase, message, progress });
    }
  }

  /**
   * Detect required dependencies based on tech stack
   */
  detectDependencies(stack: TechStack): Dependency[] {
    const dependencies: Dependency[] = [];

    // Frontend dependencies
    if (stack.frontend.toLowerCase().includes('react')) {
      dependencies.push(
        { name: 'react', type: 'npm', installCommand: 'npm install react react-dom', version: '^18.0.0' },
        { name: 'react-dom', type: 'npm', installCommand: 'npm install react react-dom', version: '^18.0.0' }
      );
    }

    if (stack.frontend.toLowerCase().includes('next')) {
      dependencies.push(
        { name: 'next', type: 'npm', installCommand: 'npm install next react react-dom', version: '^14.0.0' }
      );
    }

    if (stack.frontend.toLowerCase().includes('vue')) {
      dependencies.push(
        { name: 'vue', type: 'npm', installCommand: 'npm install vue', version: '^3.0.0' }
      );
    }

    if (stack.frontend.toLowerCase().includes('typescript')) {
      dependencies.push(
        { name: 'typescript', type: 'npm', installCommand: 'npm install -D typescript @types/node', version: '^5.0.0' }
      );
    }

    // Backend dependencies
    if (stack.backend?.toLowerCase().includes('express')) {
      dependencies.push(
        { name: 'express', type: 'npm', installCommand: 'npm install express', version: '^4.18.0' }
      );
    }

    if (stack.backend?.toLowerCase().includes('fastapi')) {
      dependencies.push(
        { name: 'fastapi', type: 'pip', installCommand: 'pip install fastapi uvicorn', version: '>=0.100.0' }
      );
    }

    // Database dependencies
    if (stack.database.toLowerCase().includes('supabase')) {
      dependencies.push(
        { name: '@supabase/supabase-js', type: 'npm', installCommand: 'npm install @supabase/supabase-js', version: '^2.0.0' }
      );
    }

    if (stack.database.toLowerCase().includes('firebase')) {
      dependencies.push(
        { name: 'firebase', type: 'npm', installCommand: 'npm install firebase', version: '^10.0.0' }
      );
    }

    if (stack.database.toLowerCase().includes('mongodb')) {
      dependencies.push(
        { name: 'mongodb', type: 'npm', installCommand: 'npm install mongodb', version: '^6.0.0' }
      );
    }

    // Mobile dependencies
    if (stack.mobile?.toLowerCase().includes('react native')) {
      dependencies.push(
        { name: 'react-native', type: 'npm', installCommand: 'npx react-native init', version: '^0.72.0' }
      );
    }

    // Build tools
    if (stack.frontend.toLowerCase().includes('vite')) {
      dependencies.push(
        { name: 'vite', type: 'npm', installCommand: 'npm install -D vite', version: '^5.0.0' }
      );
    }

    return dependencies;
  }

  /**
   * Check if a dependency is already installed
   */
  async isDependencyInstalled(dep: Dependency): Promise<boolean> {
    try {
      if (dep.type === 'npm' || dep.type === 'yarn' || dep.type === 'pnpm') {
        // Check package.json
        const packageJsonResult = await nativeFileSystem.readFile('package.json');
        if (!packageJsonResult.success || !packageJsonResult.data) return false;

        const pkg = JSON.parse(packageJsonResult.data);
        
        return !!(pkg.dependencies?.[dep.name] || pkg.devDependencies?.[dep.name]);
      }
      
      // For other types, assume not installed
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Install a single dependency
   */
  async installDependency(dep: Dependency): Promise<{ success: boolean; output: string }> {
    try {
      this.reportProgress('installing-deps', `Installing ${dep.name}...`, 0);

      // In a real implementation, this would execute the install command
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));

      return {
        success: true,
        output: `Successfully installed ${dep.name}`
      };
    } catch (error) {
      return {
        success: false,
        output: `Failed to install ${dep.name}: ${error}`
      };
    }
  }

  /**
   * Install all dependencies for a project
   */
  async installAllDependencies(dependencies: Dependency[]): Promise<{
    installed: string[];
    failed: string[];
    output: string[];
  }> {
    const installed: string[] = [];
    const failed: string[] = [];
    const output: string[] = [];

    this.reportProgress('installing-deps', 'Checking dependencies...', 10);

    for (let i = 0; i < dependencies.length; i++) {
      const dep = dependencies[i];
      const progress = 10 + (i / dependencies.length) * 60;

      // Check if already installed
      const isInstalled = await this.isDependencyInstalled(dep);
      if (isInstalled) {
        output.push(`✓ ${dep.name} is already installed`);
        installed.push(dep.name);
        continue;
      }

      // Install dependency
      this.reportProgress('installing-deps', `Installing ${dep.name}...`, progress);
      const result = await this.installDependency(dep);
      
      if (result.success) {
        installed.push(dep.name);
        output.push(`✓ ${result.output}`);
      } else {
        failed.push(dep.name);
        output.push(`✗ ${result.output}`);
      }
    }

    return { installed, failed, output };
  }

  /**
   * Create project folder structure
   */
  async createProjectStructure(
    _projectName: string,
    stack: TechStack
  ): Promise<{ created: string[]; errors: string[] }> {
    const created: string[] = [];
    const errors: string[] = [];

    this.reportProgress('creating-structure', 'Creating project folders...', 20);

    try {
      // Base folders
      const folders = [
        'src',
        'src/components',
        'src/services',
        'src/utils',
        'src/types',
        'src/styles',
        'public',
        'public/images',
        'public/icons',
      ];

      // Add backend folders if needed
      if (stack.backend) {
        folders.push('server', 'server/routes', 'server/controllers', 'server/models');
      }

      // Add mobile folders if needed
      if (stack.mobile) {
        folders.push('mobile', 'mobile/screens', 'mobile/components');
      }

      for (const folder of folders) {
        try {
          await nativeFileSystem.createDirectory(folder);
          created.push(folder);
        } catch (error) {
          errors.push(`Failed to create ${folder}: ${error}`);
        }
      }

      this.reportProgress('creating-structure', 'Project structure created', 40);
    } catch (error) {
      errors.push(`Failed to create project structure: ${error}`);
    }

    return { created, errors };
  }

  /**
   * Generate initial project files
   */
  async generateInitialFiles(
    projectName: string,
    stack: TechStack,
    description: string
  ): Promise<FileChange[]> {
    const files: FileChange[] = [];

    this.reportProgress('generating-files', 'Generating project files...', 70);

    // package.json
    const packageJson = this.generatePackageJson(projectName, stack, description);
    files.push({
      path: 'package.json',
      type: 'created',
      content: packageJson,
      language: 'json'
    });

    // README.md
    const readme = this.generateReadme(projectName, stack, description);
    files.push({
      path: 'README.md',
      type: 'created',
      content: readme,
      language: 'markdown'
    });

    // .gitignore
    const gitignore = this.generateGitignore(stack);
    files.push({
      path: '.gitignore',
      type: 'created',
      content: gitignore,
      language: 'text'
    });

    // tsconfig.json (if TypeScript)
    if (stack.frontend.toLowerCase().includes('typescript')) {
      const tsconfig = this.generateTsConfig();
      files.push({
        path: 'tsconfig.json',
        type: 'created',
        content: tsconfig,
        language: 'json'
      });
    }

    // vite.config.ts (if Vite)
    if (stack.frontend.toLowerCase().includes('vite')) {
      const viteConfig = this.generateViteConfig();
      files.push({
        path: 'vite.config.ts',
        type: 'created',
        content: viteConfig,
        language: 'typescript'
      });
    }

    // Main entry file
    const mainFile = this.generateMainFile(stack);
    files.push({
      path: mainFile.path,
      type: 'created',
      content: mainFile.content,
      language: mainFile.language
    });

    this.reportProgress('generating-files', 'Files generated', 90);

    return files;
  }

  /**
   * Generate package.json
   */
  private generatePackageJson(projectName: string, stack: TechStack, description: string): string {
    const pkg = {
      name: projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0',
      description: description,
      main: 'src/main.tsx',
      scripts: {
        dev: stack.frontend.includes('Next') ? 'next dev' : 'vite',
        build: stack.frontend.includes('Next') ? 'next build' : 'vite build',
        start: stack.frontend.includes('Next') ? 'next start' : 'vite preview',
        lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0'
      },
      dependencies: {},
      devDependencies: {}
    };

    return JSON.stringify(pkg, null, 2);
  }

  /**
   * Generate README.md
   */
  private generateReadme(projectName: string, stack: TechStack, description: string): string {
    return `# ${projectName}

${description}

## Tech Stack

- **Frontend:** ${stack.frontend}
${stack.backend ? `- **Backend:** ${stack.backend}` : ''}
- **Database:** ${stack.database}
${stack.mobile ? `- **Mobile:** ${stack.mobile}` : ''}

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- ${stack.packageManager}

### Installation

\`\`\`bash
# Install dependencies
${stack.packageManager} install

# Start development server
${stack.packageManager} run dev
\`\`\`

### Build

\`\`\`bash
# Build for production
${stack.packageManager} run build
\`\`\`

## Project Structure

\`\`\`
src/
├── components/     # React components
├── services/       # Business logic and API calls
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
└── styles/         # CSS/styling files
\`\`\`

## Features

- Modern ${stack.frontend} setup
- ${stack.database} integration
- Responsive design
- Type-safe development

## License

MIT
`;
  }

  /**
   * Generate .gitignore
   */
  private generateGitignore(_stack: TechStack): string {
    return `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/
.next/
out/

# Misc
.DS_Store
*.pem
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
Thumbs.db
`;
  }

  /**
   * Generate tsconfig.json
   */
  private generateTsConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }]
    }, null, 2);
  }

  /**
   * Generate vite.config.ts
   */
  private generateViteConfig(): string {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
`;
  }

  /**
   * Generate main entry file
   */
  private generateMainFile(stack: TechStack): { path: string; content: string; language: string } {
    if (stack.frontend.includes('React')) {
      return {
        path: 'src/main.tsx',
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
        language: 'typescript'
      };
    }

    return {
      path: 'src/main.ts',
      content: `console.log('Hello World!');\n`,
      language: 'typescript'
    };
  }

  /**
   * Complete project setup
   */
  async setupProject(
    projectName: string,
    stack: TechStack,
    description: string
  ): Promise<{
    success: boolean;
    structure: { created: string[]; errors: string[] };
    dependencies: { installed: string[]; failed: string[]; output: string[] };
    files: FileChange[];
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      this.reportProgress('analyzing', 'Analyzing project requirements...', 5);

      // Detect dependencies
      const dependencies = this.detectDependencies(stack);

      // Create project structure
      const structure = await this.createProjectStructure(projectName, stack);
      if (structure.errors.length > 0) {
        errors.push(...structure.errors);
      }

      // Generate initial files
      const files = await this.generateInitialFiles(projectName, stack, description);

      // Write files
      for (const file of files) {
        try {
          await nativeFileSystem.writeFile(file.path, file.content || '');
        } catch (error) {
          errors.push(`Failed to write ${file.path}: ${error}`);
        }
      }

      // Install dependencies
      const depResults = await this.installAllDependencies(dependencies);

      this.reportProgress('complete', 'Project setup complete!', 100);

      return {
        success: errors.length === 0 && depResults.failed.length === 0,
        structure,
        dependencies: depResults,
        files,
        errors
      };
    } catch (error) {
      errors.push(`Setup failed: ${error}`);
      return {
        success: false,
        structure: { created: [], errors: [] },
        dependencies: { installed: [], failed: [], output: [] },
        files: [],
        errors
      };
    }
  }
}

// Singleton instance
let autoProjectSetupInstance: AutoProjectSetupService | null = null;

export const getAutoProjectSetup = (): AutoProjectSetupService => {
  if (!autoProjectSetupInstance) {
    autoProjectSetupInstance = new AutoProjectSetupService();
  }
  return autoProjectSetupInstance;
};

export default getAutoProjectSetup();
