from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from urllib.parse import urlparse, parse_qs

# Add the lib directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from lib.ai_interviewer import AIInterviewer
from lib.profile_extractor import ProfileExtractor

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
        
        # Get questionnaire details if not default
        questionnaire_id = data.get('questionnaire_id', 'default')
        questionnaire_context = None
        initial_message = None
        
        print(f"DEBUG: Received questionnaire_id: {questionnaire_id}")
        print(f"DEBUG: Full data received: {data}")
        
        if questionnaire_id != 'default':
            # Load custom questionnaire from Supabase
            try:
                sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
                from lib.supabase import SupabaseClient
                supabase = SupabaseClient()
                questionnaire = supabase.get_custom_questionnaire(questionnaire_id)
                
                if questionnaire:
                    # Load the actual questions from the questionnaire
                    questions = supabase.get_questionnaire_questions(questionnaire_id)
                    title = questionnaire.get('title', 'Custom Questionnaire')
                    category = questionnaire.get('category', 'general')
                    description = questionnaire.get('description', '')
                    
                    print(f"DEBUG: Found questionnaire: {questionnaire}")
                    print(f"DEBUG: Loaded {len(questions)} questions")
                    
                    if questions:
                        # Prepare questionnaire context for AI interviewer
                        questionnaire_context = {
                            'title': title,
                            'category': category,
                            'description': description,
                            'questions': questions
                        }
                        
                        # Use the first question as the initial message
                        first_question = questions[0]
                        question_text = first_question.get('question_text', '')
                        help_text = first_question.get('help_text', '')
                        
                        if help_text:
                            initial_message = f"{question_text}\n\n{help_text}"
                        else:
                            initial_message = question_text
                            
                        print(f"DEBUG: Using first question as initial message: {initial_message}")
                    else:
                        # Fallback to category-based message if no questions
                        initial_message = f"Hi! Let's explore your thoughts about {category}. What role does {category} play in your life?"
                        print(f"DEBUG: No questions found, using category fallback: {initial_message}")
            except Exception as e:
                print(f"Error loading questionnaire {questionnaire_id}: {e}")
                # Fall back to default
                questionnaire_context = None
                initial_message = None
        
        # Initialize AI Interviewer with questionnaire context
        interviewer = AIInterviewer(api_key, questionnaire_context=questionnaire_context)
        
        # Start interview
        session = interviewer.start_interview(data.get('participant_name', 'User'))
        
        # Save session and questionnaire context for send-message.py to use
        import pickle
        session_file = f"/tmp/interview_session_{session.session_id}.pkl"
        session_data = {
            'session': session,
            'questionnaire_context': questionnaire_context
        }
        with open(session_file, 'wb') as f:
            pickle.dump(session_data, f)
        print(f"DEBUG: Saved session to {session_file}")
        
        # Format messages for frontend
        messages = []
        initial_ai_message = None
        
        if initial_message:
            # Use custom questionnaire message
            import uuid
            from datetime import datetime
            initial_ai_message = {
                'id': str(uuid.uuid4()),
                'type': 'ai',
                'content': initial_message,
                'timestamp': datetime.now().isoformat()
            }
            messages.append(initial_ai_message)
            print(f"DEBUG: Using custom initial message: {initial_message}")
        elif session.messages:
            # Use session messages from interviewer
            for msg in session.messages:
                message_data = {
                    'id': msg.id,
                    'type': msg.type,
                    'content': msg.content,
                    'timestamp': msg.timestamp.isoformat()
                }
                messages.append(message_data)
                if msg.type == 'ai' and not initial_ai_message:
                    initial_ai_message = message_data
            print(f"DEBUG: Using session messages: {len(session.messages)} messages")
        else:
            # Fallback to default skincare message
            import uuid
            from datetime import datetime
            default_message = "Hi! I'd love to understand your relationship with skincare. Tell me, is skincare something you think about a lot, or is it more just routine for you?"
            
            initial_ai_message = {
                'id': str(uuid.uuid4()),
                'type': 'ai',
                'content': default_message,
                'timestamp': datetime.now().isoformat()
            }
            messages.append(initial_ai_message)
            print(f"DEBUG: Using default skincare message")
        
        # Store initial AI message in Supabase for conversation history
        if initial_ai_message:
            try:
                from lib.supabase import SupabaseClient
                supabase = SupabaseClient()
                
                ai_message_data = {
                    'session_id': session.session_id,
                    'type': 'ai',
                    'content': initial_ai_message['content'],
                    'exchange_count': 0,
                    'timestamp': initial_ai_message['timestamp']
                }
                supabase.store_message(ai_message_data)
                print(f"DEBUG: Stored initial AI message for session {session.session_id}")
            except Exception as e:
                print(f"DEBUG: Error storing initial AI message: {e}")
        
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
                
                # Ensure person exists
                supabase.create_person(participant_name.lower())
                
                # Determine version number
                existing_profiles = supabase.get_person_profiles(participant_name.lower())
                version_number = len(existing_profiles) + 1
                if version_number > 1:
                    profile_id = f"{participant_name.lower()}_v{version_number}"
                
                # Prepare profile version data for Supabase
                profile_data = {
                    'profile_id': profile_id,
                    'person_name': participant_name.lower(),
                    'version_number': version_number,
                    'profile_data': profile_dict,
                    'is_active': True
                }
                
                # Try to insert or update
                existing_profile = supabase.get_profile_version(profile_id)
                if existing_profile:
                    supabase.update_profile_version(profile_id, profile_data)
                    action = 'updated'
                else:
                    supabase.insert_profile_version(profile_data)
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