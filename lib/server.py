"""
FastAPI Server for Pai Backend
Provides REST API endpoints for the frontend to connect to
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Import our modules
from .ai_interviewer import AIInterviewer, InterviewSession, InterviewMessage
from .profile_extractor import ProfileExtractor, PaiProfile
from .response_predictor import ResponsePredictor, SurveyQuestion, get_test_survey_questions
from .validation_tester import ValidationTester

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Pai Backend API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI components
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    raise RuntimeError("ANTHROPIC_API_KEY environment variable is required")

interviewer = AIInterviewer(api_key)
extractor = ProfileExtractor(api_key)
predictor = ResponsePredictor(api_key)
validator = ValidationTester(api_key)

# Global session storage (in production, use proper database)
active_sessions: Dict[str, InterviewSession] = {}


def _get_digital_twin_version(profile_id: str) -> str:
    """Get simple version number for digital twin (e.g. rachita_v1)"""
    try:
        # If profile_id already contains version (e.g., rachita_v1), return it directly
        if '_v' in profile_id:
            return profile_id
        
        profile_path = f"data/profiles/{profile_id}_profile.json"
        if os.path.exists(profile_path):
            with open(profile_path, 'r') as f:
                profile_data = json.load(f)
            
            # Check if pai_id contains version info
            pai_id = profile_data.get("pai_id", profile_id)
            if '_v' in pai_id:
                return pai_id
            
            # Default to v1 for profiles without version
            base_name = profile_id.split('_')[0] if '_' in profile_id else profile_id
            return f"{base_name}_v1"
        else:
            # Extract base name and default to v1
            base_name = profile_id.split('_')[0] if '_' in profile_id else profile_id
            return f"{base_name}_v1"
            
    except Exception as e:
        print(f"Error getting digital twin version: {e}")
        # Extract base name (e.g., "rachita" from "rachita_v1" or "rachita_20250809")
        base_name = profile_id.split('_')[0] if '_' in profile_id else profile_id
        return f"{base_name}_v1"


# Request/Response models
class StartInterviewRequest(BaseModel):
    participant_name: str


class SendMessageRequest(BaseModel):
    session_id: str
    message: str


class ChatMessageRequest(BaseModel):
    profile_id: str
    message: str


class ValidationRequest(BaseModel):
    profile_id: str


class ValidationResponseRequest(BaseModel):
    profile_id: str
    question_id: str
    human_answer: str


class SaveValidationResultsRequest(BaseModel):
    profile_id: str
    test_session_id: str
    comparisons: List[Dict[str, Any]]
    accuracy_percentage: int
    total_questions: int
    correct_answers: int
    model_version: Optional[str] = None
    digital_twin_version: Optional[str] = None


class InterviewResponse(BaseModel):
    session_id: str
    participant_name: str
    messages: List[Dict[str, Any]]
    exchange_count: int
    is_complete: bool
    start_time: str


class MessageResponse(BaseModel):
    ai_response: str
    exchange_count: int
    is_complete: bool


# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Pai Backend API is running", "version": "1.0.0"}


@app.post("/interview/start", response_model=InterviewResponse)
async def start_interview(request: StartInterviewRequest):
    """Start a new interview session"""
    try:
        session = interviewer.start_interview(request.participant_name)
        active_sessions[session.session_id] = session
        
        return InterviewResponse(
            session_id=session.session_id,
            participant_name=session.participant_name,
            messages=[{
                "id": msg.id,
                "type": msg.type,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat()
            } for msg in session.messages],
            exchange_count=session.exchange_count,
            is_complete=session.is_complete,
            start_time=session.start_time.isoformat()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


@app.post("/interview/message", response_model=MessageResponse)
async def send_message(request: SendMessageRequest):
    """Send a message to the AI interviewer"""
    try:
        if request.session_id not in active_sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        session = active_sessions[request.session_id]
        
        if session.is_complete:
            raise HTTPException(status_code=400, detail="Interview is already complete")
        
        # Get AI response
        ai_response = interviewer.get_ai_response(session, request.message)
        
        # Update session
        updated_session = interviewer.update_session(session, request.message, ai_response)
        active_sessions[request.session_id] = updated_session
        
        return MessageResponse(
            ai_response=ai_response,
            exchange_count=updated_session.exchange_count,
            is_complete=updated_session.is_complete
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")


@app.get("/interview/{session_id}", response_model=InterviewResponse)
async def get_interview(session_id: str):
    """Get interview session details"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    return InterviewResponse(
        session_id=session.session_id,
        participant_name=session.participant_name,
        messages=[{
            "id": msg.id,
            "type": msg.type,
            "content": msg.content,
            "timestamp": msg.timestamp.isoformat()
        } for msg in session.messages],
        exchange_count=session.exchange_count,
        is_complete=session.is_complete,
        start_time=session.start_time.isoformat()
    )


