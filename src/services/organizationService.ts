/**
 * Organization Service
 * Handles organization creation, member management, and project collaboration
 */

import { supabaseService } from './supabaseService';
import { notificationService } from './notificationService';
import { authService } from './authService';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface OrganizationProject {
  id: string;
  organization_id: string;
  ide_project_id: string;
  created_by: string;
  created_at: string;
}

class OrganizationService {
  /**
   * Get current user ID from either Supabase or Firebase
   */
  private async getCurrentUserId(): Promise<string | null> {
    const supabaseUser = await supabaseService.getCurrentUser();
    const firebaseUser = authService.getCurrentUser();
    return supabaseUser?.id || firebaseUser?.uid || null;
  }

  /**
   * Create a new organization
   */
  async createOrganization(name: string, description?: string): Promise<Organization | null> {
    const userId = await this.getCurrentUserId();
    
    if (!userId) {
      notificationService.error('You must be signed in to create an organization');
      return null;
    }

    try {
      const result = await supabaseService.insert('organizations', {
        name,
        description,
        owner_id: userId
      });

      if (result && result.length > 0) {
        notificationService.success(`Organization "${name}" created successfully!`);
        return result[0];
      }

      return null;
    } catch (error: any) {
      notificationService.error(`Failed to create organization: ${error.message}`);
      return null;
    }
  }

  /**
   * Get all organizations for current user
   */
  async getUserOrganizations(): Promise<Organization[]> {
    const userId = await this.getCurrentUserId();
    
    if (!userId) {
      return [];
    }

    try {
      // Get organizations where user is a member
      const members = await supabaseService.query('organization_members', {
        select: 'organization_id',
        filter: { user_id: userId }
      });

      if (!members || members.length === 0) {
        return [];
      }

      // Get organization details
      const orgIds = members.map((m: any) => m.organization_id);
      const organizations: Organization[] = [];

      for (const orgId of orgIds) {
        const orgs = await supabaseService.query('organizations', {
          select: '*',
          filter: { id: orgId }
        });
        if (orgs && orgs.length > 0) {
          organizations.push(orgs[0]);
        }
      }

      return organizations;
    } catch (error: any) {
      console.error('Failed to get user organizations:', error);
      return [];
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const result = await supabaseService.query('organizations', {
        select: '*',
        filter: { id: organizationId },
        limit: 1
      });

      return result && result.length > 0 ? result[0] : null;
    } catch (error: any) {
      console.error('Failed to get organization:', error);
      return null;
    }
  }

  /**
   * Get organization by invite code
   */
  async getOrganizationByInviteCode(inviteCode: string): Promise<Organization | null> {
    try {
      const result = await supabaseService.query('organizations', {
        select: '*',
        filter: { invite_code: inviteCode.toUpperCase() },
        limit: 1
      });

      return result && result.length > 0 ? result[0] : null;
    } catch (error: any) {
      console.error('Failed to get organization by invite code:', error);
      return null;
    }
  }

  /**
   * Join organization using invite code
   */
  async joinOrganization(inviteCode: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    
    if (!userId) {
      notificationService.error('You must be signed in to join an organization');
      return false;
    }

    try {
      // Find organization by invite code
      const org = await this.getOrganizationByInviteCode(inviteCode);
      
      if (!org) {
        notificationService.error('Invalid invite code');
        return false;
      }

      // Check if already a member
      const existingMember = await supabaseService.query('organization_members', {
        select: '*',
        filter: { 
          organization_id: org.id,
          user_id: userId
        },
        limit: 1
      });

      if (existingMember && existingMember.length > 0) {
        notificationService.info('You are already a member of this organization');
        return true;
      }

      // Add user as member
      const result = await supabaseService.insert('organization_members', {
        organization_id: org.id,
        user_id: userId,
        role: 'member'
      });

      if (result) {
        notificationService.success(`Successfully joined "${org.name}"!`);
        return true;
      }

      return false;
    } catch (error: any) {
      notificationService.error(`Failed to join organization: ${error.message}`);
      return false;
    }
  }

