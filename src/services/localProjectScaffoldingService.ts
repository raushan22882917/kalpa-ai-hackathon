/**
 * Local Project Scaffolding Service
 * Creates real projects on user's local disk using File System Access API
 */

export interface ProjectScaffoldConfig {
  projectName: string;
  description: string;
  techStack: {
    frontend: string;
    backend?: string;
    database: string;
    mobile?: string;
  };
  theme?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface ScaffoldResult {
  success: boolean;
  projectPath?: string;
  filesCreated?: string[];
  error?: string;
}

class LocalProjectScaffoldingService {
  /**
   * Create a new project on local disk (in Downloads folder)
   */
  async createProject(config: ProjectScaffoldConfig): Promise<ScaffoldResult> {
    try {
      // Try to get Downloads directory handle
      const parentDir = await this.getDownloadsDirectory();
      if (!parentDir) {
        return { success: false, error: 'Could not access Downloads directory' };
      }

      // Create project directory
      const projectDir = await this.createDirectory(parentDir, config.projectName);
      if (!projectDir) {
        return { success: false, error: 'Failed to create project directory' };
      }

      const filesCreated: string[] = [];

      // Generate project files based on tech stack
      const files = this.generateProjectFiles(config);

      // Create each file
      for (const file of files) {
        const success = await this.createFile(projectDir, file.path, file.content);
        if (success) {
          filesCreated.push(file.path);
        }
      }

      // Get the full path for display
      const downloadsPath = await this.getDownloadsPath();
      const fullPath = `${downloadsPath}/${config.projectName}`;

      return {
        success: true,
        projectPath: fullPath,
        filesCreated,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      };
    }
  }

