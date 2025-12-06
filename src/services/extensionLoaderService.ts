import { authService } from './authService';
import { notificationService } from './notificationService';

export interface VSCodeExtension {
  id: string;
  name: string;
  version: string;
  publisher: string;
  description: string;
  enabled: boolean;
  installed: boolean;
  downloadUrl?: string;
}

class ExtensionLoaderService {
  private loadedExtensions: Map<string, VSCodeExtension> = new Map();
  private extensionListeners: ((extensions: VSCodeExtension[]) => void)[] = [];

  constructor() {
    this.loadUserExtensions();
  }

  // Load user's saved extensions from Firebase
  private async loadUserExtensions() {
    const user = authService.getCurrentUser();
    if (!user) return;

    try {
      const extensionIds = await authService.getUserExtensions(user.uid);
      
      // Load each extension
      for (const extensionId of extensionIds) {
        await this.loadExtension(extensionId);
      }
    } catch (error) {
      console.error('Failed to load user extensions:', error);
    }
  }

  // Load extension from VS Code marketplace or local file
  async loadExtension(extensionId: string): Promise<void> {
    try {
      // Check if extension is already loaded
      if (this.loadedExtensions.has(extensionId)) {
        notificationService.info(`Extension ${extensionId} is already loaded`);
        return;
      }

      // Fetch extension metadata from VS Code marketplace
      const extension = await this.fetchExtensionMetadata(extensionId);
      
      if (!extension) {
        throw new Error('Extension not found');
      }

      // Download and install extension
      await this.installExtension(extension);

      // Mark as loaded
      this.loadedExtensions.set(extensionId, extension);
      
      // Save to user profile
      await this.saveUserExtensions();
      
      // Notify listeners
      this.notifyListeners();

      notificationService.success(`Extension ${extension.name} loaded successfully`);
    } catch (error: any) {
      notificationService.error(`Failed to load extension: ${error.message}`);
      throw error;
    }
  }

  // Fetch extension metadata from VS Code marketplace
  private async fetchExtensionMetadata(extensionId: string): Promise<VSCodeExtension | null> {
    try {
      // VS Code marketplace API
      const [publisher, name] = extensionId.split('.');
      const url = `https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json;api-version=3.0-preview.1'
        },
        body: JSON.stringify({
          filters: [{
            criteria: [
              { filterType: 7, value: `${publisher}.${name}` }
            ]
          }],
          flags: 914
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch extension metadata');
      }

      const data = await response.json();
      const ext = data.results?.[0]?.extensions?.[0];

      if (!ext) return null;

      const version = ext.versions?.[0];
      
      return {
        id: extensionId,
        name: ext.displayName || name,
        version: version?.version || '1.0.0',
        publisher: ext.publisher?.publisherName || publisher,
        description: ext.shortDescription || '',
        enabled: true,
        installed: false,
        downloadUrl: version?.files?.find((f: any) => f.assetType === 'Microsoft.VisualStudio.Services.VSIXPackage')?.source
      };
    } catch (error) {
      console.error('Failed to fetch extension metadata:', error);
      return null;
    }
  }

  // Install extension (download and activate)
  private async installExtension(extension: VSCodeExtension): Promise<void> {
    // In a real implementation, this would:
    // 1. Download the VSIX file
    // 2. Extract and parse the extension
    // 3. Load the extension's JavaScript/TypeScript code
    // 4. Register extension contributions (commands, languages, themes, etc.)
    
    // For now, we'll simulate the installation
    console.log(`Installing extension: ${extension.name}`);
    
    // Mark as installed
    extension.installed = true;
  }

  // Load extension from local file
  async loadExtensionFromFile(file: File): Promise<void> {
    try {
      // Read VSIX file
      await file.arrayBuffer();
      
      // Parse VSIX (it's a ZIP file)
      // Extract extension.vsixmanifest and package.json
      // Load extension code
      
      notificationService.info('Loading extension from file...');
      
      // For now, simulate loading
      const extensionId = `local.${file.name.replace('.vsix', '')}`;
      const extension: VSCodeExtension = {
        id: extensionId,
        name: file.name.replace('.vsix', ''),
        version: '1.0.0',
        publisher: 'local',
        description: 'Locally loaded extension',
        enabled: true,
        installed: true
      };

      this.loadedExtensions.set(extensionId, extension);
      await this.saveUserExtensions();
      this.notifyListeners();

      notificationService.success(`Extension loaded from file: ${extension.name}`);
    } catch (error: any) {
      notificationService.error(`Failed to load extension from file: ${error.message}`);
      throw error;
    }
  }

  // Unload extension
  async unloadExtension(extensionId: string): Promise<void> {
    if (!this.loadedExtensions.has(extensionId)) {
      notificationService.warning('Extension not loaded');
      return;
    }

    this.loadedExtensions.delete(extensionId);
    await this.saveUserExtensions();
    this.notifyListeners();

    notificationService.success('Extension unloaded');
  }

  // Enable/disable extension
  async toggleExtension(extensionId: string, enabled: boolean): Promise<void> {
    const extension = this.loadedExtensions.get(extensionId);
    if (!extension) return;

    extension.enabled = enabled;
    this.loadedExtensions.set(extensionId, extension);
    await this.saveUserExtensions();
    this.notifyListeners();
  }

  // Get all loaded extensions
  getLoadedExtensions(): VSCodeExtension[] {
    return Array.from(this.loadedExtensions.values());
  }

  // Save user extensions to Firebase
  private async saveUserExtensions(): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) return;

    const extensionIds = Array.from(this.loadedExtensions.keys());
    await authService.saveUserExtensions(user.uid, extensionIds);
  }

  // Subscribe to extension changes
  subscribe(callback: (extensions: VSCodeExtension[]) => void): () => void {
    this.extensionListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.extensionListeners.indexOf(callback);
      if (index > -1) {
        this.extensionListeners.splice(index, 1);
      }
    };
  }

  // Notify listeners of changes
  private notifyListeners(): void {
    const extensions = this.getLoadedExtensions();
    this.extensionListeners.forEach(listener => listener(extensions));
  }

  // Search extensions in VS Code marketplace
  async searchExtensions(query: string): Promise<VSCodeExtension[]> {
    try {
      const url = `https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json;api-version=3.0-preview.1'
        },
        body: JSON.stringify({
          filters: [{
            criteria: [
              { filterType: 10, value: query },
              { filterType: 8, value: 'Microsoft.VisualStudio.Code' }
            ],
            pageSize: 20
          }],
          flags: 914
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search extensions');
      }

      const data = await response.json();
      const extensions = data.results?.[0]?.extensions || [];

      return extensions.map((ext: any) => {
        const version = ext.versions?.[0];
        const extensionId = `${ext.publisher.publisherName}.${ext.extensionName}`;
        
        return {
          id: extensionId,
          name: ext.displayName || ext.extensionName,
          version: version?.version || '1.0.0',
          publisher: ext.publisher.publisherName,
          description: ext.shortDescription || '',
          enabled: false,
          installed: this.loadedExtensions.has(extensionId),
          downloadUrl: version?.files?.find((f: any) => f.assetType === 'Microsoft.VisualStudio.Services.VSIXPackage')?.source
        };
      });
    } catch (error) {
      console.error('Failed to search extensions:', error);
      return [];
    }
  }
}

export const extensionLoaderService = new ExtensionLoaderService();
