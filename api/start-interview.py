from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from ai_interviewer import AIInterviewer

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Initialize AI Interviewer
            interviewer = AIInterviewer()
            
            # Start interview
            session = interviewer.start_interview(data.get('participant_name', 'User'))
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            # Format messages for frontend
            messages = []
            if session.messages:
                for msg in session.messages:
                    messages.append({
                        'id': msg.id,
                        'type': msg.type,
                        'content': msg.content,
                        'timestamp': msg.timestamp.isoformat()
                    })
            else:
                # Add initial AI greeting message
                import uuid
                from datetime import datetime
                messages.append({
                    'id': str(uuid.uuid4()),
                    'type': 'ai',
                    'content': "Hello! Let's begin our conversation about skincare.",
                    'timestamp': datetime.now().isoformat()
                })
            
            response = {
                'session_id': session.session_id,
                'participant_name': session.participant_name,
                'messages': messages,
                'start_time': session.start_time.isoformat(),
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