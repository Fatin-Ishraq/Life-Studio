-- Habit Completions Table
-- Migration: 004_habit_completions.sql
-- Tracks individual habit completion events for streak visualization

-- Create habit_completions table
CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX idx_habit_completions_completed_at ON habit_completions(completed_at);

-- Composite index for fetching completions by habit and date range
CREATE INDEX idx_habit_completions_habit_date ON habit_completions(habit_id, completed_at DESC);

-- Enable RLS
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own habit completions" ON habit_completions 
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can create own habit completions" ON habit_completions 
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

CREATE POLICY "Users can delete own habit completions" ON habit_completions 
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE firebase_uid = auth.uid()::text));

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
  -- Get current habit state
  SELECT last_completed_at, streak_count INTO v_last_completed, v_current_streak
  FROM habits WHERE id = p_habit_id AND user_id = p_user_id;
  
  -- Calculate new streak
  -- If last completion was yesterday, increment streak
  -- If last completion was today, keep same streak (already completed)
  -- Otherwise reset to 1
  IF v_last_completed IS NULL THEN
    v_new_streak := 1;
  ELSIF DATE(v_last_completed AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC') THEN
    -- Already completed today, just return current values
    v_new_streak := v_current_streak;
  ELSIF DATE(v_last_completed AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day' THEN
    -- Completed yesterday, increment streak
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Streak broken, reset to 1
    v_new_streak := 1;
  END IF;
  
  -- Insert completion record
  INSERT INTO habit_completions (habit_id, user_id, notes)
  VALUES (p_habit_id, p_user_id, p_notes)
  RETURNING id INTO v_completion_id;
  
  -- Update habit with new streak and completion time
  UPDATE habits 
  SET streak_count = v_new_streak, 
      last_completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_habit_id AND user_id = p_user_id;
  
  RETURN QUERY SELECT v_new_streak, v_completion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
