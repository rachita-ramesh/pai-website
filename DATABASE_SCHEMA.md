# PAI Digital Twins Platform - Database Schema Documentation

## Overview
This document describes all database tables created for the PAI (Profile AI Interview) digital twins platform. The database is designed to support comprehensive personality profiling, AI-driven interviews, validation testing, and digital twin creation with full versioning and analytics.

## Database Files
Actual implemented tables in Supabase database:

**Total: 11 tables** (Note: Some tables from original design are not yet implemented)

---

## 🏗️ CORE ENTITIES (supabase_schema.sql)

### 1. `people`
**Purpose**: Base registry of all individuals using the platform
**Why Created**: Central identity management for tracking multiple profile versions per person

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-incrementing ID (nextval('people_id_seq')) |
| `name` | CHARACTER VARYING | Person's name (NOT NULL) |
| `created_at` | TIMESTAMP WITH TIME ZONE | When person was first registered (default: now()) |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last update timestamp (default: now()) |

**Business Logic**: Each person can have multiple profile versions (v1, v2, v3...)

---

### 2. `profile_versions`
**Purpose**: Store multiple versions of digital twin profiles for each person
**Why Created**: Support profile evolution - when someone retakes the interview, create v2, v3, etc.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-incrementing ID (nextval('profile_versions_id_seq')) |
| `profile_id` | CHARACTER VARYING | Full profile identifier (NOT NULL) |
| `person_name` | CHARACTER VARYING | Links to people.name (NOT NULL) |
| `version_number` | INTEGER | Version number (NOT NULL, default: 1) |
| `profile_data` | JSONB | Complete PAI psychological profile (NOT NULL) |
| `completeness_metadata` | JSONB | Tracks which questionnaires completed/skipped (default: '{}') |
| `is_active` | BOOLEAN | Whether this version is currently active (default: true) |
| `created_at` | TIMESTAMP WITH TIME ZONE | Profile creation time (default: now()) |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last modification time (default: now()) |

**Business Logic**: 
- Automatic versioning: rachita_v1 → rachita_v2 → rachita_v3
- Full digital twin psychology stored as JSON
- Support for multiple active profiles per person
- Modular completion tracking: completeness_metadata = {"centrepiece": true, "categories": ["beauty"], "products": ["moisturizer"], "skipped": ["fitness"]}
- Links to questionnaire_completions for detailed modular data

---

### 3. `interview_sessions`
**Purpose**: Store original interview conversations and transcripts
**Why Created**: Preserve the raw interview data that generated each profile for audit and reprocessing

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-incrementing ID (nextval('interview_sessions_id_seq')) |
| `session_id` | CHARACTER VARYING | Interview session identifier (NOT NULL) |
| `person_name` | CHARACTER VARYING | Who was interviewed (NOT NULL) |
| `transcript` | TEXT | Full text transcript |
| `messages` | JSONB | Complete conversation history (user/AI exchanges) |
| `exchange_count` | INTEGER | Number of back-and-forth exchanges (default: 0) |
| `is_complete` | BOOLEAN | Whether interview finished successfully (default: false) |
| `profile_id` | CHARACTER VARYING | Links to resulting profile |
| `questionnaire_id` | TEXT | Links to questionnaire template used (NOT NULL) |
| `created_at` | TIMESTAMP WITH TIME ZONE | Interview start time (default: now()) |
| `completed_at` | TIMESTAMP WITH TIME ZONE | Interview completion time |

**Business Logic**: 
- Links interview → profile creation
- Enables reprocessing interviews with improved AI
- Audit trail for profile generation

---

## 📊 SURVEY & VALIDATION SYSTEM

### 4. `survey_templates`
**Purpose**: Store validation survey structures with questions and expected accuracy
**Why Created**: Manage different validation tests for measuring digital twin accuracy

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-incrementing ID (nextval('survey_templates_id_seq')) |
| `survey_name` | CHARACTER VARYING | Survey identifier (NOT NULL) |
| `title` | CHARACTER VARYING | Human-readable title (NOT NULL) |
| `description` | TEXT | Survey purpose and scope |
| `target_accuracy` | NUMERIC | Expected accuracy threshold (0.60 = 60%) |
| `questions` | JSONB | Complete questions array with options (NOT NULL) |
| `version` | INTEGER | Survey version number (default: 1) |
| `is_active` | BOOLEAN | Whether survey is currently used (default: true) |
| `created_at` | TIMESTAMP WITH TIME ZONE | Creation time (default: now()) |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last update time (default: now()) |

