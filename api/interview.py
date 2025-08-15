from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from urllib.parse import urlparse, parse_qs

# Add the lib directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from lib.ai_interviewer import AIInterviewer

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Parse URL to determine operation
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            # Determine operation: start, continue, or complete
            operation = query_params.get('action', ['start'])[0]
            if 'complete' in self.path or operation == 'complete':
                return self._handle_complete_interview(data)
            elif data.get('message'):  # If there's a message, this is a continuation
                return self._handle_continue_interview(data)
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
                    # Questions are stored in the questionnaire JSONB field, not a separate table
                    questions = questionnaire.get('questions', [])
                    title = questionnaire.get('title', 'Custom Questionnaire')
                    category = questionnaire.get('category', 'general')
                    description = questionnaire.get('description', '')
                    
                    print(f"DEBUG: Found questionnaire: {questionnaire}")
                    print(f"DEBUG: Loaded {len(questions)} questions")
                    
                    if questions:
                        # Calculate target interview length (number of questions + 3 additional questions)
                        target_questions = len(questions) + 3
                        print(f"DEBUG: Target interview questions: {target_questions} (base questions: {len(questions)} + 3 additional)")
                        
                        # Prepare questionnaire context for AI interviewer
                        questionnaire_context = {
                            'title': title,
                            'category': category,
                            'description': description,
                            'questions': questions,
                            'target_questions': target_questions
                        }
                        
                        # Use the first question as the initial message
                        first_question = questions[0]
                        # Try both 'text' and 'question_text' properties
                        question_text = first_question.get('text') or first_question.get('question_text', '')
                        help_text = first_question.get('helpText') or first_question.get('help_text', '')
                        
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
        
        # Get participant name from request
        participant_name = data.get('participant_name', 'User')
        
        # Start interview
        session = interviewer.start_interview(participant_name)
        
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
                
                # Create person if doesn't exist
                person = supabase.get_person(participant_name)
                if not person:
                    supabase.create_person(participant_name)
                    print(f"DEBUG: Created new person: {participant_name}")
                
                # Create interview session record
                interview_session_data = {
                    'session_id': session.session_id,
                    'person_name': participant_name,
                    'transcript': f"AI: {initial_ai_message['content']}",
                    'messages': [initial_ai_message],
                    'exchange_count': 0,
                    'is_complete': False,
                    'profile_id': None,  # Will be set when profile is created
                    'created_at': session.start_time.isoformat(),
                    'completed_at': None
                }
                supabase.create_interview_session(interview_session_data)
                print(f"DEBUG: Created interview session record for {session.session_id}")
                
            except Exception as e:
                print(f"DEBUG: Error storing initial interview data: {e}")
        
        # Get target questions from questionnaire context
        target_questions = 20  # Default for skincare interviews
        if questionnaire_context and 'target_questions' in questionnaire_context:
            target_questions = questionnaire_context['target_questions']
        
        response = {
            'session_id': session.session_id,
            'participant_name': session.participant_name,
            'messages': messages,
            'start_time': session.start_time.isoformat(),
            'exchange_count': session.exchange_count,
            'is_complete': session.is_complete,
            'current_topic': session.current_topic,
            'target_questions': target_questions,
            'questionnaire_id': questionnaire_id
        }
        
        # Send response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        self.wfile.write(json.dumps(response).encode('utf-8'))
    
    def _handle_continue_interview(self, data):
        """Handle continuing an interview conversation"""
        # Get API key from environment
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise Exception('ANTHROPIC_API_KEY environment variable is required')
        
        # Get data from request
        session_id = data.get('session_id')
        message = data.get('message', '')
        exchange_count = data.get('exchange_count', 0)
        questionnaire_id = data.get('questionnaire_id', 'default')
        
        print(f"DEBUG: Continuing interview - Session: {session_id}, Message: {message}")
        
        # Load questionnaire context
        questionnaire_context = None
        try:
            if questionnaire_id != 'default':
                from lib.supabase import SupabaseClient
                supabase = SupabaseClient()
                questionnaire = supabase.get_custom_questionnaire(questionnaire_id)
                
                if questionnaire:
                    # Questions are stored in the questionnaire JSONB field, not a separate table
                    questions = questionnaire.get('questions', [])
                    questionnaire_context = {
                        'title': questionnaire.get('title', 'Custom Questionnaire'),
                        'category': questionnaire.get('category', 'general'),
                        'description': questionnaire.get('description', ''),
                        'questions': questions,
                        'target_questions': len(questions) + 3
                    }
                    print(f"DEBUG: Loaded questionnaire context for {questionnaire_context['category']}")
        except Exception as e:
            print(f"DEBUG: Error loading questionnaire context: {e}")
            questionnaire_context = None
        
        # SIMPLE: Just get the next question from the questionnaire
        ai_response = "Thank you for sharing that!"
        
        if questionnaire_context and 'questions' in questionnaire_context:
            questions = questionnaire_context['questions']
            
            # Use exchange_count to determine which question to ask
            # exchange_count represents how many user-AI exchanges have happened
            # If exchange_count = 1, we should ask question[1] (second question)
            
            print(f"DEBUG: Available questions: {len(questions)}")
            print(f"DEBUG: Current exchange_count: {exchange_count}")
            
            # Print all questions for debugging
            for i, q in enumerate(questions):
                print(f"DEBUG: Question {i}: {q.get('text', 'NO TEXT')}")
            
            # If we haven't asked all the questionnaire questions yet, ask the next one
            if exchange_count < len(questions):
                next_question = questions[exchange_count]
                ai_response = next_question.get('text') or next_question.get('question_text', 'Tell me more')
                print(f"DEBUG: Exchange {exchange_count}, asking question {exchange_count + 1}: {ai_response}")
            else:
                # All questionnaire questions asked, generate simple follow-up
                ai_response = "Thank you for sharing all of that! Is there anything else you'd like to tell me about this topic?"
                print(f"DEBUG: All questionnaire questions asked, using generic follow-up")
        
        # Store the conversation messages in Supabase
        try:
            from datetime import datetime
            # Store user message
            user_message_data = {
                'session_id': session_id,
                'type': 'user',
                'content': message,
                'exchange_count': exchange_count,
                'timestamp': datetime.now().isoformat()
            }
            supabase.store_message(user_message_data)
            
            # Store AI response
            ai_message_data = {
                'session_id': session_id,
                'type': 'ai',
                'content': ai_response,
                'exchange_count': exchange_count + 1,
                'timestamp': datetime.now().isoformat()
            }
            supabase.store_message(ai_message_data)
            
            print(f"DEBUG: Stored conversation messages for session {session_id}")
            
            # Update interview session with new messages and transcript
            try:
                # Get all messages for this session to build complete transcript
                all_messages = supabase.get_session_messages(session_id, limit=100)
                
                # Build transcript
                transcript_lines = []
                for msg in all_messages:
                    speaker = "User" if msg.get('type') == 'user' else "AI"
                    transcript_lines.append(f"{speaker}: {msg.get('content', '')}")
                transcript = "\n\n".join(transcript_lines)
                
                # Determine completion status
                target_questions = 15  # Default
                if questionnaire_context and 'target_questions' in questionnaire_context:
                    target_questions = questionnaire_context['target_questions']
                
                new_exchange_count = exchange_count + 1
                is_complete = new_exchange_count >= target_questions
                
                # Update interview session
                session_updates = {
                    'transcript': transcript,
                    'messages': all_messages,
                    'exchange_count': new_exchange_count,
                    'is_complete': is_complete,
                    'completed_at': datetime.now().isoformat() if is_complete else None
                }
                
                supabase.update_interview_session(session_id, session_updates)
                print(f"DEBUG: Updated interview session with complete transcript")
                
            except Exception as e:
                print(f"DEBUG: Error updating interview session: {e}")
                # Calculate completion anyway for response
                target_questions = 15
                if questionnaire_context and 'target_questions' in questionnaire_context:
                    target_questions = questionnaire_context['target_questions']
                new_exchange_count = exchange_count + 1
                is_complete = new_exchange_count >= target_questions
                
        except Exception as e:
            print(f"DEBUG: Error storing conversation messages: {e}")
            # Calculate completion anyway for response
            target_questions = 15
            if questionnaire_context and 'target_questions' in questionnaire_context:
                target_questions = questionnaire_context['target_questions']
            new_exchange_count = exchange_count + 1
            is_complete = new_exchange_count >= target_questions
        
        # Send response
        response = {
            'session_id': session_id,
            'ai_response': ai_response,
            'exchange_count': new_exchange_count,
            'is_complete': is_complete,
            'target_questions': target_questions
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        self.wfile.write(json.dumps(response).encode('utf-8'))
    
    def _handle_complete_interview(self, data):
        """Handle interview completion and profile extraction"""
        try:
            # Get session_id from the request data or query params  
            session_id = data.get('session_id') or self._get_session_from_url()
            
            print(f"DEBUG: Completing interview for session: {session_id}")
            print(f"DEBUG: Request data: {data}")
            
            if not session_id:
                raise Exception('Session ID is required for interview completion')
            
            # Get API key for profile extraction
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                raise Exception('ANTHROPIC_API_KEY environment variable is required')
            
            # Get interview session data
            from lib.supabase import SupabaseClient
            supabase = SupabaseClient()
            
            print(f"DEBUG: Looking for interview session with ID: {session_id}")
            interview_session = supabase.get_interview_session(session_id)
            
            print(f"DEBUG: Interview session result: {interview_session}")
            
            if not interview_session:
                # Let's also try to list all sessions to debug
                try:
                    all_sessions = supabase._make_request('GET', 'interview_sessions')
                    print(f"DEBUG: All interview sessions in database: {all_sessions}")
                except Exception as list_error:
                    print(f"DEBUG: Error listing sessions: {list_error}")
                
                raise Exception(f'Interview session {session_id} not found')
            
            print(f"DEBUG: Extracting profile for session {session_id}")
            
            # Extract profile using AI
            profile_data = self._extract_profile_from_interview(interview_session, api_key)
            
            # Get latest version number for this person
            person_name = interview_session['person_name']
            print(f"DEBUG: Getting latest profile version for person: {person_name}")
            latest_profile = supabase.get_latest_profile_version(person_name)
            print(f"DEBUG: Latest profile found: {latest_profile}")
            next_version = (latest_profile['version_number'] + 1) if latest_profile else 1
            print(f"DEBUG: Next version will be: {next_version}")
            
            # Create profile version
            profile_id = f"{person_name}_v{next_version}"
            print(f"DEBUG: Creating profile with ID: {profile_id}")
            profile_version_data = {
                'profile_id': profile_id,
                'person_name': person_name,
                'version_number': next_version,
                'profile_data': profile_data,
                'is_active': True,
                'created_at': 'NOW()',
                'updated_at': 'NOW()'
            }
            
            # Save profile
            created_profile = supabase.create_profile_version(profile_version_data)
            print(f"DEBUG: Created profile version {profile_id}")
            
            # Update interview session with profile_id
            supabase.update_interview_session(session_id, {'profile_id': profile_id})
            
            response = {
                'status': 'success',
                'message': 'Interview completed successfully. Profile has been extracted.',
                'profile_id': profile_id,
                'profile_data': profile_data
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            print(f"DEBUG: Error in interview completion: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {'error': str(e)}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def _get_session_from_url(self):
        """Extract session_id from URL query params"""
        try:
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            return query_params.get('session_id', [None])[0]
        except:
            return None
    
    def _extract_profile_from_interview(self, interview_session, api_key):
        """Use AI to extract personality profile from interview transcript"""
        import anthropic
        
        client = anthropic.Anthropic(api_key=api_key)
        
        transcript = interview_session.get('transcript', '')
        person_name = interview_session.get('person_name', 'User')
        
        system_prompt = """You are an expert psychological profiler and digital twin creator. Your task is to analyze an interview transcript and extract a comprehensive personality profile.

Create a detailed JSON profile with these sections:

1. **Core Personality Traits** - Big 5 personality dimensions with scores
2. **Values & Motivations** - What drives this person
3. **Behavioral Patterns** - How they typically act and respond
4. **Decision Making Style** - How they make choices
5. **Communication Style** - How they express themselves
6. **Attitudes & Beliefs** - Their perspective on relevant topics
7. **Lifestyle Preferences** - Their habits and preferences
8. **Emotional Profile** - How they handle emotions and stress

Return ONLY a valid JSON object with this structure:
{
  "personality_traits": {
    "openness": 0.7,
    "conscientiousness": 0.8,
    "extraversion": 0.6,
    "agreeableness": 0.9,
    "neuroticism": 0.3
  },
  "values_motivations": [
    "Health and wellness",
    "Personal growth"
  ],
  "behavioral_patterns": [
    "Consistent daily routines",
    "Goal-oriented approach"
  ],
  "decision_making_style": "Analytical with intuitive elements",
  "communication_style": "Direct and thoughtful",
  "attitudes_beliefs": {
    "toward_topic": "Positive and engaged",
    "toward_change": "Open but cautious"
  },
  "lifestyle_preferences": [
    "Structured schedules",
    "Work-life balance"
  ],
  "emotional_profile": {
    "stress_response": "Problem-focused coping",
    "emotional_regulation": "Generally stable"
  },
  "confidence_score": 0.85,
  "extraction_notes": "Brief notes about the analysis"
}

Base the profile entirely on evidence from the interview transcript."""
        
        try:
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                temperature=0.3,
                system=system_prompt,
                messages=[{
                    "role": "user", 
                    "content": f"Analyze this interview transcript and create a personality profile for {person_name}:\n\n{transcript}"
                }]
            )
            
            # Parse the JSON response
            profile_text = response.content[0].text
            profile_data = json.loads(profile_text)
            
            print(f"DEBUG: Successfully extracted profile for {person_name}")
            return profile_data
            
        except Exception as e:
            print(f"DEBUG: Error extracting profile: {e}")
            # Return a basic fallback profile
            return {
                "error": "Profile extraction failed",
                "fallback_profile": True,
                "person_name": person_name,
                "extraction_error": str(e)
            }
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()