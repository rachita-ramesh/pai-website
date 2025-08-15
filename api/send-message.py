from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import pickle
from datetime import datetime

# Add the lib directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from lib.ai_interviewer import AIInterviewer, InterviewSession

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Get session data
            session_id = data.get('session_id')
            message = data.get('message', '')
            exchange_count = data.get('exchange_count', 0)
            questionnaire_id = data.get('questionnaire_id', 'default')
            
            print(f"DEBUG: Processing message for session {session_id}")
            print(f"DEBUG: Message: {message}")
            print(f"DEBUG: Exchange count: {exchange_count}")
            print(f"DEBUG: Questionnaire ID: {questionnaire_id}")
            
            # Get API key from environment
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                raise Exception('ANTHROPIC_API_KEY environment variable is required')
            
            # Load questionnaire context if not default
            questionnaire_context = None
            if questionnaire_id != 'default':
                try:
                    from lib.supabase import SupabaseClient
                    supabase = SupabaseClient()
                    questionnaire = supabase.get_custom_questionnaire(questionnaire_id)
                    
                    if questionnaire:
                        questions = supabase.get_questionnaire_questions(questionnaire_id)
                        questionnaire_context = {
                            'title': questionnaire.get('title', 'Custom Questionnaire'),
                            'category': questionnaire.get('category', 'general'),
                            'description': questionnaire.get('description', ''),
                            'questions': questions
                        }
                        print(f"DEBUG: Loaded questionnaire context for {questionnaire_context['category']}")
                except Exception as e:
                    print(f"DEBUG: Error loading questionnaire context: {e}")
            
            # Load conversation history from Supabase for context
            conversation_history = []
            try:
                from lib.supabase import SupabaseClient
                supabase = SupabaseClient()
                # Get recent conversation messages for context (last 15 exchanges = 30 messages)
                recent_messages = supabase.get_session_messages(session_id, limit=30)
                
                # Build conversation history for Claude
                for msg in recent_messages:
                    if msg.get('type') == 'user':
                        conversation_history.append({"role": "user", "content": msg.get('content', '')})
                    elif msg.get('type') == 'ai':
                        conversation_history.append({"role": "assistant", "content": msg.get('content', '')})
                
                print(f"DEBUG: Loaded {len(conversation_history)} messages for context")
            except Exception as e:
                print(f"DEBUG: Could not load conversation history: {e}")
                conversation_history = []
            
            # Create AI interviewer with proper context
            interviewer = AIInterviewer(api_key, questionnaire_context=questionnaire_context)
            
            # If we have conversation history, use it; otherwise use simplified prompt
            if conversation_history:
                # Add current message to history
                conversation_history.append({"role": "user", "content": message})
                
                response = interviewer.client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=200,
                    temperature=0.7,
                    system=interviewer.system_prompt,
                    messages=conversation_history
                )
            else:
                # Fallback to simple approach if no history available
                if questionnaire_context:
                    category = questionnaire_context['category']
                    system_prompt = f"""You are an expert A&U (Attitudes & Usage) researcher conducting a {category} interview. 

CONTEXT: The user has selected a {category} questionnaire and you are having an ongoing conversation about {category}.

CRITICAL RULES:
- This is a follow-up question in an ongoing {category} interview
- ONLY ask about {category} topics - do not mention skincare, beauty, or other unrelated subjects
- Ask ONE focused follow-up question based on their response
- Show genuine curiosity about the {category} details they shared
- Keep responses brief and conversational (1-2 sentences max)

Remember: You are continuing a conversation about {category}. Stay focused on that topic only."""
                else:
                    system_prompt = """You are an expert A&U researcher conducting an interview about skincare. Ask focused follow-up questions about skincare topics only."""
                
                response = interviewer.client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=200,
                    temperature=0.7,
                    system=system_prompt,
                    messages=[{"role": "user", "content": message}]
                )
            
            ai_response = response.content[0].text
            print(f"DEBUG: Generated response for {questionnaire_context['category'] if questionnaire_context else 'default'} interview")
            
            # Clean up markdown formatting for plain text display
            ai_response = ai_response.replace('*', '').replace('**', '').replace('_', '')
            
            print(f"DEBUG: Generated AI response: {ai_response[:100]}...")
            
            # Store both user message and AI response in Supabase for conversation history
            try:
                from lib.supabase import SupabaseClient
                supabase = SupabaseClient()
                
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
            except Exception as e:
                print(f"DEBUG: Error storing conversation messages: {e}")
            
            # Send response with explicit headers
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            
            response = {
                'session_id': session_id,
                'ai_response': ai_response,
                'exchange_count': exchange_count + 1,
                'is_complete': False
            }
            
            response_json = json.dumps(response)
            self.wfile.write(response_json.encode('utf-8'))
            
        except Exception as e:
            print(f"DEBUG: Exception occurred: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {'error': str(e)}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()