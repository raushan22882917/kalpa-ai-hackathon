import type * as Monaco from 'monaco-editor';

export type ThemeName = 'light' | 'dark' | 'high-contrast';

export interface ThemeColors {
  background: string;
  foreground: string;
  lineHighlight: string;
  cursor: string;
  selection: string;
  border: string;
  panelBackground: string;
  panelForeground: string;
  buttonBackground: string;
  buttonForeground: string;
  inputBackground: string;
  inputForeground: string;
}

export interface ThemeConfig {
  name: ThemeName;
  displayName: string;
  colors: ThemeColors;
  monacoTheme: string;
}

// Light theme preset
export const LIGHT_THEME: ThemeConfig = {
  name: 'light',
  displayName: 'Light',
  colors: {
    background: '#FFFFFF',
    foreground: '#000000',
    lineHighlight: '#F0F0F0',
    cursor: '#000000',
    selection: '#ADD6FF',
    border: '#E0E0E0',
    panelBackground: '#F5F5F5',
    panelForeground: '#000000',
    buttonBackground: '#007ACC',
    buttonForeground: '#FFFFFF',
    inputBackground: '#FFFFFF',
    inputForeground: '#000000',
  },
  monacoTheme: 'light-custom',
};

// Dark theme preset
export const DARK_THEME: ThemeConfig = {
  name: 'dark',
  displayName: 'Dark',
  colors: {
    background: '#1E1E1E',
    foreground: '#D4D4D4',
    lineHighlight: '#2A2A2A',
    cursor: '#AEAFAD',
    selection: '#264F78',
    border: '#3E3E3E',
    panelBackground: '#252526',
    panelForeground: '#CCCCCC',
    buttonBackground: '#0E639C',
    buttonForeground: '#FFFFFF',
    inputBackground: '#3C3C3C',
    inputForeground: '#CCCCCC',
  },
  monacoTheme: 'vs-dark-custom',
};

// High contrast theme preset
export const HIGH_CONTRAST_THEME: ThemeConfig = {
  name: 'high-contrast',
  displayName: 'High Contrast',
  colors: {
    background: '#000000',
    foreground: '#FFFFFF',
    lineHighlight: '#1A1A1A',
    cursor: '#FFFFFF',
    selection: '#FFFF00',
    border: '#6FC3DF',
    panelBackground: '#000000',
    panelForeground: '#FFFFFF',
    buttonBackground: '#0E639C',
    buttonForeground: '#FFFFFF',
    inputBackground: '#000000',
    inputForeground: '#FFFFFF',
  },
  monacoTheme: 'hc-black',
};

export const THEME_PRESETS: Record<ThemeName, ThemeConfig> = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
  'high-contrast': HIGH_CONTRAST_THEME,
};

class ThemeService {
  private currentTheme: ThemeConfig = DARK_THEME;
  private editor: any = null;

  initialize(_monaco: typeof Monaco, editor: any) {
    this.editor = editor;
  }

  setTheme(themeName: ThemeName) {
    const theme = THEME_PRESETS[themeName];
    if (!theme) {
      console.error(`Theme "${themeName}" not found`);
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
  }

  getCurrentTheme(): ThemeConfig {
    return this.currentTheme;
  }

  private applyTheme(theme: ThemeConfig) {
    // Apply Monaco editor theme
    if (this.editor) {
      this.editor.updateOptions({
        theme: theme.monacoTheme,
      });
    }

    // Apply CSS variables for UI components
    this.applyCSSVariables(theme.colors);
  }

  private applyCSSVariables(colors: ThemeColors) {
    const root = document.documentElement;
    root.style.setProperty('--theme-background', colors.background);
    root.style.setProperty('--theme-foreground', colors.foreground);
    root.style.setProperty('--theme-line-highlight', colors.lineHighlight);
    root.style.setProperty('--theme-cursor', colors.cursor);
    root.style.setProperty('--theme-selection', colors.selection);
    root.style.setProperty('--theme-border', colors.border);
    root.style.setProperty('--theme-panel-background', colors.panelBackground);
    root.style.setProperty('--theme-panel-foreground', colors.panelForeground);
    root.style.setProperty('--theme-button-background', colors.buttonBackground);
    root.style.setProperty('--theme-button-foreground', colors.buttonForeground);
    root.style.setProperty('--theme-input-background', colors.inputBackground);
    root.style.setProperty('--theme-input-foreground', colors.inputForeground);
  }

  // Get all available themes
  getAvailableThemes(): ThemeConfig[] {
    return Object.values(THEME_PRESETS);
  }
}

export const themeService = new ThemeService();
