/**
 * Deployment Service
 * Handles deployment to various platforms (Vercel, Netlify, etc.)
 * Similar to Lovable.dev's deployment integration
 */

import { notificationService } from './notificationService';

export interface DeploymentProvider {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  apiKey?: string;
  projectId?: string;
}

export interface DeploymentConfig {
  provider: string;
  projectName: string;
  buildCommand?: string;
  outputDirectory?: string;
  environmentVariables?: Record<string, string>;
}

export interface DeploymentResult {
  success: boolean;
  url?: string;
  deploymentId?: string;
  error?: string;
}

class DeploymentService {
  private providers: Map<string, DeploymentProvider> = new Map();
  private readonly STORAGE_KEY = 'kalpa_deployment_providers';

  constructor() {
    this.loadProviders();
    this.initializeDefaultProviders();
  }

  /**
   * Initialize default deployment providers
   */
  private initializeDefaultProviders(): void {
    const defaults: DeploymentProvider[] = [
      {
        id: 'vercel',
        name: 'Vercel',
        icon: '▲',
        connected: false
      },
      {
        id: 'netlify',
        name: 'Netlify',
        icon: '◆',
        connected: false
      },
      {
        id: 'github-pages',
        name: 'GitHub Pages',
        icon: '📄',
        connected: false
      },
      {
        id: 'railway',
        name: 'Railway',
        icon: '🚂',
        connected: false
      },
      {
        id: 'render',
        name: 'Render',
        icon: '🎨',
        connected: false
      }
    ];

    defaults.forEach(provider => {
      if (!this.providers.has(provider.id)) {
        this.providers.set(provider.id, provider);
      }
    });
  }

  /**
   * Load providers from localStorage
   */
  private loadProviders(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([id, provider]) => {
          this.providers.set(id, provider as DeploymentProvider);
        });
      } catch (error) {
        console.error('Failed to load deployment providers:', error);
      }
    }
  }

  /**
   * Save providers to localStorage
   */
  private saveProviders(): void {
    const data: Record<string, DeploymentProvider> = {};
    this.providers.forEach((provider, id) => {
      data[id] = provider;
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  /**
   * Get all providers
   */
  getProviders(): DeploymentProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider
   */
  getProvider(id: string): DeploymentProvider | null {
    return this.providers.get(id) || null;
  }

  /**
   * Connect to a deployment provider
   */
  async connectProvider(id: string, apiKey: string, projectId?: string): Promise<boolean> {
    const provider = this.providers.get(id);
    if (!provider) {
      notificationService.error('Provider not found');
      return false;
    }

    try {
      // Validate API key by making a test request
      const isValid = await this.validateApiKey(id, apiKey);
      
      if (!isValid) {
        notificationService.error('Invalid API key');
        return false;
      }

      provider.connected = true;
      provider.apiKey = apiKey;
      provider.projectId = projectId;
      
      this.providers.set(id, provider);
      this.saveProviders();
      
      notificationService.success(`Connected to ${provider.name}`);
      return true;
    } catch (error) {
      notificationService.error(`Failed to connect to ${provider.name}`);
      return false;
    }
  }

  /**
   * Disconnect from a provider
   */
  disconnectProvider(id: string): void {
    const provider = this.providers.get(id);
    if (provider) {
      provider.connected = false;
      provider.apiKey = undefined;
      provider.projectId = undefined;
      this.providers.set(id, provider);
      this.saveProviders();
      notificationService.success(`Disconnected from ${provider.name}`);
    }
  }

  /**
   * Validate API key for a provider
   */
  private async validateApiKey(providerId: string, apiKey: string): Promise<boolean> {
    try {
      switch (providerId) {
        case 'vercel':
          return await this.validateVercelKey(apiKey);
        case 'netlify':
          return await this.validateNetlifyKey(apiKey);
        default:
          return true; // Skip validation for other providers
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate Vercel API key
   */
  private async validateVercelKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.vercel.com/v2/user', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Validate Netlify API key
   */
  private async validateNetlifyKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.netlify.com/api/v1/user', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Deploy to Vercel
   */
  private async deployToVercel(
    config: DeploymentConfig,
    files: { path: string; content: string }[]
  ): Promise<DeploymentResult> {
    const provider = this.providers.get('vercel');
    if (!provider?.apiKey) {
      return { success: false, error: 'Not connected to Vercel' };
    }

    try {
      // Create deployment
      const response = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: config.projectName,
          files: files.map(f => ({
            file: f.path,
            data: btoa(f.content)
          })),
          projectSettings: {
            buildCommand: config.buildCommand,
            outputDirectory: config.outputDirectory
          },
          env: config.environmentVariables
        })
      });

      if (!response.ok) {
        throw new Error('Deployment failed');
      }

      const data = await response.json();
      return {
        success: true,
        url: `https://${data.url}`,
        deploymentId: data.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deployment failed'
      };
    }
  }

  /**
   * Deploy to Netlify
   */
  private async deployToNetlify(
    config: DeploymentConfig,
    files: { path: string; content: string }[]
  ): Promise<DeploymentResult> {
    const provider = this.providers.get('netlify');
    if (!provider?.apiKey) {
      return { success: false, error: 'Not connected to Netlify' };
    }

    try {
      // Create site if needed
      let siteId = provider.projectId;
      
      if (!siteId) {
        const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: config.projectName
          })
        });

        const siteData = await siteResponse.json();
        siteId = siteData.id;
        
        // Save site ID
        provider.projectId = siteId;
        this.providers.set('netlify', provider);
        this.saveProviders();
      }

      // Deploy files
      const formData = new FormData();
      files.forEach(file => {
        formData.append(file.path, new Blob([file.content]));
      });

      const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Deployment failed');
      }

      const data = await response.json();
      return {
        success: true,
        url: data.ssl_url || data.url,
        deploymentId: data.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deployment failed'
      };
    }
  }

  /**
   * Deploy project
   */
  async deploy(
    providerId: string,
    config: DeploymentConfig,
    files: { path: string; content: string }[]
  ): Promise<DeploymentResult> {
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }

    if (!provider.connected) {
      return { success: false, error: 'Provider not connected' };
    }

    notificationService.info(`Deploying to ${provider.name}...`);

    let result: DeploymentResult;

    switch (providerId) {
      case 'vercel':
        result = await this.deployToVercel(config, files);
        break;
      case 'netlify':
        result = await this.deployToNetlify(config, files);
        break;
      default:
        result = { success: false, error: 'Provider not supported yet' };
    }

    if (result.success) {
      notificationService.success(`Deployed successfully! ${result.url}`);
    } else {
      notificationService.error(`Deployment failed: ${result.error}`);
    }

    return result;
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(providerId: string, deploymentId: string): Promise<string> {
    const provider = this.providers.get(providerId);
    if (!provider?.apiKey) {
      return 'unknown';
    }

    try {
      switch (providerId) {
        case 'vercel': {
          const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`
            }
          });
          const data = await response.json();
          return data.readyState || 'unknown';
        }
        case 'netlify': {
          const response = await fetch(`https://api.netlify.com/api/v1/deploys/${deploymentId}`, {
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`
            }
          });
          const data = await response.json();
          return data.state || 'unknown';
        }
        default:
          return 'unknown';
      }
    } catch {
      return 'unknown';
    }
  }
}

export const deploymentService = new DeploymentService();
