# Supabase Multi-Project Management Guide

## 🎯 Overview

This IDE now supports **advanced Supabase project management** where:

1. **User data is stored centrally** in YOUR Supabase (user settings, project configurations)
2. **Users can connect multiple Supabase projects** for different IDE projects
3. **Automatic project switching** based on active IDE project
4. **Centralized management** of all user's Supabase connections

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User's IDE                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User signs in with Firebase                                 │
│         │                                                     │
│         ▼                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Supabase Project Manager                       │   │
│  │  - Manages multiple Supabase projects                 │   │
│  │  - Stores configurations centrally                    │   │
│  │  - Switches active project                            │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                                                     │
│         ▼                                                     │
└─────────┼─────────────────────────────────────────────────────┘
          │
          │ Stores user data
          ▼
┌─────────────────────────────────────────────────────────────┐
│            YOUR Central Supabase                             │
│  (Stores user settings & project configurations)            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Tables:                                                      │
│  - supabase_projects (user's Supabase project configs)      │
│  - user_settings (user preferences)                          │
│  - ide_projects (IDE project metadata)                       │
│  - project_files (file metadata)                             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
          │
          │ User's projects connect to
          ▼
┌─────────────────────────────────────────────────────────────┐
│         User's Supabase Projects (Multiple)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Project A: E-commerce App                                   │
│  Project B: Blog Platform                                    │
│  Project C: Task Manager                                     │
│                                                               │
│  Each project has its own database, storage, auth            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Setup Instructions

### Step 1: Setup Central Supabase (Your Supabase)

1. **Run the SQL Schema**
   - Go to YOUR Supabase Dashboard
   - Open SQL Editor
   - Copy and run the schema from `docs/SUPABASE_CENTRAL_SCHEMA.sql`
   - This creates tables to store user data

2. **Verify Tables Created**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('supabase_projects', 'user_settings', 'ide_projects', 'project_files');
   ```

3. **Configure Environment**
   - Your `.env` file should have YOUR Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### Step 2: User Workflow

#### For Users:

1. **Sign in to IDE** with Firebase authentication

2. **Go to Supabase Panel** → **Projects Tab**

3. **Add First Supabase Project**:
   - Click "+ Add Project"
   - Enter:
     - Project Name (e.g., "E-commerce Backend")
     - Description (optional)
     - Project URL (from Supabase dashboard)
     - Anon Key (from Supabase dashboard)
   - Click "Add Project"

4. **Project is Now Active**:
   - First project becomes active automatically
   - Can query database, use storage, etc.

5. **Add More Projects** (optional):
   - Click "+ Add Project" again
   - Add as many projects as needed
   - Switch between them anytime

6. **Switch Projects**:
   - Go to Projects tab
   - Click "Switch" on any project
   - Active project is highlighted with green badge

## 📊 Features

### Multi-Project Management

```
User's Projects:
┌────────────────────────────────────────┐
│ ✓ E-commerce Backend (Active)          │
│   https://ecommerce.supabase.co        │
│   [Switch] [Delete]                    │
├────────────────────────────────────────┤
│   Blog Platform                        │
│   https://blog.supabase.co             │
│   [Switch] [Delete]                    │
├────────────────────────────────────────┤
│   Task Manager                         │
│   https://tasks.supabase.co            │
│   [Switch] [Delete]                    │
└────────────────────────────────────────┘
```

### Automatic Project Switching

When user switches projects:
1. Configuration is updated
2. Active project is marked in database
3. All database/storage operations use new project
4. UI updates to show active project

### Data Persistence

All user data is stored in YOUR central Supabase:
- Project configurations
- User settings
- IDE project metadata
- File metadata

## 🔐 Security

### Row Level Security (RLS)

All tables have RLS enabled:

```sql
-- Users can only see their own projects
CREATE POLICY "Users can view own projects"
  ON supabase_projects
  FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

### Authentication Flow

```
1. User signs in with Firebase
2. Firebase UID is used as user_id
3. All queries filtered by user_id
4. Users can only access their own data
```

## 💡 Use Cases

### Use Case 1: Multiple Client Projects

Developer working on multiple client projects:

```
Client A Project → Supabase Project A
Client B Project → Supabase Project B
Client C Project → Supabase Project C
```

Each client's data stays completely separate.

### Use Case 2: Development Stages

Same project, different environments:

```
Development → Supabase Dev Project
Staging → Supabase Staging Project
Production → Supabase Prod Project
```

Switch between environments easily.

### Use Case 3: Personal Projects

Multiple personal projects:

```
Portfolio Website → Supabase Project 1
Side Project App → Supabase Project 2
Learning Project → Supabase Project 3
```

Keep all projects organized in one IDE.

## 🔧 API Reference

### Add Project

```typescript
import { supabaseProjectManager } from './services/supabaseProjectManager';

const project = await supabaseProjectManager.addProject({
  name: 'My Project',
  description: 'Optional description',
  project_url: 'https://xxxxx.supabase.co',
  anon_key: 'your_anon_key'
});
```

### Switch Project

```typescript
await supabaseProjectManager.setActiveProject(projectId);
```

### Get Current Project

```typescript
const currentProject = supabaseProjectManager.getCurrentProject();
console.log(currentProject.name);
console.log(currentProject.project_url);
```

### Get All Projects

```typescript
const projects = supabaseProjectManager.getProjects();
projects.forEach(project => {
  console.log(`${project.name}: ${project.is_active ? 'Active' : 'Inactive'}`);
});
```

### Subscribe to Changes

```typescript
const unsubscribe = supabaseProjectManager.onProjectsChange((projects) => {
  console.log('Projects updated:', projects);
});

// Later: unsubscribe()
```

### Delete Project

```typescript
await supabaseProjectManager.deleteProject(projectId);
```

## 📝 Database Schema

### supabase_projects Table

```sql
CREATE TABLE supabase_projects (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,           -- Firebase UID
  name TEXT NOT NULL,
  description TEXT,
  project_url TEXT NOT NULL,
  anon_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### user_settings Table

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  theme TEXT DEFAULT 'dark',
  font_size INTEGER DEFAULT 14,
  auto_save BOOLEAN DEFAULT true,
  vim_mode BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### ide_projects Table

```sql
CREATE TABLE ide_projects (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  supabase_project_id UUID REFERENCES supabase_projects(id),
  name TEXT NOT NULL,
  description TEXT,
  tech_stack JSONB DEFAULT '{}',
  last_opened_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🎨 UI Components

### Projects Tab

Shows all user's Supabase projects:
- Active project highlighted
- Switch button for inactive projects
- Delete button for all projects
- Add new project button

### Project Card

```
┌────────────────────────────────────┐
│ Project Name          [Active]     │
│ Optional description               │
│ https://project.supabase.co        │
│                    [Switch][Delete]│
└────────────────────────────────────┘
```

### Add Project Modal

Form to add new Supabase project:
- Project Name (required)
- Description (optional)
- Project URL (required)
- Anon Key (required)

## 🐛 Troubleshooting

### "Central Supabase not configured"

**Solution**: Make sure your `.env` has:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### "Failed to load projects"

**Solutions**:
1. Check if SQL schema was run in YOUR Supabase
2. Verify RLS policies are created
3. Check if user is signed in with Firebase
4. Check browser console for detailed errors

### "Query failed"

**Solutions**:
1. Make sure a project is active (green badge)
2. Verify the table exists in the active Supabase project
3. Check RLS policies in the active project
4. Ensure you're authenticated

## 🎯 Best Practices

### 1. Organize Projects

Use clear naming:
- ✅ "E-commerce Backend - Production"
- ✅ "Blog Platform - Development"
- ❌ "Project 1"
- ❌ "Test"

### 2. Use Descriptions

Add context:
- "Production database for client XYZ"
- "Development environment for testing"
- "Personal project - learning Next.js"

### 3. Regular Cleanup

Delete unused projects:
- Remove old test projects
- Clean up completed projects
- Keep list manageable

### 4. Security

- Never share anon keys publicly
- Use different projects for dev/prod
- Enable RLS on all tables
- Regularly rotate keys

## 🚀 Advanced Features (Coming Soon)

- [ ] Import projects from Supabase dashboard automatically
- [ ] Project templates
- [ ] Bulk operations
- [ ] Project sharing (team collaboration)
- [ ] Project analytics
- [ ] Automatic backups

## 📚 Related Documentation

- [Central Schema SQL](./SUPABASE_CENTRAL_SCHEMA.sql)
- [User Guide](./USER_SUPABASE_GUIDE.md)
- [Architecture](./SUPABASE_ARCHITECTURE.md)
- [Quick Reference](./SUPABASE_QUICK_REFERENCE.md)

## ✨ Summary

This multi-project system gives users:
- ✅ Centralized management of all Supabase projects
- ✅ Easy switching between projects
- ✅ Data persistence across sessions
- ✅ Complete privacy and security
- ✅ Scalable architecture for multiple projects

Users can now manage multiple Supabase projects from one IDE, with all configurations stored securely in your central Supabase!