**Business Logic**: 
- Standardized validation questions
- Version control for survey evolution
- Target accuracy for pass/fail determination

---

### 5. ❌ `validation_test_sessions` - NOT IMPLEMENTED
**Status**: This table was planned but not yet created in the database.

---

### 6. `survey_responses`
**Purpose**: Store individual human vs AI responses for each validation question
**Why Created**: Granular tracking of accuracy at the question level, not just overall

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-incrementing ID (nextval('question_responses_id_seq')) |
| `test_session_id` | CHARACTER VARYING | Links to validation test session (NOT NULL) |
| `question_id` | CHARACTER VARYING | Question identifier (NOT NULL) |
| `question_text` | TEXT | Full question text (NOT NULL) |
| `question_category` | CHARACTER VARYING | Question category (attitudes, usage, etc.) |
| `human_response` | CHARACTER VARYING | What the human actually answered |
| `ai_response` | CHARACTER VARYING | What the digital twin predicted |
| `ai_reasoning` | TEXT | AI's reasoning for the prediction |
| `is_correct` | BOOLEAN | Whether AI matched human |
| `response_order` | INTEGER | Order questions were answered |
| `created_at` | TIMESTAMP WITH TIME ZONE | Response creation time (default: now()) |

**Business Logic**: 
- Question-by-question accuracy tracking
- AI reasoning storage for analysis
- Category-based accuracy breakdowns

---

### 7. `validation_test_results`
**Purpose**: Summary results and analytics for each completed validation test
**Why Created**: High-level metrics and reporting for test performance

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-incrementing ID (nextval('validation_test_results_id_seq')) |
| `test_session_id` | CHARACTER VARYING | Links to test session (NOT NULL) |
| `profile_id` | CHARACTER VARYING | Which profile was tested (NOT NULL) |
| `survey_name` | CHARACTER VARYING | Which survey was used (NOT NULL) |
| `total_questions` | INTEGER | Total questions in test (NOT NULL) |
| `correct_responses` | INTEGER | Number of correct AI predictions (NOT NULL) |
| `accuracy_score` | NUMERIC | Overall accuracy percentage (NOT NULL) |

**Note**: `detailed_results` and `test_metadata` columns are not implemented in current schema.

**Business Logic**: 
- Roll-up accuracy metrics
- Category performance analysis
- Test condition tracking

---

## 🤖 PREDICTION & AI RESPONSES

### 8. `ai_predictions`
**Purpose**: Store AI prediction results with confidence scores and reasoning
**Why Created**: Track AI prediction quality and reasoning for continuous improvement

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-incrementing ID (nextval('ai_predictions_id_seq')) |
| `profile_id` | CHARACTER VARYING | Which profile made prediction (NOT NULL) |
| `question_id` | CHARACTER VARYING | Question being predicted (NOT NULL) |
| `predicted_response` | CHARACTER VARYING | AI's predicted answer (NOT NULL) |
| `confidence_score` | NUMERIC | AI confidence (0.85 = 85%) |
| `reasoning` | TEXT | AI's reasoning process |
| `model_version` | CHARACTER VARYING | AI model version used (default: 'claude-3-5-sonnet') |
| `created_at` | TIMESTAMP WITH TIME ZONE | Prediction creation time (default: now()) |

**Business Logic**: 
- Track prediction quality over time
- A/B test different AI models
- Confidence scoring for prediction reliability

---

