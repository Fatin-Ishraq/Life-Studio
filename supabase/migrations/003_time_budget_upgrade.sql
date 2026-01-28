-- Migration: 003_time_budget_upgrade.sql
-- Upgrade time_allocations for professional time budget feature

-- Add start/end times and category to time_allocations
ALTER TABLE time_allocations ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE time_allocations ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE time_allocations ADD COLUMN IF NOT EXISTS category TEXT 
  CHECK (category IN ('work', 'deep_work', 'health', 'personal', 'learning', 'admin', 'sleep', 'meals', 'commute', 'other'));

-- User preferences for day bounds
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  day_start_time TIME DEFAULT '06:00',
  day_end_time TIME DEFAULT '23:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Day templates for quick loading
CREATE TABLE IF NOT EXISTS time_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  blocks JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_time_templates_user ON time_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- RLS policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for user_preferences" ON user_preferences FOR ALL TO anon USING (true);
CREATE POLICY "Enable all access for time_templates" ON time_templates FOR ALL TO anon USING (true);
