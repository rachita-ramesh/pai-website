from http.server import BaseHTTPRequestHandler
import json
import os
import sys

# Add the lib directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from lib.supabase import SupabaseClient

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            supabase = SupabaseClient()
            
            # Create questionnaire
            questionnaire_data = {
                'questionnaire_id': data['questionnaire_id'],
                'title': data['title'],
                'description': data.get('description', ''),
                'category': data['category'],
                'questions': data['questions'],  # Store as JSONB
                'estimated_duration': data.get('estimated_duration', 15),
                'is_public': data.get('is_public', False),
                'created_by': data.get('created_by', 'user'),
                'is_active': True
            }
            
            # Insert questionnaire
            questionnaire_result = supabase.create_custom_questionnaire(questionnaire_data)
            
            # Insert individual questions
            questions_inserted = []
            for question in data['questions']:
                question_data = {
                    'questionnaire_id': data['questionnaire_id'],
                    'question_id': question['id'],
                    'question_text': question['text'],
                    'question_type': question['type'],
                    'options': question.get('options'),
                    'is_required': question.get('required', True),
                    'question_order': question.get('question_order', 1),
                    'help_text': question.get('helpText', '')
                }
                
                question_result = supabase.add_questionnaire_question(question_data)
                questions_inserted.append(question_result)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                'success': True,
                'questionnaire_id': data['questionnaire_id'],
                'questionnaire': questionnaire_result,
                'questions_count': len(questions_inserted),
                'message': 'Questionnaire created successfully'
            }
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            print(f"Error creating questionnaire: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {'error': str(e), 'success': False}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def do_GET(self):
        try:
            # Parse query parameters
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            supabase = SupabaseClient()
            
            # Get category filter if provided
            category = query_params.get('category', [None])[0]
            
            if category:
                questionnaires = supabase.get_questionnaires_by_category(category)
            else:
                questionnaires = supabase.get_public_questionnaires()
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {
                'success': True,
                'questionnaires': questionnaires,
                'count': len(questionnaires)
            }
            
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            print(f"Error fetching questionnaires: {str(e)}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {'error': str(e), 'success': False}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()