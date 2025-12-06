# Supabase Integration Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         IDE Application                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  SupabasePanel   │────────▶│ supabaseService  │              │
│  │   (UI Component) │         │   (Business Logic)│              │
│  └──────────────────┘         └──────────────────┘              │
│           │                             │                         │
│           │                             │                         │
│           ▼                             ▼                         │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │   AuthModal      │         │   authService    │              │
│  │   (Sign In/Up)   │◀────────│  (Firebase Auth) │              │
│  └──────────────────┘         └──────────────────┘              │
│                                         │                         │
│                                         │ Auto-sync               │
│                                         ▼                         │
│                               ┌──────────────────┐               │
│                               │ Connection State │               │
│                               │    Management    │               │
│                               └──────────────────┘               │
│                                         │                         │
└─────────────────────────────────────────┼─────────────────────────┘
                                          │
                                          │ HTTPS
                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Cloud                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Auth     │  │   Database   │  │   Storage    │          │
│  │   /auth/v1   │  │   /rest/v1   │  │  /storage/v1 │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         ▼                  ▼                  ▼                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   GoTrue     │  │  PostgreSQL  │  │   S3-like    │          │
│  │   (Auth)     │  │   Database   │  │   Storage    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  Project: hiptkdwqqvifbekcxznc                                   │
│  URL: https://hiptkdwqqvifbekcxznc.supabase.co                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### Authentication Flow

```
User Action (Sign In)
        │
        ▼
┌─────────────────┐
│  SupabasePanel  │
│  (UI Component) │
└────────┬────────┘
         │ signIn(email, password)
         ▼
┌─────────────────┐
│ supabaseService │
└────────┬────────┘
         │ POST /auth/v1/token
         ▼
┌─────────────────┐
│  Supabase Auth  │
│    (GoTrue)     │
└────────┬────────┘
         │ Returns access_token
         ▼
┌─────────────────┐
│  localStorage   │
│  + State Update │
└────────┬────────┘
         │ Notify listeners
         ▼
┌─────────────────┐
│   UI Updates    │
│ (Connected ✓)   │
└─────────────────┘
```

### Database Query Flow

```
User Action (Query Table)
        │
        ▼
┌─────────────────┐
│  SupabasePanel  │
│  (Database Tab) │
└────────┬────────┘
         │ query('table_name', options)
         ▼
┌─────────────────┐
│ supabaseService │
└────────┬────────┘
         │ GET /rest/v1/table_name?params
         │ Headers: apikey, Authorization
         ▼
┌─────────────────┐
│  Supabase REST  │
│   (PostgREST)   │
└────────┬────────┘
         │ Check RLS policies
         ▼
┌─────────────────┐
│   PostgreSQL    │
│    Database     │
└────────┬────────┘
         │ Returns JSON data
         ▼
┌─────────────────┐
│   UI Display    │
│  (JSON viewer)  │
└─────────────────┘
```

### Firebase-Supabase Sync Flow

```
Firebase Sign In
        │
        ▼
┌─────────────────┐
│  authService    │
│ (Firebase Auth) │
└────────┬────────┘
         │ onAuthStateChange
         ▼
┌─────────────────┐
│ supabaseService │
│ setupFirebaseSync│
└────────┬────────┘
         │ Check autoConnect
         ▼
    ┌────────┐
    │ Enabled?│
    └───┬────┘
        │ Yes
        ▼
┌─────────────────┐
│ Auto-connect to │
│    Supabase     │
│   (Optional)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Both services  │
│   connected ✓   │
└─────────────────┘
```

## 📦 Component Structure

