/**
 * Supabase Panel Component
 * Manage Supabase integration, database operations, and storage
 */

import { useState, useEffect } from 'react';
import { supabaseService, type SupabaseConfig } from '../services/supabaseService';
import { supabaseProjectManager, type SupabaseProject, type SupabaseProjectInput } from '../services/supabaseProjectManager';
import { supabaseMetadataService, type SupabaseMetadata } from '../services/supabaseMetadataService';
import { runSupabaseDiagnostics, testSupabaseInsert } from '../services/supabaseDiagnostics';
import { notificationService } from '../services/notificationService';
import './SupabasePanel.css';

export interface SupabasePanelProps {
  theme?: 'light' | 'dark';
}

const SupabasePanel = ({ theme = 'dark' }: SupabasePanelProps) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [config, setConfig] = useState<SupabaseConfig>({
    url: '',
    anonKey: '',
    autoConnect: true
  });
  const [view, setView] = useState<'database' | 'storage' | 'auth' | 'projects'>('projects');
  const [tableName, setTableName] = useState('');
  const [queryResult, setQueryResult] = useState<any[]>([]);
  const [_loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [, setCurrentProject] = useState<SupabaseProject | null>(null);
  const [newProject, setNewProject] = useState<SupabaseProjectInput>({
    name: '',
    description: '',
    project_url: '',
    anon_key: ''
  });
  const [projectMetadata, setProjectMetadata] = useState<SupabaseMetadata | null>(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);

  useEffect(() => {
    setIsConfigured(supabaseService.isConfigured());
    setIsConnected(supabaseService.isUserConnected());

    // Load existing config
    const existingConfig = supabaseService.getConfig();
    if (existingConfig) {
      setConfig(existingConfig);
    }

    // Subscribe to connection changes
    const unsubscribe = supabaseService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    // Subscribe to project changes
    const unsubscribeProjects = supabaseProjectManager.onProjectsChange((updatedProjects) => {
      setProjects(updatedProjects);
      const currentProj = supabaseProjectManager.getCurrentProject();
      setCurrentProject(currentProj);
      
      // Fetch metadata for active project
      if (currentProj) {
        fetchProjectMetadata(currentProj.project_url, currentProj.anon_key);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeProjects();
    };
  }, []);

  const handleConfigure = () => {
    if (!config.url || !config.anonKey) {
      notificationService.error('Please provide both URL and Anon Key');
      return;
    }

    supabaseService.configure(config);
    setIsConfigured(true);
    setShowConfig(false);
  };

  const handleAutoConnectToggle = () => {
    const newValue = !config.autoConnect;
    setConfig({ ...config, autoConnect: newValue });
    supabaseService.setAutoConnect(newValue);
    
    if (newValue) {
      notificationService.success('Auto-connect enabled');
    } else {
      notificationService.info('Auto-connect disabled');
    }
  };

  const handleConnectClick = () => {
    if (!isConfigured) {
      setShowConfig(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      notificationService.error('Please enter both email and password');
      return;
    }

    setAuthLoading(true);
    try {
      let user;
      if (isSignUp) {
        user = await supabaseService.signUp(authEmail, authPassword);
        if (user) {
          notificationService.success('Account created and connected!');
        }
      } else {
        user = await supabaseService.signIn(authEmail, authPassword);
        if (user) {
          notificationService.success('Connected to Supabase!');
        }
      }

      if (user) {
        setIsConnected(true);
        setShowAuthModal(false);
        setAuthEmail('');
        setAuthPassword('');
      } else {
        notificationService.error(isSignUp ? 'Failed to create account' : 'Failed to sign in. Please check your credentials.');
      }
    } catch (error: any) {
      notificationService.error(error.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabaseService.signOut();
      setIsConnected(false);
      notificationService.success('Disconnected from Supabase');
    } catch (error: any) {
      notificationService.error('Failed to sign out');
    }
  };

  const handleQuery = async () => {
    if (!tableName) {
      notificationService.error('Please enter a table name');
      return;
    }

    setLoading(true);
    try {
      const results = await supabaseService.query(tableName, {
        limit: 100
      });
      setQueryResult(results);
    } catch (error: any) {
      notificationService.error(`Query failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!newProject.name || !newProject.project_url || !newProject.anon_key) {
      notificationService.error('Please fill in all required fields');
      return;
    }

    const project = await supabaseProjectManager.addProject(newProject);
    if (project) {
      // Fetch metadata for the new project
      await fetchProjectMetadata(project.project_url, project.anon_key);
      
      setNewProject({ name: '', description: '', project_url: '', anon_key: '' });
      setShowProjectManager(false);
    }
  };

  const fetchProjectMetadata = async (url: string, key: string) => {
    setFetchingMetadata(true);
    try {
      const metadata = await supabaseMetadataService.fetchMetadata(url, key);
      setProjectMetadata(metadata);
      
      notificationService.success(
        `Connected! Found ${metadata.tables.length} tables and ${metadata.buckets.length} storage buckets`
      );
      
      console.log('Project Metadata:', metadata);
    } catch (error) {
      console.error('Error fetching project metadata:', error);
      setProjectMetadata(null);
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleSwitchProject = async (projectId: string) => {
    await supabaseProjectManager.setActiveProject(projectId);
    
    // Fetch metadata for the newly active project
    const project = projects.find(p => p.id === projectId);
    if (project) {
      await fetchProjectMetadata(project.project_url, project.anon_key);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await supabaseProjectManager.deleteProject(projectId);
    }
  };

  const handleRunDiagnostics = async () => {
    await runSupabaseDiagnostics();
  };

  const handleTestInsert = async () => {
    await testSupabaseInsert();
  };

  if (!isConfigured) {
    return (
      <div className={`supabase-panel ${theme}`}>
        <div className="supabase-header">
          <h3>Supabase</h3>
        </div>
        
        <div className="supabase-content">
          <div className="config-prompt">
            <div className="supabase-icon">⚡</div>
            <h4>Connect Your Supabase Project</h4>
            <p>Each user connects to their own Supabase database for complete privacy</p>
            <p className="hint" style={{ fontSize: '0.85em', marginTop: '0.5rem' }}>🔒 Similar to Lovable.dev - your data stays private and under your control</p>
            
            {!showConfig ? (
              <button className="config-btn" onClick={() => setShowConfig(true)}>
                Connect My Project (Free)
              </button>
            ) : (
              <div className="config-form">
                <div className="info-box">
                  <p>📝 <strong>Your Own Project (Free)</strong></p>
                  <p>Create a free Supabase account at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a></p>
                  <p>Each user connects to their own project - your data is completely private!</p>
                  <p><a href="https://github.com/raushan22882917/Kalpa-ai/blob/main/docs/USER_SUPABASE_GUIDE.md" target="_blank" rel="noopener noreferrer">📖 Step-by-step setup guide</a></p>
                </div>
                
                <div className="form-group">
                  <label>Your Project URL</label>
                  <input
                    type="text"
                    placeholder="https://xxxxx.supabase.co"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  />
                  <p className="hint">Find this in your Supabase project Settings → API</p>
                </div>
                <div className="form-group">
                  <label>Your Anon Key</label>
                  <input
                    type="password"
                    placeholder="Your anon/public key"
                    value={config.anonKey}
                    onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
                  />
                  <p className="hint">Also in Settings → API (anon/public key)</p>
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={config.autoConnect !== false}
                      onChange={(e) => setConfig({ ...config, autoConnect: e.target.checked })}
                    />
                    <span>Auto-connect with Firebase authentication</span>
                  </label>
                  <p className="hint">Automatically sign in to your Supabase when you sign in with Firebase</p>
                </div>
                <div className="form-actions">
                  <button className="cancel-btn" onClick={() => setShowConfig(false)}>
                    Cancel
                  </button>
                  <button className="save-btn" onClick={handleConfigure}>
                    Connect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`supabase-panel ${theme}`}>
      <div className="supabase-header">
        <div className="header-left">
          <h3>Supabase</h3>
          {isConnected && (
            <span className="connection-badge connected" title="Connected to Supabase">
              ✓ Connected
            </span>
          )}
          {isConfigured && !isConnected && (
            <span className="connection-badge disconnected" title="Not connected">
              ○ Disconnected
            </span>
          )}
        </div>
        <div className="header-right">
          {isConfigured && (
            <button
              className="auto-connect-toggle"
              onClick={handleAutoConnectToggle}
              title={config.autoConnect ? 'Auto-connect enabled' : 'Auto-connect disabled'}
            >
              {config.autoConnect ? '🔗' : '⛓️‍💥'}
            </button>
          )}
          <button 
            className="config-icon-btn" 
            onClick={() => setShowConfig(true)}
            title="Reconfigure"
          >
            ⚙️
          </button>
        </div>
      </div>

      <div className="supabase-tabs">
        <button
          className={`tab ${view === 'projects' ? 'active' : ''}`}
          onClick={() => setView('projects')}
        >
          Projects
        </button>
        <button
          className={`tab ${view === 'database' ? 'active' : ''}`}
          onClick={() => setView('database')}
        >
          Database
        </button>
        <button
          className={`tab ${view === 'storage' ? 'active' : ''}`}
          onClick={() => setView('storage')}
        >
          Storage
        </button>
        <button
          className={`tab ${view === 'auth' ? 'active' : ''}`}
          onClick={() => setView('auth')}
        >
          Auth
        </button>
      </div>
      
      <div className="supabase-content">
        {view === 'projects' && (
          <div className="projects-view">
            <div className="projects-header">
              <h4>My Supabase Projects</h4>
              <button className="add-project-btn" onClick={() => setShowProjectManager(true)}>
                + Add Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="empty-projects">
                <p>📦 No projects yet</p>
                <p className="hint">Add your first Supabase project to get started</p>
                <div className="diagnostic-buttons" style={{ marginTop: '20px' }}>
                  <button 
                    className="diagnostic-btn"
                    onClick={handleRunDiagnostics}
                    style={{ 
                      padding: '8px 16px',
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-color)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginRight: '8px'
                    }}
                  >
                    🔍 Run Diagnostics
                  </button>
                  <button 
                    className="diagnostic-btn"
                    onClick={handleTestInsert}
                    style={{ 
                      padding: '8px 16px',
                      backgroundColor: 'var(--input-bg)',
                      border: '1px solid var(--input-border)',
                      color: 'var(--text-color)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🧪 Test Insert
                  </button>
                </div>
                <p className="hint" style={{ marginTop: '12px', fontSize: '11px' }}>
                  Having issues? Run diagnostics to check your setup
                </p>
              </div>
            ) : (
              <div className="projects-list">
                {projects.map((project) => (
                  <div 
                    key={project.id} 
                    className={`project-card ${project.is_active ? 'active' : ''}`}
                  >
                    <div className="project-info">
                      <div className="project-name">
                        {project.name}
                        {project.is_active && <span className="active-badge">Active</span>}
                      </div>
                      {project.description && (
                        <div className="project-description">{project.description}</div>
                      )}
                      <div className="project-url">{project.project_url}</div>
                    </div>
                    <div className="project-actions">
                      {!project.is_active && (
                        <button 
                          className="switch-btn"
                          onClick={() => handleSwitchProject(project.id)}
                        >
                          Switch
                        </button>
                      )}
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showProjectManager && (
              <div className="project-modal-overlay" onClick={() => setShowProjectManager(false)}>
                <div className="project-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="project-modal-header">
                    <h3>Add Supabase Project</h3>
                    <button 
                      className="project-modal-close"
                      onClick={() => setShowProjectManager(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="project-form">
                    <div className="form-group">
                      <label>Project Name *</label>
                      <input
                        type="text"
                        placeholder="My Project"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <input
                        type="text"
                        placeholder="Optional description"
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Project URL *</label>
                      <input
                        type="text"
                        placeholder="https://xxxxx.supabase.co"
                        value={newProject.project_url}
                        onChange={(e) => setNewProject({ ...newProject, project_url: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Anon Key *</label>
                      <input
                        type="password"
                        placeholder="Your anon/public key"
                        value={newProject.anon_key}
                        onChange={(e) => setNewProject({ ...newProject, anon_key: e.target.value })}
                      />
                    </div>
                    <div className="form-actions">
                      <button className="cancel-btn" onClick={() => setShowProjectManager(false)}>
                        Cancel
                      </button>
                      <button className="save-btn" onClick={handleAddProject}>
                        Add Project
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'database' && (
          <div className="database-view">
            {fetchingMetadata ? (
              <div className="empty-view">
                <p>⏳ Loading tables...</p>
              </div>
            ) : projectMetadata && projectMetadata.tables.length > 0 ? (
              <>
                <div className="tables-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                    📊 Database Tables ({projectMetadata.tables.length})
                  </h4>
                </div>
                
                <div className="tables-list">
                  {projectMetadata.tables.map((table) => (
                    <div 
                      key={table.name} 
                      className="table-card"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => {
                        setTableName(table.name);
                        handleQuery();
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                            {table.name}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Schema: {table.schema}
                          </div>
                        </div>
                        <button
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--button-bg)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setTableName(table.name);
                            handleQuery();
                          }}
                        >
                          Query
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {queryResult.length > 0 && (
                  <div className="query-results" style={{ marginTop: '20px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
                      Query Results ({queryResult.length} rows)
                    </h4>
                    <div className="results-table">
                      <pre>{JSON.stringify(queryResult, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-view">
                <p>📊 No tables found</p>
                <p className="hint">Add a Supabase project to see its tables</p>
              </div>
            )}
          </div>
        )}

        {view === 'storage' && (
          <div className="storage-view">
            {fetchingMetadata ? (
              <div className="empty-view">
                <p>⏳ Loading storage buckets...</p>
              </div>
            ) : projectMetadata && projectMetadata.buckets.length > 0 ? (
              <>
                <div className="buckets-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                    📦 Storage Buckets ({projectMetadata.buckets.length})
                  </h4>
                </div>
                
                <div className="buckets-list">
                  {projectMetadata.buckets.map((bucket) => (
                    <div 
                      key={bucket.id} 
                      className="bucket-card"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ fontWeight: '600', fontSize: '14px' }}>
                              {bucket.name}
                            </div>
                            {bucket.public && (
                              <span style={{
                                padding: '2px 8px',
                                backgroundColor: '#3ECF8E',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: '600',
                                borderRadius: '10px',
                                textTransform: 'uppercase'
                              }}>
                                Public
                              </span>
                            )}
                            {!bucket.public && (
                              <span style={{
                                padding: '2px 8px',
                                backgroundColor: 'var(--text-secondary)',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: '600',
                                borderRadius: '10px',
                                textTransform: 'uppercase'
                              }}>
                                Private
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            ID: {bucket.id}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            Created: {new Date(bucket.created_at).toLocaleDateString()}
                          </div>
                          {bucket.file_size_limit && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Max file size: {(bucket.file_size_limit / 1024 / 1024).toFixed(2)} MB
                            </div>
                          )}
                          {bucket.allowed_mime_types && bucket.allowed_mime_types.length > 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              Allowed types: {bucket.allowed_mime_types.join(', ')}
                            </div>
                          )}
                        </div>
                        <button
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'var(--button-bg)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            notificationService.info(`Bucket: ${bucket.name}`);
                          }}
                        >
                          Browse
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-view">
                <p>📦 No storage buckets found</p>
                <p className="hint">Add a Supabase project to see its storage buckets</p>
              </div>
            )}
          </div>
        )}

        {view === 'auth' && (
          <div className="auth-view">
            {!isConnected ? (
              <div className="auth-connect-section">
                <div className="auth-connect-content">
                  <div className="auth-icon-large">⚡</div>
                  <h3>Connect with Supabase</h3>
                  <p>Sign in to your Supabase account to access your database and manage authentication</p>
                  <button 
                    className="connect-supabase-btn"
                    onClick={handleConnectClick}
                    disabled={!isConfigured}
                  >
                    {isConfigured ? '🔐 Connect with Supabase' : '⚙️ Configure Supabase First'}
                  </button>
                  {!isConfigured && (
                    <p className="auth-hint">Please configure your Supabase project URL and API key first</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="auth-connected-section">
                <div className="auth-status-card">
                  <div className="auth-status-header">
                    <span className="status-indicator connected">●</span>
                    <span className="status-text">Connected to Supabase</span>
                  </div>
                  <div className="auth-user-info">
                    <p>You are successfully authenticated</p>
                  </div>
                  <button 
                    className="sign-out-btn"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowAuthModal(false);
        }}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-header">
              <h3>Connect with Supabase</h3>
              <button 
                className="auth-modal-close"
                onClick={() => setShowAuthModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAuthSubmit} className="auth-form">
              <div className="auth-tabs">
                <button
                  type="button"
                  className={`auth-tab ${!isSignUp ? 'active' : ''}`}
                  onClick={() => setIsSignUp(false)}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`auth-tab ${isSignUp ? 'active' : ''}`}
                  onClick={() => setIsSignUp(true)}
                >
                  Sign Up
                </button>
              </div>
              <div className="auth-form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  disabled={authLoading}
                />
              </div>
              <div className="auth-form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Your password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  disabled={authLoading}
                />
              </div>
              <button 
                type="submit" 
                className="auth-submit-btn"
                disabled={authLoading}
              >
                {authLoading ? '⏳ Connecting...' : (isSignUp ? '✨ Create Account & Connect' : '🚀 Sign In & Connect')}
              </button>
            </form>
          </div>
        </div>
      )}

      {showConfig && (
        <div className="config-modal">
          <div className="config-modal-content">
            <h4>Reconfigure Supabase</h4>
            <div className="form-group">
              <label>Project URL</label>
              <input
                type="text"
                placeholder="https://xxxxx.supabase.co"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Anon Key</label>
              <input
                type="password"
                placeholder="Your anon/public key"
                value={config.anonKey}
                onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={config.autoConnect !== false}
                  onChange={(e) => setConfig({ ...config, autoConnect: e.target.checked })}
                />
                <span>Auto-connect with Firebase authentication</span>
              </label>
              <p className="hint">When enabled, Supabase will automatically connect when you sign in with Firebase</p>
            </div>
            <div className="form-actions">
              <button className="cancel-btn" onClick={() => setShowConfig(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleConfigure}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabasePanel;
