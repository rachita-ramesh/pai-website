from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Check if API key exists
            api_key = os.getenv('ANTHROPIC_API_KEY')
            
            health_status = {
                'status': 'healthy',
                'api_key_configured': bool(api_key),
                'api_key_length': len(api_key) if api_key else 0,
                'timestamp': str(datetime.now())
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(health_status).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))