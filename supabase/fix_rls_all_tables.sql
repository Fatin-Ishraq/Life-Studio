-- Comprehensive RLS fix for Phase 1 & 2
-- Run this in your Supabase SQL Editor to allow anonymous access (Development only)

-- 1. Drop old policies that use auth.uid() for all tables
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;

DROP POLICY IF EXISTS "Users can view own habits" ON habits;
DROP POLICY IF EXISTS "Users can create own habits" ON habits;
DROP POLICY IF EXISTS "Users can update own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON habits;

DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can create own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;

DROP POLICY IF EXISTS "Users can view own reading items" ON reading_items;
DROP POLICY IF EXISTS "Users can create own reading items" ON reading_items;
DROP POLICY IF EXISTS "Users can update own reading items" ON reading_items;
DROP POLICY IF EXISTS "Users can delete own reading items" ON reading_items;

DROP POLICY IF EXISTS "Users can view own captures" ON captures;
DROP POLICY IF EXISTS "Users can create own captures" ON captures;
DROP POLICY IF EXISTS "Users can update own captures" ON captures;
DROP POLICY IF EXISTS "Users can delete own captures" ON captures;

-- 2. Create new permissive policies for all tables
CREATE POLICY "Enable all access for tasks" ON tasks FOR ALL TO anon USING (true);
CREATE POLICY "Enable all access for sessions" ON sessions FOR ALL TO anon USING (true);
CREATE POLICY "Enable all access for habits" ON habits FOR ALL TO anon USING (true);
CREATE POLICY "Enable all access for goals" ON goals FOR ALL TO anon USING (true);
CREATE POLICY "Enable all access for reading_items" ON reading_items FOR ALL TO anon USING (true);
CREATE POLICY "Enable all access for captures" ON captures FOR ALL TO anon USING (true);

-- Ensure users and projects are also covered (if you haven't run the first fix)
DROP POLICY IF EXISTS "Allow anonymous insert into users" ON users;
DROP POLICY IF EXISTS "Enable read access for anon users" ON users;
DROP POLICY IF EXISTS "Enable update access for users" ON users;
DROP POLICY IF EXISTS "Enable all access for projects" ON projects;

CREATE POLICY "Enable all access for users" ON users FOR ALL TO anon USING (true);
CREATE POLICY "Enable all access for projects" ON projects FOR ALL TO anon USING (true);
