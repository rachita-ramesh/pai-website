from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from urllib.parse import urlparse, parse_qs

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
            
            # Parse URL to determine operation
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            # Determine operation: start or complete
            operation = query_params.get('action', ['start'])[0]
            if 'complete' in self.path or operation == 'complete':
                return self._handle_complete_interview(data)
            else:
                return self._handle_start_interview(data)
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def _handle_start_interview(self, data):
        """Handle starting a new interview"""
        # Get API key from environment
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise Exception('ANTHROPIC_API_KEY environment variable is required')
        
        # Initialize AI Interviewer
        interviewer = AIInterviewer(api_key)
        
        # Start interview
        session = interviewer.start_interview(data.get('participant_name', 'User'))
        
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
                'content': "Hi! I'd love to understand your relationship with skincare. Tell me, is skincare something you think about a lot, or is it more just routine for you?",
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
        
        # Send response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        self.wfile.write(json.dumps(response).encode('utf-8'))
    
    def _handle_complete_interview(self, data):
        """Handle completing an interview and extracting profile"""
        # Get API key from environment
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise Exception('ANTHROPIC_API_KEY environment variable is required')
        
        # Initialize components
        interviewer = AIInterviewer(api_key)
        extractor = ProfileExtractor(api_key)
        
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
            profile = extractor.extract_profile(transcript, participant_name)
            
            # Save profile to Supabase
            try:
                # Import Supabase client
                import sys
                import os
                sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
                from lib.supabase import SupabaseClient
                
                supabase = SupabaseClient()
                profile_dict = profile.dict() if hasattr(profile, 'dict') else profile
                profile_id = f"{participant_name.lower()}_v1"
                
                # Prepare data for Supabase
                profile_data = {
                    'profile_id': profile_id,
                    'participant_name': participant_name,
                    'profile_data': profile_dict
                }
                
                # Try to insert or update
                existing_profile = supabase.get_profile(profile_id)
                if existing_profile:
                    supabase.update_profile(profile_id, profile_data)
                    action = 'updated'
                else:
                    supabase.insert_profile(profile_data)
                    action = 'created'
                
                response_data = {
                    'message': f'Interview completed and profile {action}',
                    'profile_created': True,
                    'profile_id': profile_id,
                    'action': action,
                    'storage': 'supabase'
                }
                
            except Exception as save_error:
                # Fallback to temporary storage if Supabase fails
                import os
                import json
                os.makedirs('/tmp/profiles', exist_ok=True)
                profile_file = f"/tmp/profiles/{participant_name.lower()}_v1_profile.json"
                
                try:
                    profile_dict = profile.dict() if hasattr(profile, 'dict') else profile
                    with open(profile_file, 'w') as f:
                        json.dump(profile_dict, f, indent=2)
                    
                    response_data = {
                        'message': f'Profile saved to fallback storage (Supabase failed: {str(save_error)})',
                        'profile_created': True,
                        'profile_id': f"{participant_name.lower()}_v1",
                        'storage': 'tmp_fallback',
                        'supabase_error': str(save_error)
                    }
                except Exception as fallback_error:
                    response_data = {
                        'message': f'Profile extraction failed: Supabase error: {str(save_error)}, Fallback error: {str(fallback_error)}',
                        'profile_created': False,
                        'error': str(save_error)
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
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()