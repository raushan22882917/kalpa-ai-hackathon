export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'custom';

export interface EditorConfig {
  aiBackendUrl: string;
  apiKey: string;
  theme: 'light' | 'dark' | 'high-contrast';
  offlineMode: boolean;
  fontSize?: number;
  customKeybindings?: Record<string, string>;
  aiProvider?: AIProvider;
}

export interface EditorShellProps {
  config: EditorConfig;
  onConfigChange: (config: EditorConfig) => void;
  file?: FileContent;
}

export interface EditorState {
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface FileContent {
  fileName: string;
  content: string;
  language?: string;
}
