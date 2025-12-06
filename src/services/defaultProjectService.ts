/**
 * Default Project Service
 * Handles creation of default projects when no workspace is detected
 */

export interface DefaultProjectConfig {
  name: string;
  description: string;
  files: Array<{
    path: string;
    content: string;
  }>;
}

class DefaultProjectService {
  /**
   * Get Downloads directory path
   */
  async getDownloadsDirectory(): Promise<string> {
    if (window.electron?.getDownloadsDirectory) {
      return await window.electron.getDownloadsDirectory();
    }
    
    // Browser fallback - use a default name
    // In browser, we'll use the virtual file system
    return 'Downloads';
  }

  /**
   * Create a default project structure
   */
  getDefaultProjectConfig(): DefaultProjectConfig {
    const projectName = `my-project-${new Date().getTime()}`;
    
    return {
      name: projectName,
      description: 'A new project created by VS Code AI Editor',
      files: [
        {
          path: 'README.md',
          content: `# ${projectName}\n\nWelcome to your new project!\n\n## Getting Started\n\nThis project was automatically created by VS Code AI Editor.\n\n## Features\n\n- Modern development environment\n- AI-powered code assistance\n- Integrated terminal\n- Live preview\n\n## Next Steps\n\n1. Start coding!\n2. Use AI commands (/\`/explain\`, /\`/fix\`, /\`/document\`) for assistance\n3. Open terminal to run commands\n\nHappy coding! 🚀\n`,
        },
        {
          path: '.gitignore',
          content: `# Dependencies\nnode_modules/\n\n# Build outputs\ndist/\nbuild/\n\n# Environment variables\n.env\n.env.local\n\n# IDE\n.vscode/\n.idea/\n\n# OS\n.DS_Store\nThumbs.db\n`,
        },
        {
          path: 'package.json',
          content: JSON.stringify({
            name: projectName,
            version: '1.0.0',
            description: 'A new project',
            main: 'index.js',
            scripts: {
              start: 'echo "Add your start script here"',
              dev: 'echo "Add your dev script here"',
            },
            keywords: [],
            author: '',
            license: 'MIT',
          }, null, 2),
        },
        {
          path: 'index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Welcome to ${projectName}</h1>
        <p>Your project is ready! Start building something amazing.</p>
    </div>
</body>
</html>`,
        },
        {
          path: 'index.js',
          content: `// Welcome to ${projectName}!\n\nconsole.log('Hello, World!');\nconsole.log('Your project is ready to go!');\n\n// Add your code here\n`,
        },
        {
          path: 'style.css',
          content: `/* Welcome to ${projectName} */\n\n* {\n    margin: 0;\n    padding: 0;\n    box-sizing: border-box;\n}\n\nbody {\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n    line-height: 1.6;\n    color: #333;\n}\n\n/* Add your styles here */\n`,
        },
      ],
    };
  }

  /**
   * Create default project in Downloads directory
   */
  async createDefaultProject(): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      const downloadsDir = await this.getDownloadsDirectory();
      const config = this.getDefaultProjectConfig();
      const projectPath = downloadsDir.includes('Downloads') 
        ? `${downloadsDir}/${config.name}`
        : `${downloadsDir}/Downloads/${config.name}`;

      // Create project directory
      if (window.electron?.fs?.createDir) {
        const createResult = await window.electron.fs.createDir(projectPath);
        if (!createResult.success) {
          return { success: false, error: createResult.error || 'Failed to create project directory' };
        }
      }

      // Create files
      if (window.electron?.fs?.writeFile) {
        for (const file of config.files) {
          const filePath = `${projectPath}/${file.path}`;
          const writeResult = await window.electron.fs.writeFile(filePath, file.content);
          if (!writeResult.success) {
            console.warn(`Failed to create file ${file.path}:`, writeResult.error);
          }
        }
      } else {
        // Browser mode - use virtual file system
        // Files will be created in the virtual file system
        return { success: true, path: config.name };
      }

      return { success: true, path: projectPath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create default project',
      };
    }
  }

  /**
   * Check if a workspace/project is already open
   */
  async hasWorkspace(): Promise<boolean> {
    // Check if workspace path is set
    if (window.electron) {
      // In Electron, check if we have a workspace
      return false; // Will be set by EditorShell
    }
    return false;
  }
}

export const defaultProjectService = new DefaultProjectService();

