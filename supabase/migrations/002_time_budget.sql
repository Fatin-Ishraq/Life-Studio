-- Migration: 002_time_budget.sql
-- Description: Add time_allocations table for Time Budget feature

CREATE TABLE time_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  label TEXT, -- Optional label if not tied to a specific project, or to override project name
  duration_minutes INTEGER NOT NULL,
  allocation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying by user and date
CREATE INDEX idx_time_allocations_user_date ON time_allocations(user_id, allocation_date);

-- Enable RLS
ALTER TABLE time_allocations ENABLE ROW LEVEL SECURITY;

-- Policy (Development Mode - Allow Anon)
CREATE POLICY "Enable all access for time_allocations" ON time_allocations FOR ALL TO anon USING (true);
