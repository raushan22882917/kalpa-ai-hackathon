# Organizations Integration Guide

This guide shows how to integrate the Organizations feature into your IDE.

## Quick Integration

### 1. Add to Sidebar

Add the OrganizationPanel to your sidebar navigation:

```typescript
// In your Sidebar.tsx or similar component
import { OrganizationPanel } from './OrganizationPanel';

// Add to your sidebar items
const sidebarItems = [
  { id: 'explorer', icon: '📁', label: 'Explorer' },
  { id: 'search', icon: '🔍', label: 'Search' },
  { id: 'source-control', icon: '🔀', label: 'Source Control' },
  { id: 'organizations', icon: '👥', label: 'Organizations' }, // NEW
  { id: 'extensions', icon: '🧩', label: 'Extensions' },
];

// In your render method
{activePanel === 'organizations' && <OrganizationPanel />}
```

### 2. Add to Activity Bar

Update your ActivityBar component:

```typescript
// In ActivityBar.tsx
<button
  className={`activity-bar-item ${activeView === 'organizations' ? 'active' : ''}`}
  onClick={() => onViewChange('organizations')}
  title="Organizations"
>
  👥
</button>
```

### 3. Import the Service

Use the organization service anywhere in your app:

```typescript
import { organizationService } from '../services/organizationService';

// Create organization
const org = await organizationService.createOrganization('My Team', 'Our dev team');

// Join organization
const success = await organizationService.joinOrganization('ABC12XYZ');

// Get user's organizations
const orgs = await organizationService.getUserOrganizations();
```

## Complete Example

Here's a complete example of adding Organizations to your sidebar:

```typescript
// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { FileExplorer } from './FileExplorer';
import { SearchPanel } from './SearchPanel';
import { SourceControlPanel } from './SourceControlPanel';
import { OrganizationPanel } from './OrganizationPanel'; // NEW
import { ExtensionsPanel } from './ExtensionsPanel';
import './Sidebar.css';

interface SidebarProps {
  activePanel: string;
  onPanelChange: (panel: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePanel, onPanelChange }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        <button
          className={activePanel === 'explorer' ? 'active' : ''}
          onClick={() => onPanelChange('explorer')}
          title="Explorer"
        >
          📁
        </button>
        <button
          className={activePanel === 'search' ? 'active' : ''}
          onClick={() => onPanelChange('search')}
          title="Search"
        >
          🔍
        </button>
        <button
          className={activePanel === 'source-control' ? 'active' : ''}
          onClick={() => onPanelChange('source-control')}
          title="Source Control"
        >
          🔀
        </button>
        <button
          className={activePanel === 'organizations' ? 'active' : ''}
          onClick={() => onPanelChange('organizations')}
          title="Organizations"
        >
          👥
        </button>
        <button
          className={activePanel === 'extensions' ? 'active' : ''}
          onClick={() => onPanelChange('extensions')}
          title="Extensions"
        >
          🧩
        </button>
      </div>

      <div className="sidebar-content">
        {activePanel === 'explorer' && <FileExplorer />}
        {activePanel === 'search' && <SearchPanel />}
        {activePanel === 'source-control' && <SourceControlPanel />}
        {activePanel === 'organizations' && <OrganizationPanel />}
        {activePanel === 'extensions' && <ExtensionsPanel />}
      </div>
    </div>
  );
};
```

## Advanced Usage

### Custom Organization UI

Create your own organization UI using the service:

```typescript
import React, { useState, useEffect } from 'react';
import { organizationService, Organization } from '../services/organizationService';

export const MyOrganizationView: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    const organizations = await organizationService.getUserOrganizations();
    setOrgs(organizations);
  };

  const handleCreateOrg = async () => {
    const name = prompt('Organization name:');
    if (name) {
      await organizationService.createOrganization(name);
      await loadOrganizations();
    }
  };

  return (
    <div>
      <h2>My Organizations</h2>
      <button onClick={handleCreateOrg}>Create New</button>
      <ul>
        {orgs.map(org => (
          <li key={org.id}>
            {org.name} - Code: {org.invite_code}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### Project Collaboration

Link projects to organizations:

```typescript
// When creating/opening a project
const handleAddToOrganization = async (projectId: string, orgId: string) => {
  const success = await organizationService.addProjectToOrganization(orgId, projectId);
  if (success) {
    console.log('Project added to organization!');
  }
};

