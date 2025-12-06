/**
 * Detects browser capabilities for terminal features
 */
export const detectTerminalCapabilities = (): {
  supported: boolean;
  features: {
    webWorkers: boolean;
    sharedArrayBuffer: boolean;
    webAssembly: boolean;
  };
} => {
  const features = {
    webWorkers: typeof Worker !== 'undefined',
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
    webAssembly: typeof WebAssembly !== 'undefined',
  };

  // Terminal is supported if all required features are available
  const supported = features.webWorkers && features.webAssembly;

  return {
    supported,
    features,
  };
};

/**
 * Terminal state interface
 */
export interface TerminalState {
  isInitialized: boolean;
  isVisible: boolean;
  capabilities: ReturnType<typeof detectTerminalCapabilities>;
}

/**
 * Initialize terminal with detected capabilities
 */
export const initializeTerminal = (): TerminalState => {
  const capabilities = detectTerminalCapabilities();

  return {
    isInitialized: capabilities.supported,
    isVisible: false,
    capabilities,
  };
};

/**
 * Check if terminal features are supported in the current browser
 */
export const isTerminalSupported = (): boolean => {
  const capabilities = detectTerminalCapabilities();
  return capabilities.supported;
};
