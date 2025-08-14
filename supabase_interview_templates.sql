-- Additional table for interview templates (add this to your existing schema)

-- Interview templates table - Store different interview types and their questions
CREATE TABLE IF NOT EXISTS interview_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(100) UNIQUE NOT NULL, -- skincare_a_u_interview, product_feedback, etc.
  title VARCHAR(200) NOT NULL,
  description TEXT,
  interview_type VARCHAR(50) NOT NULL, -- profile_creation, validation, feedback
  system_prompt TEXT NOT NULL, -- Full AI system prompt
  interview_structure JSONB NOT NULL, -- Structured interview flow
  topic_areas JSONB NOT NULL, -- Key topic areas to explore
  estimated_duration INTEGER, -- Minutes
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview topic templates - Individual topic areas within interviews
CREATE TABLE IF NOT EXISTS interview_topics (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(100) NOT NULL,
  topic_name VARCHAR(100) NOT NULL, -- category_relationship, decision_making, etc.
  topic_title VARCHAR(200) NOT NULL,
  description TEXT,
  suggested_questions JSONB NOT NULL, -- Array of suggested questions
  estimated_duration INTEGER, -- Minutes for this topic
  topic_order INTEGER NOT NULL, -- Order in the interview
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (template_name) REFERENCES interview_templates(template_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interview_templates_name ON interview_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_interview_templates_type ON interview_templates(interview_type);
CREATE INDEX IF NOT EXISTS idx_interview_topics_template ON interview_topics(template_name);
CREATE INDEX IF NOT EXISTS idx_interview_topics_order ON interview_topics(topic_order);

-- RLS
ALTER TABLE interview_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on interview_templates" ON interview_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations on interview_topics" ON interview_topics FOR ALL USING (true);

-- Insert the current skincare A&U interview template
INSERT INTO interview_templates (
  template_name,
  title,
  description,
  interview_type,
  system_prompt,
  interview_structure,
  topic_areas,
  estimated_duration,
  version,
  is_active
) VALUES (
  'skincare_au_interview',
  'Skincare Attitudes & Usage Research Interview',
  'Comprehensive A&U interview to understand skincare psychology, attitudes, and behaviors for digital twin creation',
  'profile_creation',
  'You are conducting an A&U (Attitudes & Usage) research interview about skincare. Your goal is to understand this person''s psychology, attitudes, and behaviors around skincare.

INTERVIEW STYLE:
- Conversational and curious, like a skilled qualitative researcher
- Ask ONE focused question at a time - never multiple questions in a single response
- Keep responses brief and natural (1-2 sentences max)
- Pick up on ONE interesting detail from their response to explore further
- Let them elaborate - don''t rush to the next topic
- Show genuine interest through short, focused follow-ups
- Gently explore contradictions between stated vs. revealed preferences

Remember: This should feel like a natural conversation, not a survey. Ask follow-ups, show curiosity, and help them reflect on their choices and feelings.',
  '{
    "opening_question": "I''d love to understand your relationship with skincare. Tell me, is skincare something you think about a lot, or is it more just routine for you?",
    "flow_type": "adaptive",
    "completion_criteria": {
      "min_exchanges": 15,
      "max_exchanges": 25,
      "required_topics": ["category_relationship", "core_attitudes", "decision_making", "usage_patterns"]
    }
  }'::JSONB,
  '{
    "category_relationship": {
      "duration": 5,
      "focus": "Overall relationship with skincare, how it fits into their life/identity"
    },
    "core_attitudes": {
      "duration": 10, 
      "focus": "Feelings about aging, what skincare means personally, confidence patterns"
    },
    "decision_making": {
      "duration": 8,
      "focus": "How they research and choose products, risk tolerance"
    },
    "usage_patterns": {
      "duration": 7,
      "focus": "Actual behaviors, routines, consistency patterns"
    }
  }'::JSONB,
  30,
  1,
  true
) ON CONFLICT (template_name) DO NOTHING;

-- Insert topic details
INSERT INTO interview_topics (template_name, topic_name, topic_title, description, suggested_questions, estimated_duration, topic_order, is_required) VALUES 
(
  'skincare_au_interview',
  'category_relationship',
  'Category Relationship',
  'Understanding their overall relationship with skincare and how it fits into their identity',
  '[
    "How would you describe your relationship with skincare?",
    "Has your interest in skincare changed over time?",
    "What role does skincare play in your daily life?",
    "Do you see skincare as necessity or luxury?"
  ]'::JSONB,
  5,
  1,
  true
),
(
  'skincare_au_interview', 
  'core_attitudes',
  'Core Attitudes & Motivations',
  'Deep dive into their feelings about aging, what skincare means to them personally',
  '[
    "How do you feel about aging and skin changes?",
    "What does having good skin mean to you?",
    "How confident do you feel about your skin?",
    "What influences your skincare beliefs?"
  ]'::JSONB,
  10,
  2, 
  true
),
(
  'skincare_au_interview',
  'decision_making',
  'Decision-Making Psychology', 
  'How they research, choose products, and make skincare decisions',
  '[
    "How do you typically research new skincare products?",
    "What makes you trust a skincare product or brand?",
    "Tell me about a recent skincare purchase decision",
    "How do you decide if a product is working?"
  ]'::JSONB,
  8,
  3,
  true
),
(
  'skincare_au_interview',
  'usage_patterns',
  'Usage Patterns & Behaviors',
  'Their actual skincare behaviors, routines, and consistency patterns',
  '[
    "Walk me through your typical skincare routine",
    "How consistent are you with your routine?", 
    "What happens when you travel or get busy?",
    "How do you track if products are working?"
  ]'::JSONB,
  7,
  4,
  true
) ON CONFLICT DO NOTHING;