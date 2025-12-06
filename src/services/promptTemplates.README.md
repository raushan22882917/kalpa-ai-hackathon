# AI Prompt Templates Service

## Overview

The Prompt Templates Service provides structured, context-rich prompt templates for all AI interactions in the project generator. This ensures consistent, high-quality AI responses that are aware of the selected technology stack and color theme.

## Features

### 1. Requirements Generation Prompts
- Includes EARS (Easy Approach to Requirements Syntax) patterns
- Enforces INCOSE quality rules
- Integrates stack and theme context
- Provides stack-specific guidance

### 2. Design Generation Prompts
- Comprehensive design document structure
- Stack-specific architectural patterns
- Theme application guidelines
- Component and data model templates

### 3. Task Generation Prompts
- Actionable task list structure
- Stack-specific commands and setup
- Theme integration in UI tasks
- Proper task sequencing and dependencies

### 4. Task Execution Prompts
- Full project context
- Completed tasks history
- Theme color enforcement
- File operation markers (CREATE FILE, MODIFY FILE, RUN COMMAND)

### 5. Image Generation Prompts
- Logo generation with theme colors
- Hero image generation
- Icon generation
- Color palette integration

## Usage

### Requirements Generation

```typescript
import promptTemplates from './promptTemplates';

const prompt = promptTemplates.generateRequirementsPrompt({
  description: 'A todo list application',
  stack: selectedStack,
  theme: selectedTheme,
  conversationHistory: previousMessages,
});

// Use prompt with AI service
const response = await aiService.processRequest({
  command: 'complete',
  code: prompt,
  language: 'markdown',
});
```

### Design Generation

```typescript
const prompt = promptTemplates.generateDesignPrompt({
  requirements: requirementsDoc,
  stack: selectedStack,
  theme: selectedTheme,
});
```

### Task Generation

```typescript
const prompt = promptTemplates.generateTasksPrompt({
  design: designDoc,
  requirements: requirementsDoc,
  stack: selectedStack,
  theme: selectedTheme,
});
```

### Task Execution

```typescript
const prompt = promptTemplates.generateTaskExecutionPrompt({
  task: currentTask,
  session: projectSession,
  completedTasks: previouslyCompletedTasks,
  conversationHistory: recentMessages,
});
```

### Image Generation

```typescript
const logoPrompt = promptTemplates.generateImagePrompt({
  projectName: 'My App',
  description: 'A productivity application',
  theme: selectedTheme,
  imageType: 'logo',
});
```

## Stack-Specific Guidance

The service provides tailored guidance for different technology stacks:

### React
- Component structure and state management
- React hooks best practices
- Component composition patterns

### Next.js
- Server-side rendering
- API routes and data fetching
- App Router / Pages Router

### Express.js
- REST API endpoints
- Middleware and error handling
- Route organization

### NestJS
- Modular architecture
- Dependency injection
- Decorators and services

### FastAPI
- Async API endpoints
- Pydantic validation
- Python type hints

### Supabase
- Real-time subscriptions
- Row-level security
- Authentication flow

### React Native / Expo
- Mobile-specific features
- Cross-platform compatibility
- Native modules

## Theme Integration

All prompts emphasize the selected color theme:

- **Primary color**: Main actions and branding
- **Secondary color**: Supporting elements
- **Accent color**: Highlights and calls-to-action
- **Background color**: Page backgrounds
- **Text color**: Readable content

The service ensures:
- No hardcoded colors in generated code
- Consistent color usage across all components
- Accessibility considerations (contrast ratios)
- Theme colors in generated images

## Integration Points

### Plan Creator Service
Uses prompt templates for:
- Requirements document generation
- Design document generation
- Task list generation

### Task Executor Service
Uses prompt templates for:
- Individual task implementation
- Code generation with context

### Image Generator Service
Uses prompt templates for:
- Logo generation
- Hero image generation
- Icon generation

## Testing

Comprehensive tests verify:
- Prompt structure and content
- Stack context inclusion
- Theme color integration
- Conversation history handling
- Stack-specific guidance
- All prompt types (requirements, design, tasks, execution, images)

Run tests:
```bash
npm test src/services/promptTemplates.test.ts
```

## Benefits

1. **Consistency**: All AI interactions follow the same structured format
2. **Context-Awareness**: Stack and theme information is always included
3. **Quality**: EARS patterns and INCOSE rules ensure high-quality requirements
4. **Maintainability**: Centralized prompt management
5. **Testability**: Easy to test and verify prompt content
6. **Extensibility**: Simple to add new prompt types or guidance

## Future Enhancements

Potential improvements:
- Support for additional technology stacks
- More granular stack-specific guidance
- Dynamic prompt optimization based on AI feedback
- Multi-language support for generated content
- Custom prompt templates per user/organization
