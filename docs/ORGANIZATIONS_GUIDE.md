# Organizations & Team Collaboration Guide

This guide explains how to use the Organizations feature to collaborate with your team on projects.

## Overview

The Organizations feature allows you to:
- Create organizations (teams/groups) for collaborative coding
- Generate unique invite codes for team members
- Share projects within your organization
- Manage member roles and permissions
- Collaborate on the same codebase with your team

## Getting Started

### 1. Setup Database

First, apply the organizations migration to your Supabase database:

**Option A: Using Supabase CLI (Recommended)**
```bash
supabase link --project-ref your-project-ref
supabase db push
```

**Option B: Manual Setup**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20240101000002_add_organizations.sql`
4. Paste and run the SQL

**Option C: Using Setup Script**
```bash
./setup-organizations.sh
```

### 2. Sign In

Make sure you're signed in to the IDE with your Firebase account. Organizations are linked to your user account.

### 3. Access Organizations Panel

Open the Organizations panel from the sidebar to start creating or joining organizations.

## Creating an Organization

1. Click "Create Organization" button
2. Enter organization name (required)
3. Add description (optional)
4. Click "Create"

A unique 8-character invite code will be automatically generated (e.g., `ABC12XYZ`).

## Joining an Organization

1. Get the invite code from your organization admin
2. Click "Join with Code" button
3. Enter the 8-character invite code
4. Click "Join"

You'll immediately become a member of the organization!

## Organization Roles

### Owner
- Created the organization
- Full control over organization
- Can delete the organization
- Can manage all members
- Can add/remove projects

### Admin
- Can manage members (except owner)
- Can add/remove projects
- Cannot delete organization

### Member
- Can view organization details
- Can view all projects
- Can collaborate on projects
- Can leave organization

## Managing Members

### View Members
Select an organization to see all members, their roles, and join dates.

### Update Member Roles (Owner/Admin only)
Use the organization service to update member roles:
```typescript
await organizationService.updateMemberRole(orgId, userId, 'admin');
```

### Remove Members (Owner/Admin only)
```typescript
await organizationService.removeMember(orgId, userId);
```

### Leave Organization
Any member can leave an organization at any time by clicking "Leave Organization".

## Project Collaboration

### Add Project to Organization
```typescript
await organizationService.addProjectToOrganization(orgId, projectId);
```

### View Organization Projects
All members can see projects shared within the organization.

### Remove Project from Organization
```typescript
await organizationService.removeProjectFromOrganization(orgId, projectId);
```

## Invite Code System

### How It Works
- Each organization gets a unique 8-character code
- Codes use uppercase letters and numbers (excluding confusing characters like O, 0, I, 1)
- Codes are automatically generated and guaranteed to be unique
- Anyone with the code can join the organization

### Sharing Invite Codes
1. Select your organization
2. Click "Copy Invite Code"
3. Share via email, Slack, or any communication channel
4. Team members can join instantly using the code

### Security Considerations
- Treat invite codes like passwords
- Regenerate codes if compromised (feature coming soon)
- Remove members who shouldn't have access
- Only share codes with trusted team members

## Database Schema

### Tables

**organizations**
- `id`: UUID (primary key)
- `name`: Organization name
- `description`: Optional description
- `invite_code`: Unique 8-character code
- `owner_id`: User ID of the owner
- `created_at`, `updated_at`: Timestamps

**organization_members**
- `id`: UUID (primary key)
- `organization_id`: Reference to organization
- `user_id`: User ID
- `role`: 'owner', 'admin', or 'member'
- `joined_at`: Timestamp

**organization_projects**
- `id`: UUID (primary key)
- `organization_id`: Reference to organization
- `ide_project_id`: Reference to IDE project
- `created_by`: User who added the project
- `created_at`: Timestamp

## API Reference

### organizationService

```typescript
// Create organization
await organizationService.createOrganization(name, description?);

// Get user's organizations
await organizationService.getUserOrganizations();

// Get organization by ID
await organizationService.getOrganization(organizationId);

// Get organization by invite code
await organizationService.getOrganizationByInviteCode(inviteCode);

// Join organization
await organizationService.joinOrganization(inviteCode);

// Get members
await organizationService.getOrganizationMembers(organizationId);

// Update member role
await organizationService.updateMemberRole(organizationId, userId, newRole);

// Remove member
await organizationService.removeMember(organizationId, userId);

// Add project
await organizationService.addProjectToOrganization(organizationId, projectId);

// Get projects
await organizationService.getOrganizationProjects(organizationId);

// Remove project
await organizationService.removeProjectFromOrganization(organizationId, projectId);

// Delete organization
await organizationService.deleteOrganization(organizationId);
```

## Best Practices

1. **Naming**: Use clear, descriptive names for organizations
2. **Descriptions**: Add descriptions to help members understand the purpose
3. **Roles**: Assign admin roles to trusted team members
4. **Projects**: Only add relevant projects to keep things organized
5. **Security**: Regularly review members and remove inactive users
6. **Communication**: Use invite codes for easy onboarding

## Troubleshooting

### Can't create organization
- Make sure you're signed in
- Check Supabase connection
- Verify migration was applied

### Invite code not working
- Check for typos (codes are case-sensitive)
- Ensure code is exactly 8 characters
- Verify organization still exists

### Can't see organization projects
- Confirm you're a member of the organization
- Check if projects were actually added
- Verify database permissions

### Permission denied errors
- Check your role in the organization
- Some actions require admin/owner role
- Contact organization owner for help

## Future Enhancements

Planned features:
- [ ] Regenerate invite codes
- [ ] Invite expiration dates
- [ ] Project permissions per member
- [ ] Activity logs
- [ ] Real-time collaboration indicators
- [ ] Organization settings and preferences
- [ ] Member invitations via email
- [ ] Organization avatars/logos

## Support

For issues or questions:
1. Check this guide
2. Review the code in `src/services/organizationService.ts`
3. Check Supabase logs for errors
4. Open an issue on GitHub

---

Happy collaborating! 🚀