### 9. `test_history_summary`
**Purpose**: Overall testing analytics and trends per profile
**Why Created**: Dashboard metrics and improvement tracking for each digital twin

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-incrementing ID (nextval('test_history_summary_id_seq')) |
| `profile_id` | CHARACTER VARYING | Profile being summarized (NOT NULL) |
| `total_tests_taken` | INTEGER | Lifetime test count (default: 0) |
| `average_accuracy` | NUMERIC | Average accuracy across all tests |
| `best_accuracy` | NUMERIC | Highest accuracy achieved |
| `latest_test_date` | TIMESTAMP WITH TIME ZONE | Most recent test date |
| `improvement_trend` | CHARACTER VARYING | improving, stable, declining |
| `created_at` | TIMESTAMP WITH TIME ZONE | Record creation time (default: now()) |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last update time (default: now()) |

**Business Logic**: 
- Dashboard analytics
- Improvement tracking

---

### 10. `questionnaire_completions`
**Purpose**: Track modular questionnaire completion for incremental profile building
**Why Created**: Support centrepiece/category/product questionnaire system with skip functionality

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-incrementing ID (nextval('questionnaire_completions_id_seq')) |
| `profile_id` | CHARACTER VARYING | Links to profile version (NOT NULL) |
| `questionnaire_type` | CHARACTER VARYING | centrepiece, category, product (NOT NULL) |
| `questionnaire_name` | CHARACTER VARYING | beauty, fitness, moisturizer, sunscreen, etc. (NOT NULL) |
| `completion_data` | JSONB | Question responses and interview data (NOT NULL) |
| `completed_at` | TIMESTAMP WITHOUT TIME ZONE | When questionnaire was completed (default: now()) |
| `skipped` | BOOLEAN | True if user chose to skip this questionnaire (default: false) |
| `estimated_duration` | INTEGER | Time taken to complete (minutes) |

**Business Logic**: 
- Modular profile creation (centrepiece → category → product)
- Skip functionality for optional questionnaires
- Incremental profile enhancement over time
- Track completion patterns and user preferences

---

## 📝 CUSTOM QUESTIONNAIRES (supabase_custom_questionnaires.sql)

### 12. `custom_questionnaires`
**Purpose**: User-created questionnaires for any category or topic with modular questionnaire type support
**Why Created**: Allow users to create custom questionnaires beyond default skincare interview, supporting centrepiece/category/product modular system

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-incrementing ID (nextval('custom_questionnaires_id_seq')) |
| `questionnaire_id` | CHARACTER VARYING | Questionnaire identifier (NOT NULL) |
| `title` | CHARACTER VARYING | User-defined title (NOT NULL) |
| `description` | TEXT | Questionnaire purpose |
| `questionnaire_type` | VARCHAR(20) | Type: 'centrepiece', 'category', or 'product' (NOT NULL, default: 'category') |
| `category` | CHARACTER VARYING | skincare, fitness, career, relationships, etc. (NOT NULL) |
| `created_by` | CHARACTER VARYING | Creator name (optional) |
| `questions` | JSONB | Complete questions array (NOT NULL) |
| `estimated_duration` | INTEGER | Expected completion time (minutes) |
| `is_public` | BOOLEAN | Whether others can use this questionnaire (default: false) |
| `is_active` | BOOLEAN | Whether questionnaire is active (default: true) |
| `usage_count` | INTEGER | How many times it's been used (default: 0) |
| `created_at` | TIMESTAMP WITH TIME ZONE | Creation time (default: now()) |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last update time (default: now()) |

**Business Logic**: 
- User-generated content for questionnaires with modular type system
- **Centrepiece**: General life and personality questionnaires (core digital twin foundation)
- **Category**: Specific life areas (beauty, fitness, career, relationships, etc.)
- **Product**: Specific products or sub-categories (moisturizer, sunscreen, supplements, etc.)
- Public/private sharing model
- Usage analytics for popular questionnaires
- Check constraint ensures valid questionnaire_type values

---

### 13. `questionnaire_questions`
**Purpose**: Individual questions within custom questionnaires
**Why Created**: Detailed question management with types, options, and help text

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-incrementing ID (nextval('questionnaire_questions_id_seq')) |
| `questionnaire_id` | CHARACTER VARYING | Links to custom questionnaire (NOT NULL) |
| `question_id` | CHARACTER VARYING | Question identifier within questionnaire (NOT NULL) |
| `question_text` | TEXT | Full question text (NOT NULL) |
| `question_type` | CHARACTER VARYING | open_ended, multiple_choice, scale, yes_no (default: 'open_ended') |
| `options` | JSONB | Multiple choice options |
| `is_required` | BOOLEAN | Whether question is required (default: true) |
| `question_order` | INTEGER | Order in questionnaire (NOT NULL) |
| `help_text` | TEXT | Additional guidance for question |
| `created_at` | TIMESTAMP WITH TIME ZONE | Question creation time (default: now()) |

