# Supabase Configuration Guide

Complete guide for setting up and using Supabase with this IDE project.

## 🚀 Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/sign in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Choose a name for your project (e.g., "my-ide-project")
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is perfect to start

### 2. Get Your Project Credentials

Once your project is created:

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy these two values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long JWT token starting with `eyJ...`

### 3. Configure in Your IDE

#### Option A: In-App Configuration (Recommended for Users)

**This is how users should connect - each user uses their own Supabase project:**

1. Open the IDE
2. Click the Supabase icon in the sidebar
3. Click "Connect My Project"
4. Enter **YOUR OWN** Project URL and Anon Key (from step 2 above)
5. Enable "Auto-connect with Firebase authentication" if desired

**Important:** Each user stores their data in their own Supabase project. This ensures:
- ✅ Complete data privacy and ownership
- ✅ No shared database between users
- ✅ Users control their own data
- ✅ Similar to how Lovable.dev works

#### Option B: Environment Variables (For Development/Testing Only)

Developers can set default credentials in `.env` for testing:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Note:** These are only used as defaults. Users will still connect to their own projects through the UI.

## 🔐 Important: User-Specific Configuration

**Each user must create and connect to their OWN Supabase project.**

The IDE is designed like Lovable.dev - every user connects to their own Supabase instance to store their personal data. The credentials in the `.env` file are only for the developer's testing purposes and are NOT shared with users.

## 🔧 Database Setup

### Create Your First Table

1. Go to your Supabase Dashboard
2. Click **Table Editor** in sidebar
3. Click **New Table**
4. Example table structure:

```sql
-- Create a simple projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own projects
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

### Example Tables for IDE Features

```sql
-- User settings table
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  theme TEXT DEFAULT 'dark',
  font_size INTEGER DEFAULT 14,
  auto_save BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Code snippets table
CREATE TABLE code_snippets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project files table
CREATE TABLE project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  content TEXT,
  file_type TEXT,
  size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, file_path)
);
```

## 🔐 Authentication Setup

### Enable Email Authentication

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Enable **Email** provider
3. Configure email templates (optional)

### Using Authentication in the IDE

The IDE automatically syncs with Firebase authentication. When you sign in with Firebase, you can also connect to Supabase:

```typescript
// Sign in to Supabase
await supabaseService.signIn('user@example.com', 'password');

// Sign up new user
await supabaseService.signUp('user@example.com', 'password', {
  display_name: 'John Doe'
});

// Sign out
await supabaseService.signOut();
```

## 📦 Storage Setup

### Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Click **New Bucket**
3. Example buckets:

```
- project-files (private)
- user-avatars (public)
- code-exports (private)
```

### Configure Bucket Policies

```sql
-- Allow authenticated users to upload to their folder
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Using Storage in the IDE

```typescript
// Upload a file
const file = new File(['content'], 'example.txt');
const url = await supabaseService.uploadFile(
  'project-files',
  `${userId}/example.txt`,
  file
);
```

## 🔍 Using the Database

### Query Data

```typescript
// Get all projects
const projects = await supabaseService.query('projects', {
  select: '*',
  limit: 10
});

// Get filtered data
const myProjects = await supabaseService.query('projects', {
  select: 'id, name, created_at',
  filter: { user_id: currentUserId },
  order: { column: 'created_at', ascending: false }
});
```

### Insert Data

```typescript
// Insert single record
await supabaseService.insert('projects', {
  name: 'My New Project',
  description: 'A cool project',
  user_id: currentUserId
});

// Insert multiple records
await supabaseService.insert('code_snippets', [
  { title: 'Snippet 1', code: '...', language: 'javascript' },
  { title: 'Snippet 2', code: '...', language: 'python' }
]);
```

### Update Data

```typescript
// Update records
await supabaseService.update(
  'projects',
  { name: 'Updated Name' },
  { id: projectId }
);
```

### Delete Data

```typescript
// Delete records
await supabaseService.delete('projects', { id: projectId });
```

## 🎯 Real-time Subscriptions

Enable real-time updates for collaborative features:

```sql
-- Enable real-time for a table
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
```

## 🔒 Security Best Practices

### 1. Row Level Security (RLS)

