import React, { useState, useEffect } from 'react';
import { workflowService, WorkflowProject } from '../services/workflowService';
import { organizationService, Organization } from '../services/organizationService';
import { jiraService, JiraIssue } from '../services/jiraService';
import './WorkflowPanel.css';

export const WorkflowPanel: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<WorkflowProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<WorkflowProject | null>(null);
  const [tasks, setTasks] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Connect repo modal
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [gitProvider, setGitProvider] = useState<'github' | 'bitbucket'>('github');
  const [repoName, setRepoName] = useState('');
  const [jiraProjectKey, setJiraProjectKey] = useState('');

  // Push modal
  const [showPushModal, setShowPushModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [createPR, setCreatePR] = useState(false);

  // Submit for approval modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<JiraIssue | null>(null);

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      loadProjects();
    }
  }, [selectedOrg]);

  useEffect(() => {
    if (selectedProject && selectedProject.jira_project_key) {
      loadTasks();
    }
  }, [selectedProject]);

  const loadOrganizations = async () => {
    const orgs = await organizationService.getUserOrganizations();
    setOrganizations(orgs);
  };

  const loadProjects = () => {
    if (!selectedOrg) return;
    const orgProjects = workflowService.getOrganizationProjects(selectedOrg.id);
    setProjects(orgProjects);
  };

  const loadTasks = async () => {
    if (!selectedProject?.jira_project_key) return;
    setLoading(true);
    const issues = await jiraService.getProjectIssues(selectedProject.jira_project_key);
    setTasks(issues);
    setLoading(false);
  };

  const handleConnectRepo = async () => {
    if (!selectedOrg || !repoName) return;

    setLoading(true);
    const project = await workflowService.connectRepository(
      selectedOrg.id,
      gitProvider,
      repoName,
      jiraProjectKey || undefined
    );

    if (project) {
      setShowConnectModal(false);
      setRepoName('');
      setJiraProjectKey('');
      loadProjects();
    }
    setLoading(false);
  };

  const handleStartWorking = async (projectId: string) => {
    setLoading(true);
    await workflowService.startWorking(projectId);
    setLoading(false);
  };

  const handlePullLatest = async (projectId: string) => {
    setLoading(true);
    await workflowService.pullLatest(projectId);
    setLoading(false);
  };

  const handlePush = async () => {
    if (!selectedProject || !commitMessage) return;

    setLoading(true);
    await workflowService.pushChanges(selectedProject.id, commitMessage, createPR);
    setShowPushModal(false);
    setCommitMessage('');
    setCreatePR(false);
    setLoading(false);
  };

  const handleCreateTaskBranch = async (issueKey: string) => {
    if (!selectedProject) return;

    setLoading(true);
    await workflowService.createTaskBranch(selectedProject.id, issueKey);
    setLoading(false);
  };

  const handleSubmitForApproval = async () => {
    if (!selectedProject || !selectedTask || !commitMessage) return;

    setLoading(true);
    await workflowService.submitForApproval(
      selectedProject.id,
      selectedTask.key,
      commitMessage
    );
    setShowSubmitModal(false);
    setCommitMessage('');
    setSelectedTask(null);
    setLoading(false);
  };

  return (
    <div className="workflow-panel">
      <div className="workflow-header">
        <h2>Development Workflow</h2>
      </div>

      <div className="workflow-content">
        {/* Organization Selection */}
        <div className="workflow-section">
          <h3>1. Select Organization</h3>
          <select
            value={selectedOrg?.id || ''}
            onChange={(e) => {
              const org = organizations.find(o => o.id === e.target.value);
              setSelectedOrg(org || null);
              setSelectedProject(null);
            }}
            className="workflow-select"
          >
            <option value="">Select organization...</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>

        {selectedOrg && (
          <>
            {/* Projects */}
            <div className="workflow-section">
              <div className="section-header">
                <h3>2. Connected Repositories</h3>
                <button onClick={() => setShowConnectModal(true)} className="btn-primary">
                  + Connect Repo
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="empty-state">
                  No repositories connected. Click "Connect Repo" to get started.
                </div>
              ) : (
                <div className="projects-list">
                  {projects.map(project => (
                    <div
                      key={project.id}
                      className={`project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="project-header">
                        <h4>{project.name}</h4>
                        <span className="provider-badge">{project.git_provider}</span>
                      </div>
                      <div className="project-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartWorking(project.id);
                          }}
                          className="btn-small btn-success"
                          disabled={loading}
                        >
                          🚀 Start Working
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePullLatest(project.id);
                          }}
                          className="btn-small btn-secondary"
                          disabled={loading}
                        >
                          ⬇️ Pull Latest
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {selectedProject && (
              <div className="workflow-section">
                <h3>3. Quick Actions</h3>
                <div className="quick-actions">
                  <button
                    onClick={() => setShowPushModal(true)}
                    className="action-button"
                    disabled={loading}
                  >
                    <span className="action-icon">📤</span>
                    <span className="action-label">Push Changes</span>
                  </button>
                  <button
                    onClick={() => handlePullLatest(selectedProject.id)}
                    className="action-button"
                    disabled={loading}
                  >
                    <span className="action-icon">⬇️</span>
                    <span className="action-label">Pull Latest</span>
                  </button>
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="action-button"
                    disabled={loading || !selectedProject.jira_project_key}
                  >
                    <span className="action-icon">✅</span>
                    <span className="action-label">Submit for Approval</span>
                  </button>
                </div>
              </div>
            )}

            {/* Jira Tasks */}
            {selectedProject && selectedProject.jira_project_key && (
              <div className="workflow-section">
                <h3>4. Jira Tasks</h3>
                {loading ? (
                  <div className="loading">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                  <div className="empty-state">No tasks found</div>
                ) : (
                  <div className="tasks-list">
                    {tasks.map(task => (
                      <div key={task.id} className="task-card">
                        <div className="task-header">
                          <span className="task-key">{task.key}</span>
                          <span className={`task-status status-${task.fields.status.statusCategory.key}`}>
                            {task.fields.status.name}
                          </span>
                        </div>
                        <div className="task-title">{task.fields.summary}</div>
                        <div className="task-actions">
                          <button
                            onClick={() => handleCreateTaskBranch(task.key)}
                            className="btn-small"
                            disabled={loading}
                          >
                            Create Branch
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTask(task);
                              setShowSubmitModal(true);
                            }}
                            className="btn-small btn-primary"
                            disabled={loading}
                          >
                            Submit Work
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Connect Repository Modal */}
      {showConnectModal && (
        <div className="modal-overlay" onClick={() => setShowConnectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Connect Repository</h3>

            <div className="form-group">
              <label>Git Provider</label>
              <select value={gitProvider} onChange={(e) => setGitProvider(e.target.value as any)}>
                <option value="github">GitHub</option>
                <option value="bitbucket">Bitbucket</option>
              </select>
            </div>

            <div className="form-group">
              <label>Repository Name</label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="owner/repo-name"
              />
            </div>

            <div className="form-group">
              <label>Jira Project Key (Optional)</label>
              <input
                type="text"
                value={jiraProjectKey}
                onChange={(e) => setJiraProjectKey(e.target.value)}
                placeholder="PROJ"
              />
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowConnectModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleConnectRepo} className="btn-primary" disabled={loading}>
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Push Changes Modal */}
      {showPushModal && (
        <div className="modal-overlay" onClick={() => setShowPushModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Push Changes</h3>

            <div className="form-group">
              <label>Commit Message</label>
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Describe your changes..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={createPR}
                  onChange={(e) => setCreatePR(e.target.checked)}
                />
                Create Pull Request
              </label>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowPushModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handlePush} className="btn-primary" disabled={loading || !commitMessage}>
                Push
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit for Approval Modal */}
      {showSubmitModal && (
        <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Submit for Approval</h3>

            {selectedTask && (
              <div className="task-info">
                <strong>{selectedTask.key}:</strong> {selectedTask.fields.summary}
              </div>
            )}

            <div className="form-group">
              <label>Commit Message</label>
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Describe your changes..."
                rows={3}
              />
            </div>

            <div className="info-box">
              This will:
              <ul>
                <li>Push your changes</li>
                <li>Create a pull request</li>
                <li>Update Jira issue status to "In Review"</li>
                <li>Add PR link to Jira comments</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowSubmitModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmitForApproval} className="btn-primary" disabled={loading || !commitMessage}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
