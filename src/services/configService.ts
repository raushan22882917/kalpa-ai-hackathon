/**
 * Configuration Service
 * Manages application configuration with secure storage
 */

import type { EditorConfig } from '../types/editor';

export type AIProvider = 'openai' | 'anthropic' | 'gemini' | 'custom';

export interface ExtendedEditorConfig extends EditorConfig {
  aiProvider?: AIProvider;
}

class ConfigService {
  private static readonly CONFIG_KEY = 'editorConfig';
  private static readonly SECURE_CONFIG_KEY = 'editorConfig_secure';
  
  private config: ExtendedEditorConfig | null = null;

  /**
   * Initialize configuration on app load
   */
  initialize(): ExtendedEditorConfig {
    const config = this.loadConfig();
    this.config = config;
    return config;
  }

  /**
   * Load configuration from storage
   */
  private loadConfig(): ExtendedEditorConfig {
    try {
      // Load non-sensitive config from localStorage
      const savedConfig = localStorage.getItem(ConfigService.CONFIG_KEY);
      const baseConfig: ExtendedEditorConfig = savedConfig
        ? JSON.parse(savedConfig)
        : this.getDefaultConfig();

      // Load API key from secure storage (sessionStorage for better security)
      const secureData = sessionStorage.getItem(ConfigService.SECURE_CONFIG_KEY);
      if (secureData) {
        try {
          const { apiKey } = JSON.parse(secureData);
          baseConfig.apiKey = apiKey || '';
        } catch (e) {
          console.error('Failed to parse secure config', e);
        }
      }

      return baseConfig;
    } catch (e) {
      console.error('Failed to load config', e);
      return this.getDefaultConfig();
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): ExtendedEditorConfig {
    return {
      aiBackendUrl: import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:3001',
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      theme: 'dark',
      offlineMode: false,
      fontSize: 14,
      aiProvider: 'openai',
    };
  }

  /**
   * Save configuration to storage
   */
  saveConfig(config: ExtendedEditorConfig): void {
    try {
      // Save non-sensitive config to localStorage
      const { apiKey, ...publicConfig } = config;
      localStorage.setItem(ConfigService.CONFIG_KEY, JSON.stringify(publicConfig));

      // Save API key to sessionStorage (more secure than localStorage)
      if (apiKey) {
        sessionStorage.setItem(
          ConfigService.SECURE_CONFIG_KEY,
          JSON.stringify({ apiKey })
        );
      } else {
        sessionStorage.removeItem(ConfigService.SECURE_CONFIG_KEY);
      }

      this.config = config;
    } catch (e) {
      console.error('Failed to save config', e);
      throw new Error('Failed to save configuration');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ExtendedEditorConfig {
    if (!this.config) {
      this.config = this.loadConfig();
    }
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ExtendedEditorConfig>): ExtendedEditorConfig {
    const currentConfig = this.getConfig();
    const newConfig = { ...currentConfig, ...updates };
    this.saveConfig(newConfig);
    return newConfig;
  }

  /**
   * Clear all configuration (useful for logout/reset)
   */
  clearConfig(): void {
    localStorage.removeItem(ConfigService.CONFIG_KEY);
    sessionStorage.removeItem(ConfigService.SECURE_CONFIG_KEY);
    this.config = this.getDefaultConfig();
  }

  /**
   * Validate API key format
   */
  validateApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.trim().length === 0) {
      return false;
    }
    // Basic validation - API keys should be at least 20 characters
    return apiKey.trim().length >= 20;
  }

  /**
   * Validate backend URL format
   */
  validateBackendUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

export const configService = new ConfigService();
