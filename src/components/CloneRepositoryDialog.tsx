import React, { useState } from 'react';
import './CloneRepositoryDialog.css';
import { gitCloneService, type CloneProgress } from '../services/gitCloneService';

interface CloneRepositoryDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (path: string) => void;
}

const CloneRepositoryDialog: React.FC<CloneRepositoryDialogProps> = ({
  visible,
  onClose,
  onSuccess
}) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [progress, setProgress] = useState<CloneProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClone = async () => {
    if (!repoUrl.trim()) {
      setError('Please enter a repository URL');
      return;
    }

    setError(null);
    setIsCloning(true);

    try {
      const result = await gitCloneService.cloneRepository(
        repoUrl,
        undefined,
        (prog) => setProgress(prog)
      );

      if (result.success && result.path) {
        onSuccess(result.path);
        handleClose();
      } else {
        setError(result.error || 'Clone failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clone failed');
    } finally {
      setIsCloning(false);
      setProgress(null);
    }
  };

  const handleClose = () => {
    if (!isCloning) {
      setRepoUrl('');
      setError(null);
      setProgress(null);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCloning) {
      handleClone();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!visible) return null;

  return (
    <div className="clone-dialog-overlay" onClick={handleClose}>
      <div className="clone-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="clone-dialog-header">
          <h2>Clone Repository</h2>
          <button className="close-btn" onClick={handleClose} disabled={isCloning}>
            ✕
          </button>
        </div>

        <div className="clone-dialog-content">
          <div className="input-group">
            <label htmlFor="repo-url">Repository URL</label>
            <input
              id="repo-url"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://github.com/username/repository"
              disabled={isCloning}
              autoFocus
            />
            <div className="input-hint">
              Enter a GitHub repository URL (HTTPS or SSH)
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {progress && (
            <div className="progress-container">
              <div className="progress-message">{progress.message}</div>
              {progress.percentage !== undefined && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="examples">
            <div className="examples-title">Examples:</div>
            <div className="example-item">https://github.com/facebook/react</div>
            <div className="example-item">git@github.com:microsoft/vscode.git</div>
            <div className="example-item">github.com/nodejs/node</div>
          </div>
        </div>

        <div className="clone-dialog-footer">
          <button
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={isCloning}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleClone}
            disabled={isCloning || !repoUrl.trim()}
          >
            {isCloning ? 'Cloning...' : 'Clone'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CloneRepositoryDialog;
