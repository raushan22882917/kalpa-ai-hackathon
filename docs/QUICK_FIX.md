# QUICK FIX: "Insert Failed" Error

## The Problem
The `supabase_projects` table doesn't exist in your Supabase database yet.

## The Solution (2 minutes)

### Step 1: Open Supabase Dashboard
Click this link (it will open YOUR Supabase project):
```
https://supabase.com/dashboard/project/hiptkdwqqvifbekcxznc
```

### Step 2: Go to SQL Editor
1. Look at the left sidebar
2. Click on "SQL Editor" (it has a </> icon)

### Step 3: Run This SQL

Copy this ENTIRE SQL code and paste it in the SQL Editor:

```sql
-- Create supabase_projects table
CREATE TABLE IF NOT EXISTS supabase_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_url TEXT NOT NULL,
  anon_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_project_name UNIQUE (user_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supabase_projects_user_id ON supabase_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_supabase_projects_is_active ON supabase_projects(user_id, is_active);

-- Enable RLS
ALTER TABLE supabase_projects ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - we'll secure it later)
DROP POLICY IF EXISTS "Enable all for authenticated users" ON supabase_projects;
CREATE POLICY "Enable all for authenticated users"
  ON supabase_projects
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Step 4: Click "Run"
Click the "Run" button (or press Ctrl+Enter)

You should see: ✅ "Success. No rows returned"

### Step 5: Test in IDE
1. Go back to your IDE
2. Refresh the page (F5)
3. Go to Supabase panel → Projects tab
4. Click "+ Add Project"
5. Fill in the form
6. Click "Add Project"
7. ✅ It should work now!

## Still Not Working?

### Check 1: Verify Table Exists
In Supabase SQL Editor, run:
```sql
SELECT * FROM supabase_projects LIMIT 1;
```

If you see "relation does not exist" → Run the SQL above again

If you see "Success" (even with 0 rows) → Table exists ✅

### Check 2: Run Diagnostics
In the IDE:
1. Go to Supabase panel → Projects tab
2. Click "🔍 Run Diagnostics"
3. Check browser console (F12)
4. All checks should show ✅

### Check 3: Restart Server
```bash
# Stop server (Ctrl+C)
npm start
```

## Why This Happened

The multi-project system stores user's project configurations in YOUR central Supabase database. The table needs to be created first before you can add projects.

## What This SQL Does

1. Creates `supabase_projects` table to store project configs
2. Adds indexes for faster queries
3. Enables Row Level Security (RLS)
4. Creates a permissive policy (allows all operations)

Note: The policy is permissive for now. Once everything works, you can run the full schema from `docs/SUPABASE_CENTRAL_SCHEMA.sql` for proper security.

## Success!

Once the table is created, you can:
- ✅ Add unlimited Supabase projects
- ✅ Switch between projects
- ✅ All data persists automatically
- ✅ Works across devices

## Need More Help?

- Check browser console (F12) for detailed errors
- Run diagnostics in IDE
- See `docs/SUPABASE_TROUBLESHOOTING.md`
