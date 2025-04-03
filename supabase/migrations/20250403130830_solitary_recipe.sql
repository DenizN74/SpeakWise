/*
  # Multilingual Support System

  1. New Tables
    - `supported_languages`: Stores available language options
    - `lesson_translations`: Stores translated content for lessons
    - `module_translations`: Stores translated content for modules
    - `content_translations`: Stores translated content for module contents

  2. Changes
    - Add language preference to user_profiles
    - Add language field to lessons table for source language

  3. Security
    - Enable RLS on all tables
    - Add appropriate policies for access control
*/

-- Create supported_languages table
CREATE TABLE IF NOT EXISTS supported_languages (
  code text PRIMARY KEY,
  name text NOT NULL,
  native_name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supported_languages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read supported languages"
  ON supported_languages
  FOR SELECT
  TO authenticated
  USING (true);

-- Add initial supported languages
INSERT INTO supported_languages (code, name, native_name) VALUES
  ('en', 'English', 'English'),
  ('tr', 'Turkish', 'Türkçe'),
  ('de', 'German', 'Deutsch'),
  ('fr', 'French', 'Français'),
  ('es', 'Spanish', 'Español')
ON CONFLICT (code) DO NOTHING;

-- Add language preference to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS preferred_language text REFERENCES supported_languages(code) DEFAULT 'en';

-- Create lesson_translations table
CREATE TABLE IF NOT EXISTS lesson_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  language_code text REFERENCES supported_languages(code) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (lesson_id, language_code)
);

ALTER TABLE lesson_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lesson translations"
  ON lesson_translations
  FOR SELECT
  TO authenticated
  USING (true);

-- Create module_translations table
CREATE TABLE IF NOT EXISTS module_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES lesson_modules(id) ON DELETE CASCADE,
  language_code text REFERENCES supported_languages(code) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (module_id, language_code)
);

ALTER TABLE module_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read module translations"
  ON module_translations
  FOR SELECT
  TO authenticated
  USING (true);

-- Create content_translations table
CREATE TABLE IF NOT EXISTS content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES module_contents(id) ON DELETE CASCADE,
  language_code text REFERENCES supported_languages(code) ON DELETE CASCADE,
  content jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (content_id, language_code)
);

ALTER TABLE content_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read content translations"
  ON content_translations
  FOR SELECT
  TO authenticated
  USING (true);

-- Add source language to lessons table
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS source_language text REFERENCES supported_languages(code) DEFAULT 'en';