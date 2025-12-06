# Supabase Quick Reference

## 🔑 Connect Your Own Project

**Important:** Each user connects to their own Supabase project. Get your credentials from:

1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to **Settings → API**
3. Copy your **Project URL** and **anon/public key**
4. Connect through the IDE's Supabase panel

📖 **New User?** See [USER_SUPABASE_GUIDE.md](./USER_SUPABASE_GUIDE.md) for step-by-step setup.

## 🚀 Quick Commands

### Authentication

```typescript
// Sign Up
await supabaseService.signUp('email@example.com', 'password');

// Sign In
await supabaseService.signIn('email@example.com', 'password');

// Sign Out
await supabaseService.signOut();

// Get Current User
const user = await supabaseService.getCurrentUser();

// Check Connection
const isConnected = supabaseService.isUserConnected();
```

### Database Operations

```typescript
// SELECT - Get all records
const data = await supabaseService.query('table_name');

// SELECT - With filters
const filtered = await supabaseService.query('table_name', {
  select: 'id, name, email',
  filter: { status: 'active' },
  order: { column: 'created_at', ascending: false },
  limit: 10
});

// INSERT - Single record
await supabaseService.insert('table_name', {
  name: 'John Doe',
  email: 'john@example.com'
});

// INSERT - Multiple records
await supabaseService.insert('table_name', [
  { name: 'John', email: 'john@example.com' },
  { name: 'Jane', email: 'jane@example.com' }
]);

// UPDATE
await supabaseService.update(
  'table_name',
  { status: 'completed' },
  { id: '123' }
);

// DELETE
await supabaseService.delete('table_name', { id: '123' });
```

### Storage Operations

```typescript
// Upload file
const file = new File(['content'], 'filename.txt');
const url = await supabaseService.uploadFile(
  'bucket-name',
  'path/to/file.txt',
  file
);
```

## 📊 Common SQL Queries

### Create Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT,
  path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enable RLS

```sql
-- Enable Row Level Security
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create policy for user access
CREATE POLICY "Users can access own data"
ON table_name
FOR ALL
USING (auth.uid() = user_id);
```

## 🎯 IDE Panel Features

### Supabase Panel Tabs

1. **Database Tab**
   - Query tables directly
   - View results in JSON format
   - Quick table exploration

2. **Storage Tab**
   - File browser (coming soon)
   - Upload/download files
   - Manage buckets

3. **Auth Tab**
   - Sign in/sign up
   - View connection status
   - Sign out

### Configuration Options

- **Auto-connect**: Automatically connect when signed in with Firebase
- **Manual connect**: Connect with email/password
- **Reconfigure**: Update project URL and API key

## 🔧 Environment Variables

Add to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🌐 Dashboard Links

Access your Supabase dashboard at:
- **Main Dashboard**: https://supabase.com/dashboard
- **Your Projects**: https://supabase.com/dashboard/projects

Once you select your project, you can access:
- Table Editor
- SQL Editor
- Authentication
- Storage
- API Settings

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't connect | Check URL and anon key are correct |
| Sign in fails | Verify email provider is enabled |
| Query returns empty | Check RLS policies and authentication |
| Upload fails | Verify bucket exists and policies allow upload |
| 400 error | User doesn't exist or wrong credentials |

## 📱 Keyboard Shortcuts (in IDE)

- Open Supabase Panel: Click Supabase icon in sidebar
- Switch tabs: Click Database/Storage/Auth tabs
- Quick query: Enter table name and press Enter

## 💡 Pro Tips

1. **Use RLS**: Always enable Row Level Security for production
2. **Index columns**: Add indexes for frequently queried columns
3. **Batch operations**: Use array inserts for multiple records
4. **Error handling**: Always wrap operations in try-catch
5. **Connection state**: Subscribe to connection changes for UI updates

## 🔗 Useful Links

- [Full Setup Guide](./SUPABASE_SETUP.md)
- [Supabase Docs](https://supabase.com/docs)
- [API Reference](https://supabase.com/docs/reference/javascript)
