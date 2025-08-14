from http.server import BaseHTTPRequestHandler
import json
import os
import glob

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Count profile files to determine completion status
            # Profile files are typically saved in backend/data/ or similar
            profiles_count = 0
            
            # Look for profile files in possible locations
            # Check both relative and absolute paths for Vercel deployment
            possible_dirs = [
                "backend/data/profiles",
                "/Users/rachita/Projects/Pai/backend/data/profiles",
                "/tmp/profiles",
                os.path.join(os.getcwd(), "backend/data/profiles")
            ]
            
            profiles_count = 0
            for profiles_dir in possible_dirs:
                if os.path.exists(profiles_dir):
                    try:
                        profile_files = [f for f in os.listdir(profiles_dir) if f.endswith('_profile.json')]
                        profiles_count += len(profile_files)
                    except (OSError, PermissionError):
                        continue
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                "status": "healthy",
                "profiles_created": profiles_count,
                "active_twins": 3,
                "system": "operational"
            }
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {'error': str(e)}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()