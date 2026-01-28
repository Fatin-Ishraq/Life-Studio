-- Fix for RLS violations during user synchronization
-- Run this in your Supabase SQL Editor

-- 1. Add missing INSERT policy for users table
CREATE POLICY "Allow anonymous insert into users" 
ON users FOR INSERT 
TO anon
WITH CHECK (true);

-- 2. Modify existing policies to allow selection/updates based on firebase_uid
-- Since we are using Firebase Auth and Supabase only as a database, 
-- auth.uid() in Supabase will be null when using the anon key.
-- For local development and Phase 1, we will trust the firebase_uid provided by the client.

-- Drop old policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Create new policies that allow anon access for now (Development/Phase 1)
-- Note: In a production environment, we should verify Firebase JWTs in Supabase.

CREATE POLICY "Enable read access for anon users" ON users FOR SELECT TO anon USING (true);
CREATE POLICY "Enable update access for users" ON users FOR UPDATE TO anon USING (true);

-- Projects policies (allow all for now to unblock testing)
CREATE POLICY "Enable all access for projects" ON projects FOR ALL TO anon USING (true);

-- Apply similar logic to other tables if needed, or disable RLS for testing Phase 1
-- ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE reading_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE captures DISABLE ROW LEVEL SECURITY;