// View organization projects
const handleViewOrgProjects = async (orgId: string) => {
  const projects = await organizationService.getOrganizationProjects(orgId);
  console.log('Organization projects:', projects);
};
```

### Member Management

Manage organization members:

```typescript
// View members
const members = await organizationService.getOrganizationMembers(orgId);

// Promote to admin
await organizationService.updateMemberRole(orgId, userId, 'admin');

// Remove member
await organizationService.removeMember(orgId, userId);
```

## Keyboard Shortcuts

Add keyboard shortcuts for quick access:

```typescript
// In your keybinding service
{
  key: 'Ctrl+Shift+O',
  command: 'organizations.show',
  handler: () => {
    // Show organizations panel
    onPanelChange('organizations');
  }
}
```

## Context Menu Integration

Add organization actions to context menus:

```typescript
// In project context menu
{
  label: 'Add to Organization',
  icon: '👥',
  action: async () => {
    const orgs = await organizationService.getUserOrganizations();
    // Show organization picker
    // Add project to selected organization
  }
}
```

## Notifications

The service automatically shows notifications for all actions. You can customize them:

```typescript
// The service uses notificationService internally
// All operations show success/error notifications automatically
```

## State Management

If using Redux or similar:

```typescript
// actions/organizations.ts
export const loadOrganizations = () => async (dispatch: any) => {
  dispatch({ type: 'ORGANIZATIONS_LOADING' });
  const orgs = await organizationService.getUserOrganizations();
  dispatch({ type: 'ORGANIZATIONS_LOADED', payload: orgs });
};

export const createOrganization = (name: string, description?: string) => 
  async (dispatch: any) => {
    const org = await organizationService.createOrganization(name, description);
    if (org) {
      dispatch({ type: 'ORGANIZATION_CREATED', payload: org });
    }
  };
```

## Testing

Test the organization features:

```typescript
// __tests__/organizationService.test.ts
import { organizationService } from '../services/organizationService';

describe('OrganizationService', () => {
  it('should create organization', async () => {
    const org = await organizationService.createOrganization('Test Org');
    expect(org).toBeTruthy();
    expect(org?.name).toBe('Test Org');
    expect(org?.invite_code).toHaveLength(8);
  });

  it('should join organization with code', async () => {
    const success = await organizationService.joinOrganization('TEST1234');
    expect(success).toBe(true);
  });
});
```

## Styling

The OrganizationPanel uses CSS variables for theming. Customize colors:

```css
/* Custom organization theme */
.organization-panel {
  --org-primary: #4ecdc4;
  --org-secondary: #ff6b6b;
  --org-background: #1e1e1e;
}

.invite-code {
  color: var(--org-primary);
  font-weight: bold;
}
```

## Performance Tips

1. **Lazy Loading**: Load organization data only when panel is opened
2. **Caching**: Cache organization list to reduce API calls
3. **Debouncing**: Debounce search/filter operations
4. **Pagination**: Paginate member lists for large organizations

```typescript
// Example: Lazy load organizations
const [orgs, setOrgs] = useState<Organization[]>([]);
const [loaded, setLoaded] = useState(false);

useEffect(() => {
  if (isPanelOpen && !loaded) {
    loadOrganizations();
    setLoaded(true);
  }
}, [isPanelOpen, loaded]);
```

## Security Considerations

1. **Authentication**: Always check if user is signed in
2. **Authorization**: Verify user permissions before actions
3. **Invite Codes**: Treat as sensitive data
4. **RLS Policies**: Supabase RLS policies enforce security at database level

## Troubleshooting

### Organizations not loading
```typescript
// Check authentication
const user = authService.getCurrentUser();
console.log('Current user:', user);

// Check Supabase connection
const isConnected = supabaseService.isUserConnected();
console.log('Supabase connected:', isConnected);
```

### Can't create organization
```typescript
// Verify user is authenticated
if (!authService.getCurrentUser()) {
  console.error('User not authenticated');
}

// Check Supabase configuration
if (!supabaseService.isConfigured()) {
  console.error('Supabase not configured');
}
```

## Next Steps

1. Apply the database migration
2. Add OrganizationPanel to your sidebar
3. Test creating and joining organizations
4. Customize the UI to match your IDE theme
5. Add keyboard shortcuts
6. Implement project collaboration features

---

For more details, see [ORGANIZATIONS_GUIDE.md](./ORGANIZATIONS_GUIDE.md)