```
src/
├── components/
│   └── SupabasePanel.tsx          # Main UI component
│       ├── Configuration Modal     # Setup credentials
│       ├── Auth Modal             # Sign in/up
│       ├── Database Tab           # Query interface
│       ├── Storage Tab            # File management
│       └── Auth Tab               # Connection status
│
├── services/
│   └── supabaseService.ts         # Core service
│       ├── Configuration          # URL, API key management
│       ├── Authentication         # Sign in/up/out
│       ├── Database Operations    # CRUD operations
│       ├── Storage Operations     # File upload
│       ├── Connection State       # State management
│       └── Firebase Sync          # Auto-connect logic
│
└── styles/
    └── SupabasePanel.css          # Component styles
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Client-Side                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • Environment variables (.env)                       │   │
│  │ • localStorage (encrypted tokens)                    │   │
│  │ • HTTPS only communication                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  Layer 2: API Keys                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • Anon Key (public, limited access)                 │   │
│  │ • Service Role Key (private, full access)           │   │
│  │ • JWT tokens (time-limited)                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  Layer 3: Row Level Security (RLS)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • User-based access control                          │   │
│  │ • Policy enforcement                                 │   │
│  │ • auth.uid() validation                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ▼                                   │
│  Layer 4: Database                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • PostgreSQL permissions                             │   │
│  │ • Foreign key constraints                            │   │
│  │ • Data validation                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 API Endpoints

### Authentication Endpoints

```
POST   /auth/v1/signup              # Create new user
POST   /auth/v1/token               # Sign in (get token)
POST   /auth/v1/logout              # Sign out
GET    /auth/v1/user                # Get current user
POST   /auth/v1/recover             # Password recovery
POST   /auth/v1/verify              # Email verification
```

### Database Endpoints (REST API)

```
GET    /rest/v1/{table}             # Select records
POST   /rest/v1/{table}             # Insert records
PATCH  /rest/v1/{table}             # Update records
DELETE /rest/v1/{table}             # Delete records
```

### Storage Endpoints

```
POST   /storage/v1/object/{bucket}/{path}    # Upload file
GET    /storage/v1/object/{bucket}/{path}    # Download file
DELETE /storage/v1/object/{bucket}/{path}    # Delete file
GET    /storage/v1/bucket                    # List buckets
```

## 🎯 State Management

```
┌─────────────────────────────────────────────────────────────┐
│                   Application State                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Configuration State                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • supabaseUrl: string | null                         │   │
│  │ • supabaseKey: string | null                         │   │
│  │ • autoConnectEnabled: boolean                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Connection State                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • isConnected: boolean                               │   │
│  │ • accessToken: string | null                         │   │
│  │ • connectionListeners: Function[]                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  UI State (SupabasePanel)                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • isConfigured: boolean                              │   │
│  │ • showConfig: boolean                                │   │
│  │ • showAuthModal: boolean                             │   │
│  │ • view: 'database' | 'storage' | 'auth'              │   │
│  │ • queryResult: any[]                                 │   │
│  │ • loading: boolean                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Event Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Event System                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Firebase Auth Events                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ onAuthStateChange(user)                              │   │
│  │         │                                            │   │
│  │         ▼                                            │   │
│  │  setupFirebaseSync()                                 │   │
│  │         │                                            │   │
│  │         ▼                                            │   │
│  │  autoConnectWithFirebase()                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Supabase Connection Events                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ onConnectionChange(callback)                         │   │
│  │         │                                            │   │
│  │         ▼                                            │   │
│  │  notifyConnectionListeners(connected)                │   │
│  │         │                                            │   │
│  │         ▼                                            │   │
│  │  UI Updates (badge, buttons, etc.)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  User Action Events                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • Configure button click                             │   │
│  │ • Sign in/up form submit                             │   │
│  │ • Query button click                                 │   │
│  │ • Tab switch                                         │   │
│  │ • Sign out button click                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Data Models

### User Model

```typescript
interface SupabaseUser {
  id: string;                    // UUID
  email: string;                 // User email
  user_metadata: {               // Custom metadata
    display_name?: string;
    firebase_uid?: string;
    photo_url?: string;
    [key: string]: any;
  };
}
```

### Configuration Model

```typescript
interface SupabaseConfig {
  url: string;                   // Project URL
  anonKey: string;               // Anon/public key
  autoConnect?: boolean;         // Auto-connect flag
}
```

### Query Options Model

```typescript
interface QueryOptions {
  select?: string;               // Columns to select
  filter?: Record<string, any>;  // WHERE conditions
  order?: {                      // ORDER BY
    column: string;
    ascending?: boolean;
  };
  limit?: number;                // LIMIT
}
```

## 🚀 Performance Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                  Performance Optimizations                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Connection Pooling                                       │
│     • Reuse HTTP connections                                 │
│     • Keep-alive headers                                     │
│                                                               │
│  2. Token Caching                                            │
│     • Store in localStorage                                  │
│     • Avoid repeated auth calls                              │
│                                                               │
│  3. Query Optimization                                       │
│     • Use select to limit columns                            │
│     • Add limit to prevent large responses                   │
│     • Create indexes on frequently queried columns           │
│                                                               │
│  4. State Management                                         │
│     • Local state for UI                                     │
│     • Connection listeners for sync                          │
│     • Debounce user inputs                                   │
│                                                               │
│  5. Error Handling                                           │
│     • Graceful fallbacks                                     │
│     • User-friendly error messages                           │
│     • Automatic retry for network errors                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 Integration Points

```
IDE Application
    │
    ├── Firebase Auth ──────────┐
    │   (Primary Auth)           │
    │                            │ Sync
    ├── Supabase Auth ──────────┘
    │   (Secondary/Optional)
    │
    ├── Supabase Database
    │   (User data, projects, files)
    │
    ├── Supabase Storage
    │   (File uploads, assets)
    │
    └── Notification Service
        (User feedback)
```

## 📝 Notes

- **Anon Key**: Safe to expose in client-side code, limited by RLS
- **Service Role Key**: Never expose, has full database access
- **Auto-connect**: Optional feature, can be disabled per user
- **RLS**: Always enable for production tables
- **Policies**: Define granular access control
- **Real-time**: Available but not yet implemented in UI
