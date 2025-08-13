from http.server import BaseHTTPRequestHandler
import json
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Get API key from environment
            api_key = os.getenv('ANTHROPIC_API_KEY')
            
            response_data = {
                'api_key_exists': bool(api_key),
                'api_key_length': len(api_key) if api_key else 0,
                'api_key_format_valid': api_key.startswith('sk-ant-') if api_key else False,
                'environment': 'vercel'
            }
            
            # Try a simple API call
            if api_key:
                try:
                    import anthropic
                    client = anthropic.Anthropic(api_key=api_key)
                    
                    # Very simple test call
                    response = client.messages.create(
                        model="claude-3-5-sonnet-20241022",
                        max_tokens=10,
                        messages=[{"role": "user", "content": "Hi"}],
                        timeout=5.0
                    )
                    
                    response_data['api_test'] = 'success'
                    response_data['api_response'] = response.content[0].text[:50]
                    
                except Exception as e:
                    response_data['api_test'] = 'failed'
                    response_data['api_error'] = str(e)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))