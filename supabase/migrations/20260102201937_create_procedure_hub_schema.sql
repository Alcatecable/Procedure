/*
  # Create Procedure Hub Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text) - either 'admin' or 'staff'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `procedures`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `source` (text) - original chat source (Teams, Slack, WhatsApp)
      - `source_link` (text, optional) - hyperlink to original message
      - `effective_date` (date, required)
      - `status` (text) - 'active', 'archived', or 'replaced'
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `acknowledgments`
      - `id` (uuid, primary key)
      - `procedure_id` (uuid, references procedures)
      - `user_id` (uuid, references profiles)
      - `acknowledged_at` (timestamptz)
      - Unique constraint on (procedure_id, user_id)

  2. Security
    - Enable RLS on all tables
    - Profiles: Users can read all profiles, but only update their own
    - Procedures: Everyone can read, only admins can create/update
    - Acknowledgments: Users can read all, but only create their own
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create procedures table
CREATE TABLE IF NOT EXISTS procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  source text DEFAULT '',
  source_link text DEFAULT '',
  effective_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'replaced')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create acknowledgments table
CREATE TABLE IF NOT EXISTS acknowledgments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  acknowledged_at timestamptz DEFAULT now(),
  UNIQUE(procedure_id, user_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE acknowledgments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Procedures policies
CREATE POLICY "Anyone can view procedures"
  ON procedures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert procedures"
  ON procedures FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update procedures"
  ON procedures FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete procedures"
  ON procedures FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Acknowledgments policies
CREATE POLICY "Users can view all acknowledgments"
  ON acknowledgments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own acknowledgments"
  ON acknowledgments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own acknowledgments"
  ON acknowledgments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_procedures_status ON procedures(status);
CREATE INDEX IF NOT EXISTS idx_procedures_effective_date ON procedures(effective_date);
CREATE INDEX IF NOT EXISTS idx_procedures_created_by ON procedures(created_by);
CREATE INDEX IF NOT EXISTS idx_acknowledgments_procedure_id ON acknowledgments(procedure_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgments_user_id ON acknowledgments(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_procedures_updated_at ON procedures;
CREATE TRIGGER update_procedures_updated_at
  BEFORE UPDATE ON procedures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();