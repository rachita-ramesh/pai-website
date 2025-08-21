-- Profile Data Migration Script
-- Migrate existing profile_data to new structured format
-- Date: 2025-08-20
-- Purpose: Restructure profile_data JSON to support centrepiece/category/product organization

-- First, let's examine the current profile_data structure
SELECT 
    profile_id,
    jsonb_pretty(profile_data) as current_structure,
    completeness_metadata
FROM profile_versions 
WHERE profile_data IS NOT NULL 
LIMIT 3;

-- Add a new column for the restructured data (temporary)
ALTER TABLE profile_versions 
ADD COLUMN IF NOT EXISTS profile_data_new JSONB;

-- Migration function to restructure profile data
CREATE OR REPLACE FUNCTION migrate_profile_data()
RETURNS void AS $$
DECLARE
    profile_record RECORD;
    new_structure JSONB;
    centrepiece_data JSONB;
    legacy_data JSONB;
BEGIN
    -- Loop through all profiles with profile_data
    FOR profile_record IN 
        SELECT id, profile_id, profile_data, completeness_metadata
        FROM profile_versions 
        WHERE profile_data IS NOT NULL
    LOOP
        legacy_data := profile_record.profile_data;
        
        -- Initialize new structure
        new_structure := '{}'::jsonb;
        
        -- Extract centrepiece data from legacy structure
        centrepiece_data := jsonb_build_object(
            'demographics', COALESCE(
                legacy_data->'demographics',
                jsonb_build_object(
                    'age_range', legacy_data->'demographics'->>'age_range',
                    'lifestyle', legacy_data->'demographics'->>'lifestyle',
                    'context', legacy_data->'demographics'->>'context'
                )
            ),
            'personality', COALESCE(
                legacy_data->'personality',
                jsonb_build_object(
                    'self_description', legacy_data->'core_attitudes'->>'personality_summary',
                    'signature_strengths', legacy_data->'core_attitudes'->>'strengths'
                )
            ),
            'values_beliefs', COALESCE(
                legacy_data->'values_beliefs',
                jsonb_build_object(
                    'core_values', legacy_data->'value_system'->>'core_motivation',
                    'decision_priorities', legacy_data->'decision_psychology'->>'research_style'
                )
            ),
            'lifestyle', COALESCE(
                legacy_data->'lifestyle',
                jsonb_build_object(
                    'daily_life_work', legacy_data->'lifestyle_preferences'->>'routine',
                    'interests_hobbies', legacy_data->'lifestyle_preferences'->>'activities'
                )
            ),
            'media_culture', COALESCE(
                legacy_data->'media_culture',
                jsonb_build_object(
                    'social_media_use', legacy_data->'communication_style'->>'social_media',
                    'news_information', legacy_data->'consumption_patterns'->>'information_sources'
                )
            )
        );
        
        -- Build new structure with centrepiece
        new_structure := jsonb_set(new_structure, '{centrepiece}', centrepiece_data);
        
        -- Initialize empty categories and products
        new_structure := jsonb_set(new_structure, '{categories}', '{}'::jsonb);
        new_structure := jsonb_set(new_structure, '{products}', '{}'::jsonb);
        
        -- Check completeness_metadata to see if specific categories/products were completed
        IF profile_record.completeness_metadata IS NOT NULL THEN
            -- If beauty was completed, try to extract beauty-related data
            IF profile_record.completeness_metadata ? 'beauty' THEN
                new_structure := jsonb_set(
                    new_structure, 
                    '{categories,beauty}',
                    jsonb_build_object(
                        'routine', jsonb_build_object(
                            'beauty_routine_motivation', legacy_data->'aesthetic_preferences'->>'style_preferences',
                            'self_care_perception', legacy_data->'lifestyle_preferences'->>'self_care'
                        ),
                        'skin_hair_type', jsonb_build_object(
                            'skin_concerns', legacy_data->'usage_patterns'->>'context_sensitivity'
                        )
                    )
                );
            END IF;
            
            -- If fitness was completed
            IF profile_record.completeness_metadata ? 'fitness' THEN
                new_structure := jsonb_set(
                    new_structure,
                    '{categories,fitness}',
                    jsonb_build_object(
                        'activity_level', legacy_data->'lifestyle_preferences'->>'activities',
                        'wellness_approach', legacy_data->'lifestyle_preferences'->>'routine'
                    )
                );
            END IF;
        END IF;
        
        -- Update the record with new structure
        UPDATE profile_versions 
        SET profile_data_new = new_structure
        WHERE id = profile_record.id;
        
        RAISE NOTICE 'Migrated profile: %', profile_record.profile_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_profile_data();

-- Verify migration results
SELECT 
    profile_id,
    'OLD' as structure_type,
    jsonb_pretty(profile_data) as data
FROM profile_versions 
WHERE profile_data IS NOT NULL 
LIMIT 2

UNION ALL

SELECT 
    profile_id,
    'NEW' as structure_type,
    jsonb_pretty(profile_data_new) as data
FROM profile_versions 
WHERE profile_data_new IS NOT NULL 
LIMIT 2;

-- Once migration is verified, replace old data with new data
-- UNCOMMENT THESE LINES AFTER VERIFICATION:

-- UPDATE profile_versions 
-- SET profile_data = profile_data_new
-- WHERE profile_data_new IS NOT NULL;

-- ALTER TABLE profile_versions DROP COLUMN profile_data_new;

-- Drop the migration function
DROP FUNCTION IF EXISTS migrate_profile_data();

-- Add comment for documentation
COMMENT ON COLUMN profile_versions.profile_data IS 'Structured profile data: {centrepiece: {demographics, lifestyle, personality, values_beliefs, media_culture}, categories: {beauty, fitness, etc}, products: {facial_moisturizer, sunscreen, etc}}';

-- Verify final structure
SELECT 
    profile_id,
    profile_data ? 'centrepiece' as has_centrepiece,
    profile_data ? 'categories' as has_categories,
    profile_data ? 'products' as has_products,
    jsonb_object_keys(COALESCE(profile_data->'categories', '{}'::jsonb)) as completed_categories,
    jsonb_object_keys(COALESCE(profile_data->'products', '{}'::jsonb)) as completed_products
FROM profile_versions 
WHERE profile_data IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;