# Quick Setup: Supabase Multi-Project System

## ⚡ 5-Minute Setup

### Step 1: Setup Your Central Supabase (2 minutes)

1. Open YOUR Supabase Dashboard: https://supabase.com/dashboard
2. Go to SQL Editor
3. Copy the entire content from `docs/SUPABASE_CENTRAL_SCHEMA.sql`
4. Paste and click "Run"
5. ✅ Tables created!

### Step 2: Verify Setup (1 minute)

Run this query in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('supabase_projects', 'user_settings', 'ide_projects', 'project_files');
```

You should see 4 tables.

### Step 3: Test the System (2 minutes)

1. Start your IDE
2. Sign in with Firebase
3. Click Supabase panel (⚡ icon)
4. Go to "Projects" tab
5. Click "+ Add Project"
6. Enter any Supabase project details
7. ✅ Project added!

## 🎯 How It Works

```
Your .env → YOUR Supabase (stores user data)
                 ↓
         User's project list
                 ↓
         User's Supabase Projects (their work data)
```

## 📊 What Gets Stored Where

### YOUR Central Supabase:
- User settings (theme, font size, etc.)
- User's Supabase project configurations
- IDE project metadata
- File metadata

### User's Supabase Projects:
- Their actual application data
- Their database tables
- Their storage files
- Their authentication users

## 🔐 Security

- Each user can only see their own data (RLS enabled)
- Firebase UID used for authentication
- All connections encrypted (HTTPS)
- Anon keys stored securely

## 💡 User Experience

### Before (Old System):
```
User → Manually enter URL and key → Connect to ONE project
```

### After (New System):
```
User → Sign in → See all their projects → Switch anytime
```

## 🎨 UI Flow

1. **Projects Tab** (New!)
   - Shows all user's Supabase projects
   - Active project highlighted
   - Add/Switch/Delete buttons

2. **Database Tab**
   - Query active project's database
   - Same as before, but now multi-project

3. **Storage Tab**
   - Access active project's storage
   - Same as before, but now multi-project

4. **Auth Tab**
   - Manage active project's auth
   - Same as before, but now multi-project

## 🚀 Key Features

### ✅ Multi-Project Support
Users can add unlimited Supabase projects

### ✅ Easy Switching
One click to switch between projects

### ✅ Persistent Storage
All configurations saved in YOUR Supabase

### ✅ Auto-Sync
Changes sync across devices automatically

### ✅ Secure
RLS ensures data privacy

## 📝 Example User Workflow

```
Day 1:
- User signs in
- Adds "E-commerce Backend" project
- Works on e-commerce app

Day 2:
- User adds "Blog Platform" project
- Switches to blog project
- Works on blog

Day 3:
- Switches back to e-commerce
- All settings preserved
- Continues work seamlessly
```

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't add project | Check if SQL schema was run |
| Projects not loading | Verify user is signed in with Firebase |
| Switch not working | Check browser console for errors |
| Query fails | Make sure project is active (green badge) |

## 📚 Full Documentation

- **[Multi-Project Guide](./SUPABASE_MULTI_PROJECT_GUIDE.md)** - Complete guide
- **[Central Schema](./SUPABASE_CENTRAL_SCHEMA.sql)** - SQL schema
- **[User Guide](./USER_SUPABASE_GUIDE.md)** - For end users
- **[Architecture](./SUPABASE_ARCHITECTURE.md)** - Technical details

## ✨ Summary

You now have a **production-ready multi-project Supabase system** where:

1. ✅ User data stored centrally in YOUR Supabase
2. ✅ Users can manage multiple Supabase projects
3. ✅ Easy project switching
4. ✅ All data persists across sessions
5. ✅ Complete security with RLS

**Total setup time: 5 minutes**
**User benefit: Unlimited Supabase projects in one IDE**
