import type { TechStack } from '../types/projectGenerator';

/**
 * Project Scaffolding Service
 * 
 * Handles stack-specific project structure generation, package manager selection,
 * dependency installation commands, and configuration file generation.
 */
class ProjectScaffoldingService {
  /**
   * Get the appropriate package manager for a given stack
   */
  getPackageManager(stack: TechStack): 'npm' | 'yarn' | 'pnpm' | 'pip' | 'cargo' {
    // Python stacks use pip
    if (stack.backend?.includes('FastAPI') || stack.backend?.includes('Django')) {
      return 'pip';
    }
    
    // Rust stacks use cargo (if we add them in the future)
    if (stack.backend?.includes('Actix') || stack.backend?.includes('Rocket')) {
      return 'cargo';
    }
    
    // Default to the stack's specified package manager (npm, yarn, pnpm)
    return stack.packageManager;
  }

  /**
   * Generate installation command for dependencies based on stack
   */
  generateInstallCommand(
    dependencies: string[],
    stack: TechStack,
    isDev: boolean = false
  ): string {
    const packageManager = this.getPackageManager(stack);
    
    if (packageManager === 'pip') {
      const devFlag = isDev ? '--dev' : '';
      return `pip install ${devFlag} ${dependencies.join(' ')}`;
    }
    
    if (packageManager === 'cargo') {
      return `cargo add ${dependencies.join(' ')}`;
    }
    
    // npm, yarn, pnpm
    const devFlag = isDev ? '-D' : '';
    const installCmd = packageManager === 'npm' ? 'install' : 'add';
    
    return `${packageManager} ${installCmd} ${devFlag} ${dependencies.join(' ')}`;
  }

  /**
   * Get project structure template for a stack level
   */
  getProjectStructure(stack: TechStack): ProjectStructure {
    const structure: ProjectStructure = {
      directories: [],
      files: [],
    };

    // Common frontend directories
    if (stack.frontend.includes('React') || stack.frontend.includes('Next.js')) {
      structure.directories.push('src', 'src/components', 'src/styles', 'public');
      
      if (stack.frontend.includes('Next.js')) {
        structure.directories.push('src/app', 'src/lib');
      }
    }

    // Backend directories
    if (stack.backend?.includes('Express')) {
      structure.directories.push('server', 'server/routes', 'server/controllers', 'server/middleware');
    }

    if (stack.backend?.includes('NestJS')) {
      structure.directories.push('src/modules', 'src/services', 'src/controllers', 'src/dto');
    }

    if (stack.backend?.includes('FastAPI')) {
      structure.directories.push('app', 'app/routers', 'app/models', 'app/services');
    }

    // Mobile directories
    if (stack.mobile?.includes('Expo')) {
      structure.directories.push('app', 'components', 'constants', 'hooks');
    }

    // Configuration files
    structure.files = this.getConfigurationFiles(stack);

    return structure;
  }

  /**
   * Get configuration files needed for a stack
   */
  getConfigurationFiles(stack: TechStack): ConfigFile[] {
    const files: ConfigFile[] = [];

    // TypeScript configuration
    if (this.usesTypeScript(stack)) {
      files.push({
        name: 'tsconfig.json',
        content: this.generateTsConfig(stack),
      });
    }

    // Package.json for npm-based stacks
    if (stack.packageManager !== 'pip' && stack.packageManager !== 'cargo') {
      files.push({
        name: 'package.json',
        content: this.generatePackageJson(stack),
      });
    }

    // Vite config for React projects
    if (stack.frontend.includes('React') && !stack.frontend.includes('Next.js')) {
      files.push({
        name: 'vite.config.ts',
        content: this.generateViteConfig(stack),
      });
    }

    // Next.js config
    if (stack.frontend.includes('Next.js')) {
      files.push({
        name: 'next.config.js',
        content: this.generateNextConfig(stack),
      });
    }

    // Python requirements.txt
    if (stack.backend?.includes('FastAPI')) {
      files.push({
        name: 'requirements.txt',
        content: this.generateRequirementsTxt(stack),
      });
    }

    // Environment variables template
    files.push({
      name: '.env.example',
      content: this.generateEnvExample(stack),
    });

    // ESLint config for JavaScript/TypeScript
    if (this.usesTypeScript(stack) || this.usesJavaScript(stack)) {
      files.push({
        name: '.eslintrc.json',
        content: this.generateEslintConfig(stack),
      });
    }

    // Prettier config
    if (this.usesTypeScript(stack) || this.usesJavaScript(stack)) {
      files.push({
        name: '.prettierrc',
        content: this.generatePrettierConfig(),
      });
    }

    return files;
  }

