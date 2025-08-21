from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add the lib directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from lib.supabase import SupabaseClient

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Get all available surveys"""
        try:
            supabase = SupabaseClient()
            
            # Get all surveys from survey_templates table
            surveys = supabase.get_all_survey_templates()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # Map database fields to expected frontend format
            formatted_surveys = []
            for survey in surveys:
                formatted_survey = {
                    'survey_name': survey.get('survey_name'),
                    'survey_title': survey.get('title'),  # Map 'title' to 'survey_title'
                    'description': survey.get('description'),
                    'target_accuracy': survey.get('target_accuracy'),
                    'questions': survey.get('questions', [])
                }
                formatted_surveys.append(formatted_survey)
            
            self.wfile.write(json.dumps({
                'surveys': formatted_surveys
            }).encode())
            
        except Exception as e:
            print(f"Error fetching surveys: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': f'Failed to fetch surveys: {str(e)}'
            }).encode())

    def do_POST(self):
        """Create a new survey"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            survey_data = json.loads(post_data.decode('utf-8'))
            
            # Validate required fields
            required_fields = ['survey_name', 'title', 'description', 'target_accuracy', 'questions']
            for field in required_fields:
                if field not in survey_data:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'error': f'Missing required field: {field}'
                    }).encode())
                    return
            
            # Validate questions structure
            if not isinstance(survey_data['questions'], list) or len(survey_data['questions']) == 0:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Survey must have at least one question'
                }).encode())
                return
            
            # Validate each question has required fields
            for i, question in enumerate(survey_data['questions']):
                required_q_fields = ['id', 'category', 'question', 'options']
                for field in required_q_fields:
                    if field not in question:
                        self.send_response(400)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'error': f'Question {i+1} missing required field: {field}'
                        }).encode())
                        return
                
                if not isinstance(question['options'], list) or len(question['options']) < 2:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'error': f'Question {i+1} must have at least 2 options'
                    }).encode())
                    return
            
            # Save to database
            supabase = SupabaseClient()
            
            # Prepare data for database
            db_data = {
                'survey_name': survey_data['survey_name'],
                'title': survey_data['title'],
                'description': survey_data['description'],
                'target_accuracy': survey_data['target_accuracy'],
                'questions': survey_data['questions'],
                'created_at': 'now()',
                'is_active': True
            }
            
            # Save to survey_templates table
            result = supabase.create_survey_template(db_data)
            
            if result:
                self.send_response(201)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'message': 'Survey created successfully',
                    'survey_id': result.get('id'),
                    'survey_name': survey_data['survey_name']
                }).encode())
            else:
                raise Exception("Failed to save survey to database")
                
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'Invalid JSON data'
            }).encode())
            
        except Exception as e:
            print(f"Error creating survey: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': f'Failed to create survey: {str(e)}'
            }).encode())

    def do_DELETE(self):
        """Delete a survey"""
        try:
            # Parse survey_name from query params
            if '?' not in self.path:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'survey_name parameter required'
                }).encode())
                return
            
            query_string = self.path.split('?')[1]
            params = {}
            for param in query_string.split('&'):
                if '=' in param:
                    key, value = param.split('=', 1)
                    params[key] = value
            
            survey_name = params.get('survey_name')
            if not survey_name:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'survey_name parameter required'
                }).encode())
                return
            
            supabase = SupabaseClient()
            result = supabase.delete_survey_template(survey_name)
            
            if result:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'message': 'Survey deleted successfully'
                }).encode())
            else:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Survey not found'
                }).encode())
                
        except Exception as e:
            print(f"Error deleting survey: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': f'Failed to delete survey: {str(e)}'
            }).encode())