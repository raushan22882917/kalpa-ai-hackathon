/**
 * Project Analysis Service
 * Analyzes project structure and detects project type, technologies, and structure
 */

import { FileSystemService } from './fileSystemService';

export interface ProjectFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  content?: string;
}

export interface ProjectAnalysis {
  isBlank: boolean;
  projectType?: string;
  technologies: string[];
  structure: {
    directories: string[];
    files: ProjectFile[];
    totalFiles: number;
    totalDirectories: number;
  };
  keyFiles: {
    packageJson?: ProjectFile;
    tsconfig?: ProjectFile;
    readme?: ProjectFile;
    gitignore?: ProjectFile;
    [key: string]: ProjectFile | undefined;
  };
  summary: string;
}

export class ProjectAnalysisService {
  private fileSystem: FileSystemService;
  private readonly ignoredDirs = ['node_modules', '.git', 'dist', 'build', '.next', '.vscode', '.idea', 'coverage', '.nyc_output'];
  private readonly ignoredFiles = ['.DS_Store', 'Thumbs.db'];

  constructor(fileSystem: FileSystemService) {
    this.fileSystem = fileSystem;
  }

  /**
   * Analyzes the entire project structure
   */
  async analyzeProject(rootPath: string = '/'): Promise<ProjectAnalysis> {
    try {
      const files = this.scanDirectory(rootPath);
      
      const isBlank = this.isProjectBlank(files);
      const projectType = this.detectProjectType(files);
      const technologies = this.detectTechnologies(files);
      const keyFiles = this.extractKeyFiles(files);
      
      const directories = files.filter(f => f.type === 'directory').map(f => f.path);
      const structure = {
        directories,
        files,
        totalFiles: files.filter(f => f.type === 'file').length,
        totalDirectories: directories.length
      };
      
      const summary = this.generateSummary({
        isBlank,
        projectType,
        technologies,
        structure,
        keyFiles,
      });

      return {
        isBlank,
        projectType,
        technologies,
        structure,
        keyFiles,
        summary,
      };
    } catch (error) {
      console.error('Error analyzing project:', error);
      return {
        isBlank: true,
        technologies: [],
        structure: {
          directories: [],
          files: [],
          totalFiles: 0,
          totalDirectories: 0,
        },
        keyFiles: {},
        summary: 'Error analyzing project. The project may be empty or inaccessible.',
      };
    }
  }

