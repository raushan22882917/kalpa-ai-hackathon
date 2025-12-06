# Fix "Insert Failed" Error - Quick Guide

## 🎯 Problem

Getting "Insert failed" error when trying to add a Supabase project.

## ✅ Solution (5 minutes)

### 1. Setup YOUR Central Supabase (2 min)

**Go to YOUR Supabase Dashboard:**
```
https://supabase.com/dashboard
```

**Run this SQL:**
1. Click "SQL Editor"
2. Copy ALL content from `docs/SUPABASE_CENTRAL_SCHEMA.sql`
3. Paste and click "Run"
4. Wait for "Success" message

### 2. Update .env File (1 min)

**Get your credentials:**
1. In YOUR Supabase Dashboard
2. Go to Settings → API
3. Copy "Project URL" and "anon public key"

**Update .env:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Restart Server (30 sec)

```bash
# Stop server (Ctrl+C)
npm start
```

### 4. Test (1 min)

1. Open IDE
2. Sign in with Firebase
3. Go to Supabase panel → Projects tab
4. Click "🔍 Run Diagnostics"
5. All should show ✅

### 5. Try Again (30 sec)

1. Click "+ Add Project"
2. Fill in details
3. Click "Add Project"
4. ✅ Success!

## 🔍 Diagnostic Tools

The IDE now has built-in diagnostic tools:

### Run Diagnostics
- Click "🔍 Run Diagnostics" button
- Checks all setup requirements
- Shows detailed results in console

### Test Insert
- Click "🧪 Test Insert" button
- Tests actual insert operation
- Shows success or error details

## 📊 What Gets Checked

1. ✅ Environment variables configured
2. ✅ Connection to Supabase works
3. ✅ User authenticated with Firebase
4. ✅ Table `supabase_projects` exists
5. ✅ RLS policies configured correctly

## 🐛 Common Issues

### "Central Supabase not configured"
→ Check `.env` file has both URL and KEY

### "Table does not exist"
→ Run SQL schema in YOUR Supabase

### "Permission denied"
→ RLS policies not created, run SQL schema again

### "User not signed in"
→ Sign in with Firebase first

## 📝 Verification

After setup, run in browser console:

```javascript
// Should show your Supabase URL
console.log(import.meta.env.VITE_SUPABASE_URL);

// Should show "Set ✅"
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set ✅' : 'Missing ❌');
```

## 🎉 Success!

When working, you'll see:
- Projects tab shows your projects
- Can add new projects
- Can switch between projects
- All diagnostics pass ✅

## 📚 More Help

- [Setup Checklist](./SUPABASE_SETUP_CHECKLIST.md) - Step-by-step
- [Troubleshooting](./SUPABASE_TROUBLESHOOTING.md) - Detailed fixes
- [Quick Setup](./SUPABASE_QUICK_SETUP.md) - Full guide
