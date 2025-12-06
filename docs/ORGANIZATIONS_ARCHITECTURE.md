# Organizations Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Your IDE Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────────────────────┐    │
│  │   Sidebar    │      │    OrganizationPanel         │    │
│  │              │      │                               │    │
│  │  📁 Files    │      │  ┌────────────────────────┐  │    │
│  │  🔍 Search   │      │  │  Organization List     │  │    │
│  │  🔀 Git      │      │  │  - Team A (ABC123)     │  │    │
│  │  👥 Orgs  ◄──┼──────┼─►│  - Team B (XYZ789)     │  │    │
│  │  🧩 Ext      │      │  └────────────────────────┘  │    │
│  └──────────────┘      │                               │    │
│                        │  ┌────────────────────────┐  │    │
│                        │  │  Organization Details  │  │    │
│                        │  │  - Members             │  │    │
│                        │  │  - Projects            │  │    │
│                        │  │  - Invite Code         │  │    │
│                        │  └────────────────────────┘  │    │
│                        └──────────────────────────────┘    │
│                                     │                        │
│                                     ▼                        │
│                        ┌──────────────────────────────┐    │
│                        │  organizationService.ts      │    │
│                        │  - createOrganization()      │    │
│                        │  - joinOrganization()        │    │
│                        │  - getMembers()              │    │
│                        │  - addProject()              │    │
│                        └──────────────────────────────┘    │
│                                     │                        │
└─────────────────────────────────────┼────────────────────────┘
                                      │
                                      ▼
                        ┌──────────────────────────────┐
                        │    supabaseService.ts        │
                        │    - query()                 │
                        │    - insert()                │
                        │    - update()                │
                        │    - delete()                │
                        └──────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Database                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  organizations   │  │ organization_    │                │
│  │                  │  │    members       │                │
│  │  - id            │  │                  │                │
│  │  - name          │  │  - id            │                │
│  │  - invite_code   │  │  - org_id        │                │
│  │  - owner_id      │  │  - user_id       │                │
│  └──────────────────┘  │  - role          │                │
│                        └──────────────────┘                │
│                                                               │
│  ┌──────────────────┐                                       │
│  │ organization_    │                                       │
│  │    projects      │                                       │
│  │                  │                                       │
│  │  - id            │                                       │
│  │  - org_id        │                                       │
│  │  - project_id    │                                       │
│  │  - created_by    │                                       │
│  └──────────────────┘                                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Creating an Organization

```
User Action                Service Layer              Database
─────────────────────────────────────────────────────────────
                                                              
1. Click "Create"                                             
   ↓                                                          
2. Enter name/desc                                            
   ↓                                                          
3. Submit form                                                
   ↓                                                          
   ├──────────────────→ createOrganization()                 
                        ↓                                     
                        Generate invite code                  
                        ↓                                     
                        ├──────────────────→ INSERT INTO     
                                             organizations    
                                             ↓                
                                             Trigger:         
                                             add_owner_as_    
                                             member()         
                                             ↓                
                                             INSERT INTO      
                                             organization_    
                                             members          
                                             ↓                
                        ←──────────────────┤ Return org data 
                        ↓                                     
   ←────────────────────┤ Return org object                  
   ↓                                                          
4. Display success                                            
   ↓                                                          
5. Show invite code                                           
```

### Joining an Organization

```
User Action                Service Layer              Database
─────────────────────────────────────────────────────────────
                                                              
1. Click "Join"                                               
   ↓                                                          
2. Enter invite code                                          
   ↓                                                          
3. Submit                                                     
   ↓                                                          
   ├──────────────────→ joinOrganization()                   
                        ↓                                     
                        ├──────────────────→ SELECT FROM     
                                             organizations    
                                             WHERE            
                                             invite_code=?    
                                             ↓                
                        ←──────────────────┤ Return org      
                        ↓                                     
                        Check if already                      
                        member                                
                        ↓                                     
                        ├──────────────────→ INSERT INTO     
                                             organization_    
                                             members          
                                             ↓                
                        ←──────────────────┤ Success         
                        ↓                                     
   ←────────────────────┤ Return true                        
   ↓                                                          
4. Display success                                            
   ↓                                                          
5. Refresh org list                                           
```

## Component Hierarchy

