from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add the lib directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from lib.profile_extractor import ProfileExtractor

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Handle status requests
        try:
            profiles_count = 0
            storage_source = "unknown"
            
            # Try Supabase first
            try:
                import sys
                sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
                from lib.supabase import SupabaseClient
                
                supabase = SupabaseClient()
                profiles = supabase.get_active_profiles()
                profiles_count = len(profiles)
                storage_source = "supabase"
                
            except Exception as supabase_error:
                # Fallback to file system check
                possible_dirs = [
                    "/tmp/profiles",  # Vercel serverless storage
                    "backend/data/profiles",  # Local development
                    "/Users/rachita/Projects/Pai/backend/data/profiles",  # Absolute local path
                    os.path.join(os.getcwd(), "backend/data/profiles")  # Current working directory
                ]
                
                for profiles_dir in possible_dirs:
                    if os.path.exists(profiles_dir):
                        try:
                            profile_files = [f for f in os.listdir(profiles_dir) if f.endswith('_profile.json')]
                            profiles_count += len(profile_files)
                            storage_source = "filesystem"
                        except (OSError, PermissionError):
                            continue
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                "status": "healthy",
                "profiles_created": profiles_count,
                "active_twins": 3,
                "system": "operational",
                "storage_source": storage_source
            }
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {'error': str(e)}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Get API key from environment
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                raise Exception('ANTHROPIC_API_KEY environment variable is required')
            
            # Initialize Profile Extractor
            extractor = ProfileExtractor(api_key)
            
            # Extract profile from interview data
            profile = extractor.extract_profile(data.get('interview_data', {}))
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(json.dumps(profile).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()