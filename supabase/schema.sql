-- Life Studio Database Schema
-- Complete schema - run this once to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================
-- USERS TABLE
-- ====================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- PROJECTS TABLE
-- ====================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#4a90e2',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  health_score INTEGER DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- TASKS TABLE
-- ====================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- SESSIONS TABLE (Focus Sessions)
-- ====================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  session_type TEXT DEFAULT 'pomodoro' CHECK (session_type IN ('pomodoro', 'deep_work', 'custom')),
  duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- HABITS TABLE
-- ====================
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'custom')),
  streak_count INTEGER DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- GOALS TABLE
-- ====================
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT DEFAULT 'weekly' CHECK (goal_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  deadline TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- READING ITEMS TABLE
-- ====================
CREATE TABLE reading_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  item_type TEXT DEFAULT 'book' CHECK (item_type IN ('book', 'article', 'paper', 'course')),
  status TEXT DEFAULT 'reading' CHECK (status IN ('to_read', 'reading', 'completed')),
  progress_pages INTEGER DEFAULT 0,
  total_pages INTEGER,
  notes TEXT,
  -- Additional columns from enhancement migration
  aha_moment TEXT,
  cover_url TEXT,
  rating INTEGER CHECK (rating BETWEEN 0 AND 5),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- QUICK CAPTURES TABLE
-- ====================
CREATE TABLE captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  capture_type TEXT CHECK (capture_type IN ('task', 'project', 'note', 'reading')),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- TIME BUDGET TABLES
-- ====================
CREATE TABLE time_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  label TEXT,
  duration_minutes INTEGER NOT NULL,
  allocation_date DATE DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  category TEXT CHECK (category IN ('work', 'deep_work', 'health', 'personal', 'learning', 'admin', 'sleep', 'meals', 'commute', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  day_start_time TIME DEFAULT '06:00',
  day_end_time TIME DEFAULT '23:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE time_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  blocks JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- HABIT COMPLETIONS TABLE
-- ====================
CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- READING SESSIONS & HIGHLIGHTS
-- ====================
CREATE TABLE reading_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reading_item_id UUID REFERENCES reading_items(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  pages_read INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reading_item_id UUID REFERENCES reading_items(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  page_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- INDEXES
-- ====================
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_reading_user_id ON reading_items(user_id);
CREATE INDEX idx_reading_status ON reading_items(status);
CREATE INDEX idx_captures_user_id ON captures(user_id);
CREATE INDEX idx_captures_processed ON captures(processed);
CREATE INDEX idx_time_allocations_user_date ON time_allocations(user_id, allocation_date);
CREATE INDEX idx_time_templates_user ON time_templates(user_id);
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX idx_habit_completions_completed_at ON habit_completions(completed_at);
CREATE INDEX idx_habit_completions_habit_date ON habit_completions(habit_id, completed_at DESC);
CREATE INDEX idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_item_id ON reading_sessions(reading_item_id);
CREATE INDEX idx_reading_sessions_created_at ON reading_sessions(created_at);
CREATE INDEX idx_highlights_user_id ON highlights(user_id);
CREATE INDEX idx_highlights_item_id ON highlights(reading_item_id);
CREATE INDEX idx_highlights_created_at ON highlights(created_at);

-- Full-text search indexes
CREATE INDEX idx_tasks_title_search ON tasks USING gin(to_tsvector('english', title));
CREATE INDEX idx_projects_name_search ON projects USING gin(to_tsvector('english', name));

-- ====================
-- ROW LEVEL SECURITY (RLS)
-- ====================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- ====================
-- RLS POLICIES
-- ====================

-- Users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (firebase_uid = auth.uid()::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (firebase_uid = auth.uid()::text);

-- Projects
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can create own projects" ON projects FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

-- Tasks
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can create own tasks" ON tasks FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

-- Sessions
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can create own sessions" ON sessions FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

-- Habits
CREATE POLICY "Users can view own habits" ON habits FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can create own habits" ON habits FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

-- Goals
CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can create own goals" ON goals FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

-- Reading Items
CREATE POLICY "Users can view own reading items" ON reading_items FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can create own reading items" ON reading_items FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can update own reading items" ON reading_items FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can delete own reading items" ON reading_items FOR DELETE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

-- Captures
CREATE POLICY "Users can view own captures" ON captures FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can create own captures" ON captures FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can update own captures" ON captures FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can delete own captures" ON captures FOR DELETE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

-- Time Allocations, User Preferences, Time Templates
CREATE POLICY "Enable all access for time_allocations" ON time_allocations FOR ALL TO anon USING (true);
CREATE POLICY "Enable all access for user_preferences" ON user_preferences FOR ALL TO anon USING (true);
CREATE POLICY "Enable all access for time_templates" ON time_templates FOR ALL TO anon USING (true);

-- Habit Completions
CREATE POLICY "Users can view own habit completions" ON habit_completions FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can create own habit completions" ON habit_completions FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can delete own habit completions" ON habit_completions FOR DELETE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

-- Reading Sessions
CREATE POLICY "Users can view own reading sessions" ON reading_sessions FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can create own reading sessions" ON reading_sessions FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can update own reading sessions" ON reading_sessions FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can delete own reading sessions" ON reading_sessions FOR DELETE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

-- Highlights
CREATE POLICY "Users can view own highlights" ON highlights FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can create own highlights" ON highlights FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can update own highlights" ON highlights FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));
CREATE POLICY "Users can delete own highlights" ON highlights FOR DELETE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

-- ====================
-- TRIGGERS & FUNCTIONS
-- ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reading_updated_at BEFORE UPDATE ON reading_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log habit completion and update streak
CREATE OR REPLACE FUNCTION complete_habit(
  p_habit_id UUID,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(new_streak INTEGER, completion_id UUID) AS $$
DECLARE
  v_last_completed TIMESTAMPTZ;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
  v_completion_id UUID;
BEGIN
  SELECT last_completed_at, streak_count INTO v_last_completed, v_current_streak
  FROM habits WHERE id = p_habit_id AND user_id = p_user_id;
  
  IF v_last_completed IS NULL THEN
    v_new_streak := 1;
  ELSIF DATE(v_last_completed AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC') THEN
    v_new_streak := v_current_streak;
  ELSIF DATE(v_last_completed AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day' THEN
    v_new_streak := v_current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;
  
  INSERT INTO habit_completions (habit_id, user_id, notes)
  VALUES (p_habit_id, p_user_id, p_notes)
  RETURNING id INTO v_completion_id;
  
  UPDATE habits 
  SET streak_count = v_new_streak, 
      last_completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_habit_id AND user_id = p_user_id;
  
  RETURN QUERY SELECT v_new_streak, v_completion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
