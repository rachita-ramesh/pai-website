from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add the lib directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

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
            
            print(f"DEBUG: Processing message for session {session_id}")
            print(f"DEBUG: Message: {message}")
            print(f"DEBUG: Exchange count: {exchange_count}")
            
            # Get API key from environment
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                raise Exception('ANTHROPIC_API_KEY environment variable is required')
            
            # TODO: Get questionnaire context from session storage
            # For now, use a simplified approach with direct Claude API but better prompts
            # This needs proper session management to maintain questionnaire context
            
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            
            # Use a more intelligent generic prompt that can adapt to context
            system_prompt = """You are an expert A&U (Attitudes & Usage) researcher conducting an interview. 

CRITICAL INSTRUCTIONS:
- Look at what the user just said to understand the TOPIC they're discussing
- If they mention exercise/fitness, ask follow-ups ONLY about fitness topics
- If they mention nutrition/diet, ask follow-ups ONLY about nutrition topics  
- If they mention skincare, ask follow-ups ONLY about skincare topics
- If they mention career, ask follow-ups ONLY about career topics
- NEVER change or mix topics - stay laser-focused on THEIR topic

INTERVIEW STYLE:
- Ask ONE focused follow-up question based on their response
- Keep it conversational and brief (1-2 sentences max)
- Show genuine curiosity about details they shared
- Help them elaborate on interesting points

FORBIDDEN: Do NOT introduce new topics or categories. Only ask about what THEY brought up."""

            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=200,
                temperature=0.7,
                system=system_prompt,
                messages=[{"role": "user", "content": message}]
            )
            
            ai_response = response.content[0].text
            
            # Clean up markdown formatting for plain text display
            ai_response = ai_response.replace('*', '').replace('**', '').replace('_', '')
            
            print(f"DEBUG: Generated AI response: {ai_response[:100]}...")
            
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
                'is_complete': False  # TODO: Determine completion logic
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