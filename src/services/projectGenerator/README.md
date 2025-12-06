# AI Project Generator - Core Services

This directory contains the core services and data models for the AI Project Generator feature.

## Overview

The AI Project Generator enables developers to create complete projects through natural language conversation. Users select a technology stack and color theme, describe their project idea, and the system generates comprehensive project plans (requirements, design, and tasks) tailored to the selected stack and theme.

## Structure

### Types (`src/types/projectGenerator.ts`)
Core TypeScript interfaces for the project generator:
- `TechStack` - Technology stack configuration
- `ColorTheme` - Color theme configuration
- `GeneratedImage` - AI-generated images (logos, heroes, icons)
- `ProjectSession` - Complete session state
- `ChatMessage` - Chat message format
- `ProjectPlan` - Requirements, design, and tasks
- `Task` - Individual implementation task
- `RequirementsDoc`, `DesignDoc`, `TaskList` - Document structures

### Predefined Data
- `src/data/predefinedStacks.ts` - 10 predefined technology stacks organized by complexity level (1-5)
- `src/data/predefinedThemes.ts` - 6+ predefined color themes with complete color palettes

### Utilities (`src/utils/sessionStorage.ts`)
Session storage utilities:
- `generateSessionId()` - Generate unique session IDs
- `serializeSession()` / `deserializeSession()` - Session serialization with Date handling
- `serializeConversation()` / `deserializeConversation()` - Conversation history serialization
- `createSessionSummary()` - Create session summaries for listing
- Path helpers for session files (session.json, conversation.json, requirements.md, design.md, tasks.md)

### Session Storage Directory
Sessions are stored at `.kiro/project-sessions/{sessionId}/` with the following structure:
- `session.json` - Session metadata and state
- `conversation.json` - Full conversation history
- `requirements.md` - Generated requirements document
- `design.md` - Generated design document
- `tasks.md` - Generated task list

## Technology Stacks

The system includes 10 predefined stacks organized by complexity:

**Level 1 - Beginner:**
- React + Supabase

**Level 2 - Intermediate:**
- React + Express + Supabase
- React + NestJS + Supabase

**Level 3 - Advanced:**
- Next.js + Supabase
- Next.js + NestJS + Supabase
- Next.js + FastAPI + Supabase

**Level 4 - Mobile:**
- React Native (Expo) + Supabase
- React Native + Next.js + Supabase
- React Native + FastAPI + Supabase

**Level 5 - Ultimate:**
- Next.js + Supabase + React Native

## Color Themes

6 predefined themes with complete color palettes:
- Modern Blue - Professional and trustworthy
- Vibrant Purple - Creative and energetic
- Nature Green - Fresh and sustainable
- Sunset Orange - Warm and inviting
- Elegant Dark - Sophisticated and modern
- Minimal Gray - Clean and minimalist

Each theme includes: primary, secondary, accent, background, and text colors.

## Usage

```typescript
import { 
  PREDEFINED_STACKS, 
  PREDEFINED_THEMES,
  generateSessionId,
  serializeSession,
  deserializeSession,
  type ProjectSession,
  type TechStack,
  type ColorTheme
} from './services/projectGenerator';

// Create a new session
const sessionId = generateSessionId();
const stack = PREDEFINED_STACKS[0]; // React + Supabase
const theme = PREDEFINED_THEMES[0]; // Modern Blue

const session: ProjectSession = {
  id: sessionId,
  selectedStack: stack,
  selectedTheme: theme,
  description: 'A task management app',
  plan: { projectName: 'Task Manager' },
  phase: 'description',
  conversationHistory: [],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Serialize for storage
const json = serializeSession(session);

// Deserialize from storage
const loaded = deserializeSession(json);
```

## Testing

Run tests with:
```bash
npx vitest run src/services/projectGenerator/coreTypes.test.ts
```

Tests verify:
- All 10 stacks are defined with required properties
- All 6+ themes have complete color palettes
- Session serialization/deserialization works correctly
- Session summaries are created properly
