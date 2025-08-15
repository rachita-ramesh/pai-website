from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import pickle
from datetime import datetime

# Add the lib directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from lib.ai_interviewer import AIInterviewer, InterviewSession

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Get session data
            session_id = data.get('session_id')
            message = data.get('message', '')
            exchange_count = data.get('exchange_count', 0)
            
            print(f"DEBUG: Processing message for session {session_id}")
            print(f"DEBUG: Message: {message}")
            print(f"DEBUG: Exchange count: {exchange_count}")
            
            # Get API key from environment
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                raise Exception('ANTHROPIC_API_KEY environment variable is required')
            
            # Load the session from temporary storage
            session_file = f"/tmp/interview_session_{session_id}.pkl"
            questionnaire_context = None
            
            try:
                with open(session_file, 'rb') as f:
                    session_data = pickle.load(f)
                    session = session_data['session']
                    questionnaire_context = session_data.get('questionnaire_context')
                    print(f"DEBUG: Loaded session with {len(session.messages)} messages")
            except FileNotFoundError:
                print(f"DEBUG: Session file not found, creating new session")
                # Create a minimal session if not found
                session = InterviewSession(
                    session_id=session_id,
                    participant_name="User",
                    messages=[],
                    start_time=datetime.now(),
                    current_topic="interview",
                    exchange_count=0,
                    is_complete=False
                )
            
            # Initialize AI Interviewer with questionnaire context
            interviewer = AIInterviewer(api_key, questionnaire_context=questionnaire_context)
            
            # Get AI response with full conversation context
            ai_response = interviewer.get_ai_response(session, message)
            
            # Update session with new exchange
            updated_session = interviewer.update_session(session, message, ai_response)
            
            # Save updated session
            session_data = {
                'session': updated_session,
                'questionnaire_context': questionnaire_context
            }
            with open(session_file, 'wb') as f:
                pickle.dump(session_data, f)
                
            print(f"DEBUG: Updated session, now has {len(updated_session.messages)} messages")
            
            # Clean up markdown formatting for plain text display
            ai_response = ai_response.replace('*', '').replace('**', '').replace('_', '')
            
            print(f"DEBUG: Generated AI response: {ai_response[:100]}...")
            
            # Send response with explicit headers
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            
            response = {
                'session_id': session_id,
                'ai_response': ai_response,
                'exchange_count': updated_session.exchange_count,
                'is_complete': updated_session.is_complete
            }
            
            response_json = json.dumps(response)
            self.wfile.write(response_json.encode('utf-8'))
            
        except Exception as e:
            print(f"DEBUG: Exception occurred: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {'error': str(e)}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()