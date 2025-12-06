import React from 'react';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onOpenProject: () => void;
  onCloneRepository: () => void;
  onConnectTo: () => void;
  onProjectClick?: (projectPath: string) => void;
  recentProjects?: Array<{
    name: string;
    path: string;
  }>;
  theme?: 'light' | 'dark';
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onOpenProject,
  onCloneRepository,
  onConnectTo,
  onProjectClick,
  recentProjects = [],
  theme = 'dark'
}) => {
  return (
    <div className={`welcome-screen ${theme}`}>
      <div className="welcome-content">
        {/* Logo and Title */}
        <div className="welcome-header">
          <div className="welcome-logo">
            <img src="/logo.png" alt="Kalpa AI Logo" className="logo-image" />
          </div>
          <h1 className="welcome-title">Kalpa AI</h1>
          <p className="welcome-subtitle">An agentic IDE that helps you do your best work.</p>
        </div>

        {/* Get Started Section */}
        <div className="welcome-section">
          <h2 className="section-title">Get started</h2>
          <button className="primary-action-btn" onClick={onOpenProject}>
            <span className="btn-icon">📁</span>
            Open a project
          </button>
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="welcome-section">
            <h3 className="section-subtitle">Recent projects</h3>
            <div className="recent-projects-list">
              {recentProjects.map((project, index) => (
                <div 
                  key={index} 
                  className="recent-project-item clickable"
                  onClick={() => onProjectClick?.(project.path)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onProjectClick?.(project.path);
                    }
                  }}
                >
                  <span className="project-icon">📁</span>
                  <div className="project-info">
                    <span className="project-name">{project.name}</span>
                    <span className="project-path">{project.path}</span>
                  </div>
                  <span className="project-arrow">→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="welcome-actions">
          <button className="action-btn" onClick={onCloneRepository}>
            <span className="btn-icon">🔗</span>
            Clone repository
          </button>
          <button className="action-btn" onClick={onConnectTo}>
            <span className="btn-icon">🔌</span>
            Connect to
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