@app.post("/interview/{session_id}/complete")
async def complete_interview(session_id: str, background_tasks: BackgroundTasks):
    """Complete an interview and trigger profile extraction"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    try:
        # Save interview session
        interview_file = interviewer.save_session(session)
        
        # Trigger background profile extraction
        background_tasks.add_task(extract_profile_background, interview_file, session.participant_name)
        
        return {
            "message": "Interview completed",
            "interview_file": interview_file,
            "profile_extraction": "started"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete interview: {str(e)}")


async def extract_profile_background(interview_file: str, participant_name: str):
    """Background task to extract profile from interview"""
    try:
        # Load transcript and extract profile
        transcript = extractor.load_interview_transcript(interview_file)
        profile = extractor.extract_profile(transcript, participant_name)
        
        # Save profile
        profile_file = extractor.save_profile(profile)
        
        print(f"Profile extracted and saved to: {profile_file}")
        
    except Exception as e:
        print(f"Background profile extraction failed: {e}")


@app.get("/survey/questions")
async def get_survey_questions():
    """Get the test survey questions"""
    questions = get_test_survey_questions()
    return {"questions": [q.dict() for q in questions]}


@app.post("/predict/{pai_id}")
async def predict_responses(pai_id: str):
    """Predict survey responses for a profile"""
    profiles_dir = "data/profiles"
    profile_file = f"{pai_id}_profile.json"
    filepath = os.path.join(profiles_dir, profile_file)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Profile not found")
    
    try:
        # Load profile and questions
        profile = extractor.load_profile(filepath)
        questions = get_test_survey_questions()
        
        # Generate predictions
        predictions = predictor.batch_predict(profile, questions)
        
        # Save predictions
        predictions_file = predictor.save_predictions(predictions, pai_id)
        
        return {
            "predictions": [p.dict() for p in predictions],
            "file": predictions_file,
            "avg_confidence": sum(p.confidence for p in predictions) / len(predictions)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to predict responses: {str(e)}")


@app.post("/interview/force-complete/{session_id}")
async def force_complete_interview(session_id: str, background_tasks: BackgroundTasks):
    """Force complete any interview session and trigger profile extraction"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = active_sessions[session_id]
    
    try:
        # Mark as complete regardless of exchange count
        session.is_complete = True
        
        # Save interview session
        interview_file = interviewer.save_session(session)
        
        # Trigger background profile extraction
        background_tasks.add_task(extract_profile_background, interview_file, session.participant_name)
        
        return {
            "message": "Interview force completed",
            "interview_file": interview_file,
            "exchange_count": session.exchange_count,
            "profile_extraction": "started"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete interview: {str(e)}")


@app.post("/chat/message")
async def chat_with_digital_twin(request: ChatMessageRequest):
    """Chat with a digital twin using their extracted profile"""
    try:
        # Load the profile
        profile_path = f"data/profiles/{request.profile_id}_profile.json"
        if not os.path.exists(profile_path):
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile = extractor.load_profile(profile_path)
        
        # Create a survey question from the user's message  
        # This converts any question into a structured format for prediction
        from response_predictor import SurveyQuestion
        
        # Determine response options based on message type
        if "skincare" in request.message.lower():
            options = [
                "I'd approach this with a simple, research-backed solution",
                "I'd ask friends who know about skincare for advice",
                "I'd focus on the wellness and health aspects",
                "I'd keep it minimal but effective"
            ]
        elif "decision" in request.message.lower() or "choose" in request.message.lower():
            options = [
                "I'd gather information and trust friend recommendations",
                "I'd focus on long-term health benefits",
                "I'd choose the simplest effective option",
                "I'd balance convenience with results"
            ]
        else:
            options = [
                "I'd take a holistic, health-focused approach",
                "I'd keep things simple and efficient", 
                "I'd rely on trusted friend recommendations",
                "I'd focus on long-term wellness benefits"
            ]
        
        question = SurveyQuestion(
            id="chat_question",
            category="General",
            question=request.message,
            options=options
        )
        
        # Get prediction from digital twin
        prediction = predictor.predict_response(profile, question)
        
        # Convert prediction to conversational response
        response_text = f"{prediction.predicted_answer}. {prediction.reasoning[:200]}..."
        
        return {
            "response": response_text,
            "confidence": prediction.confidence
        }
        
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate response: {str(e)}")


@app.get("/sessions")
async def get_active_sessions():
    """Get all active session IDs and their details"""
    return {
        session_id: {
            "participant_name": session.participant_name,
            "exchange_count": session.exchange_count,
            "start_time": session.start_time,
            "is_complete": session.is_complete
        }
        for session_id, session in active_sessions.items()
    }


@app.get("/validation/survey")
async def get_validation_survey():
    """Get the validation survey questions"""
    try:
        survey_path = "data/validation_survey.json"
        if not os.path.exists(survey_path):
            raise HTTPException(status_code=404, detail="Validation survey not found")
        
        with open(survey_path, 'r') as f:
            survey = json.load(f)
        
        return survey
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load survey: {str(e)}")


@app.post("/validation/predict")
async def predict_validation_responses(request: ValidationRequest):
    """Get digital twin predictions for all validation questions"""
    try:
        # Load the profile
        profile_path = f"data/profiles/{request.profile_id}_profile.json"
        if not os.path.exists(profile_path):
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile = extractor.load_profile(profile_path)
        
        # Load validation survey
        with open("data/validation_survey.json", 'r') as f:
            survey = json.load(f)
        
        # Generate predictions for each question
        predictions = []
        for q in survey["questions"]:
            from response_predictor import SurveyQuestion
            question = SurveyQuestion(
                id=q["id"],
                category=q["category"],
                question=q["question"],
                options=q["options"]
            )
            
            prediction = predictor.predict_response(profile, question)
            predictions.append({
                "question_id": q["id"],
                "question": q["question"],
                "category": q["category"],
                "options": q["options"],
                "predicted_answer": prediction.predicted_answer,
                "confidence": prediction.confidence,
                "reasoning": prediction.reasoning
            })
        
        return {
            "profile_id": request.profile_id,
            "survey_title": survey["survey_title"],
            "predictions": predictions,
            "total_questions": len(predictions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate predictions: {str(e)}")


@app.post("/validation/compare")
async def compare_responses(request: ValidationResponseRequest):
    """Compare human response to digital twin prediction for accuracy"""
    try:
        # Load the profile
        profile_path = f"data/profiles/{request.profile_id}_profile.json"
        if not os.path.exists(profile_path):
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile = extractor.load_profile(profile_path)
        
        # Load validation survey to find the specific question
        with open("data/validation_survey.json", 'r') as f:
            survey = json.load(f)
        
        question_data = None
        for q in survey["questions"]:
            if q["id"] == request.question_id:
                question_data = q
                break
        
        if not question_data:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Generate digital twin prediction
        from response_predictor import SurveyQuestion
        question = SurveyQuestion(
            id=question_data["id"],
            category=question_data["category"],
            question=question_data["question"],
            options=question_data["options"]
        )
        
        prediction = predictor.predict_response(profile, question)
        
        # Compare responses
        is_match = request.human_answer.strip() == prediction.predicted_answer.strip()
        
        return {
            "question_id": request.question_id,
            "human_answer": request.human_answer,
            "predicted_answer": prediction.predicted_answer,
            "is_match": is_match,
            "confidence": prediction.confidence,
            "reasoning": prediction.reasoning
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compare responses: {str(e)}")


@app.post("/validation/save-results")
async def save_validation_results(request: SaveValidationResultsRequest):
    """Save complete validation test results"""
    try:
        # Create results directory if it doesn't exist
        results_dir = "data/validation_results"
        os.makedirs(results_dir, exist_ok=True)
        
        # Create results object
        results = {
            "profile_id": request.profile_id,
            "test_session_id": request.test_session_id,
            "timestamp": datetime.now().isoformat(),
            "accuracy_percentage": request.accuracy_percentage,
            "total_questions": request.total_questions,
            "correct_answers": request.correct_answers,
            "model_version": request.model_version or "claude-3-5-sonnet-20241022",
            "digital_twin_version": _get_digital_twin_version(request.profile_id),
            "comparisons": request.comparisons,
            "test_completed": True
        }
        
        # Save results file
        results_file = f"{results_dir}/{request.profile_id}_{request.test_session_id}_results.json"
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        return {
            "message": "Results saved successfully",
            "file_path": results_file,
            "accuracy": request.accuracy_percentage
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save results: {str(e)}")


@app.get("/validation/results/history")
async def get_validation_history():
    """Get all validation test results across all profiles"""
    try:
        results_dir = "data/validation_results"
        
        if not os.path.exists(results_dir):
            return {
                "status": "no_tests_completed",
                "results": [],
                "message": "No validation tests have been completed yet"
            }
        
        # Find all result files
        result_files = [f for f in os.listdir(results_dir) if f.endswith("_results.json")]
        
        if not result_files:
            return {
                "status": "no_tests_completed",
                "results": [],
                "message": "No validation tests have been completed yet"
            }
        
        # Load all results with summary info
        results = []
        for filename in sorted(result_files, reverse=True):  # Most recent first
            filepath = os.path.join(results_dir, filename)
            try:
                with open(filepath, 'r') as f:
                    result_data = json.load(f)
                
                # Add summary info
                results.append({
                    "filename": filename,
                    "profile_id": result_data.get("profile_id"),
                    "digital_twin_version": result_data.get("digital_twin_version"), 
                    "model_version": result_data.get("model_version"),
                    "accuracy_percentage": result_data.get("accuracy_percentage"),
                    "total_questions": result_data.get("total_questions"),
                    "correct_answers": result_data.get("correct_answers"),
                    "timestamp": result_data.get("timestamp"),
                    "test_session_id": result_data.get("test_session_id")
                })
            except Exception as e:
                print(f"Error loading result file {filename}: {e}")
                continue
        
        return {
            "status": "success",
            "total_tests": len(results),
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get validation history: {str(e)}")


@app.get("/validation/results/{profile_id}")
async def get_validation_results(profile_id: str):
    """Get overall validation test results for a profile"""
    try:
        results_dir = "data/validation_results"
        
        if not os.path.exists(results_dir):
            return {
                "profile_id": profile_id,
                "status": "no_tests_completed",
                "message": "No validation tests have been completed yet"
            }
        
        # Find all result files for this profile
        result_files = [f for f in os.listdir(results_dir) 
                       if f.startswith(f"{profile_id}_") and f.endswith("_results.json")]
        
        if not result_files:
            return {
                "profile_id": profile_id,
                "status": "no_tests_completed", 
                "message": "No validation tests have been completed yet"
            }
        
        # Load the most recent results
        most_recent_file = sorted(result_files)[-1]
        results_path = os.path.join(results_dir, most_recent_file)
        
        with open(results_path, 'r') as f:
            results = json.load(f)
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get results: {str(e)}")


@app.get("/validation/results/detail/{test_session_id}")
async def get_detailed_validation_results(test_session_id: str):
    """Get detailed validation results for a specific test session"""
    try:
        results_dir = "data/validation_results"
        
        if not os.path.exists(results_dir):
            raise HTTPException(status_code=404, detail="No validation results found")
        
        # Find the result file by test session ID
        result_files = [f for f in os.listdir(results_dir) 
                       if test_session_id in f and f.endswith("_results.json")]
        
        if not result_files:
            raise HTTPException(status_code=404, detail="Test session results not found")
        
        # Load the detailed results
        results_path = os.path.join(results_dir, result_files[0])
        with open(results_path, 'r') as f:
            results = json.load(f)
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get detailed results: {str(e)}")


@app.get("/status")
async def get_system_status():
    """Get system status and statistics"""
    try:
        # Count files in different directories
        interviews_count = len([f for f in os.listdir("data/interviews")] if os.path.exists("data/interviews") else [])
        profiles_count = len([f for f in os.listdir("data/profiles")] if os.path.exists("data/profiles") else [])
        predictions_count = len([f for f in os.listdir("data/predictions")] if os.path.exists("data/predictions") else [])
        
        return {
            "status": "healthy",
            "active_sessions": len(active_sessions),
            "interviews_completed": interviews_count,
            "profiles_created": profiles_count,
            "predictions_generated": predictions_count,
            "api_key_configured": bool(api_key),
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


# Run the server
if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    
    print("🚀 Starting Pai Backend Server")
    print(f"📍 Server will be available at: http://localhost:{port}")
    print(f"📖 API docs available at: http://localhost:{port}/docs")
    print(f"🔑 API key configured: {'✅' if api_key else '❌'}")
    
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )