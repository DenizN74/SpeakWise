/*
  # Community System Enhancement

  1. New Tables
    - `community_badges`
      - Stores badge definitions and requirements
    - `user_badges`
      - Links users to their earned badges
    - `community_feedback`
      - Stores feedback/comments on posts
    - `feedback_votes`
      - Tracks votes on feedback
    - `user_notifications`
      - Stores user notifications
    - `contribution_scores`
      - Tracks user contribution metrics

  2. Changes
    - Add new columns to user_profiles
    - Add new columns to community_posts

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for user access
*/

-- Create community_badges table
CREATE TABLE IF NOT EXISTS community_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  requirement_type text NOT NULL,
  requirement_count integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read badges"
  ON community_badges
  FOR SELECT
  TO authenticated
  USING (true);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES community_badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own badges"
  ON user_badges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create community_feedback table
CREATE TABLE IF NOT EXISTS community_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_correction boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE community_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all feedback"
  ON community_feedback
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create feedback"
  ON community_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback"
  ON community_feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create feedback_votes table
CREATE TABLE IF NOT EXISTS feedback_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id uuid REFERENCES community_feedback(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  vote_type text CHECK (vote_type IN ('helpful', 'best')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (feedback_id, user_id)
);

ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all votes"
  ON feedback_votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can vote"
  ON feedback_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create contribution_scores table
CREATE TABLE IF NOT EXISTS contribution_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  posts_count integer DEFAULT 0,
  feedback_count integer DEFAULT 0,
  helpful_votes_received integer DEFAULT 0,
  best_votes_received integer DEFAULT 0,
  total_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE contribution_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all contribution scores"
  ON contribution_scores
  FOR SELECT
  TO authenticated
  USING (true);

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  content jsonb NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own notifications"
  ON user_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add new columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS rank text DEFAULT 'novice',
ADD COLUMN IF NOT EXISTS can_give_feedback boolean DEFAULT false;

-- Add new columns to community_posts
ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS ai_suggestions jsonb,
ADD COLUMN IF NOT EXISTS feedback_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_feedback_id uuid REFERENCES community_feedback(id);

-- Create function to update contribution scores
CREATE OR REPLACE FUNCTION update_contribution_score()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contribution_scores (user_id, total_score)
  VALUES (NEW.user_id, 10)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_score = contribution_scores.total_score + 10,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for contribution score updates
CREATE TRIGGER contribution_score_post_trigger
AFTER INSERT ON community_posts
FOR EACH ROW
EXECUTE FUNCTION update_contribution_score();

CREATE TRIGGER contribution_score_feedback_trigger
AFTER INSERT ON community_feedback
FOR EACH ROW
EXECUTE FUNCTION update_contribution_score();