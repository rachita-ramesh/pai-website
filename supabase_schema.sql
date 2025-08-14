-- Supabase database schema for PAI digital twins

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR(100) UNIQUE NOT NULL,
  participant_name VARCHAR(100) NOT NULL,
  profile_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  participant_name VARCHAR(100) NOT NULL,
  transcript TEXT,
  messages JSONB,
  exchange_count INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Validation results table
CREATE TABLE IF NOT EXISTS validation_results (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR(100) NOT NULL,
  test_session_id VARCHAR(100) NOT NULL,
  survey_name VARCHAR(100) NOT NULL,
  questions JSONB NOT NULL,
  human_responses JSONB NOT NULL,
  ai_responses JSONB NOT NULL,
  accuracy_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (profile_id) REFERENCES profiles(profile_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_profile_id ON profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_interviews_session_id ON interviews(session_id);
CREATE INDEX IF NOT EXISTS idx_validation_profile_id ON validation_results(profile_id);

-- Row Level Security (RLS) - enable for security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on interviews" ON interviews FOR ALL USING (true);
CREATE POLICY "Allow all operations on validation_results" ON validation_results FOR ALL USING (true);