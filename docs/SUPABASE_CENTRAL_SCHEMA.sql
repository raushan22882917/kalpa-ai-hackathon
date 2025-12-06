-- Central Supabase Schema
-- This schema is for YOUR Supabase project to store user data
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- Table: supabase_projects
-- Stores user's Supabase project configurations
-- ============================================================================

CREATE TABLE IF NOT EXISTS supabase_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,  -- Firebase UID
  name TEXT NOT NULL,
  description TEXT,
  project_url TEXT NOT NULL,
  anon_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_project_name UNIQUE (user_id, name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_supabase_projects_user_id ON supabase_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_supabase_projects_is_active ON supabase_projects(user_id, is_active);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE supabase_projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own projects
CREATE POLICY "Users can view own projects"
  ON supabase_projects
  FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Users can insert their own projects
CREATE POLICY "Users can insert own projects"
  ON supabase_projects
  FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON supabase_projects
  FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON supabase_projects
  FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================================
-- Table: user_settings
-- Stores user preferences and settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,  -- Firebase UID
  theme TEXT DEFAULT 'dark',
  font_size INTEGER DEFAULT 14,
  auto_save BOOLEAN DEFAULT true,
  vim_mode BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_settings
CREATE POLICY "Users can view own settings"
  ON user_settings
  FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================================
-- Table: ide_projects
-- Stores user's IDE projects metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS ide_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,  -- Firebase UID
  supabase_project_id UUID REFERENCES supabase_projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  tech_stack JSONB DEFAULT '{}',
  last_opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_ide_project_name UNIQUE (user_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ide_projects_user_id ON ide_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_ide_projects_supabase_project_id ON ide_projects(supabase_project_id);

-- Enable RLS
ALTER TABLE ide_projects ENABLE ROW LEVEL SECURITY;

-- Policies for ide_projects
CREATE POLICY "Users can view own IDE projects"
  ON ide_projects
  FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own IDE projects"
  ON ide_projects
  FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own IDE projects"
  ON ide_projects
  FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own IDE projects"
  ON ide_projects
  FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ============================================================================
-- Table: project_files
-- Stores file metadata for IDE projects
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ide_project_id UUID REFERENCES ide_projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT,
  size INTEGER,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_project_file_path UNIQUE (ide_project_id, file_path)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_files_ide_project_id ON project_files(ide_project_id);

-- Enable RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Policies for project_files (inherit from ide_projects)
CREATE POLICY "Users can view own project files"
  ON project_files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ide_projects
      WHERE ide_projects.id = project_files.ide_project_id
      AND ide_projects.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can insert own project files"
  ON project_files
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ide_projects
      WHERE ide_projects.id = project_files.ide_project_id
      AND ide_projects.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can update own project files"
  ON project_files
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ide_projects
      WHERE ide_projects.id = project_files.ide_project_id
      AND ide_projects.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Users can delete own project files"
  ON project_files
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ide_projects
      WHERE ide_projects.id = project_files.ide_project_id
      AND ide_projects.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_supabase_projects_updated_at
  BEFORE UPDATE ON supabase_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ide_projects_updated_at
  BEFORE UPDATE ON ide_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Sample Data (Optional - for testing)
-- ============================================================================

-- Insert sample user settings
-- INSERT INTO user_settings (user_id, theme, font_size)
-- VALUES ('test-user-id', 'dark', 14);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('supabase_projects', 'user_settings', 'ide_projects', 'project_files');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('supabase_projects', 'user_settings', 'ide_projects', 'project_files');

-- ============================================================================
-- Notes
-- ============================================================================

-- 1. Run this script in YOUR Supabase SQL Editor
-- 2. This creates tables to store user data centrally
-- 3. Each user's Supabase project configurations are stored here
-- 4. RLS ensures users can only access their own data
-- 5. Firebase UID is used as user_id for authentication
