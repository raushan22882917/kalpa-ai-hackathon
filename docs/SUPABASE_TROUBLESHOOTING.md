# Supabase Troubleshooting Guide

## 🐛 "Insert failed" Error

This error occurs when trying to add a Supabase project. Here's how to fix it:

### Step 1: Check Environment Variables

Make sure your `.env` file has YOUR Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**How to get these:**
1. Go to YOUR Supabase Dashboard: https://supabase.com/dashboard
2. Select YOUR project (not the user's project)
3. Go to Settings → API
4. Copy "Project URL" and "anon/public key"

### Step 2: Run the SQL Schema

The `supabase_projects` table must exist in YOUR Supabase:

1. Open YOUR Supabase Dashboard
2. Go to SQL Editor
3. Copy the entire content from `docs/SUPABASE_CENTRAL_SCHEMA.sql`
4. Paste and click "Run"
5. Verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('supabase_projects', 'user_settings', 'ide_projects', 'project_files');
```

You should see 4 tables.

### Step 3: Check Row Level Security

Make sure RLS policies are created:

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'supabase_projects';
```

You should see policies like:
- "Users can view own projects"
- "Users can insert own projects"
- "Users can update own projects"
- "Users can delete own projects"

If not, run the SQL schema again.

### Step 4: Use Diagnostic Tools

The IDE has built-in diagnostic tools:

1. Go to Supabase panel → Projects tab
2. Click "🔍 Run Diagnostics"
3. Check the browser console for detailed results
4. Click "🧪 Test Insert" to test the insert operation

### Step 5: Check Authentication

Make sure you're signed in with Firebase:

1. Look for user profile in top-right corner
2. If not signed in, click "Sign In"
3. Sign in with Firebase authentication
4. Try adding project again

## 🔍 Diagnostic Checklist

Run through this checklist:

- [ ] `.env` file has `VITE_SUPABASE_URL`
- [ ] `.env` file has `VITE_SUPABASE_ANON_KEY`
- [ ] SQL schema was run in YOUR Supabase
- [ ] Table `supabase_projects` exists
- [ ] RLS policies are created
- [ ] User is signed in with Firebase
- [ ] Browser console shows no errors

## 📊 Common Error Messages

### "Central Supabase not configured"

**Cause:** `.env` file missing or incomplete

**Solution:**
1. Check `.env` file exists in project root
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Restart development server: `npm start`

### "relation 'supabase_projects' does not exist"

**Cause:** SQL schema not run in YOUR Supabase

**Solution:**
1. Go to YOUR Supabase Dashboard → SQL Editor
2. Run `docs/SUPABASE_CENTRAL_SCHEMA.sql`
3. Verify table exists

### "permission denied for table supabase_projects"

**Cause:** RLS policies not configured correctly

**Solution:**
1. Check if RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'supabase_projects';
```

2. If `rowsecurity` is `false`, enable it:
```sql
ALTER TABLE supabase_projects ENABLE ROW LEVEL SECURITY;
```

3. Re-run the policy creation from SQL schema

### "duplicate key value violates unique constraint"

**Cause:** Project with same name already exists

**Solution:**
1. Use a different project name
2. Or delete the existing project first

## 🧪 Manual Testing

### Test 1: Check Connection

Open browser console and run:

```javascript
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

fetch(`${url}/rest/v1/`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
}).then(r => console.log('Connection:', r.ok ? 'OK' : 'Failed'));
```

### Test 2: Check Table Exists

```javascript
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

fetch(`${url}/rest/v1/supabase_projects?limit=0`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
}).then(r => console.log('Table exists:', r.ok));
```

### Test 3: Test Insert

```javascript
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

fetch(`${url}/rest/v1/supabase_projects`, {
  method: 'POST',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  body: JSON.stringify({
    user_id: 'test-user',
    name: 'Test Project',
    project_url: 'https://test.supabase.co',
    anon_key: 'test-key',
    is_active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })
}).then(r => r.json()).then(console.log);
```

## 🔧 Quick Fixes

### Fix 1: Restart Development Server

Sometimes environment variables don't load:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm start
```

### Fix 2: Clear Browser Cache

```
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

### Fix 3: Check Supabase Project Status

Make sure YOUR Supabase project is active:
1. Go to https://supabase.com/dashboard
2. Check if project shows "Active" status
3. If paused, click "Resume"

### Fix 4: Regenerate API Keys

If keys are invalid:
1. Go to Settings → API in YOUR Supabase
2. Click "Regenerate" for anon key
3. Update `.env` with new key
4. Restart server

## 📝 Step-by-Step Setup Verification

Follow these steps in order:

### 1. Verify Environment (30 seconds)

```bash
# Check .env file exists
cat .env | grep SUPABASE

# Should show:
# VITE_SUPABASE_URL=https://...
# VITE_SUPABASE_ANON_KEY=eyJ...
```

### 2. Verify Supabase Connection (1 minute)

1. Open YOUR Supabase Dashboard
2. Go to SQL Editor
3. Run: `SELECT NOW();`
4. Should return current timestamp

### 3. Verify Tables (1 minute)

In SQL Editor, run:

```sql
\dt supabase_projects
```

Should show table details.

### 4. Verify RLS (1 minute)

```sql
SELECT * FROM pg_policies WHERE tablename = 'supabase_projects';
```

Should show 4 policies.

### 5. Test in IDE (1 minute)

1. Open IDE
2. Sign in with Firebase
3. Go to Supabase panel → Projects tab
4. Click "🔍 Run Diagnostics"
5. All checks should pass ✅

## 🆘 Still Having Issues?

### Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Copy error message

### Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Try adding project
4. Look for failed requests (red)
5. Click on failed request
6. Check "Response" tab for error details

### Enable Verbose Logging

The diagnostic tools log detailed information to console. Check:
- Environment configuration
- Connection status
- Authentication status
- Table existence
- RLS policies

### Contact Support

If all else fails, provide:
1. Error message from console
2. Network request/response details
3. Diagnostic results
4. Your Supabase project region

## ✅ Success Checklist

When everything works, you should see:

- ✅ Environment variables configured
- ✅ Connection to Supabase successful
- ✅ User authenticated with Firebase
- ✅ Table `supabase_projects` exists
- ✅ RLS policies configured
- ✅ Test insert successful
- ✅ Can add projects in IDE
- ✅ Projects appear in list
- ✅ Can switch between projects

## 📚 Related Documentation

- [Quick Setup Guide](./SUPABASE_QUICK_SETUP.md)
- [Multi-Project Guide](./SUPABASE_MULTI_PROJECT_GUIDE.md)
- [Central Schema SQL](./SUPABASE_CENTRAL_SCHEMA.sql)
- [User Guide](./USER_SUPABASE_GUIDE.md)