  /**
   * Get members of an organization
   */
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    try {
      const result = await supabaseService.query('organization_members', {
        select: '*',
        filter: { organization_id: organizationId }
      });

      return result || [];
    } catch (error: any) {
      console.error('Failed to get organization members:', error);
      return [];
    }
  }

  /**
   * Update member role (admin/owner only)
   */
  async updateMemberRole(
    organizationId: string,
    userId: string,
    newRole: 'admin' | 'member'
  ): Promise<boolean> {
    const currentUserId = await this.getCurrentUserId();
    if (!currentUserId) {
      notificationService.error('You must be signed in');
      return false;
    }

    try {
      // Check if current user is admin or owner
      const currentMember = await supabaseService.query('organization_members', {
        select: '*',
        filter: {
          organization_id: organizationId,
          user_id: currentUserId
        },
        limit: 1
      });

      if (!currentMember || currentMember.length === 0) {
        notificationService.error('You are not a member of this organization');
        return false;
      }

      if (!['owner', 'admin'].includes(currentMember[0].role)) {
        notificationService.error('You do not have permission to update member roles');
        return false;
      }

      // Update role
      const result = await supabaseService.update(
        'organization_members',
        { role: newRole },
        { organization_id: organizationId, user_id: userId }
      );

      if (result) {
        notificationService.success('Member role updated successfully');
        return true;
      }

      return false;
    } catch (error: any) {
      notificationService.error(`Failed to update member role: ${error.message}`);
      return false;
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(organizationId: string, userId: string): Promise<boolean> {
    const currentUserId = await this.getCurrentUserId();
    if (!currentUserId) {
      notificationService.error('You must be signed in');
      return false;
    }

    try {
      // Check if current user is admin/owner or removing themselves
      const currentMember = await supabaseService.query('organization_members', {
        select: '*',
        filter: {
          organization_id: organizationId,
          user_id: currentUserId
        },
        limit: 1
      });

      if (!currentMember || currentMember.length === 0) {
        notificationService.error('You are not a member of this organization');
        return false;
      }

      const isRemovingSelf = userId === currentUserId;
      const hasPermission = ['owner', 'admin'].includes(currentMember[0].role);

      if (!isRemovingSelf && !hasPermission) {
        notificationService.error('You do not have permission to remove members');
        return false;
      }

      // Remove member
      const result = await supabaseService.delete('organization_members', {
        organization_id: organizationId,
        user_id: userId
      });

      if (result) {
        notificationService.success(
          isRemovingSelf ? 'You have left the organization' : 'Member removed successfully'
        );
        return true;
      }

      return false;
    } catch (error: any) {
      notificationService.error(`Failed to remove member: ${error.message}`);
      return false;
    }
  }

  /**
   * Add project to organization
   */
  async addProjectToOrganization(
    organizationId: string,
    projectId: string
  ): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      notificationService.error('You must be signed in');
      return false;
    }

    try {
      // Check if user is a member
      const member = await supabaseService.query('organization_members', {
        select: '*',
        filter: {
          organization_id: organizationId,
          user_id: userId
        },
        limit: 1
      });

      if (!member || member.length === 0) {
        notificationService.error('You are not a member of this organization');
        return false;
      }

      // Add project
      const result = await supabaseService.insert('organization_projects', {
        organization_id: organizationId,
        project_id: projectId,
        created_by: userId
      });

      if (result) {
        notificationService.success('Project added to organization');
        return true;
      }

      return false;
    } catch (error: any) {
      notificationService.error(`Failed to add project: ${error.message}`);
      return false;
    }
  }

  /**
   * Get projects in an organization
   */
  async getOrganizationProjects(organizationId: string): Promise<any[]> {
    try {
      const result = await supabaseService.query('organization_projects', {
        select: '*',
        filter: { organization_id: organizationId }
      });

      return result || [];
    } catch (error: any) {
      console.error('Failed to get organization projects:', error);
      return [];
    }
  }

  /**
   * Remove project from organization
   */
  async removeProjectFromOrganization(
    organizationId: string,
    projectId: string
  ): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      notificationService.error('You must be signed in');
      return false;
    }

    try {
      const result = await supabaseService.delete('organization_projects', {
        organization_id: organizationId,
        project_id: projectId
      });

      if (result) {
        notificationService.success('Project removed from organization');
        return true;
      }

      return false;
    } catch (error: any) {
      notificationService.error(`Failed to remove project: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete organization (owner only)
   */
  async deleteOrganization(organizationId: string): Promise<boolean> {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      notificationService.error('You must be signed in');
      return false;
    }

    try {
      // Check if user is owner
      const org = await this.getOrganization(organizationId);
      if (!org || org.owner_id !== userId) {
        notificationService.error('Only the organization owner can delete it');
        return false;
      }

      const result = await supabaseService.delete('organizations', {
        id: organizationId
      });

      if (result) {
        notificationService.success('Organization deleted successfully');
        return true;
      }

      return false;
    } catch (error: any) {
      notificationService.error(`Failed to delete organization: ${error.message}`);
      return false;
    }
  }
}

export const organizationService = new OrganizationService();
