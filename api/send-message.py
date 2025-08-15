from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.parse

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
            
            # Validate API key
            if not api_key or len(api_key) < 50:
                raise Exception(f'Invalid API key: length={len(api_key) if api_key else 0}')
            
            # Make direct HTTP request to Anthropic API
            url = "https://api.anthropic.com/v1/messages"
            
            # TODO: This should get the questionnaire context from session
            # For now, use a generic prompt that doesn't assume skincare
            system_prompt = """You are conducting an A&U (Attitudes & Usage) research interview. 
Your goal is to understand this person's psychology, attitudes, and behaviors related to the topic being discussed.

INTERVIEW STYLE:
- Conversational and friendly, like a skilled researcher
- Ask follow-up questions based on their responses
- Dig deeper when you hear interesting insights
- Don't rush - let them elaborate
- Notice contradictions and explore them gently
- STAY FOCUSED on the topic they're discussing - do not change subjects

CRITICAL RULES:
- If they're talking about fitness/exercise, only ask about fitness-related topics
- If they're talking about nutrition, only ask about nutrition-related topics  
- If they're talking about skincare, only ask about skincare-related topics
- DO NOT mix topics or bring up unrelated subjects

Remember: This should feel like a natural conversation about THEIR topic, not a survey. Ask follow-ups, show curiosity, and help them reflect on their choices and feelings. Keep responses concise but thoughtful."""

            payload = {
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 200,
                "temperature": 0.7,
                "system": system_prompt,
                "messages": [{"role": "user", "content": message}]
            }
            
            headers = {
                "Content-Type": "application/json",
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01"
            }
            
            # Make the request
            req = urllib.request.Request(
                url, 
                data=json.dumps(payload).encode('utf-8'),
                headers=headers,
                method='POST'
            )
            
            with urllib.request.urlopen(req, timeout=30) as response:
                response_data = json.loads(response.read().decode('utf-8'))
                ai_response = response_data['content'][0]['text']
                
                # Clean up markdown formatting for plain text display
                ai_response = ai_response.replace('*', '').replace('**', '').replace('_', '')
            
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
                'exchange_count': data.get('exchange_count', 0) + 1,
                'is_complete': False,
                'current_topic': 'skincare_conversation'
            }
            
            # Debug: Log what we're sending
            response_json = json.dumps(response)
            print(f"DEBUG: Sending response length: {len(response_json)}")
            print(f"DEBUG: Response preview: {response_json[:100]}...")
            
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