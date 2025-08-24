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
                        'questionnaire_id': questionnaire_id,
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
            print(f"DEBUG: Using simple sequential question progression")
            
            # SIMPLE: Just get the next question from the questionnaire JSONB
            ai_response = "Thank you for sharing that!"
            
            if questionnaire_context and 'questions' in questionnaire_context:
                questions = questionnaire_context['questions']
                
                print(f"DEBUG: Available questions: {len(questions)}")
                print(f"DEBUG: Current exchange_count: {exchange_count}")
                
                # Frontend already incremented exchange_count, so use it directly as question index
                # exchange_count=1 after Q1 response → ask questions[1] (Q2)
                # exchange_count=2 after Q2 response → ask questions[2] (Q3)  
                # exchange_count=3 after Q3 response → ask questions[3] (Q4)
                question_index = exchange_count
                
                if question_index < len(questions):
                    next_question = questions[question_index]
                    ai_response = next_question.get('text') or next_question.get('question_text', 'Tell me more')
                    question_id = next_question.get('id', f'q{question_index + 1}')
                    print(f"DEBUG: Exchange {exchange_count}, asking question {question_id} (index {question_index})")
                    print(f"DEBUG: Question: {ai_response[:80]}...")
                else:
                    ai_response = "Thank you for sharing all of that! Is there anything else you'd like to tell me about this topic?"
                    print(f"DEBUG: All questionnaire questions asked, using generic follow-up")
            
            # Frontend already incremented exchange_count, so don't increment again
            new_exchange_count = exchange_count
            
            # Complete only when ALL questions have been asked  
            if questionnaire_context and 'questions' in questionnaire_context:
                total_questions = len(questionnaire_context['questions'])
                is_complete = new_exchange_count >= total_questions
                print(f"DEBUG: Completion check: {new_exchange_count}/{total_questions}, complete: {is_complete}")
            else:
                is_complete = new_exchange_count >= 8  # Fallback
        
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
                    'id': f"ai_{exchange_count}",
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
                
                # Use completion status from sequential logic above
                if 'new_exchange_count' not in locals() or 'is_complete' not in locals():
                    new_exchange_count = exchange_count  # Frontend already incremented
                    # Complete when all questions are asked
                    if questionnaire_context and 'questions' in questionnaire_context:
                        total_questions = len(questionnaire_context['questions'])
                        is_complete = new_exchange_count >= total_questions
                    else:
                        is_complete = new_exchange_count >= 8
                        
                # Set target_questions for response consistency
                if questionnaire_context and 'questions' in questionnaire_context:
                    target_questions = len(questionnaire_context['questions'])
                else:
                    target_questions = 8
                
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
                # Use completion from sequential logic above
                if 'new_exchange_count' not in locals() or 'is_complete' not in locals():
                    new_exchange_count = exchange_count  # Frontend already incremented
                    if questionnaire_context and 'questions' in questionnaire_context:
                        total_questions = len(questionnaire_context['questions'])
                        is_complete = new_exchange_count >= total_questions
                    else:
                        is_complete = new_exchange_count >= 8
                
        except Exception as e:
            print(f"DEBUG: Error storing conversation messages: {e}")
            # Use completion from sequential logic above
            if 'new_exchange_count' not in locals() or 'is_complete' not in locals():
                new_exchange_count = exchange_count  # Frontend already incremented
                if questionnaire_context and 'questions' in questionnaire_context:
                    total_questions = len(questionnaire_context['questions'])
                    is_complete = new_exchange_count >= total_questions
                else:
                    is_complete = new_exchange_count >= 8
        
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
            
            # For multi-questionnaire profiles, collect all sessions for this person from today
            person_name = interview_session['person_name'].strip()
            print(f"DEBUG: Collecting all recent sessions for person: {person_name}")
            
            # Get questionnaires completed from frontend
            questionnaires_completed = data.get('questionnaires_completed', [])
            print(f"DEBUG: Frontend reports completed questionnaires: {questionnaires_completed}")
            
            # Initialize sessions for extraction
            sessions_for_extraction = [interview_session]  # Default to single session
            
            if len(questionnaires_completed) > 1:
                # Multi-questionnaire flow - collect all related sessions
                print(f"DEBUG: Multi-questionnaire flow detected, collecting {len(questionnaires_completed)} sessions")
                all_sessions = []
                
                for questionnaire_name in questionnaires_completed:
                    # Find the session for this questionnaire type
                    matching_sessions = supabase.get_recent_interview_sessions_by_person_and_questionnaire(person_name, questionnaire_name)
                    if matching_sessions:
                        latest_session = max(matching_sessions, key=lambda x: x.get('created_at', ''))
                        all_sessions.append(latest_session)
                        print(f"DEBUG: Found session for {questionnaire_name}: {latest_session['session_id']}")
                    else:
                        print(f"DEBUG: No session found for questionnaire: {questionnaire_name}")
                
                if len(all_sessions) > 1:
                    print(f"DEBUG: Using combined data from {len(all_sessions)} sessions")
                    # Use all individual sessions for AI extraction (it will combine them properly)
                    sessions_for_extraction = all_sessions
                    print(f"DEBUG: Will extract profile from {len(sessions_for_extraction)} individual sessions")
                else:
                    print(f"DEBUG: Only found {len(all_sessions)} sessions, falling back to single session")
                    if all_sessions:
                        sessions_for_extraction = all_sessions
            else:
                print(f"DEBUG: Single questionnaire flow, using original session")
            
            # Fetch full questionnaire data for all sessions to get tags
            questionnaires_data = {}
            for session in sessions_for_extraction:
                q_id = session.get('questionnaire_id')
                if q_id and q_id not in questionnaires_data:
                    try:
                        q_data = supabase.get_custom_questionnaire(q_id)
                        if q_data:
                            questionnaires_data[q_id] = q_data
                            print(f"DEBUG: Fetched questionnaire data for {q_id}")
                    except Exception as e:
                        print(f"DEBUG: Could not fetch questionnaire {q_id}: {e}")

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
            
            # Check if we should add to existing profile or create new one
            existing_profile_id = data.get('existing_profile_id')
            profile_action = data.get('profile_action', 'new')
            
            if profile_action == 'existing' and existing_profile_id:
                # Adding to existing profile - use the provided profile ID
                profile_id = existing_profile_id
                print(f"DEBUG: Adding to existing profile: {profile_id}")
                
                # Verify the existing profile exists
                existing_profile = supabase.get_profile_version(profile_id)
                if not existing_profile:
                    print(f"ERROR: Existing profile {profile_id} not found, creating new one instead")
                    # Fall back to creating new profile
                    latest_profile = supabase.get_latest_profile_version(person_name)
                    print(f"DEBUG: Latest profile found: {latest_profile}")
                    next_version = (latest_profile['version_number'] + 1) if latest_profile else 1
                    profile_id = f"{person_name}_v{next_version}"
                else:
                    print(f"DEBUG: Confirmed existing profile exists: {profile_id}")
                    
                    # Get all sessions already linked to this existing profile
                    existing_sessions = supabase.get_sessions_by_profile_id(profile_id)
                    print(f"DEBUG: Found {len(existing_sessions)} existing sessions for profile {profile_id}")
                    
                    # Add existing sessions to the extraction set (avoid duplicates)
                    existing_session_ids = {s['session_id'] for s in sessions_for_extraction}
                    for existing_session in existing_sessions:
                        if existing_session['session_id'] not in existing_session_ids:
                            sessions_for_extraction.append(existing_session)
                            print(f"DEBUG: Added existing session {existing_session['session_id']} to extraction")
                    
                    print(f"DEBUG: Will re-extract profile from {len(sessions_for_extraction)} total sessions (existing + new)")
            else:
                # Creating new profile
                latest_profile = supabase.get_latest_profile_version(person_name)
                print(f"DEBUG: Latest profile found: {latest_profile}")
                next_version = (latest_profile['version_number'] + 1) if latest_profile else 1
                
                # Create a unique profile version ID
                profile_id = f"{person_name}_v{next_version}"
                print(f"DEBUG: Creating new profile with ID: {profile_id}")
                
                # Double-check this profile_id doesn't exist
                existing_check = supabase.get_profile_version(profile_id)
                if existing_check:
                    # If it somehow exists, add a UUID suffix
                    profile_id = f"{person_name}_v{next_version}_{uuid.uuid4().hex[:8]}"
                    print(f"DEBUG: Profile ID conflict detected, using UUID suffix: {profile_id}")
            
            # Extract profile using AI with all collected sessions (already determined above)
            print(f"DEBUG: Extracting profile from {len(sessions_for_extraction)} session(s)")
            profile_data = self._extract_profile_from_interview(
                sessions_for_extraction, 
                api_key, 
                profile_id, 
                questionnaires_completed,
                questionnaires_data
            )
            
            # Extract completeness metadata from request data
            completeness_metadata = data.get('completeness_metadata', {})
            print(f"DEBUG: Saving completeness_metadata: {completeness_metadata}")
            
            # Save or update profile based on action
            try:
                if profile_action == 'existing' and existing_profile_id and existing_profile:
                    # Update existing profile
                    print(f"DEBUG: Updating existing profile {profile_id}")
                    
                    # Merge the new profile data with existing data
                    existing_data = existing_profile.get('profile_data', {})
                    existing_completeness = existing_profile.get('completeness_metadata', {})
                    
                    # For now, we'll replace the profile_data entirely with the new AI extraction
                    # The AI should have combined all sessions including the existing profile's sessions
                    update_data = {
                        'profile_data': profile_data,
                        'completeness_metadata': completeness_metadata,
                        'updated_at': 'NOW()'
                    }
                    
                    updated_profile = supabase.update_profile_version(profile_id, update_data)
                    print(f"DEBUG: Updated existing profile {profile_id}")
                    created_profile = updated_profile
                else:
                    # Create new profile version
                    print(f"DEBUG: Creating new profile {profile_id}")
                    profile_version_data = {
                        'profile_id': profile_id,
                        'person_name': person_name,
                        'version_number': next_version if 'next_version' in locals() else 1,
                        'profile_data': profile_data,
                        'completeness_metadata': completeness_metadata,
                        'is_active': True,
                        'created_at': 'NOW()',
                        'updated_at': 'NOW()'
                    }
                    
                    created_profile = supabase.create_profile_version(profile_version_data)
                    print(f"DEBUG: Created profile version {profile_id}")
                
                # Link all sessions to this profile_id for full traceability
                for session in sessions_for_extraction:
                    try:
                        supabase.update_interview_session(session['session_id'], {'profile_id': profile_id})
                        print(f"DEBUG: Linked session {session['session_id']} to profile {profile_id}")
                    except Exception as e:
                        print(f"DEBUG: Error linking session {session['session_id']}: {e}")
                
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
            
            # Calculate total exchanges from all sessions used in profile creation
            total_exchanges = sum(session.get('exchange_count', 0) for session in sessions_for_extraction)
            print(f"DEBUG: Total exchanges across all sessions: {total_exchanges}")
            
            response = {
                'status': 'success',
                'message': 'Interview completed successfully. Profile has been extracted.',
                'profile_id': profile_id,
                'profile_data': profile_data,
                'questionnaire_id': interview_session.get('questionnaire_id', 'unknown'),
                'person_name': person_name,
                'total_exchanges': total_exchanges
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
    
    def _generate_schema_from_tags(self, questionnaires_data, profile_id):
        """Dynamically generate the JSON schema for the AI based on questionnaire tags."""
        schema = {
            "profile_id": profile_id,
            "profile_data": {}
        }
        
        for q_id, q_data in questionnaires_data.items():
            questions = q_data.get('questions', [])
            for question in questions:
                tags = question.get('tags')
                if tags and len(tags) == 2:
                    category, sub_category = tags
                    
                    if category not in schema["profile_data"]:
                        schema["profile_data"][category] = {}
                    
                    # Add a placeholder for the AI to fill
                    schema["profile_data"][category][sub_category] = {
                        "value": f"extracted {sub_category.replace('_', ' ')}",
                        "source": {
                            "questionnaire_id": q_id,
                            "question_id": question.get('id', 'unknown'),
                            "session_id": "session_id_placeholder"
                        }
                    }
        
        return schema

    def _extract_profile_from_interview(self, all_sessions, api_key, profile_id, questionnaires_completed, questionnaires_data):
        """Use AI to extract personality profile from interview transcript with metadata tracking"""
        import anthropic
        
        client = anthropic.Anthropic(api_key=api_key)
        
        # Build combined transcript and collect session metadata
        combined_transcript = ""
        session_metadata = {}
        
        for session in all_sessions:
            questionnaire_id = session.get('questionnaire_id', 'unknown')
            session_id = session.get('session_id', 'unknown')
            transcript = session.get('transcript', '')
            
            combined_transcript += f"\n\n--- {questionnaire_id.upper()} QUESTIONNAIRE (Session: {session_id}) ---\n{transcript}"
            session_metadata[questionnaire_id] = {
                'session_id': session_id,
                'exchange_count': session.get('exchange_count', 0),
                'completed_at': session.get('completed_at', session.get('created_at', ''))
            }
        
        person_name = all_sessions[0].get('person_name', 'User') if all_sessions else 'User'
        
        print(f"DEBUG: Combined transcript length: {len(combined_transcript)} chars")
        print(f"DEBUG: Session metadata: {session_metadata}")
        print(f"DEBUG: First 500 chars of combined transcript: {combined_transcript[:500]}...")
        
        # Dynamically generate the schema from questionnaire tags
        dynamic_schema = self._generate_schema_from_tags(questionnaires_data, profile_id)
        
        # Add session metadata to the schema for the AI prompt
        dynamic_schema["created_from_sessions"] = session_metadata
        
        # DEBUG: Print the generated schema to the console for verification
        print(f"DEBUG: Dynamically generated schema for AI prompt:\\n{json.dumps(dynamic_schema, indent=2)}")
        
        # Convert schema to a pretty-printed JSON string for the prompt
        schema_json_string = json.dumps(dynamic_schema, indent=2)

        system_prompt = f"""You are an expert psychological profiler and digital twin creator. Your task is to analyze interview transcripts and extract a comprehensive PAI personality profile with full traceability.

CRITICAL: You must return a JSON object where each profile field includes the VALUE and METADATA about which question generated that data.

Return ONLY a valid JSON object with this exact structure:

{schema_json_string}

Important guidelines:
- Include actual session_id from the sessions you're analyzing
- Only include sections where you have data from the interviews
- Use descriptive text for values, not just categories
- Base everything on evidence from the interview transcript
- If a section wasn't covered, omit it entirely
- Focus on extracting rich, detailed insights rather than categorizing"""
        
        try:
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=8000,
                temperature=0.3,
                system=system_prompt,
                messages=[{
                    "role": "user", 
                    "content": f"Analyze this interview transcript and create a personality profile for {person_name}:\n\n{combined_transcript}"
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