**Business Logic**: 
- Multiple question types support
- Flexible ordering and requirements
- Help text for question clarification

---

## 🔗 Relationships Summary

### Core Data Flow:
1. **Person** creates multiple **Profile Versions** (v1, v2, v3...)
2. **Interview Sessions** generate **Profile Versions**
3. **Profile Versions** take **Validation Tests** using **Survey Templates**
4. **Validation Tests** generate **Question Responses** and **Test Results**
5. **AI Predictions** are compared to human responses for accuracy
6. **Test History** tracks overall performance trends

### Template System:
- **Custom Questionnaires** define user-created form flows
- Interview templates are referenced via `questionnaire_id` in interview_sessions
- **Note**: Interview templates table not yet implemented in database

### Analytics Chain:
- Individual **Question Responses** → **Test Results** → **Test History Summary**
- **AI Predictions** → confidence and reasoning analysis
- **Questionnaire Usage** → popularity and effectiveness metrics

---

## 🎯 Key Design Decisions

### 1. **Profile Versioning**
- Each person can have unlimited profile versions
- Automatic incrementing: name_v1 → name_v2 → name_v3
- Supports profile evolution and A/B testing

### 2. **Separation of Concerns**
- **Interview data** (raw conversations) vs **Profile data** (processed insights)
- **Survey templates** (validation) vs **Interview templates** (conversation)
- **Custom questionnaires** (user-created) vs **System templates** (built-in)

### 3. **Granular Analytics**
- Question-level accuracy tracking
- Category-based performance analysis
- Confidence scoring and reasoning storage

### 4. **Flexible Content Management**
- Database-driven interview flows (not hardcoded)
- User-generated questionnaire content
- Public/private sharing models

### 5. **Full Audit Trail**
- Preserve original interview conversations
- Track all test sessions and results
- Version control for templates and surveys

## ⚠️ Implementation Status

### ✅ Implemented Tables (11):
1. `people` - Base user registry
2. `profile_versions` - Versioned digital twin profiles
3. `interview_sessions` - Interview conversations and transcripts
4. `survey_templates` - Validation survey structures
5. `survey_responses` - Individual question responses for validation
6. `validation_test_results` - Summary results for validation tests
7. `ai_predictions` - AI prediction tracking with confidence scores
8. `test_history_summary` - Overall analytics per profile
9. `questionnaire_completions` - Modular questionnaire tracking
10. `custom_questionnaires` - User-created questionnaires
11. `questionnaire_questions` - Individual questions within custom questionnaires

### ❌ Missing Tables (3 from original design):
1. `validation_test_sessions` - Test session management
2. `interview_templates` - AI conversation flow templates
3. `template_questions` - Questions within interview templates

### 🔧 Schema Differences from Original Design:
- All timestamp columns use `TIMESTAMP WITH TIME ZONE` for better timezone handling
- Added `questionnaire_id` column to `interview_sessions` for template linking
- Several optional JSONB columns (`detailed_results`, `test_metadata`) not implemented in `validation_test_results`
- `questionnaire_completions.completed_at` uses `TIMESTAMP WITHOUT TIME ZONE`
- Default model version is 'claude-3-5-sonnet' instead of generic placeholder

### 🆕 Recent Schema Updates:
- **August 2025**: Added `questionnaire_type` column to `custom_questionnaires` table
  - Supports modular questionnaire system: centrepiece, category, product
  - Includes check constraint for valid values
  - Migration available in `supabase_migration_questionnaire_type.sql`

This schema supports most of the PAI digital twins lifecycle from profile creation through validation testing with comprehensive analytics and user-generated content capabilities. Some advanced session management features require the missing tables to be implemented.