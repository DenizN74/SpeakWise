/*
  # Enhanced Lesson Content Structure

  1. New Tables
    - `lesson_modules`
      - `id` (uuid, primary key)
      - `lesson_id` (uuid, foreign key to lessons)
      - `title` (text)
      - `description` (text)
      - `order_index` (integer)
      - `created_at` (timestamp)

    - `module_contents`
      - `id` (uuid, primary key)
      - `module_id` (uuid, foreign key to lesson_modules)
      - `type` (text: 'text', 'image', 'video', 'audio', 'quiz')
      - `content` (jsonb)
      - `order_index` (integer)
      - `created_at` (timestamp)

    - `quiz_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to user_profiles)
      - `content_id` (uuid, foreign key to module_contents)
      - `answers` (jsonb)
      - `score` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Create lesson_modules table
CREATE TABLE IF NOT EXISTS lesson_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lesson_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lesson modules"
  ON lesson_modules
  FOR SELECT
  TO authenticated
  USING (true);

-- Create module_contents table
CREATE TABLE IF NOT EXISTS module_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES lesson_modules(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('text', 'image', 'video', 'audio', 'quiz')),
  content jsonb NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE module_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read module contents"
  ON module_contents
  FOR SELECT
  TO authenticated
  USING (true);

-- Create quiz_responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  content_id uuid REFERENCES module_contents(id) ON DELETE CASCADE,
  answers jsonb NOT NULL,
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own quiz responses"
  ON quiz_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own quiz responses"
  ON quiz_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lesson_modules_lesson_id ON lesson_modules(lesson_id);
CREATE INDEX IF NOT EXISTS idx_module_contents_module_id ON module_contents(module_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_content ON quiz_responses(user_id, content_id);