```
OrganizationPanel
├── Header
│   ├── Title
│   └── Actions
│       ├── Create Button
│       └── Join Button
│
├── Organization List (Left Panel)
│   └── Organization Items
│       ├── Name
│       ├── Description
│       └── Invite Code
│
└── Organization Details (Right Panel)
    ├── Header
    │   ├── Name
    │   └── Actions
    │       ├── Copy Code
    │       ├── Leave/Delete
    │       └── Settings
    │
    ├── Invite Code Section
    │   ├── Code Display
    │   ├── Copy Button
    │   └── Help Text
    │
    ├── Members Section
    │   └── Member List
    │       ├── User ID
    │       ├── Role Badge
    │       └── Join Date
    │
    └── Projects Section
        └── Project List
            ├── Project Name
            ├── Added Date
            └── Actions

Modals:
├── Create Organization Modal
│   ├── Name Input
│   ├── Description Input
│   └── Actions (Cancel/Create)
│
└── Join Organization Modal
    ├── Code Input
    ├── Help Text
    └── Actions (Cancel/Join)
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Authentication                                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Firebase Auth                                      │    │
│  │  - User must be signed in                          │    │
│  │  - JWT token validation                            │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                    │
│  Layer 2: Service Layer Validation                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  organizationService                                │    │
│  │  - Check user authentication                       │    │
│  │  - Validate input data                             │    │
│  │  - Check user permissions                          │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                    │
│  Layer 3: Row Level Security (RLS)                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Supabase RLS Policies                             │    │
│  │  - organizations: owner/member access              │    │
│  │  - members: organization member access             │    │
│  │  - projects: organization member access            │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↓                                    │
│  Layer 4: Database Constraints                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  PostgreSQL Constraints                             │    │
│  │  - Foreign key constraints                         │    │
│  │  - Unique constraints                              │    │
│  │  - Check constraints (role validation)            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Permission Matrix

```
┌──────────────────┬────────┬────────┬────────┐
│     Action       │ Owner  │ Admin  │ Member │
├──────────────────┼────────┼────────┼────────┤
│ View org         │   ✅   │   ✅   │   ✅   │
│ View members     │   ✅   │   ✅   │   ✅   │
│ View projects    │   ✅   │   ✅   │   ✅   │
│ Add projects     │   ✅   │   ✅   │   ✅   │
│ Invite members   │   ✅   │   ✅   │   ✅   │
│ Update roles     │   ✅   │   ✅   │   ❌   │
│ Remove members   │   ✅   │   ✅   │   ❌   │
│ Update org       │   ✅   │   ❌   │   ❌   │
│ Delete org       │   ✅   │   ❌   │   ❌   │
│ Leave org        │   ✅   │   ✅   │   ✅   │
└──────────────────┴────────┴────────┴────────┘
```

## State Management

```
OrganizationPanel State:
├── organizations: Organization[]
├── selectedOrg: Organization | null
├── members: OrganizationMember[]
├── projects: OrganizationProject[]
├── loading: boolean
├── showCreateModal: boolean
├── showJoinModal: boolean
├── newOrgName: string
├── newOrgDescription: string
├── inviteCode: string
└── currentUser: User | null

State Updates:
├── On mount → Load organizations
├── On auth change → Reload organizations
├── On org select → Load members & projects
├── On create → Add to list & select
├── On join → Add to list & select
└── On leave/delete → Remove from list & deselect
```

## API Endpoints (via Supabase REST)

```
Organizations:
GET    /rest/v1/organizations?id=eq.{id}
POST   /rest/v1/organizations
PATCH  /rest/v1/organizations?id=eq.{id}
DELETE /rest/v1/organizations?id=eq.{id}

Members:
GET    /rest/v1/organization_members?organization_id=eq.{id}
POST   /rest/v1/organization_members
PATCH  /rest/v1/organization_members?id=eq.{id}
DELETE /rest/v1/organization_members?id=eq.{id}

Projects:
GET    /rest/v1/organization_projects?organization_id=eq.{id}
POST   /rest/v1/organization_projects
DELETE /rest/v1/organization_projects?id=eq.{id}
```

## Error Handling Flow

```
User Action
    ↓
Service Method
    ↓
Try {
    Validate Input
        ↓
    Check Auth
        ↓
    Check Permissions
        ↓
    Database Operation
        ↓
    Success Notification
        ↓
    Return Result
}
Catch {
    Log Error
        ↓
    Error Notification
        ↓
    Return null/false
}
```

## Scalability Considerations

### Current Design
- ✅ Supports unlimited organizations per user
- ✅ Supports unlimited members per organization
- ✅ Supports unlimited projects per organization
- ✅ Efficient indexing on foreign keys
- ✅ RLS policies for security

### Future Optimizations
- [ ] Pagination for large member lists
- [ ] Caching frequently accessed organizations
- [ ] Real-time subscriptions for live updates
- [ ] Search/filter for organizations
- [ ] Bulk operations for member management

## Technology Stack

```
Frontend:
├── React (UI components)
├── TypeScript (type safety)
└── CSS (styling)

Backend:
├── Supabase (database + auth)
├── PostgreSQL (data storage)
└── Row Level Security (access control)

Services:
├── organizationService (business logic)
├── supabaseService (database operations)
├── authService (authentication)
└── notificationService (user feedback)
```

---

This architecture provides a solid foundation for team collaboration while maintaining security and scalability.
