# PAI Digital Twins Platform - Database Schema Documentation

## Overview
This document describes all database tables created for the PAI (Profile AI Interview) digital twins platform. The database is designed to support comprehensive personality profiling, AI-driven interviews, validation testing, and digital twin creation with full versioning and analytics.

## Database Files
- `supabase_schema.sql` - Core platform tables (9 tables)
- `supabase_interview_templates.sql` - AI interview structure tables (2 tables)  
- `supabase_custom_questionnaires.sql` - User-created questionnaire tables (3 tables)

**Total: 14 tables**

---

## 🏗️ CORE ENTITIES (supabase_schema.sql)

### 1. `people`
**Purpose**: Base registry of all individuals using the platform
**Why Created**: Central identity management for tracking multiple profile versions per person

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Auto-incrementing ID |
| `name` | VARCHAR(100) UNIQUE | Person's name (rachita, everhett, gigi) |
| `created_at` | TIMESTAMP | When person was first registered |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Business Logic**: Each person can have multiple profile versions (v1, v2, v3...)

---

### 2. `profile_versions`
**Purpose**: Store multiple versions of digital twin profiles for each person
**Why Created**: Support profile evolution - when someone retakes the interview, create v2, v3, etc.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Auto-incrementing ID |
| `profile_id` | VARCHAR(100) UNIQUE | Full profile identifier (rachita_v1, everhett_v2) |
| `person_name` | VARCHAR(100) | Links to people.name |
| `version_number` | INTEGER | Version number (1, 2, 3...) |
| `profile_data` | JSONB | Complete PAI psychological profile |
| `is_active` | BOOLEAN | Whether this version is currently active |
| `created_at` | TIMESTAMP | Profile creation time |
| `updated_at` | TIMESTAMP | Last modification time |

**Business Logic**: 
- Automatic versioning: rachita_v1 → rachita_v2 → rachita_v3
- Full digital twin psychology stored as JSON
- Support for multiple active profiles per person

---

### 3. `interview_sessions`
**Purpose**: Store original interview conversations and transcripts
**Why Created**: Preserve the raw interview data that generated each profile for audit and reprocessing

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Auto-incrementing ID |
| `session_id` | VARCHAR(100) UNIQUE | Interview session identifier |
| `person_name` | VARCHAR(100) | Who was interviewed |
| `transcript` | TEXT | Full text transcript |
| `messages` | JSONB | Complete conversation history (user/AI exchanges) |
| `exchange_count` | INTEGER | Number of back-and-forth exchanges |
| `is_complete` | BOOLEAN | Whether interview finished successfully |
| `profile_id` | VARCHAR(100) | Links to resulting profile |
| `created_at` | TIMESTAMP | Interview start time |
| `completed_at` | TIMESTAMP | Interview completion time |

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
| `id` | SERIAL PRIMARY KEY | Auto-incrementing ID |
| `survey_name` | VARCHAR(100) UNIQUE | Survey identifier (validation_survey_1) |
| `title` | VARCHAR(200) | Human-readable title |
| `description` | TEXT | Survey purpose and scope |
| `target_accuracy` | DECIMAL(3,2) | Expected accuracy threshold (0.60 = 60%) |
| `questions` | JSONB | Complete questions array with options |
| `version` | INTEGER | Survey version number |
| `is_active` | BOOLEAN | Whether survey is currently used |

**Business Logic**: 
- Standardized validation questions
- Version control for survey evolution
- Target accuracy for pass/fail determination

---

### 5. `validation_test_sessions`
**Purpose**: Track each instance of a validation test being taken
**Why Created**: Session management for validation tests with status tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Auto-incrementing ID |
| `test_session_id` | VARCHAR(100) UNIQUE | Test session identifier |
| `profile_id` | VARCHAR(100) | Which profile is being tested |
| `survey_name` | VARCHAR(100) | Which survey is being used |
| `status` | VARCHAR(50) | in_progress, completed, failed |
| `started_at` | TIMESTAMP | Test start time |
| `completed_at` | TIMESTAMP | Test completion time |

**Business Logic**: 
- Each test is a session with lifecycle management
- Links profile → survey → results
- Supports incomplete/abandoned tests

---

