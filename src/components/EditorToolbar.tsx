/**
 * Editor Toolbar Component
 * Provides quick actions like Run, Debug, Format, etc.
 */

import { useState } from 'react';
import './EditorToolbar.css';

interface EditorToolbarProps {
  fileName?: string;
  language?: string;
  lineNumber?: number;
  columnNumber?: number;
  onRun?: () => void;
  isRunning?: boolean;
  viewMode?: 'code' | 'preview';
  onViewModeChange?: (mode: 'code' | 'preview') => void;
  previewUrl?: string;
}

const EditorToolbar = ({
  fileName,
  language = 'plaintext',
  lineNumber = 1,
  columnNumber = 1,
  onRun,
  isRunning = false,
  viewMode = 'code',
  onViewModeChange,
  previewUrl,
}: EditorToolbarProps) => {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const getLanguageIcon = (lang: string): string => {
    const icons: Record<string, string> = {
      javascript: '📜',
      typescript: '📘',
      python: '🐍',
      java: '☕',
      cpp: '⚙️',
      c: '⚙️',
      go: '🐹',
      rust: '🦀',
      ruby: '💎',
      php: '🐘',
      html: '🌐',
      css: '🎨',
      json: '📋',
      markdown: '📝',
      yaml: '📄',
      xml: '📄',
      sql: '🗄️',
      shell: '🐚',
      bash: '🐚',
      powershell: '⚡',
    };
    return icons[lang.toLowerCase()] || '📄';
  };

  const canRun = (lang: string): boolean => {
    const runnableLanguages = [
      'javascript',
      'typescript',
      'python',
      'java',
      'cpp',
      'c',
      'go',
      'rust',
      'ruby',
      'php',
      'shell',
      'bash',
      'powershell',
    ];
    return runnableLanguages.includes(lang.toLowerCase());
  };



  return (
    <div className="editor-toolbar">
      <div className="toolbar-left">
        {/* File Name */}
        {fileName && (
          <div className="toolbar-item file-name">
            <span className="file-icon">📄</span>
            <span className="file-name-text">{fileName}</span>
          </div>
        )}

        {/* Language Indicator */}
        <div 
          className="toolbar-item language-indicator"
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          title="Select Language"
        >
          <span className="language-icon">{getLanguageIcon(language)}</span>
          <span className="language-name">{language}</span>
          <span className="dropdown-arrow">▼</span>
          
          {showLanguageMenu && (
            <div className="language-menu">
              <div className="language-menu-item">JavaScript</div>
              <div className="language-menu-item">TypeScript</div>
              <div className="language-menu-item">Python</div>
              <div className="language-menu-item">Java</div>
              <div className="language-menu-item">C++</div>
              <div className="language-menu-item">Go</div>
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-center">
        {/* Run Button */}
        {canRun(language) && onRun && (
          <button
            className={`toolbar-button run-button ${isRunning ? 'running' : ''}`}
            onClick={onRun}
            disabled={isRunning}
            title="Run Code (Ctrl+Enter)"
          >
            {isRunning ? (
              <>
                <span className="button-icon spinning">⟳</span>
                <span className="button-text">Running...</span>
              </>
            ) : (
              <>
                <span className="button-icon">▶</span>
                <span className="button-text">Run</span>
              </>
            )}
          </button>
        )}
      </div>

      <div className="toolbar-right">
        {/* View Mode Toggle - Only show if preview URL is available */}
        {previewUrl && onViewModeChange && (
          <div className="toolbar-item view-mode-toggle">
            <button
              className={`view-mode-button ${viewMode === 'code' ? 'active' : ''}`}
              onClick={() => onViewModeChange('code')}
              title="Code View"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.708 5.578L2.061 8.224l2.647 2.646-.708.708-3-3V7.87l3-3 .708.708zm7-.708L11 5.578l2.647 2.646L11 10.87l.708.708 3-3V7.87l-3-3zM4.908 13l.894.448 5-10L9.908 3l-5 10z"/>
              </svg>
              <span>Code</span>
            </button>
            <button
              className={`view-mode-button ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => onViewModeChange('preview')}
              title="Preview"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1.5 1h13l.5.5v13l-.5.5h-13l-.5-.5v-13l.5-.5zM2 2v12h12V2H2zm2 2h8v1H4V4zm0 2h8v1H4V6zm0 2h5v1H4V8z"/>
              </svg>
              <span>Preview</span>
            </button>
          </div>
        )}

        {/* Cursor Position */}
        <div className="toolbar-item cursor-position" title="Line:Column">
          <span className="position-icon">📍</span>
          <span className="position-text">
            Ln {lineNumber}, Col {columnNumber}
          </span>
        </div>

        {/* Encoding */}
        <div className="toolbar-item encoding" title="File Encoding">
          <span>UTF-8</span>
        </div>

        {/* End of Line */}
        <div className="toolbar-item eol" title="End of Line Sequence">
          <span>LF</span>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
