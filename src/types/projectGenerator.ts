// Core types for AI Project Generator feature

export interface TechStack {
  id: string;
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'mobile' | 'ultimate';
  levelNumber: number; // 1-5
  frontend: string;
  backend?: string;
  database: string;
  mobile?: string;
  benefits: string[];
  useCases: string[];
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'cargo';
  setupCommands?: {
    frontend?: string[];
    backend?: string[];
    mobile?: string[];
  };
}

export interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  description: string;
}

export interface GeneratedImage {
  id: string;
  type: 'logo' | 'hero' | 'icon';
  url: string;
  dataUrl: string; // base64 encoded
  width: number;
  height: number;
  format: 'png' | 'svg' | 'jpg';
  prompt: string; // The prompt used to generate the image
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'plan' | 'task' | 'code' | 'command' | 'approval' | 'error' | 'stack-selection' | 'theme-selection' | 'image' | 'file-changes';
    data?: {
      // For 'plan' type
      documentType?: 'requirements' | 'design' | 'tasks';
      document?: any;
      
      // For 'task' type
      taskId?: string;
      taskStatus?: string;
      taskResult?: TaskResult;
      
      // For 'code' type
      filePath?: string;
      language?: string;
      diff?: boolean;
      
      // For 'command' type
      command?: string;
      result?: CommandResult;
      
      // For 'approval' type
      approvalType?: 'requirements' | 'design' | 'tasks';
      approved?: boolean;

      // For 'image' type
      images?: GeneratedImage[];

      // For 'file-changes' type
      fileChanges?: FileChange[];
    };
  };
}

export interface CommandResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface Task {
  id: string;
  number: string; // e.g., "1.1", "2.3"
  description: string;
  details: string[];
  requirements: string[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
  result?: TaskResult;
}

export interface FileChange {
  path: string;
  type: 'created' | 'modified';
  content?: string; // Full content for created files
  diff?: string; // Diff for modified files
  language?: string; // For syntax highlighting
}

export interface TaskResult {
  success: boolean;
  filesCreated: string[];
  filesModified: string[];
  fileChanges?: FileChange[]; // Detailed file change information
  commandsRun: CommandResult[];
  error?: string;
  output?: string;
}

export interface Requirement {
  number: number;
  userStory: string;
  acceptanceCriteria: string[];
}

export interface RequirementsDoc {
  introduction: string;
  glossary: Record<string, string>;
  requirements: Requirement[];
}

export interface Component {
  name: string;
  description: string;
  responsibilities: string[];
  interface?: string;
}

export interface DataModel {
  name: string;
  description: string;
  fields: Record<string, string>;
}

export interface DesignDoc {
  overview: string;
  architecture: string;
  components: Component[];
  dataModels: DataModel[];
  errorHandling: string;
  testingStrategy: string;
}

export interface TaskList {
  tasks: Task[];
  checkpoints: number[]; // task indices where checkpoints occur
}

export interface ProjectPlan {
  projectName: string;
  requirements?: RequirementsDoc;
  design?: DesignDoc;
  tasks?: TaskList;
}

export interface ProjectSession {
  id: string;
  selectedStack: TechStack;
  selectedTheme: ColorTheme;
  generatedImages?: GeneratedImage[];
  description: string;
  plan: ProjectPlan;
  phase: 'stack-selection' | 'theme-selection' | 'description' | 'requirements' | 'design' | 'tasks' | 'image-generation' | 'execution' | 'complete';
  conversationHistory: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionSummary {
  id: string;
  projectName: string;
  phase: string;
  lastUpdated: Date;
  taskProgress: string; // e.g., "3/10 tasks complete"
  selectedStack?: TechStack;
  selectedTheme?: ColorTheme;
}

export interface Dependency {
  name: string;
  type: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'gem' | 'cargo' | 'go' | 'system';
  installCommand: string;
  version?: string;
}
