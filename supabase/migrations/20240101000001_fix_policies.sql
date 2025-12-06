-- Fix RLS Policies to Allow Inserts
-- This migration updates policies to be more permissive for development

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable all for users" ON supabase_projects;
DROP POLICY IF EXISTS "Enable all for user settings" ON user_settings;
DROP POLICY IF EXISTS "Enable all for ide projects" ON ide_projects;
DROP POLICY IF EXISTS "Enable all for project files" ON project_files;

-- Create permissive policies that allow all operations
-- Note: In production, you should implement proper JWT-based authentication

-- supabase_projects policies
CREATE POLICY "Allow all operations on supabase_projects"
  ON supabase_projects
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- user_settings policies
CREATE POLICY "Allow all operations on user_settings"
  ON user_settings
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ide_projects policies
CREATE POLICY "Allow all operations on ide_projects"
  ON ide_projects
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- project_files policies
CREATE POLICY "Allow all operations on project_files"
  ON project_files
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Verify RLS is still enabled
ALTER TABLE supabase_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ide_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