  /**
   * Get Downloads directory handle
   */
  private async getDownloadsDirectory(): Promise<FileSystemDirectoryHandle | null> {
    try {
      if ('showDirectoryPicker' in window) {
        // Request access to Downloads folder
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'downloads', // Start in Downloads folder
        });
        return dirHandle;
      }
      return null;
    } catch (error) {
      console.error('Failed to access Downloads directory:', error);
      return null;
    }
  }

  /**
   * Get Downloads path for display
   */
  private async getDownloadsPath(): Promise<string> {
    // Detect OS and return appropriate Downloads path
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('mac')) {
      return '/Users/' + (await this.getUsername()) + '/Downloads';
    } else if (userAgent.includes('win')) {
      return 'C:\\Users\\' + (await this.getUsername()) + '\\Downloads';
    } else {
      // Linux
      return '/home/' + (await this.getUsername()) + '/Downloads';
    }
  }

  /**
   * Get current username (best effort)
   */
  private async getUsername(): Promise<string> {
    // Try to get from environment or use generic
    return 'user';
  }



  /**
   * Create a directory
   */
  private async createDirectory(
    parentHandle: FileSystemDirectoryHandle,
    name: string
  ): Promise<FileSystemDirectoryHandle | null> {
    try {
      return await parentHandle.getDirectoryHandle(name, { create: true });
    } catch (error) {
      console.error('Failed to create directory:', error);
      return null;
    }
  }

  /**
   * Create a file with content
   */
  private async createFile(
    dirHandle: FileSystemDirectoryHandle,
    path: string,
    content: string
  ): Promise<boolean> {
    try {
      const pathParts = path.split('/');
      let currentDir = dirHandle;

      // Navigate/create nested directories
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentDir = await currentDir.getDirectoryHandle(pathParts[i], { create: true });
      }

      // Create the file
      const fileName = pathParts[pathParts.length - 1];
      const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      return true;
    } catch (error) {
      console.error(`Failed to create file ${path}:`, error);
      return false;
    }
  }

  /**
   * Generate project files based on configuration
   */
  private generateProjectFiles(config: ProjectScaffoldConfig): Array<{ path: string; content: string }> {
    const files: Array<{ path: string; content: string }> = [];

    // README.md
    files.push({
      path: 'README.md',
      content: this.generateReadme(config),
    });

    // package.json
    if (config.techStack.frontend.includes('React') || config.techStack.frontend.includes('Vue')) {
      files.push({
        path: 'package.json',
        content: this.generatePackageJson(config),
      });
    }

    // index.html
    files.push({
      path: 'index.html',
      content: this.generateIndexHtml(config),
    });

    // Main app file
    if (config.techStack.frontend.includes('React')) {
      files.push({
        path: 'src/App.tsx',
        content: this.generateReactApp(config),
      });
      files.push({
        path: 'src/main.tsx',
        content: this.generateReactMain(),
      });
    }

    // CSS file
    files.push({
      path: 'src/index.css',
      content: this.generateCSS(config),
    });

    // .gitignore
    files.push({
      path: '.gitignore',
      content: this.generateGitignore(),
    });

    // vite.config.ts (if using Vite)
    if (config.techStack.frontend.includes('Vite')) {
      files.push({
        path: 'vite.config.ts',
        content: this.generateViteConfig(),
      });
    }

    // tsconfig.json
    files.push({
      path: 'tsconfig.json',
      content: this.generateTsConfig(),
    });

    return files;
  }

  private generateReadme(config: ProjectScaffoldConfig): string {
    return `# ${config.projectName}

${config.description}

## Tech Stack

- **Frontend:** ${config.techStack.frontend}
${config.techStack.backend ? `- **Backend:** ${config.techStack.backend}` : ''}
- **Database:** ${config.techStack.database}
${config.techStack.mobile ? `- **Mobile:** ${config.techStack.mobile}` : ''}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- Modern UI with ${config.theme ? 'custom color theme' : 'default styling'}
- Responsive design
- TypeScript support
- Hot module replacement

## Development

\`\`\`bash
npm run dev    # Start development server
npm run build  # Build for production
npm run preview # Preview production build
\`\`\`

---

Created with AI Project Generator
`;
  }

  private generatePackageJson(config: ProjectScaffoldConfig): string {
    const isReact = config.techStack.frontend.includes('React');
    return JSON.stringify({
      name: config.projectName,
      private: true,
      version: '0.0.1',
      type: 'module',
      description: config.description,
      scripts: {
        dev: 'vite',
        build: isReact ? 'tsc && vite build' : 'vite build',
        preview: 'vite preview',
      },
      dependencies: isReact ? {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      } : {
        vue: '^3.3.0',
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.0.0',
        typescript: '^5.0.0',
        vite: '^4.4.0',
      },
    }, null, 2);
  }

  private generateIndexHtml(config: ProjectScaffoldConfig): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  }

  private generateReactApp(config: ProjectScaffoldConfig): string {
    return `import { useState } from 'react'
import './index.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <header className="app-header">
        <h1>${config.projectName}</h1>
        <p>${config.description}</p>
      </header>
      
      <main className="app-main">
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>Built with ${config.techStack.frontend}</p>
      </footer>
    </div>
  )
}

export default App
`;
  }

  private generateReactMain(): string {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
  }

  private generateCSS(config: ProjectScaffoldConfig): string {
    const primary = config.theme?.primary || '#3B82F6';
    const secondary = config.theme?.secondary || '#1E40AF';
    const accent = config.theme?.accent || '#60A5FA';

    return `:root {
  --primary-color: ${primary};
  --secondary-color: ${secondary};
  --accent-color: ${accent};
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
}

.app-header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  color: var(--primary-color);
}

.app-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  text-align: center;
}

button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

button:hover {
  background: var(--secondary-color);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.app-footer {
  padding: 1rem;
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  color: white;
}

code {
  background: #f4f4f4;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
}
`;
  }

  private generateGitignore(): string {
    return `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`;
  }

  private generateViteConfig(): string {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
})
`;
  }

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
        noFallthroughCasesInSwitch: true,
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }],
    }, null, 2);
  }
}

export const localProjectScaffoldingService = new LocalProjectScaffoldingService();
