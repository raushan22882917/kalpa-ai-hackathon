# User Guide: Connect Your Own Supabase

## 🎯 Overview

This IDE allows you to connect to **your own Supabase project** to store your data. Similar to Lovable.dev, each user maintains their own database - your data stays completely private and under your control.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Your Free Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub, Google, or email

### Step 2: Create Your Project

1. Click **"New Project"**
2. Fill in the details:
   - **Name**: Choose any name (e.g., "my-ide-data")
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose the closest region to you
   - **Plan**: Select **Free** (perfect for personal use)
3. Click **"Create new project"**
4. Wait 1-2 minutes for setup to complete

### Step 3: Get Your Credentials

1. Once your project is ready, go to **Settings** (⚙️ icon in sidebar)
2. Click **"API"** in the settings menu
3. You'll see two important values:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   
   **anon/public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   (a very long string)
   ```

4. Keep this tab open - you'll need these in the next step

### Step 4: Connect to the IDE

1. Open the IDE application
2. Look for the **Supabase icon** (⚡) in the left sidebar
3. Click it to open the Supabase panel
4. Click **"Connect My Project"**
5. Paste your credentials:
   - **Project URL**: Paste the URL from step 3
   - **Anon Key**: Paste the long key from step 3
6. Check **"Auto-connect with Firebase authentication"** (recommended)
7. Click **"Connect"**

### Step 5: Sign In

1. Go to the **Auth** tab in the Supabase panel
2. Click **"Connect with Supabase"**
3. Choose **"Sign Up"** (first time) or **"Sign In"** (returning)
4. Enter your email and password
5. Click **"Create Account & Connect"** or **"Sign In & Connect"**

✅ **You're all set!** Your IDE is now connected to your personal Supabase database.

## 💡 What Can You Do Now?

### Store Your Projects
Your projects, files, and settings are saved to your Supabase database.

### Query Your Data
Use the Database tab to view and query your tables directly.

### Upload Files
Store files and assets in your Supabase storage buckets.

### Sync Across Devices
Access your data from any device by signing in with the same credentials.

## 🔒 Privacy & Security

### Your Data is Private
- Each user has their own separate Supabase project
- No one else can access your data
- You have complete control and ownership

### How It Works
```
┌─────────────────┐
│   Your Device   │
│                 │
│   IDE App       │
└────────┬────────┘
         │
         │ HTTPS (Encrypted)
         │
         ▼
┌─────────────────┐
│  Your Supabase  │
│    Project      │
│                 │
│  Your Database  │
│  Your Storage   │
└─────────────────┘
```

### Security Features
- ✅ All connections use HTTPS encryption
- ✅ Row Level Security (RLS) protects your data
- ✅ JWT tokens for authentication
- ✅ Your credentials never leave your device

## 🆓 Free Tier Limits

Supabase's free tier includes:
- ✅ 500 MB database space
- ✅ 1 GB file storage
- ✅ 2 GB bandwidth per month
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

**Perfect for personal use!**

## 🔧 Advanced Setup (Optional)

### Create Custom Tables

If you want to store custom data, you can create tables in Supabase:

1. Go to your Supabase Dashboard
2. Click **"Table Editor"** in the sidebar
3. Click **"New Table"**
4. Example: Create a "projects" table

```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Only you can see your projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);
```

### Enable Storage Buckets

1. Go to **Storage** in your Supabase Dashboard
2. Click **"New Bucket"**
3. Create buckets for:
   - `project-files` (private)
   - `user-uploads` (private)
   - `public-assets` (public)

## 🐛 Troubleshooting

### "Failed to connect"
- ✅ Check your Project URL starts with `https://`
- ✅ Verify your Anon Key is complete (very long)
- ✅ Make sure your Supabase project is active

### "Sign in failed"
- ✅ Go to Supabase Dashboard → Authentication → Providers
- ✅ Make sure **Email** provider is enabled
- ✅ Check your email and password are correct

### "Query returns empty"
- ✅ Make sure you've created the table in Supabase
- ✅ Check Row Level Security policies allow access
- ✅ Verify you're signed in

### Need Help?
- 📚 [Supabase Documentation](https://supabase.com/docs)
- 💬 [Supabase Discord Community](https://discord.supabase.com)
- 🎓 [Supabase YouTube Tutorials](https://www.youtube.com/c/supabase)

## 🎉 You're Ready!

You now have your own private database connected to the IDE. Your data is secure, private, and completely under your control - just like Lovable.dev!

Start building and let the IDE handle the rest. 🚀
