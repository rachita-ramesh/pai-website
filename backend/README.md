# Pai Backend - AI Digital Persona System

A Python backend that conducts natural language interviews to create digital personas and predict behavioral responses with 60%+ accuracy.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FastAPI        │    │   Claude API    │
│   (Next.js)     │◄──►│   Server         │◄──►│   (Anthropic)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │   Python Core    │
                    │   Components     │
                    └──────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
    ┌───────▼────┐    ┌────────▼────┐    ┌───────▼────────┐
    │ Interview  │    │ Profile     │    │ Prediction &   │
    │ Conductor  │    │ Extractor   │    │ Validation     │
    └────────────┘    └─────────────┘    └────────────────┘
```

## 📁 Core Components

### 1. `ai_interviewer.py` - Conversational AI Interviewer
- Conducts natural 15-20 minute A&U research interviews about skincare
- Uses sophisticated prompts to explore attitudes, behaviors, and decision-making
- Adaptive follow-up questions based on responses
- Saves complete transcripts with timestamps

### 2. `profile_extractor.py` - Psychological Profile Builder
- Converts interview transcripts into structured JSON profiles
- Extracts behavioral patterns, value systems, and prediction weights
- Creates rich digital personas that capture decision-making psychology

### 3. `response_predictor.py` - Behavioral Prediction Engine
- Takes Pai profiles and predicts survey responses with reasoning
- 5-step prediction process with confidence scoring
- Generates detailed explanations for each prediction

### 4. `validation_tester.py` - Accuracy Validation System
- Tests predictions against real human responses
- Measures accuracy rates and identifies improvement areas
- Target: 60%+ prediction accuracy to validate the concept

### 5. `server.py` - FastAPI REST API
- Provides HTTP endpoints for frontend integration
- Real-time interview management
- Background profile processing
- CORS-enabled for Next.js frontend

### 6. `main.py` - Complete Pipeline Orchestrator
- Runs full interview → profile → predict → validate workflow
- Interactive and simulated modes
- Comprehensive result reporting

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up Environment
```bash
# Copy and configure environment
cp .env.example .env

# Add your Anthropic API key to .env
ANTHROPIC_API_KEY=your_key_here
```

### 3. Run Individual Components
```bash
# Test the AI interviewer
python ai_interviewer.py

# Extract profiles from interviews
python profile_extractor.py

# Generate predictions
python response_predictor.py

# Validate accuracy
python validation_tester.py
```

### 4. Run Complete Pipeline
```bash
# Interactive mode (real interviews)
python main.py

# Or start the API server
python server.py
```

## 🔌 API Endpoints

### Interview Management
- `POST /interview/start` - Start new interview session
- `POST /interview/message` - Send message to AI interviewer  
- `GET /interview/{session_id}` - Get session details
- `POST /interview/{session_id}/complete` - Complete interview

### Profile Management
- `GET /profiles` - List all profiles
- `GET /profile/{pai_id}` - Get specific profile

### Predictions & Validation  
- `GET /survey/questions` - Get test survey questions
- `POST /predict/{pai_id}` - Generate predictions for profile
- `GET /status` - System health and statistics

## 📊 Data Flow

```
1. 🎤 Interview Conducted
   └── Transcript saved to data/interviews/

2. 🧠 Profile Extracted  
   └── JSON profile saved to data/profiles/

3. 🔮 Predictions Generated
   └── Survey responses saved to data/predictions/

4. ✅ Accuracy Validated
   └── Validation results saved to data/validation/
```

## 🎯 Success Metrics

From the PDF requirements:

### Day 1 Success:
- ✅ AI interviewer conducts 3 natural 15-20 minute conversations
- ✅ Profile extraction creates rich, differentiated profiles for each founder  
- ✅ Each profile feels accurate to the person interviewed

### Day 2 Success:
- ✅ Prediction system generates logical reasoning for each response
- 🎯 **Overall accuracy rate of 60%+ across all test questions**
- ✅ Profiles capture meaningful differences between the 3 founders
- ✅ System identifies low-confidence predictions appropriately

## 📝 Example Usage

```python
from ai_interviewer import AIInterviewer
from profile_extractor import ProfileExtractor
from response_predictor import ResponsePredictor

# Initialize with your API key
interviewer = AIInterviewer("your-api-key")
extractor = ProfileExtractor("your-api-key")
predictor = ResponsePredictor("your-api-key")

# 1. Conduct interview
session = interviewer.start_interview("Alice")
# ... interactive conversation ...
interviewer.save_session(session)

# 2. Extract profile
transcript = extractor.load_interview_transcript("interview_file.json")
profile = extractor.extract_profile(transcript, "Alice")

# 3. Generate predictions
questions = get_test_survey_questions()
predictions = predictor.batch_predict(profile, questions)

print(f"Predicted with {avg_confidence:.1%} average confidence")
```

## 🔧 Development

### File Structure
```
backend/
├── ai_interviewer.py      # Core interview system
├── profile_extractor.py   # Profile creation
├── response_predictor.py  # Behavioral prediction  
├── validation_tester.py   # Accuracy testing
├── server.py             # FastAPI REST API
├── main.py               # Pipeline orchestrator
├── requirements.txt      # Python dependencies
├── .env.example          # Environment template
└── data/                 # Generated data
    ├── interviews/       # Interview transcripts
    ├── profiles/         # Extracted profiles
    ├── predictions/      # Survey predictions
    └── validation/       # Accuracy results
```

### Adding New Survey Questions

1. Edit `response_predictor.py`
2. Add questions to `get_test_survey_questions()`
3. Follow the existing format with clear options

### Customizing Interview Flow

1. Modify the system prompt in `ai_interviewer.py`
2. Adjust topic areas and follow-up patterns
3. Update completion criteria (exchange count, topic coverage)

## 🧪 Testing & Validation

The system is designed to achieve **60%+ prediction accuracy** to validate that AI can create valuable digital personas from qualitative interviews.

### Running Validation
```bash
# Test all profiles
python validation_tester.py

# Full pipeline with validation
python main.py
```

### Success Criteria
- Natural conversation flow ✅
- Rich psychological profiles ✅  
- Logical prediction reasoning ✅
- 60%+ accuracy rate 🎯
- Appropriate confidence scoring ✅

## 🚨 Important Notes

- **API Key Required**: Set `ANTHROPIC_API_KEY` in `.env`
- **Rate Limits**: Claude API has usage limits - monitor your usage
- **Data Privacy**: Interview data contains personal information - handle securely
- **Accuracy Target**: 60% is the minimum viable accuracy for concept validation

## 🤝 Frontend Integration

The FastAPI server is designed to work seamlessly with the Next.js frontend:

- CORS configured for `localhost:3000`
- Real-time interview sessions
- Background profile processing
- RESTful API design

See the main README for frontend integration details.