  /**
   * Recursively scans a directory and returns all files and directories
   */
  private scanDirectory(path: string, maxDepth: number = 10, currentDepth: number = 0): ProjectFile[] {
    if (currentDepth > maxDepth) {
      return [];
    }

    const items: ProjectFile[] = [];

    try {
      const entries = this.fileSystem.listDirectory(path);

      for (const entry of entries) {
        const entryPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`;
        
        // Skip ignored directories and files
        if (this.shouldIgnore(entry.name)) {
          continue;
        }

        const item: ProjectFile = {
          path: entryPath,
          name: entry.name,
          type: entry.type,
        };

        if (entry.type === 'file') {
          try {
            const content = this.fileSystem.readFile(entryPath);
            item.content = content;
            item.size = content.length;
          } catch (error) {
            // File might not be readable, continue without content
          }
        }

        items.push(item);

        // Recursively scan subdirectories
        if (entry.type === 'directory') {
          const subItems = this.scanDirectory(entryPath, maxDepth, currentDepth + 1);
          items.push(...subItems);
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
      console.warn(`Could not scan directory ${path}:`, error);
    }

    return items;
  }

  /**
   * Checks if a file or directory should be ignored
   */
  private shouldIgnore(name: string): boolean {
    if (this.ignoredFiles.includes(name)) {
      return true;
    }
    return this.ignoredDirs.some(dir => name === dir || name.startsWith(dir + '/'));
  }

  /**
   * Determines if the project is blank
   */
  private isProjectBlank(structure: ProjectFile[]): boolean {
    // Filter out common config files that might exist in empty projects
    const meaningfulFiles = structure.filter(file => {
      if (file.type === 'directory') return false;
      const name = file.name.toLowerCase();
      return !name.startsWith('.') && 
             name !== 'readme.md' && 
             name !== 'license' &&
             name !== 'package.json' &&
             name !== 'package-lock.json';
    });

    return meaningfulFiles.length === 0;
  }

  /**
   * Detects the project type based on files and structure
   */
  private detectProjectType(structure: ProjectFile[]): string | undefined {
    const fileNames = structure.map(f => f.name.toLowerCase());
    const paths = structure.map(f => f.path.toLowerCase());

    // Check for package.json
    if (fileNames.includes('package.json')) {
      try {
        const packageJsonFile = structure.find(f => f.name === 'package.json');
        if (packageJsonFile?.content) {
          try {
            const packageJson = JSON.parse(packageJsonFile.content);
            if (packageJson.dependencies?.['react'] || packageJson.dependencies?.['react-dom']) {
              if (fileNames.includes('next.config.js') || fileNames.includes('next.config.ts')) {
                return 'Next.js';
              }
              return 'React';
            }
            if (packageJson.dependencies?.['vue']) {
              return 'Vue.js';
            }
            if (fileNames.includes('angular.json')) {
              return 'Angular';
            }
            if (packageJson.dependencies?.['express']) {
              return 'Node.js/Express';
            }
            return 'Node.js';
          } catch (e) {
            // Invalid JSON, continue
          }
        }
      } catch (e) {
        // Error reading package.json
      }
    }

    // Check for Python
    if (fileNames.includes('requirements.txt') || fileNames.includes('setup.py') || fileNames.includes('pyproject.toml')) {
      if (fileNames.includes('manage.py')) {
        return 'Django';
      }
      if (paths.some(p => p.includes('fastapi') || p.includes('main.py'))) {
        return 'FastAPI';
      }
      return 'Python';
    }

    // Check for TypeScript
    if (fileNames.includes('tsconfig.json')) {
      return 'TypeScript';
    }

    // Check for Java
    if (fileNames.includes('pom.xml')) {
      return 'Java/Maven';
    }
    if (fileNames.includes('build.gradle')) {
      return 'Java/Gradle';
    }

    // Check for Rust
    if (fileNames.includes('cargo.toml')) {
      return 'Rust';
    }

    // Check for Go
    if (fileNames.includes('go.mod')) {
      return 'Go';
    }

    return undefined;
  }

  /**
   * Detects technologies used in the project
   */
  private detectTechnologies(structure: ProjectFile[]): string[] {
    const technologies: string[] = [];
    const fileNames = structure.map(f => f.name.toLowerCase());

    // Frontend frameworks
    if (fileNames.includes('package.json')) {
      try {
        const packageJsonFile = structure.find(f => f.name === 'package.json');
        if (packageJsonFile?.content) {
          try {
            const packageJson = JSON.parse(packageJsonFile.content);
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            if (deps['react'] || deps['react-dom']) technologies.push('React');
            if (deps['vue']) technologies.push('Vue.js');
            if (deps['@angular/core']) technologies.push('Angular');
            if (deps['next']) technologies.push('Next.js');
            if (deps['express']) technologies.push('Express');
            if (deps['typescript']) technologies.push('TypeScript');
            if (deps['tailwindcss']) technologies.push('Tailwind CSS');
            if (deps['@mui/material']) technologies.push('Material-UI');
            if (deps['styled-components']) technologies.push('Styled Components');
          } catch (e) {
            // Invalid JSON
          }
        }
      } catch (e) {
        // Error reading
      }
    }

    // Build tools
    if (fileNames.includes('vite.config.js') || fileNames.includes('vite.config.ts')) {
      technologies.push('Vite');
    }
    if (fileNames.includes('webpack.config.js')) {
      technologies.push('Webpack');
    }

    // Testing
    if (fileNames.includes('jest.config.js') || fileNames.some(f => f.includes('jest'))) {
      technologies.push('Jest');
    }
    if (fileNames.includes('vitest.config.ts') || fileNames.includes('vitest.config.js')) {
      technologies.push('Vitest');
    }

    // TypeScript
    if (fileNames.includes('tsconfig.json')) {
      technologies.push('TypeScript');
    }

    // Python
    if (fileNames.includes('requirements.txt') || fileNames.includes('pyproject.toml')) {
      technologies.push('Python');
    }

    return [...new Set(technologies)]; // Remove duplicates
  }

  /**
   * Extracts key files from the project structure
   */
  private extractKeyFiles(structure: ProjectFile[]): ProjectAnalysis['keyFiles'] {
    const keyFiles: ProjectAnalysis['keyFiles'] = {};

    for (const file of structure) {
      if (file.type === 'file') {
        const name = file.name.toLowerCase();
        if (name === 'package.json') {
          keyFiles.packageJson = file;
        } else if (name === 'tsconfig.json' || name === 'tsconfig.node.json') {
          keyFiles.tsconfig = file;
        } else if (name === 'readme.md' || name === 'readme') {
          keyFiles.readme = file;
        } else if (name === '.gitignore') {
          keyFiles.gitignore = file;
        }
      }
    }

    return keyFiles;
  }

  /**
   * Generates a human-readable summary of the project
   */
  private generateSummary(analysis: Omit<ProjectAnalysis, 'summary'>): string {
    if (analysis.isBlank) {
      return 'This project appears to be empty or contains only configuration files.';
    }

    const parts: string[] = [];

    if (analysis.projectType) {
      parts.push(`Project Type: ${analysis.projectType}`);
    }

    if (analysis.technologies.length > 0) {
      parts.push(`Technologies: ${analysis.technologies.join(', ')}`);
    }

    parts.push(`Structure: ${analysis.structure.totalDirectories} directories, ${analysis.structure.totalFiles} files`);

    return parts.join('\n');
  }
}

