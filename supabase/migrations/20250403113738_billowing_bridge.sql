/*
  # AI Learning System Tables

  1. New Tables
    - `content_recommendations`
      - Stores personalized content recommendations for users
      - Based on their learning history and performance
    
    - `writing_corrections`
      - Stores grammar and spelling corrections for user submissions
      - Includes improvement suggestions
    
    - `dynamic_quiz_configs`
      - Stores dynamic quiz generation settings
      - Adjusts difficulty based on user performance
    
    - `pronunciation_assessments`
      - Stores pronunciation analysis results
      - Includes scores and improvement suggestions
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Content recommendations table
CREATE TABLE IF NOT EXISTS content_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  module_id uuid REFERENCES lesson_modules(id) ON DELETE CASCADE,
  confidence_score float NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reason jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own recommendations"
  ON content_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Writing corrections table
CREATE TABLE IF NOT EXISTS writing_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  original_text text NOT NULL,
  corrected_text text NOT NULL,
  suggestions jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE writing_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own writing corrections"
  ON writing_corrections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Dynamic quiz configurations table
CREATE TABLE IF NOT EXISTS dynamic_quiz_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  difficulty_level float NOT NULL CHECK (difficulty_level >= 0 AND difficulty_level <= 1),
  focus_areas jsonb NOT NULL,
  last_performance jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dynamic_quiz_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own quiz configs"
  ON dynamic_quiz_configs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Pronunciation assessments table
CREATE TABLE IF NOT EXISTS pronunciation_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  audio_url text NOT NULL,
  transcript text NOT NULL,
  score float NOT NULL CHECK (score >= 0 AND score <= 1),
  feedback jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pronunciation_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own pronunciation assessments"
  ON pronunciation_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_recommendations_user ON content_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_corrections_user ON writing_corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_quiz_configs_user ON dynamic_quiz_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_assessments_user ON pronunciation_assessments(user_id);