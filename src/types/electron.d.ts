/**
 * Electron API Type Definitions
 */

interface ElectronFS {
  readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
  readDir: (dirPath: string) => Promise<{ success: boolean; files?: any[]; error?: string }>;
  createDir: (dirPath: string) => Promise<{ success: boolean; error?: string }>;
  delete: (targetPath: string) => Promise<{ success: boolean; error?: string }>;
  rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; error?: string }>;
  exists: (targetPath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;
  stat: (targetPath: string) => Promise<{ success: boolean; stats?: any; error?: string }>;
}

interface ElectronAPI {
  selectDirectory: () => Promise<string | undefined>;
  selectFile: () => Promise<string | undefined>;
  saveFileDialog: () => Promise<string | undefined>;
  fs: ElectronFS;
  onMenuNewFile: (callback: () => void) => void;
  onMenuOpenFile: (callback: (filePath: string) => void) => void;
  onMenuOpenFolder: (callback: (folderPath: string) => void) => void;
  onMenuSave: (callback: () => void) => void;
  onMenuSaveAs: (callback: (filePath: string) => void) => void;
  onMenuToggleTerminal: (callback: () => void) => void;
  onMenuShowDocs: (callback: () => void) => void;
  openSettingsWindow: () => Promise<void>;
  openAccountsWindow: () => Promise<void>;
  getDownloadsDirectory: () => Promise<string>;
  executeCommand: (command: string, workingDir: string) => Promise<{ success: boolean; output?: string; error?: string }>;
  platform: string;
  isElectron: boolean;
}

interface ElectronAuthAPI {
  syncAuth: (authData: any) => void;
  getAuthData: () => Promise<any>;
}

interface Window {
  electron?: ElectronAPI;
  electronAPI?: ElectronAuthAPI;
  showDirectoryPicker?: () => Promise<any>;
  showOpenFilePicker?: () => Promise<any>;
  showSaveFilePicker?: () => Promise<any>;
}
