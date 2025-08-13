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
            
            # Initialize AI Interviewer
            interviewer = AIInterviewer()
            
            # Get or create session
            if session_id not in active_sessions:
                # Create new session
                session = interviewer.start_interview(data.get('participant_name', 'User'))
                active_sessions[session_id] = session
            else:
                session = active_sessions[session_id]
            
            # Get AI response
            ai_response = interviewer.get_response(message, session)
            
            # Update session
            active_sessions[session_id] = session
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                'session_id': session.session_id,
                'ai_message': ai_response,
                'exchange_count': session.exchange_count,
                'is_complete': session.is_complete,
                'current_topic': session.current_topic
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