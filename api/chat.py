from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from urllib.parse import urlparse, parse_qs

# Add the lib directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from lib.ai_interviewer import AIInterviewer

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse URL to determine operation
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            if 'status' in query_params or 'status' in self.path:
                return self._handle_status()
            elif 'profiles' in self.path or 'person' in query_params:
                return self._handle_get_profiles(query_params)
            else:
                # Default GET behavior for chat (if any)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'message': 'Chat endpoint ready'}).encode('utf-8'))
                
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def _handle_status(self):
        """Handle status requests"""
        try:
            # Check if profiles exist
            profiles_dir = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'profiles')
            profiles_created = 0
            
            if os.path.exists(profiles_dir):
                profiles_created = len([f for f in os.listdir(profiles_dir) if f.endswith('.json')])
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                'status': 'running',
                'profiles_created': profiles_created,
                'active_sessions': 0,
                'total_interviews': 0
            }
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Get API key from environment
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                raise Exception('ANTHROPIC_API_KEY environment variable is required')
            
            # Get profile_id and message from request
            profile_id = data.get('profile_id')
            message = data.get('message', '')
            
            if not profile_id:
                raise Exception('profile_id is required')
            
            # Load profile data from Supabase
            try:
                from lib.supabase import SupabaseClient
                supabase = SupabaseClient()
                
                profile_data = supabase.get_profile_version(profile_id)
                if not profile_data:
                    raise Exception(f'Profile {profile_id} not found')
                
                print(f"DEBUG: Loaded profile data for {profile_id}")
                
                # Generate digital twin response based on profile
                response_text = self._generate_digital_twin_response(profile_data, message, api_key)
                
                response = {
                    'response': response_text,
                    'profile_id': profile_id
                }
                
            except Exception as e:
                print(f"DEBUG: Error loading profile: {e}")
                # Fallback to generic response
                response = {
                    'response': f"I'm having trouble accessing my personality profile right now. Could you try asking again? (Error: {str(e)})",
                    'profile_id': profile_id or 'unknown'
                }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            print(f"DEBUG: Chat API error: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def _handle_get_profiles(self, query_params):
        """Handle GET request for profile versions"""
        try:
            person_name = query_params.get('person', [None])[0]
            if not person_name:
                raise Exception('person parameter is required')
            
            # Get all profile versions for this person
            from lib.supabase import SupabaseClient
            supabase = SupabaseClient()
            
            profiles = supabase.get_person_profiles(person_name)
            
            # Format response
            profile_versions = []
            for profile in profiles:
                profile_versions.append({
                    'profile_id': profile.get('profile_id'),
                    'version_number': profile.get('version_number'),
                    'created_at': profile.get('created_at'),
                    'is_active': profile.get('is_active', False)
                })
            
            response = {
                'person_name': person_name,
                'profiles': profile_versions
            }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            print(f"DEBUG: Error getting profiles: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def _generate_digital_twin_response(self, profile_data, message, api_key):
        """Generate a digital twin response based on the person's profile data"""
        import anthropic
        
        client = anthropic.Anthropic(api_key=api_key)
        
        # Extract profile information
        profile_json = profile_data.get('profile_data', {})
        person_name = profile_data.get('person_name', 'User')
        
        # Create system prompt with personality profile
        system_prompt = f"""You are {person_name}'s digital twin, an AI representation of their personality based on their actual interview responses and extracted psychological profile.

PERSONALITY PROFILE:
{json.dumps(profile_json, indent=2)}

INSTRUCTIONS:
- Respond as {person_name} would, using first person ("I", "my", "me")
- Base your responses on the personality traits, attitudes, and decision-making patterns in the profile
- Be conversational and natural, not robotic
- Reference specific aspects of your personality when relevant
- Keep responses to 2-3 sentences unless asked for more detail
- If asked about topics not covered in your profile, respond based on your general personality patterns

Remember: You ARE {person_name}, not an AI assistant describing them."""

        try:
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=300,
                temperature=0.7,
                system=system_prompt,
                messages=[{
                    "role": "user", 
                    "content": message
                }]
            )
            
            return response.content[0].text
            
        except Exception as e:
            print(f"DEBUG: Error generating digital twin response: {e}")
            return f"I'm having trouble thinking right now. Could you ask me that again?"
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()