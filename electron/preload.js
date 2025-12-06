const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // File system operations
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectFile: () => ipcRenderer.invoke('select-file'),
  saveFileDialog: () => ipcRenderer.invoke('save-file-dialog'),
  
  // Native file system access
  fs: {
    readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
    readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', dirPath),
    createDir: (dirPath) => ipcRenderer.invoke('fs:createDir', dirPath),
    delete: (targetPath) => ipcRenderer.invoke('fs:delete', targetPath),
    rename: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
    exists: (targetPath) => ipcRenderer.invoke('fs:exists', targetPath),
    stat: (targetPath) => ipcRenderer.invoke('fs:stat', targetPath),
  },

  // Menu events
  onMenuNewFile: (callback) => ipcRenderer.on('menu-new-file', callback),
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', (event, filePath) => callback(filePath)),
  onMenuOpenFolder: (callback) => ipcRenderer.on('menu-open-folder', (event, folderPath) => callback(folderPath)),
  onMenuChangeWorkspace: (callback) => ipcRenderer.on('menu-change-workspace', (event, folderPath) => callback(folderPath)),
  onMenuSave: (callback) => ipcRenderer.on('menu-save', callback),
  onMenuSaveAs: (callback) => ipcRenderer.on('menu-save-as', (event, filePath) => callback(filePath)),
  onMenuToggleTerminal: (callback) => ipcRenderer.on('menu-toggle-terminal', callback),
  onMenuShowDocs: (callback) => ipcRenderer.on('menu-show-docs', callback),

  // Platform info
  platform: process.platform,
  isElectron: true,
  
  // Window management
  openSettingsWindow: () => ipcRenderer.invoke('open-settings-window'),
  openAccountsWindow: () => ipcRenderer.invoke('open-accounts-window'),
  
  // System paths
  getDownloadsDirectory: () => ipcRenderer.invoke('get-downloads-directory'),
  
  // Git operations
  gitClone: (repoUrl, targetPath) => ipcRenderer.invoke('git-clone', repoUrl, targetPath),
  
  // Terminal command execution
  executeCommand: (command, workingDir) => ipcRenderer.invoke('execute-command', command, workingDir),
});

// Expose auth API separately for Firebase auth sync
contextBridge.exposeInMainWorld('electronAPI', {
  syncAuth: (authData) => ipcRenderer.send('sync-auth', authData),
  getAuthData: () => ipcRenderer.invoke('get-auth-data'),
});