### 6. `question_responses`
**Purpose**: Store individual human vs AI responses for each validation question
**Why Created**: Granular tracking of accuracy at the question level, not just overall

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Auto-incrementing ID |
| `test_session_id` | VARCHAR(100) | Links to validation test session |
| `question_id` | VARCHAR(100) | Question identifier |
| `question_text` | TEXT | Full question text |
| `question_category` | VARCHAR(100) | Question category (attitudes, usage, etc.) |
| `human_response` | VARCHAR(500) | What the human actually answered |
| `ai_response` | VARCHAR(500) | What the digital twin predicted |
| `ai_reasoning` | TEXT | AI's reasoning for the prediction |
| `is_correct` | BOOLEAN | Whether AI matched human |
| `response_order` | INTEGER | Order questions were answered |

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
| `id` | SERIAL PRIMARY KEY | Auto-incrementing ID |
| `test_session_id` | VARCHAR(100) UNIQUE | Links to test session |
| `profile_id` | VARCHAR(100) | Which profile was tested |
| `survey_name` | VARCHAR(100) | Which survey was used |
| `total_questions` | INTEGER | Total questions in test |
| `correct_responses` | INTEGER | Number of correct AI predictions |
| `accuracy_score` | DECIMAL(5,2) | Overall accuracy percentage |
| `detailed_results` | JSONB | Category breakdowns, analytics |
| `test_metadata` | JSONB | Test conditions, timing, etc. |

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
| `id` | SERIAL PRIMARY KEY | Auto-incrementing ID |
| `profile_id` | VARCHAR(100) | Which profile made prediction |
| `question_id` | VARCHAR(100) | Question being predicted |
| `predicted_response` | VARCHAR(500) | AI's predicted answer |
| `confidence_score` | DECIMAL(3,2) | AI confidence (0.85 = 85%) |
| `reasoning` | TEXT | AI's reasoning process |
| `model_version` | VARCHAR(50) | AI model version used |

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
| `id` | SERIAL PRIMARY KEY | Auto-incrementing ID |
| `profile_id` | VARCHAR(100) UNIQUE | Profile being summarized |
| `total_tests_taken` | INTEGER | Lifetime test count |
| `average_accuracy` | DECIMAL(5,2) | Average accuracy across all tests |
| `best_accuracy` | DECIMAL(5,2) | Highest accuracy achieved |
| `latest_test_date` | TIMESTAMP | Most recent test date |
| `improvement_trend` | VARCHAR(50) | improving, stable, declining |

**Business Logic**: 
- Dashboard analytics
- Improvement tracking

## 📝 CUSTOM QUESTIONNAIRES (supabase_custom_questionnaires.sql)

### 12. `custom_questionnaires`
**Purpose**: User-created questionnaires for any category or topic
**Why Created**: Allow users to create custom questionnaires beyond default skincare interview

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Auto-incrementing ID |
| `questionnaire_id` | VARCHAR(100) UNIQUE | Questionnaire identifier |
| `title` | VARCHAR(200) | User-defined title |
| `description` | TEXT | Questionnaire purpose |
| `category` | VARCHAR(100) | skincare, fitness, career, relationships, etc. |
| `created_by` | VARCHAR(100) | Creator name (optional) |
| `questions` | JSONB | Complete questions array |
| `estimated_duration` | INTEGER | Expected completion time (minutes) |
| `is_public` | BOOLEAN | Whether others can use this questionnaire |
| `is_active` | BOOLEAN | Whether questionnaire is active |
| `usage_count` | INTEGER | How many times it's been used |

**Business Logic**: 
- User-generated content for questionnaires
- Public/private sharing model
- Usage analytics for popular questionnaires

---

### 13. `questionnaire_questions`
**Purpose**: Individual questions within custom questionnaires
**Why Created**: Detailed question management with types, options, and help text

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Auto-incrementing ID |
| `questionnaire_id` | VARCHAR(100) | Links to custom questionnaire |
| `question_id` | VARCHAR(100) | Question identifier within questionnaire |
| `question_text` | TEXT | Full question text |
| `question_type` | VARCHAR(50) | open_ended, multiple_choice, scale, yes_no |
| `options` | JSONB | Multiple choice options |
| `is_required` | BOOLEAN | Whether question is required |
| `question_order` | INTEGER | Order in questionnaire |
| `help_text` | TEXT | Additional guidance for question |

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
- **Interview Templates** define AI conversation flows
- **Custom Questionnaires** define user-created form flows
- Both can be selected during profile creation

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

This schema supports the complete PAI digital twins lifecycle from profile creation through validation testing with comprehensive analytics and user-generated content capabilities.