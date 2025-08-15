from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from urllib.parse import urlparse, parse_qs

# Add the lib directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from lib.ai_interviewer import AIInterviewer

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse URL to determine if this is a status request
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            if 'status' in query_params or 'status' in self.path:
                return self._handle_status()
            else:
                # Default GET behavior for chat (if any)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'Chat endpoint ready'}).encode('utf-8'))
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def _handle_status(self):
        """Handle status requests"""
        try:
            # Check if profiles exist
            profiles_dir = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'profiles')
            profiles_created = 0
            
            if os.path.exists(profiles_dir):
                profiles_created = len([f for f in os.listdir(profiles_dir) if f.endswith('.json')])
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                'status': 'running',
                'profiles_created': profiles_created,
                'active_sessions': 0,
                'total_interviews': 0
            }
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Get API key from environment
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                raise Exception('ANTHROPIC_API_KEY environment variable is required')
            
            # Initialize AI Interviewer
            interviewer = AIInterviewer(api_key)
            
            # Get response from AI
            response = interviewer.get_response(
                data.get('message', ''),
                data.get('context', {}),
                data.get('interview_stage', 'greeting')
            )
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
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