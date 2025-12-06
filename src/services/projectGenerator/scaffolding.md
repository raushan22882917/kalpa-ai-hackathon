# Project Scaffolding Service

## Overview

The Project Scaffolding Service provides stack-specific project structure generation, package manager selection, dependency installation commands, and configuration file generation for the AI Project Generator.

## Features

### 1. Package Manager Selection

Automatically selects the appropriate package manager based on the technology stack:

- **Python stacks** (FastAPI, Django) → `pip`
- **Rust stacks** (Actix, Rocket) → `cargo`
- **JavaScript/TypeScript stacks** → `npm`, `yarn`, or `pnpm` (as specified in stack)

### 2. Installation Command Generation

Generates proper installation commands for dependencies:

```typescript
// Example: npm install react react-dom
generateInstallCommand(['react', 'react-dom'], stack, false)

// Example: pip install fastapi uvicorn
generateInstallCommand(['fastapi', 'uvicorn'], stack, false)

// Example: npm install -D typescript @types/node
generateInstallCommand(['typescript', '@types/node'], stack, true)
```

### 3. Project Structure Templates

Generates appropriate directory structures for each stack level:

**React Stack:**
- `src/`
- `src/components/`
- `src/styles/`
- `public/`

**Next.js Stack:**
- `src/app/`
- `src/components/`
- `src/lib/`
- `public/`

**Express Backend:**
- `server/`
- `server/routes/`
- `server/controllers/`
- `server/middleware/`

**NestJS Backend:**
- `src/modules/`
- `src/services/`
- `src/controllers/`
- `src/dto/`

**FastAPI Backend:**
- `app/`
- `app/routers/`
- `app/models/`
- `app/services/`

**Expo Mobile:**
- `app/`
- `components/`
- `constants/`
- `hooks/`

### 4. Configuration File Generation

Automatically generates stack-specific configuration files:

- **TypeScript:** `tsconfig.json`
- **Package.json:** For npm-based stacks
- **Vite:** `vite.config.ts` (React without Next.js)
- **Next.js:** `next.config.js`
- **Python:** `requirements.txt`
- **Environment:** `.env.example`
- **Linting:** `.eslintrc.json`, `.prettierrc`

### 5. Stack-Specific Best Practices

Provides curated best practices for each technology:

**React:**
- Use functional components with hooks
- Keep components small and focused
- Use TypeScript for type safety
- Implement proper error boundaries

**Next.js:**
- Use App Router for new projects
- Implement proper SEO with metadata
- Use Server Components where possible
- Optimize images with next/image

**Express:**
- Use middleware for cross-cutting concerns
- Implement proper error handling
- Use environment variables for configuration
- Add request validation

**NestJS:**
- Use dependency injection
- Organize code into modules
- Use DTOs for data validation
- Implement guards for authentication

**FastAPI:**
- Use Pydantic models for validation
- Implement async endpoints where possible
- Use dependency injection
- Add proper API documentation

**Supabase:**
- Use Row Level Security (RLS)
- Implement proper authentication
- Use real-time subscriptions efficiently
- Optimize database queries

**Expo:**
- Use Expo Router for navigation
- Implement proper error handling
- Optimize for different screen sizes
- Test on both iOS and Android

## Integration with Plan Creator

The scaffolding service is integrated with the Plan Creator Service to:

1. Generate proper installation commands using the correct package manager
2. Include directory structure creation in task lists
3. Add configuration file generation to setup tasks
4. Include best practices in task details

## Usage Example

```typescript
import projectScaffoldingService from './projectScaffoldingService';

// Get package manager for a stack
const packageManager = projectScaffoldingService.getPackageManager(stack);

// Generate install command
const installCmd = projectScaffoldingService.generateInstallCommand(
  ['react', 'react-dom'],
  stack,
  false
);

// Get project structure
const structure = projectScaffoldingService.getProjectStructure(stack);

// Get best practices
const practices = projectScaffoldingService.getStackBestPractices(stack);
```

## Testing

The service is thoroughly tested with property-based tests:

- **Property 16:** Package manager selection validates correct package manager for each stack type
- **Property 23:** Project type detection validates appropriate structure, configuration, and best practices for each stack

All tests use `fast-check` with 100 iterations to ensure correctness across all predefined stacks.
