-- Comprehensive Supabase database schema for PAI digital twins platform

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- People table - Base person information
CREATE TABLE IF NOT EXISTS people (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Profile versions table - Multiple versions per person (v1, v2, v3, etc.)
CREATE TABLE IF NOT EXISTS profile_versions (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR(100) UNIQUE NOT NULL, -- rachita_v1, rachita_v2, everhett_v1
  person_name VARCHAR(100) NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  profile_data JSONB NOT NULL, -- Full PAI profile JSON
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (person_name) REFERENCES people(name),
  UNIQUE(person_name, version_number)
);

-- Interview sessions table - Original interview data
CREATE TABLE IF NOT EXISTS interview_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  person_name VARCHAR(100) NOT NULL,
  transcript TEXT,
  messages JSONB, -- Full conversation history
  exchange_count INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT FALSE,
  profile_id VARCHAR(100), -- Links to created profile
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (person_name) REFERENCES people(name),
  FOREIGN KEY (profile_id) REFERENCES profile_versions(profile_id)
);

-- ============================================================================
-- SURVEY & VALIDATION SYSTEM
-- ============================================================================

-- Survey templates table - Validation survey structures
CREATE TABLE IF NOT EXISTS survey_templates (
  id SERIAL PRIMARY KEY,
  survey_name VARCHAR(100) UNIQUE NOT NULL, -- validation_survey_1, skincare_attitudes
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_accuracy DECIMAL(3,2), -- 0.60 for 60%
  questions JSONB NOT NULL, -- Full questions array with options
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Validation test sessions table - Each test instance
CREATE TABLE IF NOT EXISTS validation_test_sessions (
  id SERIAL PRIMARY KEY,
  test_session_id VARCHAR(100) UNIQUE NOT NULL,
  profile_id VARCHAR(100) NOT NULL,
  survey_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, failed
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (profile_id) REFERENCES profile_versions(profile_id),
  FOREIGN KEY (survey_name) REFERENCES survey_templates(survey_name)
);

-- Question responses table - Individual answers to each question
CREATE TABLE IF NOT EXISTS question_responses (
  id SERIAL PRIMARY KEY,
  test_session_id VARCHAR(100) NOT NULL,
  question_id VARCHAR(100) NOT NULL,
  question_text TEXT NOT NULL,
  question_category VARCHAR(100),
  human_response VARCHAR(500),
  ai_response VARCHAR(500),
  ai_reasoning TEXT, -- AI's reasoning for the response
  is_correct BOOLEAN, -- Whether AI matched human
  response_order INTEGER, -- Order in which questions were answered
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (test_session_id) REFERENCES validation_test_sessions(test_session_id)
);

-- Validation test results table - Summary results per test session
CREATE TABLE IF NOT EXISTS validation_test_results (
  id SERIAL PRIMARY KEY,
  test_session_id VARCHAR(100) UNIQUE NOT NULL,
  profile_id VARCHAR(100) NOT NULL,
  survey_name VARCHAR(100) NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_responses INTEGER NOT NULL,
  accuracy_score DECIMAL(5,2) NOT NULL, -- Percentage accuracy
  detailed_results JSONB, -- Full breakdown by category
  test_metadata JSONB, -- Test conditions, timestamps, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (test_session_id) REFERENCES validation_test_sessions(test_session_id),
  FOREIGN KEY (profile_id) REFERENCES profile_versions(profile_id),
  FOREIGN KEY (survey_name) REFERENCES survey_templates(survey_name)
);

-- ============================================================================
-- PREDICTION & AI RESPONSES
-- ============================================================================

-- AI prediction models table - Store prediction results
CREATE TABLE IF NOT EXISTS ai_predictions (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR(100) NOT NULL,
  question_id VARCHAR(100) NOT NULL,
  predicted_response VARCHAR(500) NOT NULL,
  confidence_score DECIMAL(3,2), -- 0.85 for 85% confidence
  reasoning TEXT,
  model_version VARCHAR(50) DEFAULT 'claude-3-5-sonnet',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (profile_id) REFERENCES profile_versions(profile_id)
);

-- Test history summary table - Overall testing history per profile
CREATE TABLE IF NOT EXISTS test_history_summary (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR(100) NOT NULL,
  total_tests_taken INTEGER DEFAULT 0,
  average_accuracy DECIMAL(5,2),
  best_accuracy DECIMAL(5,2),
  latest_test_date TIMESTAMP WITH TIME ZONE,
  improvement_trend VARCHAR(50), -- improving, stable, declining
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (profile_id) REFERENCES profile_versions(profile_id),
  UNIQUE(profile_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_people_name ON people(name);
CREATE INDEX IF NOT EXISTS idx_profile_versions_profile_id ON profile_versions(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_versions_person_name ON profile_versions(person_name);
CREATE INDEX IF NOT EXISTS idx_profile_versions_active ON profile_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_session_id ON interview_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_person ON interview_sessions(person_name);
CREATE INDEX IF NOT EXISTS idx_survey_templates_name ON survey_templates(survey_name);
CREATE INDEX IF NOT EXISTS idx_validation_test_sessions_id ON validation_test_sessions(test_session_id);
CREATE INDEX IF NOT EXISTS idx_validation_test_sessions_profile ON validation_test_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_question_responses_session ON question_responses(test_session_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_session ON validation_test_results(test_session_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_profile ON validation_test_results(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_profile ON ai_predictions(profile_id);
CREATE INDEX IF NOT EXISTS idx_test_history_profile ON test_history_summary(profile_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_history_summary ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on people" ON people FOR ALL USING (true);
CREATE POLICY "Allow all operations on profile_versions" ON profile_versions FOR ALL USING (true);
CREATE POLICY "Allow all operations on interview_sessions" ON interview_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on survey_templates" ON survey_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations on validation_test_sessions" ON validation_test_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on question_responses" ON question_responses FOR ALL USING (true);
CREATE POLICY "Allow all operations on validation_test_results" ON validation_test_results FOR ALL USING (true);
CREATE POLICY "Allow all operations on ai_predictions" ON ai_predictions FOR ALL USING (true);
CREATE POLICY "Allow all operations on test_history_summary" ON test_history_summary FOR ALL USING (true);

-- ============================================================================
-- SAMPLE DATA INSERTION
-- ============================================================================

-- Insert sample people
INSERT INTO people (name) VALUES ('rachita'), ('everhett'), ('gigi') ON CONFLICT (name) DO NOTHING;

-- Insert sample survey template
INSERT INTO survey_templates (survey_name, title, description, target_accuracy, questions) 
VALUES (
  'validation_survey_1',
  'Skincare Attitudes & Usage Validation Study',
  'Comprehensive validation questions to test digital twin accuracy in predicting skincare behaviors and attitudes',
  0.60,
  '[{"id": "routine_complexity", "category": "Usage Patterns", "question": "How many skincare products do you typically use?", "options": ["1-2 products", "3-5 products", "6-8 products", "9+ products"]}]'::JSONB
) ON CONFLICT (survey_name) DO NOTHING;