from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Simple API handler for AI responses

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
            
            # Get AI response directly using Claude API
            try:
                import anthropic
                
                # Validate API key
                if not api_key or len(api_key) < 50:
                    raise Exception(f'Invalid API key: length={len(api_key) if api_key else 0}')
                
                client = anthropic.Anthropic(
                    api_key=api_key,
                    timeout=10.0  # Set client-level timeout
                )
                
                # PAI Interview following the methodology
                system_prompt = """You are conducting an A&U (Attitudes & Usage) research interview about skincare. 
Your goal is to understand this person's psychology, attitudes, and behaviors around skincare.

INTERVIEW STYLE:
- Conversational and friendly, like a skilled researcher
- Ask follow-up questions based on their responses
- Dig deeper when you hear interesting insights
- Don't rush - let them elaborate
- Notice contradictions and explore them gently

KEY AREAS TO EXPLORE:
- Their overall relationship with skincare
- How they feel about aging and skin changes
- How they make decisions about products
- What influences them (science, reviews, friends)
- Their actual usage behaviors and routines
- Their values and what matters most to them
- How they want to feel about their skin in the future

Remember: This should feel like a natural conversation, not a survey. Ask follow-ups, show curiosity, and help them reflect on their choices and feelings. Keep responses concise but thoughtful."""

                response = client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=200,
                    temperature=0.7,
                    system=system_prompt,
                    messages=[{"role": "user", "content": message}]
                )
                
                ai_response = response.content[0].text
                
            except anthropic.APITimeoutError as e:
                raise Exception(f"API timeout error: {str(e)}")
            except anthropic.APIConnectionError as e:
                raise Exception(f"API connection error: {str(e)}")
            except anthropic.RateLimitError as e:
                raise Exception(f"Rate limit error: {str(e)}")
            except anthropic.AuthenticationError as e:
                raise Exception(f"Authentication error - check API key: {str(e)}")
            except Exception as e:
                raise Exception(f"Anthropic API error: {str(e)}")
            
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