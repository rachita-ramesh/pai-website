-- Migration: Add questionnaire_type column to custom_questionnaires table
-- Date: 2025-08-19
-- Purpose: Properly track whether questionnaires are centrepiece, category, or product type

-- Add the questionnaire_type column
ALTER TABLE custom_questionnaires 
ADD COLUMN questionnaire_type VARCHAR(20) NOT NULL DEFAULT 'category';

-- Add check constraint to ensure valid values
ALTER TABLE custom_questionnaires 
ADD CONSTRAINT questionnaire_type_check 
CHECK (questionnaire_type IN ('centrepiece', 'category', 'product'));

-- Update existing records based on category field (if any exist)
-- This is a best-guess migration - you may need to adjust based on your data
UPDATE custom_questionnaires 
SET questionnaire_type = CASE 
  WHEN category ILIKE '%general%' OR category ILIKE '%life%' OR category ILIKE '%centrepiece%' THEN 'centrepiece'
  WHEN category ILIKE '%product%' OR category ILIKE '%moisturizer%' OR category ILIKE '%sunscreen%' THEN 'product'
  ELSE 'category'
END;

-- Add comment for documentation
COMMENT ON COLUMN custom_questionnaires.questionnaire_type IS 'Type of questionnaire: centrepiece (general life), category (specific areas), or product (specific products)';

-- Verify the migration
SELECT questionnaire_type, category, title, COUNT(*) as count
FROM custom_questionnaires 
GROUP BY questionnaire_type, category, title
ORDER BY questionnaire_type, category;