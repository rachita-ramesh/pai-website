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
            
            # Create a minimal session for this request (since Vercel functions are stateless)
            from ai_interviewer import InterviewSession, InterviewMessage
            from datetime import datetime
            
            # Create a basic session structure
            session = InterviewSession(
                session_id=session_id,
                participant_name=data.get('participant_name', 'User'),
                messages=[],  # We'll build conversation history from context if needed
                start_time=datetime.now(),
                current_topic="skincare_conversation",
                exchange_count=data.get('exchange_count', 0),
                is_complete=False
            )
            
            # Get AI response directly using Claude API
            try:
                import anthropic
                client = anthropic.Anthropic(api_key=api_key)
                
                # Create a simple conversation context
                conversation_messages = [{"role": "user", "content": message}]
                
                response = client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=300,  # Further reduced for faster response
                    temperature=0.7,
                    system="You are a friendly AI skincare interviewer. Ask thoughtful follow-up questions about skincare habits, routines, and preferences. Keep responses brief and conversational.",
                    messages=conversation_messages,
                    timeout=20.0  # Reduced timeout to 20 seconds
                )
                
                ai_response = response.content[0].text
                
            except anthropic.APITimeoutError as e:
                raise Exception(f"API timeout - please try again: {str(e)}")
            except anthropic.APIConnectionError as e:
                raise Exception(f"Connection error - check your internet: {str(e)}")
            except anthropic.RateLimitError as e:
                raise Exception(f"Rate limit reached - please wait a moment: {str(e)}")
            except Exception as e:
                raise Exception(f"AI service error: {str(e)}")
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                'session_id': session_id,
                'ai_response': ai_response,
                'exchange_count': data.get('exchange_count', 0) + 1,
                'is_complete': False,
                'current_topic': 'skincare_conversation'
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