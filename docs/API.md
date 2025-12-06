# API Documentation

Complete API reference for Kalpa AI services and components.

## Table of Contents

- [File System Service](#file-system-service)
- [Terminal Service](#terminal-service)
- [AI Service](#ai-service)
- [Project Generator Service](#project-generator-service)
- [Device Manager Service](#device-manager-service)
- [Theme Service](#theme-service)
- [Extension Loader Service](#extension-loader-service)

---

## File System Service

Manages virtual file system with localStorage persistence.

### Import

```typescript
import { fileSystemService } from './services/fileSystemService';
```

### Methods

#### `createFile(path: string, content: string): Promise<void>`

Creates a new file.

```typescript
await fileSystemService.createFile('/src/App.tsx', 'export const App = () => {}');
```

**Parameters:**
- `path` - File path (must be unique)
- `content` - File content

**Throws:**
- `Error` if file already exists
- `Error` if path is invalid

#### `readFile(path: string): Promise<string>`

Reads file content.

```typescript
const content = await fileSystemService.readFile('/src/App.tsx');
```

**Parameters:**
- `path` - File path

**Returns:** File content as string

**Throws:**
- `Error` if file doesn't exist

#### `updateFile(path: string, content: string): Promise<void>`

Updates existing file.

```typescript
await fileSystemService.updateFile('/src/App.tsx', 'new content');
```

#### `deleteFile(path: string): Promise<void>`

Deletes a file.

```typescript
await fileSystemService.deleteFile('/src/App.tsx');
```

#### `listDirectory(path: string): Promise<FileEntry[]>`

Lists directory contents.

```typescript
const files = await fileSystemService.listDirectory('/src');
// Returns: [{ name: 'App.tsx', type: 'file', path: '/src/App.tsx' }, ...]
```

#### `createDirectory(path: string): Promise<void>`

Creates a directory.

```typescript
await fileSystemService.createDirectory('/src/components');
```

#### `fileExists(path: string): Promise<boolean>`

Checks if file exists.

```typescript
const exists = await fileSystemService.fileExists('/src/App.tsx');
```

### Types

```typescript
interface FileEntry {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  modified?: Date;
}
```

---

## Terminal Service

Manages terminal sessions with WebSocket communication.

### Import

```typescript
import { terminalService } from './services/terminalService';
```

### Methods

#### `createSession(): Promise<string>`

Creates a new terminal session.

```typescript
const sessionId = await terminalService.createSession();
```

**Returns:** Session ID

#### `sendCommand(sessionId: string, command: string): Promise<void>`

Sends command to terminal.

```typescript
await terminalService.sendCommand(sessionId, 'npm install');
```

#### `onOutput(sessionId: string, callback: (data: string) => void): void`

Listens for terminal output.

```typescript
terminalService.onOutput(sessionId, (data) => {
  console.log('Terminal output:', data);
});
```

#### `resize(sessionId: string, cols: number, rows: number): Promise<void>`

Resizes terminal.

```typescript
await terminalService.resize(sessionId, 80, 24);
```

#### `closeSession(sessionId: string): Promise<void>`

Closes terminal session.

```typescript
await terminalService.closeSession(sessionId);
```

---

## AI Service

Integrates multiple AI providers for code generation and assistance.

### Import

```typescript
import { clientAIService } from './services/clientAIService';
```

### Methods

#### `generateCode(options: CodeGenerationOptions): Promise<string>`

Generates code from prompt.

```typescript
const code = await clientAIService.generateCode({
  prompt: 'Create a React component for a todo list',
  provider: 'openai',
  model: 'gpt-4',
  language: 'typescript'
});
```

**Parameters:**

```typescript
interface CodeGenerationOptions {
  prompt: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama';
  model: string;
  language?: string;
  context?: string;
}
```

#### `chat(options: ChatOptions): Promise<string>`

Chat completion.

```typescript
const response = await clientAIService.chat({
  messages: [
    { role: 'user', content: 'Explain async/await' }
  ],
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022'
});
```

**Parameters:**

```typescript
interface ChatOptions {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  provider: AIProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
}
```

#### `explainCode(code: string, provider: AIProvider): Promise<string>`

Explains code.

```typescript
const explanation = await clientAIService.explainCode(
  'const sum = (a, b) => a + b',
  'openai'
);
```

#### `fixCode(code: string, error: string, provider: AIProvider): Promise<string>`

Fixes code errors.

```typescript
const fixed = await clientAIService.fixCode(
  'const x = 1; x = 2;',
  'Cannot assign to const variable',
  'anthropic'
);
```

#### `optimizeCode(code: string, provider: AIProvider): Promise<string>`

Optimizes code.

```typescript
const optimized = await clientAIService.optimizeCode(
  'for (let i = 0; i < arr.length; i++) { sum += arr[i]; }',
  'gemini'
);
```

### Supported Models

**OpenAI:**
- `gpt-4-turbo-preview`
- `gpt-4`
- `gpt-3.5-turbo`

**Anthropic:**
- `claude-3-5-sonnet-20241022`
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`

**Google Gemini:**
- `gemini-1.5-pro-latest`
- `gemini-1.5-flash-latest`

**Groq:**
- `llama-3.1-70b-versatile`
- `mixtral-8x7b-32768`

**Ollama:**
- Any locally installed model

---

## Project Generator Service

Generates complete project scaffolds from natural language descriptions.

### Import

```typescript
import { projectGeneratorService } from './services/projectGeneratorService';
```

### Methods

#### `generateProject(options: ProjectOptions): Promise<ProjectPlan>`

Generates complete project plan.

```typescript
const plan = await projectGeneratorService.generateProject({
  prompt: 'E-commerce website with user authentication',
  stack: {
    frontend: 'React',
    backend: 'Node.js',
    database: 'PostgreSQL',
    mobile: 'React Native'
  },
  theme: {
    name: 'Ocean Blue',
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#ec4899'
  },
  provider: 'openai',
  model: 'gpt-4'
});
```

**Parameters:**

```typescript
interface ProjectOptions {
  prompt: string;
  stack: TechStack;
  theme: ColorTheme;
  provider: AIProvider;
  model: string;
}

interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  mobile?: string;
  deployment?: string;
}

interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background?: string;
  text?: string;
}
```

**Returns:**

```typescript
interface ProjectPlan {
  requirements: string;  // Markdown document
  design: string;        // Markdown document
  tasks: Task[];
  stack: TechStack;
  theme: ColorTheme;
  images?: GeneratedImage[];
}

interface Task {
  id: number;
  title: string;
  description: string;
  commands?: string[];
  files?: FileToCreate[];
  dependencies?: number[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}
```

#### `executeTask(task: Task, plan: ProjectPlan): Promise<TaskResult>`

Executes a single task.

```typescript
const result = await projectGeneratorService.executeTask(
  plan.tasks[0],
  plan
);
```

**Returns:**

```typescript
interface TaskResult {
  success: boolean;
  output?: string;
  error?: string;
  filesCreated?: string[];
  commandsExecuted?: string[];
}
```

#### `generateImages(plan: ProjectPlan): Promise<GeneratedImage[]>`

Generates project images (logo, assets).

```typescript
const images = await projectGeneratorService.generateImages(plan);
```

---

## Device Manager Service

Manages connections to physical Android and iOS devices.

### Import

```typescript
import { deviceManager } from './services/deviceManager';
```

### Methods

#### `discoverDevices(): Promise<Device[]>`

Discovers connected devices.

```typescript
const devices = await deviceManager.discoverDevices();
// Returns: [{ id: 'abc123', name: 'Pixel 7', platform: 'android', ... }]
```

**Returns:**

```typescript
interface Device {
  id: string;
  name: string;
  platform: 'android' | 'ios';
  model: string;
  osVersion: string;
  connected: boolean;
}
```

#### `connect(deviceId: string): Promise<void>`

Connects to a device.

```typescript
await deviceManager.connect('abc123');
```

#### `disconnect(deviceId: string): Promise<void>`

Disconnects from device.

```typescript
await deviceManager.disconnect('abc123');
```

#### `executeCommand(deviceId: string, command: string): Promise<string>`

Executes command on device.

```typescript
// Android
const output = await deviceManager.executeCommand('abc123', 'ls /sdcard');

// iOS
const output = await deviceManager.executeCommand('xyz789', 'ls /var/mobile');
```

#### `installApp(deviceId: string, appPath: string): Promise<void>`

Installs app on device.

```typescript
// Android (.apk)
await deviceManager.installApp('abc123', '/path/to/app.apk');

// iOS (.ipa)
await deviceManager.installApp('xyz789', '/path/to/app.ipa');
```

#### `getLogs(deviceId: string): Promise<string[]>`

Gets device logs.

```typescript
const logs = await deviceManager.getLogs('abc123');
```

#### `captureScreen(deviceId: string): Promise<Blob>`

Captures device screen.

```typescript
const screenshot = await deviceManager.captureScreen('abc123');
```

#### `getFileSystem(deviceId: string, path: string): Promise<FileEntry[]>`

Lists device file system.

```typescript
const files = await deviceManager.getFileSystem('abc123', '/sdcard');
```

---

## Theme Service

Manages editor themes and color schemes.

### Import

```typescript
import { themeService } from './services/themeService';
```

### Methods

#### `getThemes(): Theme[]`

Gets available themes.

```typescript
const themes = themeService.getThemes();
```

**Returns:**

```typescript
interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    // ... more colors
  };
}
```

#### `setTheme(themeId: string): void`

Sets active theme.

```typescript
themeService.setTheme('dark-plus');
```

#### `createCustomTheme(theme: Theme): void`

Creates custom theme.

```typescript
themeService.createCustomTheme({
  id: 'my-theme',
  name: 'My Theme',
  type: 'dark',
  colors: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    // ... more colors
  }
});
```

#### `exportTheme(themeId: string): string`

Exports theme as JSON.

```typescript
const json = themeService.exportTheme('my-theme');
```

#### `importTheme(json: string): void`

Imports theme from JSON.

```typescript
themeService.importTheme(jsonString);
```

---

## Extension Loader Service

Manages VS Code-style extensions.

### Import

```typescript
import { extensionLoaderService } from './services/extensionLoaderService';
```

### Methods

#### `loadExtension(extensionId: string): Promise<Extension>`

Loads an extension.

```typescript
const extension = await extensionLoaderService.loadExtension('ai-assistant');
```

**Returns:**

```typescript
interface Extension {
  id: string;
  name: string;
  version: string;
  activate: (context: ExtensionContext) => void;
  deactivate?: () => void;
}
```

#### `getLoadedExtensions(): Extension[]`

Gets loaded extensions.

```typescript
const extensions = extensionLoaderService.getLoadedExtensions();
```

#### `unloadExtension(extensionId: string): Promise<void>`

Unloads an extension.

```typescript
await extensionLoaderService.unloadExtension('ai-assistant');
```

#### `registerCommand(command: string, callback: Function): void`

Registers extension command.

```typescript
extensionLoaderService.registerCommand('myExtension.doSomething', () => {
  console.log('Command executed!');
});
```

#### `executeCommand(command: string, ...args: any[]): Promise<any>`

Executes extension command.

```typescript
await extensionLoaderService.executeCommand('myExtension.doSomething');
```

---

## REST API Endpoints

Backend API endpoints for server communication.

### Base URL

```
http://localhost:3001/api
```

### Authentication

Include API key in headers:

```typescript
headers: {
  'Authorization': 'Bearer YOUR_API_KEY'
}
```

### Endpoints

#### `POST /ai/generate`

Generate code with AI.

**Request:**
```json
{
  "prompt": "Create a React component",
  "provider": "openai",
  "model": "gpt-4",
  "language": "typescript"
}
```

**Response:**
```json
{
  "code": "export const Component = () => { ... }",
  "usage": {
    "promptTokens": 50,
    "completionTokens": 200
  }
}
```

#### `POST /ai/chat`

Chat completion.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Explain async/await" }
  ],
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022"
}
```

**Response:**
```json
{
  "response": "Async/await is a syntax for handling...",
  "usage": { ... }
}
```

#### `GET /devices`

List connected devices.

**Response:**
```json
{
  "devices": [
    {
      "id": "abc123",
      "name": "Pixel 7",
      "platform": "android",
      "model": "Pixel 7",
      "osVersion": "14"
    }
  ]
}
```

#### `POST /devices/:id/command`

Execute command on device.

**Request:**
```json
{
  "command": "ls /sdcard"
}
```

**Response:**
```json
{
  "output": "Download\nDCIM\nMusic\n...",
  "exitCode": 0
}
```

#### `POST /devices/:id/install`

Install app on device.

**Request:** Multipart form data with app file

**Response:**
```json
{
  "success": true,
  "packageName": "com.example.app"
}
```

#### `GET /devices/:id/logs`

Get device logs.

**Response:**
```json
{
  "logs": [
    "2024-01-01 12:00:00 I/ActivityManager: Start proc...",
    "..."
  ]
}
```

---

## WebSocket API

Real-time communication for terminal and device features.

### Connection

```typescript
const ws = new WebSocket('ws://localhost:3001');
```

### Terminal Events

#### Client → Server

```json
{
  "type": "terminal:create",
  "sessionId": "session-123"
}
```

```json
{
  "type": "terminal:input",
  "sessionId": "session-123",
  "data": "npm install\n"
}
```

```json
{
  "type": "terminal:resize",
  "sessionId": "session-123",
  "cols": 80,
  "rows": 24
}
```

#### Server → Client

```json
{
  "type": "terminal:output",
  "sessionId": "session-123",
  "data": "Installing packages..."
}
```

```json
{
  "type": "terminal:exit",
  "sessionId": "session-123",
  "exitCode": 0
}
```

### Device Events

#### Client → Server

```json
{
  "type": "device:connect",
  "deviceId": "abc123"
}
```

```json
{
  "type": "device:command",
  "deviceId": "abc123",
  "command": "ls /sdcard"
}
```

#### Server → Client

```json
{
  "type": "device:connected",
  "deviceId": "abc123",
  "info": { ... }
}
```

```json
{
  "type": "device:output",
  "deviceId": "abc123",
  "data": "Download\nDCIM\n..."
}
```

```json
{
  "type": "device:disconnected",
  "deviceId": "abc123"
}
```

---

## Error Handling

All API methods throw typed errors:

```typescript
try {
  await fileSystemService.readFile('/nonexistent.txt');
} catch (error) {
  if (error instanceof FileNotFoundError) {
    console.error('File not found:', error.path);
  } else if (error instanceof PermissionError) {
    console.error('Permission denied:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Error Types

```typescript
class FileNotFoundError extends Error {
  constructor(public path: string) {
    super(`File not found: ${path}`);
  }
}

class PermissionError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
  }
}

class AIProviderError extends Error {
  constructor(message: string, public provider: string) {
    super(`${provider}: ${message}`);
  }
}
```

---

## Rate Limiting

API endpoints are rate-limited:

- **AI endpoints**: 60 requests/minute
- **Device endpoints**: 120 requests/minute
- **File system**: 300 requests/minute

Rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

---

## Examples

### Complete File System Workflow

```typescript
import { fileSystemService } from './services/fileSystemService';

// Create project structure
await fileSystemService.createDirectory('/my-project');
await fileSystemService.createDirectory('/my-project/src');
await fileSystemService.createDirectory('/my-project/public');

// Create files
await fileSystemService.createFile(
  '/my-project/src/index.ts',
  'console.log("Hello World");'
);

await fileSystemService.createFile(
  '/my-project/package.json',
  JSON.stringify({ name: 'my-project', version: '1.0.0' }, null, 2)
);

// List files
const files = await fileSystemService.listDirectory('/my-project/src');
console.log('Files:', files);

// Read and update
const content = await fileSystemService.readFile('/my-project/src/index.ts');
await fileSystemService.updateFile(
  '/my-project/src/index.ts',
  content + '\nconsole.log("Updated");'
);
```

### AI-Powered Code Generation

```typescript
import { clientAIService } from './services/clientAIService';

// Generate component
const component = await clientAIService.generateCode({
  prompt: 'Create a React todo list component with add, delete, and toggle functionality',
  provider: 'openai',
  model: 'gpt-4',
  language: 'typescript'
});

// Save to file
await fileSystemService.createFile('/src/TodoList.tsx', component);

// Generate tests
const tests = await clientAIService.generateCode({
  prompt: `Generate tests for this component:\n\n${component}`,
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  language: 'typescript'
});

await fileSystemService.createFile('/src/TodoList.test.tsx', tests);
```

### Device Testing Workflow

```typescript
import { deviceManager } from './services/deviceManager';

// Discover devices
const devices = await deviceManager.discoverDevices();
const device = devices[0];

// Connect
await deviceManager.connect(device.id);

// Install app
await deviceManager.installApp(device.id, '/path/to/app.apk');

// Run tests
const output = await deviceManager.executeCommand(
  device.id,
  'am instrument -w com.example.app.test/androidx.test.runner.AndroidJUnitRunner'
);

console.log('Test results:', output);

// Get logs
const logs = await deviceManager.getLogs(device.id);
console.log('App logs:', logs);

// Disconnect
await deviceManager.disconnect(device.id);
```

---

For more examples, see the [examples/](../examples/) directory.
