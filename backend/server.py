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
from ai_interviewer import AIInterviewer, InterviewSession, InterviewMessage
from profile_extractor import ProfileExtractor, PaiProfile
from response_predictor import ResponsePredictor, SurveyQuestion, get_test_survey_questions
from validation_tester import ValidationTester

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


# Request/Response models
class StartInterviewRequest(BaseModel):
    participant_name: str


class SendMessageRequest(BaseModel):
    session_id: str
    message: str


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


@app.get("/profiles")
async def list_profiles():
    """List all available profiles"""
    profiles_dir = "data/profiles"
    
    if not os.path.exists(profiles_dir):
        return {"profiles": []}
    
    profile_files = [f for f in os.listdir(profiles_dir) if f.endswith('_profile.json')]
    profiles = []
    
    for filename in profile_files:
        filepath = os.path.join(profiles_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                profile_data = json.load(f)
            
            profiles.append({
                "pai_id": profile_data.get("pai_id"),
                "filename": filename,
                "created": os.path.getmtime(filepath)
            })
        except Exception as e:
            print(f"Error loading profile {filename}: {e}")
            continue
    
    return {"profiles": profiles}


@app.get("/profile/{pai_id}")
async def get_profile(pai_id: str):
    """Get a specific profile by ID"""
    profiles_dir = "data/profiles"
    profile_file = f"{pai_id}_profile.json"
    filepath = os.path.join(profiles_dir, profile_file)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Profile not found")
    
    try:
        profile = extractor.load_profile(filepath)
        return profile.dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load profile: {str(e)}")


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