  /**
   * Get stack-specific best practices
   */
  getStackBestPractices(stack: TechStack): string[] {
    const practices: string[] = [];

    // React best practices
    if (stack.frontend.includes('React')) {
      practices.push(
        'Use functional components with hooks',
        'Keep components small and focused',
        'Use TypeScript for type safety',
        'Implement proper error boundaries'
      );
    }

    // Next.js best practices
    if (stack.frontend.includes('Next.js')) {
      practices.push(
        'Use App Router for new projects',
        'Implement proper SEO with metadata',
        'Use Server Components where possible',
        'Optimize images with next/image'
      );
    }

    // Express best practices
    if (stack.backend?.includes('Express')) {
      practices.push(
        'Use middleware for cross-cutting concerns',
        'Implement proper error handling',
        'Use environment variables for configuration',
        'Add request validation'
      );
    }

    // NestJS best practices
    if (stack.backend?.includes('NestJS')) {
      practices.push(
        'Use dependency injection',
        'Organize code into modules',
        'Use DTOs for data validation',
        'Implement guards for authentication'
      );
    }

    // FastAPI best practices
    if (stack.backend?.includes('FastAPI')) {
      practices.push(
        'Use Pydantic models for validation',
        'Implement async endpoints where possible',
        'Use dependency injection',
        'Add proper API documentation'
      );
    }

    // Supabase best practices
    if (stack.database.includes('Supabase')) {
      practices.push(
        'Use Row Level Security (RLS)',
        'Implement proper authentication',
        'Use real-time subscriptions efficiently',
        'Optimize database queries'
      );
    }

    // Mobile best practices
    if (stack.mobile?.includes('Expo')) {
      practices.push(
        'Use Expo Router for navigation',
        'Implement proper error handling',
        'Optimize for different screen sizes',
        'Test on both iOS and Android'
      );
    }

    return practices;
  }

  // Private helper methods

  private usesTypeScript(stack: TechStack): boolean {
    return (
      stack.frontend.includes('React') ||
      stack.frontend.includes('Next.js') ||
      !!stack.backend?.includes('NestJS') ||
      !!stack.mobile?.includes('Expo')
    );
  }

  private usesJavaScript(stack: TechStack): boolean {
    return (
      !!stack.backend?.includes('Express') ||
      !!stack.backend?.includes('Node')
    );
  }

  private generateTsConfig(stack: TechStack): string {
    const config: any = {
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
    };

    // Next.js specific config
    if (stack.frontend.includes('Next.js')) {
      config.compilerOptions.jsx = 'preserve';
      config.compilerOptions.plugins = [{ name: 'next' }];
      config.compilerOptions.paths = {
        '@/*': ['./src/*'],
      };
      config.include = ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'];
      config.exclude = ['node_modules'];
    }

    return JSON.stringify(config, null, 2);
  }

  private generatePackageJson(stack: TechStack): string {
    const pkg: any = {
      name: 'project',
      version: '0.1.0',
      private: true,
      scripts: {},
      dependencies: {},
      devDependencies: {},
    };

    // Add scripts based on stack
    if (stack.frontend.includes('Next.js')) {
      pkg.scripts = {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      };
    } else if (stack.frontend.includes('React')) {
      pkg.scripts = {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
        lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
      };
    }

    if (stack.mobile?.includes('Expo')) {
      pkg.scripts = {
        start: 'expo start',
        android: 'expo start --android',
        ios: 'expo start --ios',
        web: 'expo start --web',
      };
    }

    return JSON.stringify(pkg, null, 2);
  }

  private generateViteConfig(_stack: TechStack): string {
    return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
})
`;
  }

  private generateNextConfig(_stack: TechStack): string {
    return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
`;
  }

  private generateRequirementsTxt(stack: TechStack): string {
    const requirements = ['fastapi>=0.100.0', 'uvicorn[standard]>=0.23.0'];
    
    if (stack.database.includes('Supabase')) {
      requirements.push('supabase>=1.0.0');
    }

    return requirements.join('\n');
  }

  private generateEnvExample(stack: TechStack): string {
    const vars: string[] = [];

    if (stack.database.includes('Supabase')) {
      vars.push('SUPABASE_URL=your-supabase-url');
      vars.push('SUPABASE_ANON_KEY=your-supabase-anon-key');
    }

    if (stack.backend?.includes('FastAPI')) {
      vars.push('DATABASE_URL=postgresql://user:password@localhost:5432/dbname');
    }

    vars.push('NODE_ENV=development');

    return vars.join('\n');
  }

  private generateEslintConfig(stack: TechStack): string {
    const config: any = {
      extends: ['eslint:recommended'],
      env: {
        browser: true,
        es2020: true,
        node: true,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: {},
    };

    if (this.usesTypeScript(stack)) {
      config.extends.push('plugin:@typescript-eslint/recommended');
      config.parser = '@typescript-eslint/parser';
    }

    if (stack.frontend.includes('React')) {
      config.extends.push('plugin:react/recommended', 'plugin:react-hooks/recommended');
      config.settings = {
        react: {
          version: 'detect',
        },
      };
    }

    return JSON.stringify(config, null, 2);
  }

  private generatePrettierConfig(): string {
    return JSON.stringify(
      {
        semi: true,
        trailingComma: 'es5',
        singleQuote: true,
        printWidth: 100,
        tabWidth: 2,
      },
      null,
      2
    );
  }
}

export interface ProjectStructure {
  directories: string[];
  files: ConfigFile[];
}

export interface ConfigFile {
  name: string;
  content: string;
}

export default new ProjectScaffoldingService();
