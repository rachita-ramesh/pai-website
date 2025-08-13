from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from ai_interviewer import AIInterviewer

# Global storage for sessions (in production, use a database)
active_sessions = {}

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Get session data
            session_id = data.get('session_id')
            message = data.get('message', '')
            
            # Get API key from environment
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                raise Exception('ANTHROPIC_API_KEY environment variable is required')
            
            # Initialize AI Interviewer
            interviewer = AIInterviewer(api_key)
            
            # Get or create session
            if session_id not in active_sessions:
                # Create new session
                session = interviewer.start_interview(data.get('participant_name', 'User'))
                active_sessions[session_id] = session
            else:
                session = active_sessions[session_id]
            
            # Get AI response
            ai_response = interviewer.get_ai_response(session, message)
            
            # Update session with the new message exchange
            updated_session = interviewer.update_session(session, message, ai_response)
            active_sessions[session_id] = updated_session
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                'session_id': updated_session.session_id,
                'ai_response': ai_response,
                'exchange_count': updated_session.exchange_count,
                'is_complete': updated_session.is_complete,
                'current_topic': updated_session.current_topic
            }
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()