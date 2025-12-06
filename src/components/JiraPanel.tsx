import React, { useState, useEffect } from 'react';
import { jiraService, JiraIssue, JiraProject } from '../services/jiraService';
import './JiraPanel.css';

interface JiraPanelProps {
  theme?: 'light' | 'dark';
}

export const JiraPanel: React.FC<JiraPanelProps> = ({ theme = 'dark' }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(null);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [myIssues, setMyIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [view, setView] = useState<'projects' | 'myIssues'>('projects');

  // Configuration form
  const [domain, setDomain] = useState('');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');

  // Create issue form
  const [newIssueSummary, setNewIssueSummary] = useState('');
  const [newIssueDescription, setNewIssueDescription] = useState('');
  const [newIssueType, setNewIssueType] = useState('Task');
  const [newIssuePriority, setNewIssuePriority] = useState('Medium');

  useEffect(() => {
    const configured = jiraService.isConfigured();
    setIsConfigured(configured);

    if (configured) {
      const config = jiraService.getConfig();
      if (config) {
        setDomain(config.domain);
        setEmail(config.email);
      }
      loadProjects();
      loadMyIssues();
    }
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    const projectList = await jiraService.getProjects();
    setProjects(projectList);
    setLoading(false);
  };

  const loadMyIssues = async () => {
    const issues = await jiraService.getMyIssues();
    setMyIssues(issues);
  };

  const handleConfigure = () => {
    if (!domain || !email || !apiToken) {
      alert('Please fill in all fields');
      return;
    }

    jiraService.configure(domain, email, apiToken);
    setIsConfigured(true);
    setShowConfig(false);
    loadProjects();
    loadMyIssues();
  };

  const handleSelectProject = async (project: JiraProject) => {
    setSelectedProject(project);
    setLoading(true);
    const projectIssues = await jiraService.getProjectIssues(project.key);
    setIssues(projectIssues);
    setLoading(false);
  };

  const handleCreateIssue = async () => {
    if (!selectedProject || !newIssueSummary) {
      alert('Please fill in required fields');
      return;
    }

    const issue = await jiraService.createIssue(
      selectedProject.key,
      newIssueSummary,
      newIssueDescription,
      newIssueType,
      newIssuePriority
    );

    if (issue) {
      setNewIssueSummary('');
      setNewIssueDescription('');
      setShowCreateIssue(false);
      // Reload issues
      const projectIssues = await jiraService.getProjectIssues(selectedProject.key);
      setIssues(projectIssues);
    }
  };

  const getStatusColor = (statusCategory: string): string => {
    switch (statusCategory) {
      case 'done':
        return '#00875a';
      case 'indeterminate':
        return '#0052cc';
      default:
        return '#6b778c';
    }
  };

  if (!isConfigured || showConfig) {
    return (
      <div className={`jira-panel ${theme}`}>
        <div className="jira-config">
          <h2>Configure Jira</h2>
          <p className="help-text">
            Enter your Jira credentials to connect your projects and issues.
          </p>

          <div className="form-group">
            <label>Jira Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="your-domain (without .atlassian.net)"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your-email@example.com"
            />
          </div>

          <div className="form-group">
            <label>API Token</label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Create in Atlassian Account Settings"
            />
            <small>
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
              >
                Create API Token
              </a>
            </small>
          </div>

          <div className="button-group">
            <button onClick={handleConfigure} className="btn-primary">
              Connect
            </button>
            {isConfigured && (
              <button onClick={() => setShowConfig(false)} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`jira-panel ${theme}`}>
      <div className="jira-header">
        <h2>Jira</h2>
        <div className="header-actions">
          <button
            onClick={() => setView('projects')}
            className={`btn-tab ${view === 'projects' ? 'active' : ''}`}
          >
            Projects
          </button>
          <button
            onClick={() => setView('myIssues')}
            className={`btn-tab ${view === 'myIssues' ? 'active' : ''}`}
          >
            My Issues
          </button>
          <button onClick={() => setShowConfig(true)} className="btn-icon" title="Settings">
            ⚙️
          </button>
        </div>
      </div>

      {view === 'projects' && (
        <div className="jira-content">
          <div className="project-list">
            <h3>Projects ({projects.length})</h3>
            {loading && !selectedProject && <div className="loading">Loading...</div>}
            {projects.map((project) => (
              <div
                key={project.id}
                className={`project-item ${selectedProject?.id === project.id ? 'selected' : ''}`}
                onClick={() => handleSelectProject(project)}
              >
                <div className="project-name">{project.name}</div>
                <div className="project-key">{project.key}</div>
              </div>
            ))}
          </div>

          {selectedProject && (
            <div className="project-details">
              <div className="project-header">
                <h3>{selectedProject.name}</h3>
                <button onClick={() => setShowCreateIssue(true)} className="btn-primary">
                  Create Issue
                </button>
              </div>

              <div className="issues-list">
                <h4>Issues ({issues.length})</h4>
                {loading ? (
                  <div className="loading">Loading issues...</div>
                ) : issues.length === 0 ? (
                  <div className="empty-state">No issues found</div>
                ) : (
                  issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="issue-item"
                      onClick={() => window.open(jiraService.getIssueUrl(issue.key), '_blank')}
                    >
                      <div className="issue-header">
                        <span className="issue-key">{issue.key}</span>
                        <span
                          className="issue-status"
                          style={{
                            backgroundColor: getStatusColor(
                              issue.fields.status.statusCategory.key
                            )
                          }}
                        >
                          {issue.fields.status.name}
                        </span>
                      </div>
                      <div className="issue-summary">{issue.fields.summary}</div>
                      <div className="issue-meta">
                        <span className="issue-type">{issue.fields.issuetype.name}</span>
                        <span className="issue-priority">{issue.fields.priority.name}</span>
                        {issue.fields.assignee && (
                          <span className="issue-assignee">
                            {issue.fields.assignee.displayName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'myIssues' && (
        <div className="my-issues">
          <h3>My Issues ({myIssues.length})</h3>
          {myIssues.length === 0 ? (
            <div className="empty-state">No issues assigned to you</div>
          ) : (
            <div className="issues-list">
              {myIssues.map((issue) => (
                <div key={issue.id} className="issue-item">
                  <div className="issue-header">
                    <span className="issue-key">{issue.key}</span>
                    <span
                      className="issue-status"
                      style={{
                        backgroundColor: getStatusColor(
                          issue.fields.status.statusCategory.key
                        )
                      }}
                    >
                      {issue.fields.status.name}
                    </span>
                  </div>
                  <div className="issue-summary">{issue.fields.summary}</div>
                  <div className="issue-meta">
                    <span className="issue-project">{issue.fields.project.name}</span>
                    <span className="issue-type">{issue.fields.issuetype.name}</span>
                  </div>
                  <a
                    href={jiraService.getIssueUrl(issue.key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-small"
                  >
                    View in Jira
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreateIssue && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowCreateIssue(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Issue in {selectedProject.name}</h3>

            <div className="form-group">
              <label>Summary *</label>
              <input
                type="text"
                value={newIssueSummary}
                onChange={(e) => setNewIssueSummary(e.target.value)}
                placeholder="Brief description of the issue"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newIssueDescription}
                onChange={(e) => setNewIssueDescription(e.target.value)}
                placeholder="Detailed description"
                rows={4}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select value={newIssueType} onChange={(e) => setNewIssueType(e.target.value)}>
                  <option value="Task">Task</option>
                  <option value="Bug">Bug</option>
                  <option value="Story">Story</option>
                  <option value="Epic">Epic</option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={newIssuePriority}
                  onChange={(e) => setNewIssuePriority(e.target.value)}
                >
                  <option value="Highest">Highest</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Lowest">Lowest</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowCreateIssue(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleCreateIssue} className="btn-primary">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
