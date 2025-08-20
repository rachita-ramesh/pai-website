# PAI - Digital Twins for Market Research Platform

## 📋 Project Overview

PAI (Profile AI Interview) is a next-generation market research platform that transforms real people into rich, queryable digital personas through AI-powered conversational interviews. The platform enables businesses to create highly accurate digital twins of their target customers and query them at scale for market insights.

## 🎯 Core Vision

Instead of traditional surveys and focus groups, PAI conducts natural 15-20 minute AI interviews that extract deep psychological profiles. These digital twins can then predict behavioral responses with 60%+ accuracy, revolutionizing how market research is conducted.

## 🏗️ System Architecture

### Frontend (Next.js 15)
- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Key Features**: 
  - Responsive design across all devices
  - Real-time voice recording and speech recognition
  - Interactive chat interface for AI interviews
  - Modular questionnaire selection system

### Backend (Python + FastAPI)
- **Core Engine**: Python-based AI interviewing and profile extraction
- **API Layer**: FastAPI for REST endpoints
- **AI Integration**: Anthropic Claude API for natural language processing
- **Key Components**:
  - `ai_interviewer.py` - Conversational AI interviewer
  - `profile_extractor.py` - Psychological profile builder
  - `response_predictor.py` - Behavioral prediction engine
  - `validation_tester.py` - Accuracy validation system

### Database (Supabase)
- **Type**: PostgreSQL with JSONB support
- **Schema**: 14 tables supporting comprehensive persona management
- **Key Features**: 
  - Profile versioning (v1, v2, v3...)
  - Modular questionnaire completions
  - Validation test tracking
  - AI prediction analytics

## 🔄 Core Workflow

### 1. Profile Creation Pipeline
```
User Selection → AI Interview → Profile Extraction → Digital Twin
```

1. **Questionnaire Selection**:
   - Choose between new profile or enhancing existing
   - Select modular questionnaires:
     - **Centrepiece**: Core personality and general life attitudes (required)
     - **Category**: Specific areas like beauty, fitness, nutrition
     - **Product**: Specific products like moisturizer, sunscreen

2. **AI Interview Process**:
   - Natural conversation using speech recognition or text
   - AI dynamically asks follow-up questions
   - Typical duration: 15-20 minutes
   - Real-time transcript and message history

3. **Profile Extraction**:
   - AI analyzes interview transcript
   - Extracts structured psychological profile:
     - Demographics and lifestyle context
     - Core attitudes and values
     - Decision psychology and purchase triggers
     - Usage patterns and emotional drivers
     - Behavioral quotes and prediction weights

### 2. Digital Twin Querying
```
Client Query → AI Processing → Digital Twin Response → Accuracy Validation
```

- Clients can query digital twins through chat interface
- AI processes queries using extracted profiles
- Responses include confidence scores and reasoning
- Validation system tracks prediction accuracy

## 🧠 Modular Questionnaire System

### Recent Enhancement: Modular Architecture
The platform now supports a sophisticated modular questionnaire system:

#### Questionnaire Types:
1. **Centrepiece (Required)**: 
   - General life attitudes and core personality
   - ~15 minutes duration
   - Foundation for all profiles

2. **Category Questionnaires**:
   - Beauty & Skincare
   - Fitness & Health  
   - Nutrition
   - Career & Professional
   - Relationships
   - Mental Health
   - ~10 minutes each

3. **Product-Specific Questionnaires**:
   - Moisturizer Products
   - Sunscreen Products
   - Cleansers
   - Serums
   - ~5 minutes each

#### User Flow:
- Users can select multiple questionnaires in one session
- Skip functionality for optional questionnaires
- Existing profile enhancement (add new questionnaires to existing profiles)
- Estimated time calculation and progress tracking

## 📊 Database Schema Highlights

### Core Entities
- **`people`**: Base registry of individuals
- **`profile_versions`**: Versioned digital twin profiles with automatic incrementing
- **`interview_sessions`**: Complete conversation transcripts and metadata
- **`questionnaire_completions`**: Modular questionnaire tracking

### Validation System
- **`survey_templates`**: Validation question structures
- **`validation_test_sessions`**: Test session management
- **`survey_responses`**: Question-level accuracy tracking
- **`validation_test_results`**: Overall performance analytics

### Custom Content
- **`custom_questionnaires`**: User-created questionnaire templates
- **`questionnaire_questions`**: Flexible question management with multiple types

## 🎨 User Interface Features

### Profile Creation Experience
- **Step-by-step wizard**: Questionnaire selection → Setup → Interview → Complete
- **Voice Integration**: Real-time speech recognition with visual feedback
- **Progress Tracking**: Exchange count, estimated completion time
- **Profile Display**: Rich visualization of extracted personality data

### Questionnaire Builder
- **Multiple Question Types**: Open-ended, multiple choice, yes/no, rating scales
- **Three Questionnaire Types**: Centrepiece, category-specific, product-specific
- **Help Text Support**: Additional guidance for complex questions
- **Public/Private Sharing**: Community questionnaire sharing

### Chat Interface
- **Real-time Conversations**: Live AI responses with typing indicators
- **Voice Input**: Click-to-record with automatic transcription
- **Message History**: Complete conversation preservation
- **Visual Design**: Modern chat bubbles with avatars

## 🔬 Validation & Analytics

