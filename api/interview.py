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
                
                print(f"DEBUG: START - Retrieved questionnaire for ID '{questionnaire_id}': {questionnaire}")
                
                if questionnaire:
                    # Questions are stored in the questionnaire JSONB field, not a separate table
                    questions = questionnaire.get('questions', [])
                    title = questionnaire.get('title', 'Custom Questionnaire')
                    category = questionnaire.get('category', 'general')
                    description = questionnaire.get('description', '')
                    
                    print(f"DEBUG: START - Found questionnaire: title='{title}', category='{category}', questions={len(questions)}")
                    if questions:
                        print(f"DEBUG: START - First question: {questions[0]}")
                    print(f"DEBUG: START - Loaded {len(questions)} questions")
                    
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
                            'target_questions': max(3, min(len(questions) + 2, 8))
                        }
                        
                        # Let the AI generate a natural conversational greeting
                        # that introduces the topic and asks the first question naturally
                        print(f"DEBUG: Using AI-generated natural greeting for {category} interview")
                    else:
                        # Fallback to category-based message if no questions
                        initial_message = f"Hi! Let's explore your thoughts about {category}. What role does {category} play in your life?"
                        print(f"DEBUG: No questions found, using category fallback: {initial_message}")
                else:
                    print(f"DEBUG: START - No questionnaire found for ID '{questionnaire_id}'")
            except Exception as e:
                print(f"Error loading questionnaire {questionnaire_id}: {e}")
                # Fall back to default
                questionnaire_context = None
                initial_message = None
        
        # Initialize AI Interviewer with questionnaire context
        interviewer = AIInterviewer(api_key, questionnaire_context=questionnaire_context)
        
        # Get participant name from request and strip any whitespace
        participant_name = data.get('participant_name', 'User').strip()
        
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
        
        if session.messages:
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
        
        # Store initial interview session in Supabase
        if initial_ai_message:
            try:
                from lib.supabase import SupabaseClient
                supabase = SupabaseClient()
                
                # Ensure person exists BEFORE creating interview session
                print(f"DEBUG: Checking if person exists: '{participant_name}'")
                person = supabase.get_person(participant_name)
                if not person:
                    print(f"DEBUG: Person '{participant_name}' not found, creating...")
                    supabase.create_person(participant_name)
                    print(f"DEBUG: Successfully created person: '{participant_name}'")
                else:
                    print(f"DEBUG: Person '{participant_name}' already exists")
                
                # Create interview session record with initial AI message
                interview_session_data = {
                    'session_id': session.session_id,
                    'person_name': participant_name,
                    'questionnaire_id': questionnaire_id,  # Add questionnaire tracking
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
        target_questions = 8  # Default reduced for better UX
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
                
                print(f"DEBUG: Retrieved questionnaire for ID '{questionnaire_id}': {questionnaire}")
                
                if questionnaire:
                    # Questions are stored in the questionnaire JSONB field, not a separate table
                    questions = questionnaire.get('questions', [])
                    print(f"DEBUG: Extracted {len(questions)} questions from questionnaire")
                    if questions:
                        print(f"DEBUG: First question: {questions[0]}")
                    
                    questionnaire_context = {
                        'title': questionnaire.get('title', 'Custom Questionnaire'),
                        'category': questionnaire.get('category', 'general'),
                        'description': questionnaire.get('description', ''),
                        'questions': questions,
                        'target_questions': max(3, min(len(questions) + 2, 8))
                    }
                    print(f"DEBUG: Loaded questionnaire context for category '{questionnaire_context['category']}' with {len(questions)} questions")
                else:
                    print(f"DEBUG: No questionnaire found for ID '{questionnaire_id}'")
        except Exception as e:
            print(f"DEBUG: Error loading questionnaire context: {e}")
            questionnaire_context = None
        
        # Use sequential question progression for now - disable AI interviewer
        if False:  # Temporarily disable AI interviewer
            # Load or create interview session from pickle file
            import pickle
            session_file = f"/tmp/interview_session_{session_id}.pkl"
            
            if os.path.exists(session_file):
                with open(session_file, 'rb') as f:
                    session_data = pickle.load(f)
                    interviewer = AIInterviewer(api_key, questionnaire_context=session_data.get('questionnaire_context'))
                    session = session_data['session']
                    print(f"DEBUG: Loaded existing session from {session_file}")
            else:
                # Create new AI interviewer and session if file doesn't exist
                interviewer = AIInterviewer(api_key, questionnaire_context=questionnaire_context)
                from lib.ai_interviewer import InterviewSession, InterviewMessage
                from datetime import datetime
                session = InterviewSession(
                    session_id=session_id,
                    participant_name="User",
                    messages=[],
                    start_time=datetime.now(),
                    current_topic="category_relationship",
                    exchange_count=exchange_count,
                    is_complete=False
                )
                print(f"DEBUG: Created new session since file doesn't exist")
            
            # Get AI response using the interviewer
            ai_response = interviewer.get_ai_response(session, message)
            
            # Update session with new messages
            session = interviewer.update_session(session, message, ai_response)
            
            # Save updated session
            session_data = {
                'session': session,
                'questionnaire_context': questionnaire_context
            }
            with open(session_file, 'wb') as f:
                pickle.dump(session_data, f)
            print(f"DEBUG: Updated and saved session to {session_file}")
            
            # Use session completion status
            is_complete = session.is_complete
            new_exchange_count = session.exchange_count
            
            print(f"DEBUG: AI response: {ai_response}")
            print(f"DEBUG: Session complete: {is_complete}, exchange count: {new_exchange_count}")
            
        else:
            print(f"DEBUG: Using sequential question progression")
            # Use sequential question progression
            ai_response = "Thank you for sharing that!"
            
            if questionnaire_context and 'questions' in questionnaire_context:
                questions = questionnaire_context['questions']
                print(f"DEBUG: Available questions: {len(questions)}")
                print(f"DEBUG: Current exchange_count: {exchange_count}")
                
                # Sequential question progression - always start from Q1 and go in order
                # Frontend sends exchange_count already incremented, so we need to subtract 1
                question_index = exchange_count - 1  # Q1 when exchange_count=1, Q2 when exchange_count=2, etc.
                
                print(f"DEBUG: SEQUENTIAL - exchange_count: {exchange_count}, will ask question_index: {question_index}")
                
                if question_index < len(questions):
                    next_question = questions[question_index]
                    ai_response = next_question.get('text') or next_question.get('question_text', 'Tell me more')
                    question_id = next_question.get('id', f'q{question_index + 1}')
                    print(f"DEBUG: SEQUENTIAL - Asking question {question_id} (index {question_index})")
                    print(f"DEBUG: SEQUENTIAL - Question text: {ai_response[:100]}...")
                    
                    # Set completion based on question count  
                    new_exchange_count = exchange_count + 1
                    is_complete = new_exchange_count >= len(questions)
                    print(f"DEBUG: SEQUENTIAL - After this exchange: {new_exchange_count}/{len(questions)}, complete: {is_complete}")
                else:
                    # All questionnaire questions asked - mark complete
                    ai_response = "Thank you for sharing all of that! Is there anything else you'd like to tell me about this topic?"
                    print(f"DEBUG: SEQUENTIAL - All questionnaire questions asked, marking complete")
                    new_exchange_count = exchange_count + 1
                    is_complete = True
            else:
                # Fallback completion calculation when no questions
                target_questions = 8
                new_exchange_count = exchange_count + 1
                is_complete = new_exchange_count >= target_questions
        
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
            # Messages will be stored directly in interview_sessions table below
            
            print(f"DEBUG: Stored conversation messages for session {session_id}")
            
            # Update interview session with new messages and transcript
            try:
                # Get all messages for this session to build complete transcript
                # Get current session and build updated messages
                current_session = supabase.get_interview_session(session_id)
                existing_messages = current_session.get('messages', []) if current_session else []
                
                # Add new messages
                new_user_message = {
                    'id': f"user_{exchange_count}",
                    'type': 'user', 
                    'content': message,
                    'timestamp': datetime.now().isoformat()
                }
                new_ai_message = {
                    'id': f"ai_{exchange_count + 1}",
                    'type': 'ai',
                    'content': ai_response, 
                    'timestamp': datetime.now().isoformat()
                }
                
                all_messages = existing_messages + [new_user_message, new_ai_message]
                
                # Build transcript
                transcript_lines = []
                for msg in all_messages:
                    speaker = "User" if msg.get('type') == 'user' else "AI"
                    transcript_lines.append(f"{speaker}: {msg.get('content', '')}")
                transcript = "\n\n".join(transcript_lines)
                
                # Use completion status from AI interviewer if available, otherwise calculate
                if 'new_exchange_count' not in locals() or 'is_complete' not in locals():
                    target_questions = 8  # Default reduced
                    if questionnaire_context and 'target_questions' in questionnaire_context:
                        target_questions = questionnaire_context['target_questions']
                    
                    new_exchange_count = exchange_count + 1
                    is_complete = new_exchange_count >= target_questions
                else:
                    # Calculate target_questions for response consistency
                    target_questions = 8
                    if questionnaire_context and 'target_questions' in questionnaire_context:
                        target_questions = questionnaire_context['target_questions']
                
                print(f"DEBUG: Completion check - exchange_count: {exchange_count}, new_exchange_count: {new_exchange_count}, target_questions: {target_questions}, is_complete: {is_complete}")
                
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
                # Use completion from AI interviewer if available, otherwise calculate
                if 'new_exchange_count' not in locals() or 'is_complete' not in locals():
                    target_questions = 8
                    if questionnaire_context and 'target_questions' in questionnaire_context:
                        target_questions = questionnaire_context['target_questions']
                    new_exchange_count = exchange_count + 1
                    is_complete = new_exchange_count >= target_questions
                
        except Exception as e:
            print(f"DEBUG: Error storing conversation messages: {e}")
            # Use completion from AI interviewer if available, otherwise calculate
            if 'new_exchange_count' not in locals() or 'is_complete' not in locals():
                target_questions = 8
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
                raise Exception(f'Interview session {session_id} not found')
            
            # Check if profile already exists for this session
            if interview_session.get('profile_id'):
                print(f"DEBUG: Profile already exists for session {session_id}: {interview_session['profile_id']}")
                # Get the existing profile data
                existing_profile = supabase.get_profile_version(interview_session['profile_id'])
                response = {
                    'status': 'success',
                    'message': 'Profile already exists for this interview session',
                    'profile_id': interview_session['profile_id'],
                    'profile_data': existing_profile.get('profile_data') if existing_profile else None
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return
            
            print(f"DEBUG: Extracting profile for session {session_id}")
            
            # Get latest version number for this person
            person_name = interview_session['person_name'].strip()  # Remove any trailing spaces
            print(f"DEBUG: Getting latest profile version for person: {person_name}")
            
            # Ensure person exists in database before creating profile
            try:
                person = supabase.get_person(person_name)
                if not person:
                    print(f"DEBUG: Person {person_name} not found, creating...")
                    supabase.create_person(person_name)
                    print(f"DEBUG: Created person: {person_name}")
            except Exception as e:
                print(f"DEBUG: Error ensuring person exists: {e}")
            
            # Generate a unique profile ID using timestamp to avoid conflicts
            from datetime import datetime
            import uuid
            
            # Try to get latest profile version
            latest_profile = supabase.get_latest_profile_version(person_name)
            print(f"DEBUG: Latest profile found: {latest_profile}")
            next_version = (latest_profile['version_number'] + 1) if latest_profile else 1
            
            # Create a unique profile version ID with timestamp to avoid duplicates
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            profile_id = f"{person_name}_v{next_version}"
            print(f"DEBUG: Creating profile with unique ID: {profile_id}")
            
            # Double-check this profile_id doesn't exist
            existing_check = supabase.get_profile_version(profile_id)
            if existing_check:
                # If it somehow exists, add a UUID suffix
                profile_id = f"{person_name}_v{next_version}_{uuid.uuid4().hex[:8]}"
                print(f"DEBUG: Profile ID conflict detected, using UUID suffix: {profile_id}")
            
            # Extract profile using AI with the profile_id
            profile_data = self._extract_profile_from_interview(interview_session, api_key, profile_id)
            profile_version_data = {
                'profile_id': profile_id,
                'person_name': person_name,
                'version_number': next_version,
                'profile_data': profile_data,
                'is_active': True,
                'created_at': 'NOW()',
                'updated_at': 'NOW()'
            }
            
            # Save profile and update session atomically
            try:
                created_profile = supabase.create_profile_version(profile_version_data)
                print(f"DEBUG: Created profile version {profile_id}")
                
                # Immediately update interview session with profile_id
                supabase.update_interview_session(session_id, {'profile_id': profile_id})
                print(f"DEBUG: Successfully linked profile {profile_id} to session {session_id}")
                
            except Exception as e:
                print(f"DEBUG: Error creating or linking profile: {e}")
                # If session update fails, we should delete the created profile to avoid orphans
                try:
                    if 'created_profile' in locals():
                        print(f"DEBUG: Attempting to clean up orphaned profile {profile_id}")
                        # Note: We'd need a delete method for this, but for now just log the issue
                except:
                    pass
                raise e
            
            response = {
                'status': 'success',
                'message': 'Interview completed successfully. Profile has been extracted.',
                'profile_id': profile_id,
                'profile_data': profile_data,
                'questionnaire_id': interview_session.get('questionnaire_id', 'unknown'),
                'person_name': person_name
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
    
    def _extract_profile_from_interview(self, interview_session, api_key, profile_id):
        """Use AI to extract personality profile from interview transcript"""
        import anthropic
        
        client = anthropic.Anthropic(api_key=api_key)
        
        transcript = interview_session.get('transcript', '')
        person_name = interview_session.get('person_name', 'User')
        
        system_prompt = f"""You are an expert psychological profiler and digital twin creator. Your task is to analyze an interview transcript and extract a comprehensive PAI (Profile AI Interview) personality profile.

Create a detailed JSON profile following the PAI structured format. Analyze the interview transcript and extract insights about the person's psychology, attitudes, behaviors, and decision-making patterns.

Return ONLY a valid JSON object with this exact structure:

{{
  "profile_id": "{profile_id}",
  "demographics": {{
    "age_range": "25-34",
    "lifestyle": "urban_professional|student|homemaker|retired|entrepreneur",
    "context": "wellness_oriented|career_focused|family_oriented|creative"
  }},
  "core_attitudes": {{
    "aging_approach": "proactive_prevention|acceptance|denial|anxiety",
    "beauty_philosophy": "natural|scientific|minimal|maximalist",
    "risk_tolerance": "conservative|moderate|experimental",
    "trust_orientation": "expert_authority|social_proof|self_research|brand_loyalty"
  }},
  "decision_psychology": {{
    "research_style": "extensive_researcher|social_validator|expert_seeker|intuitive_decider",
    "influence_hierarchy": [
      "peer_recommendations",
      "expert_advice",
      "scientific_evidence",
      "convenience"
    ],
    "purchase_triggers": [
      "friend_recommendations",
      "problem_solving",
      "prevention"
    ],
    "regret_patterns": [
      "too_expensive",
      "too_complex",
      "ineffective"
    ]
  }},
  "usage_patterns": {{
    "routine_adherence": "strict|flexible|inconsistent",
    "context_sensitivity": "weather|mood|lifestyle_changes|time_pressure",
    "emotional_drivers": [
      "confidence",
      "health_indicators",
      "social_situations"
    ],
    "change_catalysts": [
      "life_events",
      "seasonal_changes",
      "social_influence"
    ]
  }},
  "value_system": {{
    "priority_hierarchy": [
      "effectiveness",
      "convenience",
      "price",
      "ethics"
    ],
    "non_negotiables": [
      "time_efficiency",
      "ingredient_safety"
    ],
    "ideal_outcome": "clear_skin|anti_aging|minimal_effort|natural_glow",
    "core_motivation": "health|appearance|confidence|social_acceptance"
  }},
  "behavioral_quotes": [
    "Direct quotes from the interview that reveal key behavioral insights"
  ],
  "prediction_weights": {{
    "price_sensitivity": 0.5,
    "ingredient_focus": 0.7,
    "routine_complexity_tolerance": 0.3,
    "brand_loyalty": 0.4,
    "social_influence_susceptibility": 0.6
  }}
}}

Important guidelines:
- Use actual quotes from the interview for behavioral_quotes
- Set prediction_weights as decimals between 0.0-1.0 based on the interview evidence
- Choose values from the provided options that best match the person's responses
- Base everything on evidence from the interview transcript
- If information isn't available, make reasonable inferences based on what was discussed"""
        
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
            print(f"DEBUG: Raw AI response: {profile_text}")
            
            # Try to extract JSON from the response (sometimes Claude wraps it in markdown)
            try:
                # First try direct JSON parsing
                profile_data = json.loads(profile_text)
            except json.JSONDecodeError:
                # If that fails, try to extract JSON from markdown code blocks
                import re
                json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', profile_text, re.DOTALL)
                if json_match:
                    json_content = json_match.group(1)
                    print(f"DEBUG: Extracted JSON from markdown: {json_content}")
                    profile_data = json.loads(json_content)
                else:
                    # Try to find JSON object in the text
                    json_match = re.search(r'(\{.*\})', profile_text, re.DOTALL)
                    if json_match:
                        json_content = json_match.group(1)
                        print(f"DEBUG: Extracted JSON from text: {json_content}")
                        profile_data = json.loads(json_content)
                    else:
                        raise ValueError("No valid JSON found in AI response")
            
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