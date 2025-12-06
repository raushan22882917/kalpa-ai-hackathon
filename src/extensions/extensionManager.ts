/**
 * Extension Manager
 * Manages the lifecycle of Monaco Editor extensions
 */

import type * as Monaco from 'monaco-editor';
import type { Extension, ExtensionContext } from './ai-assistant/extension';

export interface ExtensionConfig {
  aiBackendUrl: string;
  apiKey: string;
  onShowPanel?: () => void;
  onAddMessage?: (message: any) => void;
  onGetConversationContext?: () => any[];
}

export class ExtensionManager {
  private extensions: Map<string, Extension> = new Map();
  private context: ExtensionContext | null = null;

  /**
   * Initialize the extension manager with Monaco and editor instances
   */
  initialize(
    monaco: typeof Monaco,
    editor: Monaco.editor.IStandaloneCodeEditor,
    config: ExtensionConfig
  ): void {
    this.context = {
      monaco,
      editor,
      config,
    };
  }

  /**
   * Register and activate an extension
   */
  registerExtension(name: string, extension: Extension): void {
    if (!this.context) {
      throw new Error('ExtensionManager not initialized');
    }

    if (this.extensions.has(name)) {
      console.warn(`Extension ${name} is already registered`);
      return;
    }

    this.extensions.set(name, extension);
    extension.activate(this.context);
    console.log(`Extension ${name} registered and activated`);
  }

  /**
   * Deactivate and unregister an extension
   */
  unregisterExtension(name: string): void {
    const extension = this.extensions.get(name);
    if (extension) {
      extension.deactivate();
      this.extensions.delete(name);
      console.log(`Extension ${name} deactivated and unregistered`);
    }
  }

  /**
   * Get a registered extension by name
   */
  getExtension(name: string): Extension | undefined {
    return this.extensions.get(name);
  }

  /**
   * Update configuration for all extensions
   */
  updateConfig(config: Partial<ExtensionConfig>): void {
    if (!this.context) {
      return;
    }

    this.context.config = {
      ...this.context.config,
      ...config,
    };

    // Notify extensions of config change by deactivating and reactivating
    this.extensions.forEach((extension, name) => {
      extension.deactivate();
      extension.activate(this.context!);
      console.log(`Extension ${name} reactivated with new config`);
    });
  }

  /**
   * Deactivate all extensions
   */
  deactivateAll(): void {
    this.extensions.forEach((extension, name) => {
      extension.deactivate();
      console.log(`Extension ${name} deactivated`);
    });
    this.extensions.clear();
  }
}

// Singleton instance
export const extensionManager = new ExtensionManager();
