-- Custom questionnaires schema for PAI platform

-- Custom questionnaires table - User-created questionnaires
CREATE TABLE IF NOT EXISTS custom_questionnaires (
  id SERIAL PRIMARY KEY,
  questionnaire_id VARCHAR(100) UNIQUE NOT NULL, -- skincare_deep_dive, fitness_habits, etc.
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- skincare, fitness, career, relationships, etc.
  created_by VARCHAR(100), -- creator name (optional)
  questions JSONB NOT NULL, -- Array of question objects
  estimated_duration INTEGER, -- Minutes
  is_public BOOLEAN DEFAULT false, -- Can others use this questionnaire?
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0, -- How many times it's been used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Questionnaire questions table - Individual questions within custom questionnaires
CREATE TABLE IF NOT EXISTS questionnaire_questions (
  id SERIAL PRIMARY KEY,
  questionnaire_id VARCHAR(100) NOT NULL,
  question_id VARCHAR(100) NOT NULL, -- unique within questionnaire
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'open_ended', -- open_ended, multiple_choice, scale, yes_no
  options JSONB, -- For multiple choice questions
  is_required BOOLEAN DEFAULT true,
  question_order INTEGER NOT NULL,
  help_text TEXT, -- Additional guidance for the question
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (questionnaire_id) REFERENCES custom_questionnaires(questionnaire_id) ON DELETE CASCADE,
  UNIQUE(questionnaire_id, question_id)
);

-- Questionnaire usage tracking - Track which profiles used which questionnaires
CREATE TABLE IF NOT EXISTS questionnaire_usage (
  id SERIAL PRIMARY KEY,
  questionnaire_id VARCHAR(100) NOT NULL,
  profile_id VARCHAR(100) NOT NULL,
  interview_session_id VARCHAR(100),
  usage_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_status VARCHAR(50) DEFAULT 'completed', -- completed, abandoned
  feedback_rating INTEGER, -- 1-5 star rating of questionnaire quality
  feedback_comments TEXT,
  FOREIGN KEY (questionnaire_id) REFERENCES custom_questionnaires(questionnaire_id),
  FOREIGN KEY (profile_id) REFERENCES profile_versions(profile_id),
  FOREIGN KEY (interview_session_id) REFERENCES interview_sessions(session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_questionnaires_id ON custom_questionnaires(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_custom_questionnaires_category ON custom_questionnaires(category);
CREATE INDEX IF NOT EXISTS idx_custom_questionnaires_public ON custom_questionnaires(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_questionnaires_active ON custom_questionnaires(is_active);
CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_questionnaire ON questionnaire_questions(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_questions_order ON questionnaire_questions(question_order);
CREATE INDEX IF NOT EXISTS idx_questionnaire_usage_questionnaire ON questionnaire_usage(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_usage_profile ON questionnaire_usage(profile_id);

-- Row Level Security
ALTER TABLE custom_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on custom_questionnaires" ON custom_questionnaires FOR ALL USING (true);
CREATE POLICY "Allow all operations on questionnaire_questions" ON questionnaire_questions FOR ALL USING (true);
CREATE POLICY "Allow all operations on questionnaire_usage" ON questionnaire_usage FOR ALL USING (true);

-- Sample custom questionnaire
INSERT INTO custom_questionnaires (
  questionnaire_id,
  title,
  description,
  category,
  created_by,
  questions,
  estimated_duration,
  is_public,
  is_active
) VALUES (
  'fitness_lifestyle_deep_dive',
  'Fitness & Lifestyle Deep Dive',
  'Comprehensive questionnaire to understand fitness habits, wellness priorities, and lifestyle choices',
  'fitness',
  'pai_team',
  '[
    {
      "id": "fitness_importance",
      "text": "How important is fitness in your daily life?",
      "type": "scale",
      "scale_range": [1, 10],
      "required": true
    },
    {
      "id": "workout_frequency",
      "text": "How often do you exercise per week?",
      "type": "multiple_choice",
      "options": ["Never", "1-2 times", "3-4 times", "5-6 times", "Daily"],
      "required": true
    },
    {
      "id": "fitness_goals",
      "text": "What are your primary fitness goals?",
      "type": "open_ended",
      "required": true
    },
    {
      "id": "workout_preferences",
      "text": "What types of workouts do you enjoy most?",
      "type": "open_ended",
      "required": false
    },
    {
      "id": "health_tracking",
      "text": "Do you track your health metrics (steps, calories, sleep)?",
      "type": "yes_no",
      "required": true
    }
  ]'::JSONB,
  15,
  true,
  true
) ON CONFLICT (questionnaire_id) DO NOTHING;

-- Insert corresponding questions
INSERT INTO questionnaire_questions (questionnaire_id, question_id, question_text, question_type, options, is_required, question_order, help_text) VALUES
('fitness_lifestyle_deep_dive', 'fitness_importance', 'How important is fitness in your daily life?', 'scale', '{"scale_range": [1, 10], "scale_labels": {"1": "Not important at all", "10": "Extremely important"}}'::JSONB, true, 1, 'Rate from 1-10 where 1 is not important at all and 10 is extremely important'),
('fitness_lifestyle_deep_dive', 'workout_frequency', 'How often do you exercise per week?', 'multiple_choice', '["Never", "1-2 times", "3-4 times", "5-6 times", "Daily"]'::JSONB, true, 2, 'Include any physical activity like walking, gym, sports, yoga, etc.'),
('fitness_lifestyle_deep_dive', 'fitness_goals', 'What are your primary fitness goals?', 'open_ended', null, true, 3, 'Be specific about what you want to achieve (weight loss, muscle gain, endurance, etc.)'),
('fitness_lifestyle_deep_dive', 'workout_preferences', 'What types of workouts do you enjoy most?', 'open_ended', null, false, 4, 'Describe the activities you find most enjoyable and sustainable'),
('fitness_lifestyle_deep_dive', 'health_tracking', 'Do you track your health metrics (steps, calories, sleep)?', 'yes_no', null, true, 5, 'Include any apps, devices, or manual tracking methods')
ON CONFLICT (questionnaire_id, question_id) DO NOTHING;