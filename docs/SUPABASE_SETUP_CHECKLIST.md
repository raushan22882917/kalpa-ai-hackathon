# Supabase Setup Checklist

## ✅ Quick Setup Checklist

Follow these steps to fix the "Insert failed" error:

### □ Step 1: Check .env File (1 minute)

Open `.env` file and verify:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to get these:**
1. Go to https://supabase.com/dashboard
2. Select YOUR project
3. Settings → API
4. Copy "Project URL" and "anon public key"

### □ Step 2: Run SQL Schema (2 minutes)

1. Open YOUR Supabase Dashboard
2. Click "SQL Editor" in sidebar
3. Open `docs/SUPABASE_CENTRAL_SCHEMA.sql`
4. Copy ALL the SQL code
5. Paste in SQL Editor
6. Click "Run" button

**Verify it worked:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'supabase_projects';
```

Should return 1 row.

### □ Step 3: Restart Dev Server (30 seconds)

```bash
# Stop server (Ctrl+C in terminal)
# Start again
npm start
```

### □ Step 4: Sign In (30 seconds)

1. Open IDE in browser
2. Click "Sign In" button
3. Sign in with Firebase
4. Verify you see your profile

### □ Step 5: Test (1 minute)

1. Go to Supabase panel (⚡ icon)
2. Click "Projects" tab
3. Click "🔍 Run Diagnostics"
4. Check console - all should be ✅
5. Click "🧪 Test Insert"
6. Should see success message

### □ Step 6: Add Project

1. Click "+ Add Project"
2. Fill in:
   - Name: "My Test Project"
   - URL: (any Supabase project URL)
   - Anon Key: (any Supabase anon key)
3. Click "Add Project"
4. Should see success! ✅

## 🎯 Quick Verification

Run this in browser console:

```javascript
// Check env vars
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌');
```

## 🐛 If Still Failing

### Check 1: Table Exists?

In Supabase SQL Editor:
```sql
SELECT * FROM supabase_projects LIMIT 1;
```

- If error "relation does not exist" → Run SQL schema again
- If works → Table exists ✅

### Check 2: RLS Policies?

```sql
SELECT policyname FROM pg_policies WHERE tablename = 'supabase_projects';
```

Should show 4 policies. If not → Run SQL schema again.

### Check 3: Signed In?

Look for user profile icon in IDE. If not there → Sign in with Firebase.

## 📊 Expected Results

After setup:

```
✅ Environment Config: PASS
✅ Connection: PASS  
✅ Authentication: PASS
✅ Table Exists: PASS
✅ RLS Policies: PASS
✅ Test Insert: PASS
```

## 🚀 You're Done!

Once all checks pass, you can:
- Add unlimited Supabase projects
- Switch between projects
- Query databases
- Use storage
- Manage auth

## 📚 Need More Help?

- [Troubleshooting Guide](./SUPABASE_TROUBLESHOOTING.md) - Detailed fixes
- [Quick Setup](./SUPABASE_QUICK_SETUP.md) - 5-minute guide
- [Multi-Project Guide](./SUPABASE_MULTI_PROJECT_GUIDE.md) - Full documentation