Always enable RLS on your tables:

```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

### 2. Secure Policies

Create policies that restrict access:

```sql
-- Only allow users to access their own data
CREATE POLICY "user_access_own_data"
ON your_table
USING (auth.uid() = user_id);
```

### 3. API Keys

- **Never commit** your `service_role` key to version control
- Use `anon` key for client-side applications
- Store keys in `.env` file (already in `.gitignore`)

### 4. CORS Configuration

Your Supabase project automatically handles CORS, but you can configure it in:
**Project Settings** → **API** → **CORS**

## 🧪 Testing Your Setup

### Test Connection

1. Open the IDE
2. Go to Supabase panel
3. Click "Connect My Project"
4. Enter your credentials
5. Try querying a table

### Test with SQL Editor

In Supabase Dashboard:

```sql
-- Test insert
INSERT INTO projects (name, description)
VALUES ('Test Project', 'Testing connection');

-- Test select
SELECT * FROM projects;
```

## 📱 Features Available

### ✅ Currently Implemented

- ✅ Configuration management
- ✅ Email authentication (sign up/sign in/sign out)
- ✅ Database queries (SELECT)
- ✅ Data insertion (INSERT)
- ✅ Data updates (UPDATE)
- ✅ Data deletion (DELETE)
- ✅ File uploads to storage
- ✅ Auto-connect with Firebase auth
- ✅ Connection state management

### 🚧 Coming Soon

- 🚧 Real-time subscriptions
- 🚧 Storage browser UI
- 🚧 Advanced query builder
- 🚧 Database schema viewer
- 🚧 Migration management

## 🐛 Troubleshooting

### Connection Issues

**Problem**: "Failed to connect to Supabase"

**Solutions**:
1. Verify your Project URL is correct (should start with `https://`)
2. Check your anon key is complete (very long JWT token)
3. Ensure your Supabase project is active (not paused)
4. Check browser console for detailed error messages

### Authentication Issues

**Problem**: "Sign in failed"

**Solutions**:
1. Verify email provider is enabled in Supabase Dashboard
2. Check if user exists (or use sign up instead)
3. Verify password is correct
4. Check if email confirmation is required

### Query Issues

**Problem**: "Query failed" or empty results

**Solutions**:
1. Verify table name is correct (case-sensitive)
2. Check Row Level Security policies
3. Ensure you're authenticated if RLS is enabled
4. Verify table has data

### RLS Policy Issues

**Problem**: "Row level security policy violation"

**Solutions**:
1. Check if RLS is enabled: `SELECT * FROM pg_tables WHERE tablename = 'your_table';`
2. Review your policies: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`
3. Ensure policies allow the operation you're trying to perform
4. Test with RLS disabled temporarily (for debugging only)

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Real-time Guide](https://supabase.com/docs/guides/realtime)

## 💡 Example Use Cases

### 1. Save User Preferences

```typescript
// Save theme preference
await supabaseService.insert('user_settings', {
  user_id: currentUserId,
  theme: 'dark',
  font_size: 14
});

// Load preferences
const settings = await supabaseService.query('user_settings', {
  filter: { user_id: currentUserId }
});
```

### 2. Store Code Snippets

```typescript
// Save snippet
await supabaseService.insert('code_snippets', {
  user_id: currentUserId,
  title: 'React Hook',
  code: 'const [state, setState] = useState()',
  language: 'javascript',
  tags: ['react', 'hooks']
});

// Search snippets
const snippets = await supabaseService.query('code_snippets', {
  filter: { language: 'javascript' },
  order: { column: 'created_at', ascending: false }
});
```

### 3. Collaborative Projects

```typescript
// Create project
const project = await supabaseService.insert('projects', {
  name: 'Team Project',
  user_id: currentUserId
});

// Add project files
await supabaseService.insert('project_files', {
  project_id: project.id,
  file_path: 'src/index.js',
  content: 'console.log("Hello")',
  file_type: 'javascript'
});
```

## 🎉 You're All Set!

Your IDE is now fully configured with Supabase. Start building amazing features with real-time database, authentication, and storage capabilities!

For questions or issues, check the troubleshooting section or visit the Supabase community forums.
