/*
  # Speaking Practice System

  1. New Tables
    - `speaking_scenarios`: Stores scenario definitions and metadata
    - `scenario_dialogues`: Stores dialogue paths and responses
    - `user_scenario_progress`: Tracks user progress and performance
    - `scenario_recordings`: Stores user audio recordings and analysis

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for user access
*/

-- Create speaking_scenarios table
CREATE TABLE IF NOT EXISTS speaking_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  xp_reward integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE speaking_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scenarios"
  ON speaking_scenarios
  FOR SELECT
  TO authenticated
  USING (true);

-- Create scenario_dialogues table
CREATE TABLE IF NOT EXISTS scenario_dialogues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES speaking_scenarios(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES scenario_dialogues(id),
  speaker text NOT NULL,
  content text NOT NULL,
  expected_responses jsonb,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scenario_dialogues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read dialogues"
  ON scenario_dialogues
  FOR SELECT
  TO authenticated
  USING (true);

-- Create user_scenario_progress table
CREATE TABLE IF NOT EXISTS user_scenario_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  scenario_id uuid REFERENCES speaking_scenarios(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  fluency_score numeric CHECK (fluency_score >= 0 AND fluency_score <= 1),
  grammar_score numeric CHECK (grammar_score >= 0 AND grammar_score <= 1),
  vocabulary_score numeric CHECK (vocabulary_score >= 0 AND vocabulary_score <= 1),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, scenario_id)
);

ALTER TABLE user_scenario_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own progress"
  ON user_scenario_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Insert own progress"
  ON user_scenario_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own progress"
  ON user_scenario_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create scenario_recordings table
CREATE TABLE IF NOT EXISTS scenario_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  scenario_id uuid REFERENCES speaking_scenarios(id) ON DELETE CASCADE,
  dialogue_id uuid REFERENCES scenario_dialogues(id) ON DELETE CASCADE,
  audio_url text NOT NULL,
  transcript text,
  ai_analysis jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scenario_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own recordings"
  ON scenario_recordings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Create own recordings"
  ON scenario_recordings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add function to update XP on scenario completion
CREATE OR REPLACE FUNCTION update_xp_on_scenario_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed AND NOT OLD.completed THEN
    UPDATE user_profiles
    SET xp_points = xp_points + (
      SELECT xp_reward
      FROM speaking_scenarios
      WHERE id = NEW.scenario_id
    )
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for XP updates
CREATE TRIGGER scenario_completion_xp_trigger
AFTER UPDATE ON user_scenario_progress
FOR EACH ROW
WHEN (NEW.completed IS DISTINCT FROM OLD.completed)
EXECUTE FUNCTION update_xp_on_scenario_completion();