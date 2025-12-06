import React from 'react';
import type { Task } from '../types/projectGenerator';
import './ErrorRecoveryPanel.css';

interface ErrorRecoveryPanelProps {
  task: Task;
  onRetry: (taskId: string, modifications?: string) => Promise<void>;
  onSkip: (taskId: string) => Promise<void>;
  onModify: (taskId: string) => void;
}

/**
 * Component for displaying task errors and recovery options
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */
export const ErrorRecoveryPanel: React.FC<ErrorRecoveryPanelProps> = ({
  task,
  onRetry,
  onSkip,
  onModify,
}) => {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [isSkipping, setIsSkipping] = React.useState(false);
  const [showModifyInput, setShowModifyInput] = React.useState(false);
  const [modifications, setModifications] = React.useState('');
  const modifyTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  if (task.status !== 'failed' || !task.result?.error) {
    return null;
  }

  const errorMessage = task.result.error;
  const suggestions = getErrorSuggestions(errorMessage);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry(task.id, modifications || undefined);
      setModifications('');
      setShowModifyInput(false);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await onSkip(task.id);
    } finally {
      setIsSkipping(false);
    }
  };

  const handleModifyClick = () => {
    setShowModifyInput(true);
    onModify(task.id);
    // Focus the textarea after it's shown
    setTimeout(() => modifyTextareaRef.current?.focus(), 0);
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to retry
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isRetrying && !isSkipping) {
      e.preventDefault();
      handleRetry();
    }
    // Ctrl/Cmd + S to skip
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && !isRetrying && !isSkipping) {
      e.preventDefault();
      handleSkip();
    }
  };

  return (
    <div 
      className="error-recovery-panel"
      onKeyDown={handleKeyDown}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-header">
        <span className="error-icon">⚠️</span>
        <h4>Task Failed: {task.number} {task.description}</h4>
      </div>

      <div className="error-message">
        <strong>Error:</strong>
        <pre>{errorMessage}</pre>
      </div>

      {task.result.commandsRun && task.result.commandsRun.length > 0 && (
        <div className="error-commands">
          <strong>Failed Commands:</strong>
          {task.result.commandsRun
            .filter(cmd => cmd.exitCode !== 0)
            .map((cmd, idx) => (
              <div key={idx} className="failed-command">
                <code>{cmd.command}</code>
                {cmd.stderr && (
                  <pre className="command-stderr">{cmd.stderr}</pre>
                )}
              </div>
            ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="error-suggestions">
          <strong>Suggestions:</strong>
          <ul>
            {suggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {showModifyInput && (
        <div className="modify-input">
          <label htmlFor="modifications">
            Describe modifications to apply before retrying:
          </label>
          <textarea
            ref={modifyTextareaRef}
            id="modifications"
            value={modifications}
            onChange={(e) => setModifications(e.target.value)}
            placeholder="E.g., 'Use a different package name' or 'Skip the database setup'"
            rows={3}
            aria-label="Task modification instructions"
          />
        </div>
      )}

      <div className="recovery-actions">
        <button
          className="retry-button"
          onClick={handleRetry}
          disabled={isRetrying || isSkipping}
          aria-label="Retry task (Ctrl+Enter)"
          title="Retry task (Ctrl+Enter)"
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </button>

        <button
          className="modify-button"
          onClick={handleModifyClick}
          disabled={isRetrying || isSkipping}
          aria-label="Modify task and retry"
          title="Modify task and retry"
        >
          Modify & Retry
        </button>

        <button
          className="skip-button"
          onClick={handleSkip}
          disabled={isRetrying || isSkipping}
          aria-label="Skip this task (Ctrl+S)"
          title="Skip this task (Ctrl+S)"
        >
          {isSkipping ? 'Skipping...' : 'Skip Task'}
        </button>
      </div>

      <div className="recovery-help">
        <p>
          <strong>Need help?</strong> You can retry the task as-is, modify the approach
          and retry, or skip this task and continue with the next one.
        </p>
      </div>
    </div>
  );
};

/**
 * Analyze error message and provide helpful suggestions
 * Implements error suggestion logic based on common error patterns
 */
function getErrorSuggestions(errorMessage: string): string[] {
  const suggestions: string[] = [];
  const lowerError = errorMessage.toLowerCase();

  // Network/connectivity errors
  if (lowerError.includes('enotfound') || lowerError.includes('network') || lowerError.includes('timeout')) {
    suggestions.push('Check your internet connection');
    suggestions.push('Verify that the package registry is accessible');
    suggestions.push('Try again in a few moments');
  }

  // Permission errors
  if (lowerError.includes('eacces') || lowerError.includes('permission denied') || lowerError.includes('eperm')) {
    suggestions.push('You may need elevated permissions (try with sudo on Unix systems)');
    suggestions.push('Check file/directory permissions');
    suggestions.push('Ensure you have write access to the project directory');
  }

  // Module/package not found
  if (lowerError.includes('cannot find module') || lowerError.includes('module not found') || lowerError.includes('enoent')) {
    suggestions.push('The required package may not be installed');
    suggestions.push('Try running the installation commands first');
    suggestions.push('Check if the package name is correct');
  }

  // Syntax errors
  if (lowerError.includes('syntaxerror') || lowerError.includes('unexpected token')) {
    suggestions.push('There may be a syntax error in the generated code');
    suggestions.push('Try modifying the task to fix the syntax issue');
  }

  // Port already in use
  if (lowerError.includes('eaddrinuse') || lowerError.includes('port') && lowerError.includes('already')) {
    suggestions.push('The port is already in use by another process');
    suggestions.push('Stop the other process or use a different port');
  }

  // Dependency conflicts
  if (lowerError.includes('conflict') || lowerError.includes('peer dep')) {
    suggestions.push('There may be dependency version conflicts');
    suggestions.push('Try updating package versions or resolving conflicts manually');
  }

  // Command not found
  if (lowerError.includes('command not found') || lowerError.includes('is not recognized')) {
    suggestions.push('The required command/tool may not be installed');
    suggestions.push('Install the necessary tools for your project stack');
  }

  // Out of memory
  if (lowerError.includes('out of memory') || lowerError.includes('heap')) {
    suggestions.push('The operation ran out of memory');
    suggestions.push('Try closing other applications or increasing memory limits');
  }

  // Generic fallback
  if (suggestions.length === 0) {
    suggestions.push('Review the error message above for details');
    suggestions.push('Try modifying the task approach if the error persists');
    suggestions.push('You can skip this task and continue with others');
  }

  return suggestions;
}
