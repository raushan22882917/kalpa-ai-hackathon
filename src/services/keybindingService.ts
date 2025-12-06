import type * as Monaco from 'monaco-editor';

export interface KeybindingAction {
  id: string;
  label: string;
  keybinding: number;
  handler: () => void;
}

export interface KeybindingConfig {
  [actionId: string]: {
    label: string;
    keybinding: number;
  };
}

/**
 * Standard VS Code keybindings
 */
export const createStandardKeybindings = (
  monaco: typeof Monaco,
  editor: Monaco.editor.IStandaloneCodeEditor
): KeybindingAction[] => {
  const KeyMod = monaco.KeyMod;
  const KeyCode = monaco.KeyCode;

  return [
    {
      id: 'editor.action.formatDocument',
      label: 'Format Document',
      keybinding: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyF,
      handler: () => {
        editor.getAction('editor.action.formatDocument')?.run();
      },
    },
    {
      id: 'editor.action.commentLine',
      label: 'Toggle Line Comment',
      keybinding: KeyMod.CtrlCmd | KeyCode.Slash,
      handler: () => {
        editor.getAction('editor.action.commentLine')?.run();
      },
    },
    {
      id: 'editor.action.quickCommand',
      label: 'Command Palette',
      keybinding: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyP,
      handler: () => {
        editor.trigger('keyboard', 'editor.action.quickCommand', {});
      },
    },
    {
      id: 'editor.action.find',
      label: 'Find',
      keybinding: KeyMod.CtrlCmd | KeyCode.KeyF,
      handler: () => {
        editor.getAction('actions.find')?.run();
      },
    },
    {
      id: 'editor.action.replace',
      label: 'Replace',
      keybinding: KeyMod.CtrlCmd | KeyCode.KeyH,
      handler: () => {
        editor.getAction('editor.action.startFindReplaceAction')?.run();
      },
    },
    {
      id: 'editor.action.selectAll',
      label: 'Select All',
      keybinding: KeyMod.CtrlCmd | KeyCode.KeyA,
      handler: () => {
        editor.getAction('editor.action.selectAll')?.run();
      },
    },
    {
      id: 'editor.action.copyLinesDownAction',
      label: 'Copy Line Down',
      keybinding: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyD,
      handler: () => {
        editor.getAction('editor.action.copyLinesDownAction')?.run();
      },
    },
    {
      id: 'editor.action.moveLinesUpAction',
      label: 'Move Line Up',
      keybinding: KeyMod.Alt | KeyCode.UpArrow,
      handler: () => {
        editor.getAction('editor.action.moveLinesUpAction')?.run();
      },
    },
    {
      id: 'editor.action.moveLinesDownAction',
      label: 'Move Line Down',
      keybinding: KeyMod.Alt | KeyCode.DownArrow,
      handler: () => {
        editor.getAction('editor.action.moveLinesDownAction')?.run();
      },
    },
  ];
};

/**
 * Register keybindings with the Monaco editor
 */
export const registerKeybindings = (
  monaco: typeof Monaco,
  editor: Monaco.editor.IStandaloneCodeEditor
): void => {
  const keybindings = createStandardKeybindings(monaco, editor);

  keybindings.forEach((binding) => {
    editor.addAction({
      id: binding.id,
      label: binding.label,
      keybindings: [binding.keybinding],
      run: binding.handler,
    });
  });
};

/**
 * Get the current keybinding configuration
 */
export const getKeybindingConfig = (
  monaco: typeof Monaco
): KeybindingConfig => {
  const KeyMod = monaco.KeyMod;
  const KeyCode = monaco.KeyCode;

  return {
    'editor.action.formatDocument': {
      label: 'Format Document',
      keybinding: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyF,
    },
    'editor.action.commentLine': {
      label: 'Toggle Line Comment',
      keybinding: KeyMod.CtrlCmd | KeyCode.Slash,
    },
    'editor.action.quickCommand': {
      label: 'Command Palette',
      keybinding: KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyP,
    },
    'editor.action.find': {
      label: 'Find',
      keybinding: KeyMod.CtrlCmd | KeyCode.KeyF,
    },
    'editor.action.replace': {
      label: 'Replace',
      keybinding: KeyMod.CtrlCmd | KeyCode.KeyH,
    },
  };
};

/**
 * Keybinding customization service
 */
class KeybindingCustomizationService {
  private monaco: typeof Monaco | null = null;
  private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  private customKeybindings: Record<string, string> = {};

  initialize(monaco: typeof Monaco, editor: Monaco.editor.IStandaloneCodeEditor) {
    this.monaco = monaco;
    this.editor = editor;
    this.loadCustomKeybindings();
  }

  /**
   * Load custom keybindings from localStorage
   */
  private loadCustomKeybindings() {
    try {
      const saved = localStorage.getItem('customKeybindings');
      if (saved) {
        this.customKeybindings = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load custom keybindings', e);
    }
  }

  /**
   * Save custom keybindings to localStorage
   */
  saveCustomKeybindings(keybindings: Record<string, string>) {
    this.customKeybindings = keybindings;
    localStorage.setItem('customKeybindings', JSON.stringify(keybindings));
  }

  /**
   * Get custom keybindings
   */
  getCustomKeybindings(): Record<string, string> {
    return { ...this.customKeybindings };
  }

  /**
   * Apply custom keybindings to the editor
   */
  applyCustomKeybindings() {
    if (!this.monaco || !this.editor) {
      console.error('Monaco or editor not initialized');
      return;
    }

    // Re-register keybindings with custom values
    registerKeybindings(this.monaco, this.editor);
  }

  /**
   * Reset keybindings to defaults
   */
  resetToDefaults() {
    this.customKeybindings = {};
    localStorage.removeItem('customKeybindings');
    if (this.monaco && this.editor) {
      registerKeybindings(this.monaco, this.editor);
    }
  }
}

export const keybindingCustomizationService = new KeybindingCustomizationService();
