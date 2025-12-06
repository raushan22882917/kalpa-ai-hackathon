import React, { useState, useEffect } from 'react';
import { getContextManager } from '../services/contextManagerService';
import type { SessionSummary, ProjectSession } from '../types/projectGenerator';
import './SessionManager.css';

interface SessionManagerProps {
  onSessionSelect: (sessionId: string) => void;
  onClose: () => void;
  currentSessionId?: string | null;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  onSessionSelect,
  onClose,
  currentSessionId
}) => {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<ProjectSession | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  
  const contextManager = getContextManager();

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const sessionList = await contextManager.listSessions();
      setSessions(sessionList);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionClick = async (sessionId: string) => {
    if (expandedSessionId === sessionId) {
      // Collapse if already expanded
      setExpandedSessionId(null);
      setExpandedSession(null);
    } else {
      // Expand and load full session details
      try {
        const session = await contextManager.getSession(sessionId);
        setExpandedSessionId(sessionId);
        setExpandedSession(session);
      } catch (error) {
        console.error('Failed to load session details:', error);
      }
    }
  };

  const handleResumeSession = (sessionId: string) => {
    onSessionSelect(sessionId);
  };

  const handleDeleteClick = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteConfirmId(sessionId);
  };

  const handleDeleteConfirm = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await contextManager.deleteSession(sessionId);
      await loadSessions();
      setDeleteConfirmId(null);
      
      // If we deleted the current session, notify parent
      if (sessionId === currentSessionId) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleDeleteCancel = (event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteConfirmId(null);
  };

  const handleExportSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const session = await contextManager.getSession(sessionId);
      const exportData = JSON.stringify(session, null, 2);
      
      // Create a download link
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${session.plan.projectName.replace(/\s+/g, '-')}-${sessionId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportStatus(`Exported: ${session.plan.projectName}`);
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('Failed to export session:', error);
      setExportStatus('Export failed');
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const handleImportSession = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const session: ProjectSession = JSON.parse(text);
      
      // Validate session structure
      if (!session.id || !session.plan || !session.selectedStack) {
        throw new Error('Invalid session file format');
      }

      // Save the imported session
      await contextManager.saveSession(session.id, session);
      await loadSessions();
      
      setExportStatus(`Imported: ${session.plan.projectName}`);
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('Failed to import session:', error);
      setExportStatus('Import failed');
      setTimeout(() => setExportStatus(null), 3000);
    }
    
    // Reset file input
    event.target.value = '';
  };

  const formatPhase = (phase: string): string => {
    return phase
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="session-manager">
      <div className="session-manager-header">
        <h2>Project Sessions</h2>
        <div className="session-manager-actions">
          <label className="import-button">
            <input
              type="file"
              accept=".json"
              onChange={handleImportSession}
              style={{ display: 'none' }}
            />
            Import
          </label>
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        </div>
      </div>

      {exportStatus && (
        <div className="export-status">{exportStatus}</div>
      )}

      {isLoading ? (
        <div className="session-loading">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="session-empty">
          <p>No saved sessions yet.</p>
          <p>Start a new project to create your first session!</p>
        </div>
      ) : (
        <div className="session-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`session-card ${expandedSessionId === session.id ? 'expanded' : ''} ${
                session.id === currentSessionId ? 'current' : ''
              }`}
              onClick={() => handleSessionClick(session.id)}
            >
              <div className="session-card-header">
                <div className="session-info">
                  <h3 className="session-name">{session.projectName}</h3>
                  <div className="session-meta">
                    <span className="session-phase">{formatPhase(session.phase)}</span>
                    <span className="session-progress">{session.taskProgress}</span>
                    <span className="session-date">{formatDate(session.lastUpdated)}</span>
                  </div>
                </div>
                {session.id === currentSessionId && (
                  <span className="current-badge">Current</span>
                )}
              </div>

              {session.selectedStack && (
                <div className="session-stack">
                  <span className="stack-label">Stack:</span>
                  <span className="stack-name">{session.selectedStack.name}</span>
                  <span className="stack-level">Level {session.selectedStack.levelNumber}</span>
                </div>
              )}

              {session.selectedTheme && (
                <div className="session-theme">
                  <span className="theme-label">Theme:</span>
                  <span className="theme-name">{session.selectedTheme.name}</span>
                  <div className="theme-colors">
                    <span
                      className="theme-color"
                      style={{ backgroundColor: session.selectedTheme.primary }}
                      title="Primary"
                    />
                    <span
                      className="theme-color"
                      style={{ backgroundColor: session.selectedTheme.secondary }}
                      title="Secondary"
                    />
                    <span
                      className="theme-color"
                      style={{ backgroundColor: session.selectedTheme.accent }}
                      title="Accent"
                    />
                  </div>
                </div>
              )}

              {expandedSessionId === session.id && expandedSession && (
                <div className="session-details">
                  <div className="session-description">
                    <strong>Description:</strong>
                    <p>{expandedSession.description}</p>
                  </div>

                  {expandedSession.generatedImages && expandedSession.generatedImages.length > 0 && (
                    <div className="session-images">
                      <strong>Generated Images:</strong>
                      <div className="image-grid">
                        {expandedSession.generatedImages.map((image) => (
                          <div key={image.id} className="image-preview">
                            <img
                              src={image.dataUrl || image.url}
                              alt={`${image.type} for ${session.projectName}`}
                              className="preview-image"
                            />
                            <span className="image-type">{image.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {expandedSession.plan.tasks && (
                    <div className="session-tasks-summary">
                      <strong>Tasks:</strong>
                      <div className="task-status-bar">
                        {expandedSession.plan.tasks.tasks.map((task) => (
                          <div
                            key={task.id}
                            className={`task-indicator ${task.status}`}
                            title={`${task.number}: ${task.description} (${task.status})`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="session-actions">
                {session.id !== currentSessionId && (
                  <button
                    className="resume-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResumeSession(session.id);
                    }}
                  >
                    Resume
                  </button>
                )}
                <button
                  className="export-button"
                  onClick={(e) => handleExportSession(session.id, e)}
                >
                  Export
                </button>
                {deleteConfirmId === session.id ? (
                  <div className="delete-confirm">
                    <button
                      className="confirm-delete-button"
                      onClick={(e) => handleDeleteConfirm(session.id, e)}
                    >
                      Confirm
                    </button>
                    <button
                      className="cancel-delete-button"
                      onClick={handleDeleteCancel}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="delete-button"
                    onClick={(e) => handleDeleteClick(session.id, e)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
