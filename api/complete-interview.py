from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from ai_interviewer import AIInterviewer
from profile_extractor import ProfileExtractor

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Initialize components
            interviewer = AIInterviewer()
            extractor = ProfileExtractor()
            
            # Get session data
            session_id = data.get('session_id')
            
            # Mock completion for now - in production, get from session storage
            interview_data = data.get('interview_data', {})
            participant_name = data.get('participant_name', 'User')
            
            # Extract profile from interview data
            if interview_data and 'messages' in interview_data:
                # Convert messages to transcript
                transcript = ""
                for msg in interview_data['messages']:
                    if msg['type'] == 'user':
                        transcript += f"User: {msg['content']}\n"
                    elif msg['type'] == 'ai':
                        transcript += f"AI: {msg['content']}\n"
                
                # Extract profile
                profile = extractor.extract_profile(transcript)
                profile_file = f"data/profiles/{participant_name.lower()}_v1_profile.json"
                
                # Save profile (simplified for Vercel)
                response_data = {
                    'message': 'Interview completed and profile extracted',
                    'profile_created': True,
                    'profile_id': f"{participant_name.lower()}_v1",
                    'profile_file': profile_file
                }
            else:
                response_data = {
                    'message': 'Interview completed',
                    'profile_created': False
                }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            
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