import type * as Monaco from 'monaco-editor';

export interface ThemeExtension {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  themeData: Monaco.editor.IStandaloneThemeData;
  compatible: boolean;
}

/**
 * Theme Extension Service
 * Manages installation and compatibility checking for theme extensions
 */
class ThemeExtensionService {
  private monaco: typeof Monaco | null = null;
  private installedExtensions: Map<string, ThemeExtension> = new Map();

  initialize(monaco: typeof Monaco) {
    this.monaco = monaco;
    this.loadInstalledExtensions();
  }

  /**
   * Check if a theme extension is compatible with the current editor
   */
  checkCompatibility(extension: ThemeExtension): boolean {
    if (!this.monaco) {
      return false;
    }

    // Check if the theme data has required properties
    const hasBase = extension.themeData.base !== undefined;
    const hasInherit = extension.themeData.inherit !== undefined;
    const hasRules = Array.isArray(extension.themeData.rules);
    const hasColors = typeof extension.themeData.colors === 'object';

    return hasBase && hasInherit && hasRules && hasColors;
  }

  /**
   * Install a theme extension
   */
  installExtension(extension: ThemeExtension): boolean {
    if (!this.monaco) {
      console.error('Monaco not initialized');
      return false;
    }

    // Check compatibility
    if (!this.checkCompatibility(extension)) {
      console.error('Theme extension is not compatible');
      return false;
    }

    try {
      // Define the theme in Monaco
      this.monaco.editor.defineTheme(extension.id, extension.themeData);

      // Store the extension
      this.installedExtensions.set(extension.id, extension);

      // Save to localStorage
      this.saveInstalledExtensions();

      return true;
    } catch (error) {
      console.error('Failed to install theme extension', error);
      return false;
    }
  }

  /**
   * Uninstall a theme extension
   */
  uninstallExtension(extensionId: string): boolean {
    if (!this.installedExtensions.has(extensionId)) {
      return false;
    }

    this.installedExtensions.delete(extensionId);
    this.saveInstalledExtensions();
    return true;
  }

  /**
   * Get all installed theme extensions
   */
  getInstalledExtensions(): ThemeExtension[] {
    return Array.from(this.installedExtensions.values());
  }

  /**
   * Get a specific theme extension
   */
  getExtension(extensionId: string): ThemeExtension | undefined {
    return this.installedExtensions.get(extensionId);
  }

  /**
   * Load installed extensions from localStorage
   */
  private loadInstalledExtensions() {
    try {
      const saved = localStorage.getItem('installedThemeExtensions');
      if (saved) {
        const extensions: ThemeExtension[] = JSON.parse(saved);
        extensions.forEach(ext => {
          this.installedExtensions.set(ext.id, ext);
          // Re-register the theme with Monaco
          if (this.monaco) {
            this.monaco.editor.defineTheme(ext.id, ext.themeData);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load installed theme extensions', error);
    }
  }

  /**
   * Save installed extensions to localStorage
   */
  private saveInstalledExtensions() {
    try {
      const extensions = Array.from(this.installedExtensions.values());
      localStorage.setItem('installedThemeExtensions', JSON.stringify(extensions));
    } catch (error) {
      console.error('Failed to save installed theme extensions', error);
    }
  }

  /**
   * Create a sample theme extension for testing
   */
  createSampleExtension(): ThemeExtension {
    return {
      id: 'sample-theme',
      name: 'Sample Theme',
      version: '1.0.0',
      author: 'Test Author',
      description: 'A sample theme for testing',
      compatible: true,
      themeData: {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955' },
          { token: 'keyword', foreground: 'C586C0' },
        ],
        colors: {
          'editor.background': '#1E1E1E',
          'editor.foreground': '#D4D4D4',
        },
      },
    };
  }
}

export const themeExtensionService = new ThemeExtensionService();
