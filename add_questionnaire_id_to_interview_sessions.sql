-- Add questionnaire_id field to interview_sessions table
-- This allows us to track which questionnaire was used for each interview

ALTER TABLE interview_sessions 
ADD COLUMN questionnaire_id VARCHAR(100);

-- Create an index for better query performance
CREATE INDEX idx_interview_sessions_questionnaire_id 
ON interview_sessions(questionnaire_id);

-- Optional: Add a comment to document the field
COMMENT ON COLUMN interview_sessions.questionnaire_id 
IS 'ID of the questionnaire used for this interview session';