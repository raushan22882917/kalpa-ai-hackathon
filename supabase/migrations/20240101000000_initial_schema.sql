-- Initial Schema for Supabase Multi-Project Management
-- This migration creates all necessary tables for the IDE

-- ============================================================================
-- Table: supabase_projects
-- Stores user's Supabase project configurations
-- ============================================================================

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

-- Policies: Allow all operations for authenticated users
-- Note: Using permissive policy for simplicity. In production, you should use proper JWT-based policies.
DROP POLICY IF EXISTS "Enable all for users" ON supabase_projects;
CREATE POLICY "Enable all for users"
  ON supabase_projects
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Table: user_settings
-- Stores user preferences and settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
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

-- Policies
DROP POLICY IF EXISTS "Enable all for user settings" ON user_settings;
CREATE POLICY "Enable all for user settings"
  ON user_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Table: ide_projects
-- Stores user's IDE projects metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS ide_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
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

-- Policies
DROP POLICY IF EXISTS "Enable all for ide projects" ON ide_projects;
CREATE POLICY "Enable all for ide projects"
  ON ide_projects
  FOR ALL
  USING (true)
  WITH CHECK (true);

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

-- Policies
DROP POLICY IF EXISTS "Enable all for project files" ON project_files;
CREATE POLICY "Enable all for project files"
  ON project_files
  FOR ALL
  USING (true)
  WITH CHECK (true);

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
DROP TRIGGER IF EXISTS update_supabase_projects_updated_at ON supabase_projects;
CREATE TRIGGER update_supabase_projects_updated_at
  BEFORE UPDATE ON supabase_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ide_projects_updated_at ON ide_projects;
CREATE TRIGGER update_ide_projects_updated_at
  BEFORE UPDATE ON ide_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
