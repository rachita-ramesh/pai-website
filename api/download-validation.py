from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import parse_qs, urlparse

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse query parameters
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            # Support both old session_id and new filename parameters
            test_session_id = query_params.get('session_id', [None])[0]
            filename = query_params.get('filename', [None])[0]
            
            # Get validation results directory
            results_dir = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'validation_results')
            
            if filename:
                # Use direct filename
                if not filename.endswith('.json'):
                    filename += '.json'
                filepath = os.path.join(results_dir, filename)
            elif test_session_id:
                # Legacy support - try to find file by session ID
                filepath = f'/tmp/validation_results/{test_session_id}_validation.json'
                if not os.path.exists(filepath):
                    # Also try in the new location
                    import glob
                    pattern = os.path.join(results_dir, f"*{test_session_id}*.json")
                    matching_files = glob.glob(pattern)
                    if matching_files:
                        filepath = matching_files[0]
            else:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'filename or session_id parameter required'}).encode('utf-8'))
                return
            
            if not os.path.exists(filepath):
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Validation file not found'}).encode('utf-8'))
                return
            
            # Read and return the validation file
            with open(filepath, 'r', encoding='utf-8') as f:
                validation_data = json.load(f)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            download_filename = filename if filename else f"{test_session_id}_validation.json"
            self.send_header('Content-Disposition', f'attachment; filename="{download_filename}"')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(validation_data, indent=2).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))