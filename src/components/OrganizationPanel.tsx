import React, { useState, useEffect } from 'react';
import { organizationService, Organization, OrganizationMember } from '../services/organizationService';
import { authService } from '../services/authService';
import './OrganizationPanel.css';

export const OrganizationPanel: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    
    if (user) {
      loadOrganizations();
    }

    const unsubscribe = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
      if (user) {
        loadOrganizations();
      } else {
        setOrganizations([]);
        setSelectedOrg(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadOrganizations = async () => {
    setLoading(true);
    const orgs = await organizationService.getUserOrganizations();
    setOrganizations(orgs);
    setLoading(false);
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      return;
    }

    const org = await organizationService.createOrganization(
      newOrgName,
      newOrgDescription
    );

    if (org) {
      setNewOrgName('');
      setNewOrgDescription('');
      setShowCreateModal(false);
      await loadOrganizations();
    }
  };

  const handleJoinOrganization = async () => {
    if (!inviteCode.trim()) {
      return;
    }

    const success = await organizationService.joinOrganization(inviteCode);
    if (success) {
      setInviteCode('');
      setShowJoinModal(false);
      await loadOrganizations();
    }
  };

  const handleSelectOrganization = async (org: Organization) => {
    setSelectedOrg(org);
    setLoading(true);
    
    const [orgMembers, orgProjects] = await Promise.all([
      organizationService.getOrganizationMembers(org.id),
      organizationService.getOrganizationProjects(org.id)
    ]);
    
    setMembers(orgMembers);
    setProjects(orgProjects);
    setLoading(false);
  };

  const handleLeaveOrganization = async (orgId: string) => {
    if (!currentUser) return;
    
    const confirmed = confirm('Are you sure you want to leave this organization?');
    if (!confirmed) return;

    const success = await organizationService.removeMember(orgId, currentUser.uid);
    if (success) {
      setSelectedOrg(null);
      await loadOrganizations();
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    const confirmed = confirm('Are you sure you want to delete this organization? This action cannot be undone.');
    if (!confirmed) return;

    const success = await organizationService.deleteOrganization(orgId);
    if (success) {
      setSelectedOrg(null);
      await loadOrganizations();
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'member') => {
    if (!selectedOrg) return;
    
    const success = await organizationService.updateMemberRole(selectedOrg.id, userId, newRole);
    if (success) {
      // Reload members
      const updatedMembers = await organizationService.getOrganizationMembers(selectedOrg.id);
      setMembers(updatedMembers);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedOrg) return;
    
    const confirmed = confirm('Are you sure you want to remove this member?');
    if (!confirmed) return;

    const success = await organizationService.removeMember(selectedOrg.id, userId);
    if (success) {
      // Reload members
      const updatedMembers = await organizationService.getOrganizationMembers(selectedOrg.id);
      setMembers(updatedMembers);
    }
  };

  const isOwner = (org: Organization) => {
    return currentUser && org.owner_id === currentUser.uid;
  };

  const isAdmin = () => {
    if (!selectedOrg || !currentUser) return false;
    const member = members.find(m => m.user_id === currentUser.uid);
    return member && (member.role === 'owner' || member.role === 'admin');
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Invite code copied to clipboard!');
  };

  if (!currentUser) {
    return (
      <div className="organization-panel">
        <div className="empty-state">
          <p>Please sign in to manage organizations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="organization-panel">
      <div className="organization-header">
        <h2>Organizations</h2>
        <div className="header-actions">
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create Organization
          </button>
          <button onClick={() => setShowJoinModal(true)} className="btn-secondary">
            Join with Code
          </button>
        </div>
      </div>

      {loading && !selectedOrg && (
        <div className="loading">Loading organizations...</div>
      )}

      {!loading && organizations.length === 0 && (
        <div className="empty-state">
          <p>You are not part of any organizations yet.</p>
          <p>Create one or join using an invite code!</p>
        </div>
      )}

      <div className="organization-content">
        <div className="organization-list">
          {organizations.map((org) => (
            <div
              key={org.id}
              className={`organization-item ${selectedOrg?.id === org.id ? 'selected' : ''}`}
              onClick={() => handleSelectOrganization(org)}
            >
              <div className="org-name">{org.name}</div>
              <div className="org-description">{org.description}</div>
              <div className="org-code">
                Code: <span className="invite-code">{org.invite_code}</span>
              </div>
            </div>
          ))}
        </div>

        {selectedOrg && (
          <div className="organization-details">
            <div className="details-header">
              <h3>{selectedOrg.name}</h3>
              <div className="details-actions">
                <button
                  onClick={() => copyInviteCode(selectedOrg.invite_code)}
                  className="btn-secondary"
                >
                  Copy Invite Code
                </button>
                {selectedOrg.owner_id === currentUser.uid ? (
                  <button
                    onClick={() => handleDeleteOrganization(selectedOrg.id)}
                    className="btn-danger"
                  >
                    Delete Organization
                  </button>
                ) : (
                  <button
                    onClick={() => handleLeaveOrganization(selectedOrg.id)}
                    className="btn-danger"
                  >
                    Leave Organization
                  </button>
                )}
              </div>
            </div>

            <div className="invite-code-section">
              <h4>Invite Code</h4>
              <div className="invite-code-display">
                <code>{selectedOrg.invite_code}</code>
                <button onClick={() => copyInviteCode(selectedOrg.invite_code)}>
                  Copy
                </button>
              </div>
              <p className="help-text">
                Share this code with team members to invite them to the organization
              </p>
            </div>

            <div className="members-section">
              <h4>Members ({members.length})</h4>
              {loading ? (
                <div className="loading">Loading members...</div>
              ) : (
                <div className="members-list">
                  {members.map((member) => (
                    <div key={member.id} className="member-item">
                      <div className="member-info">
                        <span className="member-id">
                          {member.user_id}
                          {member.user_id === currentUser?.uid && ' (You)'}
                        </span>
                        <span className={`member-role role-${member.role}`}>
                          {member.role}
                        </span>
                      </div>
                      <div className="member-actions">
                        <div className="member-joined">
                          Joined: {new Date(member.joined_at).toLocaleDateString()}
                        </div>
                        {isAdmin() && member.user_id !== currentUser?.uid && member.role !== 'owner' && (
                          <div className="member-controls">
                            {member.role === 'member' && (
                              <button
                                onClick={() => handleUpdateRole(member.user_id, 'admin')}
                                className="btn-small btn-secondary"
                                title="Promote to Admin"
                              >
                                Make Admin
                              </button>
                            )}
                            {member.role === 'admin' && isOwner(selectedOrg) && (
                              <button
                                onClick={() => handleUpdateRole(member.user_id, 'member')}
                                className="btn-small btn-secondary"
                                title="Demote to Member"
                              >
                                Make Member
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveMember(member.user_id)}
                              className="btn-small btn-danger"
                              title="Remove Member"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="projects-section">
              <h4>Projects ({projects.length})</h4>
              {loading ? (
                <div className="loading">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="empty-state">
                  <p>No projects in this organization yet</p>
                </div>
              ) : (
                <div className="projects-list">
                  {projects.map((project) => (
                    <div key={project.id} className="project-item">
                      <div className="project-name">Project ID: {project.ide_project_id}</div>
                      <div className="project-meta">
                        Added: {new Date(project.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create Organization</h3>
            <div className="form-group">
              <label>Organization Name</label>
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Enter organization name"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description (optional)</label>
              <textarea
                value={newOrgDescription}
                onChange={(e) => setNewOrgDescription(e.target.value)}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleCreateOrganization} className="btn-primary">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Organization Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Join Organization</h3>
            <div className="form-group">
              <label>Invite Code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter 8-character code"
                maxLength={8}
                autoFocus
              />
              <p className="help-text">
                Enter the invite code shared by the organization admin
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowJoinModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleJoinOrganization} className="btn-primary">
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