### Accuracy Metrics
- **Target Accuracy**: 60%+ prediction accuracy for concept validation
- **Question-level Tracking**: Individual response accuracy analysis
- **Category Performance**: Accuracy breakdown by question categories
- **Confidence Scoring**: AI confidence levels for each prediction

### Analytics Dashboard
- **Profile Performance**: Accuracy trends over time
- **Test History**: Comprehensive testing analytics
- **Improvement Tracking**: Profile enhancement over versions
- **Usage Analytics**: Popular questionnaires and completion rates

## 🛠️ Technical Implementation

### Key Technologies
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Python, FastAPI, Anthropic Claude API
- **Database**: Supabase (PostgreSQL with JSONB)
- **Voice**: Web Speech API for real-time voice recognition
- **Deployment**: Optimized for Vercel deployment

### API Architecture
```
/api/interview          # Interview session management
/api/questionnaires     # Custom questionnaire CRUD
/api/chat              # Digital twin querying
/api/validation        # Accuracy testing
/api/create-profile    # Profile creation pipeline
```

### File Structure
```
src/
├── app/
│   ├── create-profile/      # Profile creation wizard
│   ├── create-questionnaire/ # Questionnaire builder
│   ├── chat/               # Digital twin chat interface
│   ├── validation/         # Accuracy testing
│   └── validation-history/ # Test results dashboard
├── components/ui/          # Reusable UI components
└── lib/                   # Utility functions and API clients

api/                       # Python backend API handlers
lib/                      # Core Python components
data/                     # Generated interview and profile data
```

## 🚀 Recent Developments

### Latest Features (Current Version)
1. **Modular Questionnaire System**: 
   - Three-tier questionnaire architecture
   - Skip functionality for optional questionnaires
   - Existing profile enhancement capabilities

2. **Enhanced Profile Creation**:
   - Choose between new profile or enhance existing
   - Multiple questionnaire selection in single session
   - Time estimation and progress tracking

3. **Database Integration**:
   - Complete Supabase integration for all 14 tables
   - Profile versioning with automatic incrementing
   - Comprehensive validation result tracking

4. **Improved User Experience**:
   - Real-time voice recognition with visual feedback
   - Rich profile data visualization
   - Downloadable JSON profile exports

## 🎯 Business Applications

### Market Research Use Cases
- **Customer Persona Development**: Create detailed customer archetypes
- **Product Testing**: Predict customer responses to new products
- **Marketing Message Testing**: Validate messaging with digital twins
- **User Experience Research**: Understand user behavior patterns
- **Segmentation Analysis**: Identify distinct customer segments

### Target Industries
- **Consumer Goods**: Skincare, beauty, wellness products
- **Technology**: Software and app user research
- **Healthcare**: Patient experience and treatment preferences
- **Finance**: Investment and financial product preferences
- **Retail**: Shopping behavior and preference analysis

## 📈 Success Metrics

### Day 1 Success Criteria ✅
- AI interviewer conducts natural 15-20 minute conversations
- Profile extraction creates rich, differentiated profiles
- Profiles feel accurate to interviewed individuals

### Day 2 Success Criteria 🎯
- Prediction system generates logical reasoning for responses
- **60%+ overall accuracy rate across test questions**
- Profiles capture meaningful differences between individuals
- System appropriately identifies low-confidence predictions

## 🔮 Future Roadmap

### Planned Enhancements
1. **Multi-language Support**: Interviews in multiple languages
2. **Industry Templates**: Pre-built questionnaires for specific industries
3. **Advanced Analytics**: Machine learning insights and pattern recognition
4. **Integration APIs**: Connect with existing market research tools
5. **Team Collaboration**: Multi-user workspace for research teams

### Scalability Considerations
- **Performance Optimization**: Caching and query optimization
- **Rate Limiting**: API throttling for high-volume usage
- **Data Privacy**: Enhanced security and compliance features
- **Enterprise Features**: Advanced user management and permissions

## 🏆 Competitive Advantages

1. **Natural Conversations**: AI interviews feel like real conversations, not surveys
2. **Deep Psychology**: Extracts rich behavioral insights, not just preferences
3. **Prediction Accuracy**: 60%+ accuracy validates digital twin concept
4. **Modular System**: Flexible questionnaire building for any domain
5. **Real-time Voice**: Natural speech interaction reduces friction
6. **Profile Evolution**: Version tracking supports longitudinal research

## 📝 Usage Examples

### Creating a Digital Twin
```javascript
// 1. Select questionnaires
const selectedQuestionnaires = ['centrepiece', 'beauty', 'moisturizer'];

// 2. Conduct AI interview  
const interview = await startInterview(userName, questionnaires);

// 3. Extract profile
const profile = await extractProfile(interview.sessionId);

// 4. Query digital twin
const response = await queryDigitalTwin(profile.id, "How do you choose skincare products?");
```

### Building Custom Questionnaires
```javascript
const questionnaire = {
  title: "Fitness & Wellness Deep Dive",
  type: "category",
  category: "fitness",
  questions: [
    {
      text: "What motivates you to exercise?",
      type: "open_ended",
      required: true
    }
  ]
};
```

## 🤝 Contributing

The platform is designed for extensibility:
- **Custom Questionnaires**: Users can create domain-specific questionnaires
- **API Integration**: REST APIs enable third-party integrations
- **Template System**: New interview templates can be added
- **Validation Framework**: Custom validation surveys can be created

PAI represents the future of market research - moving from static surveys to dynamic, conversational digital twins that provide deeper insights into human behavior and decision-making.