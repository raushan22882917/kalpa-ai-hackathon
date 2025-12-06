/**
 * Preview Detection Service
 * Automatically detects when dev servers start in terminal and opens preview
 */

export interface DevServerInfo {
  url: string;
  port: number;
  framework?: string;
  timestamp: number;
}

type PreviewCallback = (serverInfo: DevServerInfo) => void;

class PreviewDetectionService {
  private callbacks: PreviewCallback[] = [];
  private detectedServers: Map<string, DevServerInfo> = new Map();
  private autoOpenEnabled: boolean = true;

  /**
   * Patterns to detect dev server starts in terminal output
   */
  private readonly patterns = [
    // Vite
    { regex: /Local:\s+(https?:\/\/localhost:\d+)/i, framework: 'Vite' },
    { regex: /➜\s+Local:\s+(https?:\/\/localhost:\d+)/i, framework: 'Vite' },
    
    // React (Create React App)
    { regex: /Local:\s+(https?:\/\/localhost:\d+)/i, framework: 'React' },
    { regex: /On Your Network:\s+(https?:\/\/\d+\.\d+\.\d+\.\d+:\d+)/i, framework: 'React' },
    
    // Next.js
    { regex: /ready - started server on .+, url: (https?:\/\/localhost:\d+)/i, framework: 'Next.js' },
    { regex: /Local:\s+(https?:\/\/localhost:\d+)/i, framework: 'Next.js' },
    
    // Vue CLI
    { regex: /App running at:\s*\n\s*- Local:\s+(https?:\/\/localhost:\d+)/i, framework: 'Vue' },
    
    // Angular
    { regex: /Local:\s+(https?:\/\/localhost:\d+)/i, framework: 'Angular' },
    { regex: /Angular Live Development Server is listening on localhost:\d+/i, framework: 'Angular' },
    
    // Express/Node
    { regex: /Server (?:is )?(?:running|listening) (?:on|at) (?:port )?(\d+)/i, framework: 'Express' },
    { regex: /listening on .*:(\d+)/i, framework: 'Node' },
    
    // Generic localhost patterns
    { regex: /(https?:\/\/localhost:\d+)/i, framework: 'Web Server' },
    { regex: /(https?:\/\/127\.0\.0\.1:\d+)/i, framework: 'Web Server' },
  ];

  /**
   * Subscribe to dev server detection events
   */
  subscribe(callback: PreviewCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Analyze terminal output for dev server starts
   */
  analyzeTerminalOutput(output: string): void {
    for (const pattern of this.patterns) {
      const match = output.match(pattern.regex);
      if (match) {
        let url: string;
        
        if (match[1]?.startsWith('http')) {
          url = match[1];
        } else if (match[1]) {
          // Port number only
          url = `http://localhost:${match[1]}`;
        } else {
          continue;
        }

        // Clean up URL (remove trailing slashes, etc.)
        url = url.trim().replace(/\/$/, '');

        // Check if this is a new server or recently restarted
        const existing = this.detectedServers.get(url);
        const now = Date.now();
        
        // Only notify if it's a new server or hasn't been seen in 5 seconds
        if (!existing || (now - existing.timestamp) > 5000) {
          const portMatch = url.match(/:(\d+)/);
          const port = portMatch ? parseInt(portMatch[1]) : 80;

          const serverInfo: DevServerInfo = {
            url,
            port,
            framework: pattern.framework,
            timestamp: now,
          };

          this.detectedServers.set(url, serverInfo);

          // Auto-open preview if enabled
          if (this.autoOpenEnabled) {
            this.callbacks.forEach(callback => callback(serverInfo));
          }
        }
        
        break;
      }
    }
  }

  /**
   * Manually trigger preview for a specific URL
   */
  openPreview(url: string, framework?: string): void {
    const portMatch = url.match(/:(\d+)/);
    const port = portMatch ? parseInt(portMatch[1]) : 80;

    const serverInfo: DevServerInfo = {
      url,
      port,
      framework,
      timestamp: Date.now(),
    };

    this.detectedServers.set(url, serverInfo);
    this.callbacks.forEach(callback => callback(serverInfo));
  }

  /**
   * Get all detected servers
   */
  getDetectedServers(): DevServerInfo[] {
    return Array.from(this.detectedServers.values());
  }

  /**
   * Enable or disable auto-open preview
   */
  setAutoOpen(enabled: boolean): void {
    this.autoOpenEnabled = enabled;
  }

  /**
   * Check if auto-open is enabled
   */
  isAutoOpenEnabled(): boolean {
    return this.autoOpenEnabled;
  }

  /**
   * Reset detected servers (useful for testing or manual reset)
   */
  reset(): void {
    this.detectedServers.clear();
  }
}

export const previewDetectionService = new PreviewDetectionService();
