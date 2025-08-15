import os
import json
from typing import Dict, List, Optional

class SupabaseClient:
    def __init__(self):
        self.url = os.getenv('SUPABASE_URL')
        self.key = os.getenv('SUPABASE_ANON_KEY')
        
        if not self.url or not self.key:
            raise Exception('SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required')
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, headers: Optional[Dict] = None) -> Dict:
        """Make HTTP request to Supabase REST API"""
        import urllib.request
        import urllib.parse
        
        url = f"{self.url}/rest/v1/{endpoint}"
        
        default_headers = {
            'apikey': self.key,
            'Authorization': f'Bearer {self.key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
        
        if headers:
            default_headers.update(headers)
        
        request_data = None
        if data:
            request_data = json.dumps(data).encode('utf-8')
        
        req = urllib.request.Request(url, data=request_data, headers=default_headers, method=method)
        
        try:
            with urllib.request.urlopen(req) as response:
                response_data = response.read().decode('utf-8')
                return json.loads(response_data) if response_data else {}
        except urllib.error.HTTPError as e:
            error_data = e.read().decode('utf-8')
            raise Exception(f"Supabase error: {e.code} - {error_data}")
    
    # ============================================================================
    # PROFILE MANAGEMENT
    # ============================================================================
    
    def create_person(self, name: str) -> Dict:
        """Create or get a person"""
        try:
            return self._make_request('POST', 'people', {'name': name})
        except:
            # Person might already exist, try to get them
            result = self._make_request('GET', f'people?name=eq.{name}')
            return result[0] if result else {}
    
    def insert_profile_version(self, profile_data: Dict) -> Dict:
        """Insert a new profile version"""
        return self._make_request('POST', 'profile_versions', profile_data)
    
    def get_profile_version(self, profile_id: str) -> Optional[Dict]:
        """Get a specific profile version by profile_id"""
        try:
            result = self._make_request('GET', f'profile_versions?profile_id=eq.{profile_id}')
            return result[0] if result else None
        except:
            return None
    
    def get_active_profiles(self) -> List[Dict]:
        """Get all active profile versions"""
        try:
            return self._make_request('GET', 'profile_versions?is_active=eq.true')
        except:
            return []
    
    def get_person_profiles(self, person_name: str) -> List[Dict]:
        """Get all profile versions for a person"""
        try:
            return self._make_request('GET', f'profile_versions?person_name=eq.{person_name}&order=version_number.desc')
        except:
            return []
    
    def update_profile_version(self, profile_id: str, profile_data: Dict) -> Dict:
        """Update an existing profile version"""
        return self._make_request('PATCH', f'profile_versions?profile_id=eq.{profile_id}', profile_data)
    
    # ============================================================================
    # INTERVIEW TEMPLATES & MANAGEMENT
    # ============================================================================
    
    def get_interview_template(self, template_name: str) -> Optional[Dict]:
        """Get interview template by name"""
        try:
            result = self._make_request('GET', f'interview_templates?template_name=eq.{template_name}')
            return result[0] if result else None
        except:
            return None
    
    def get_interview_topics(self, template_name: str) -> List[Dict]:
        """Get interview topics for a template"""
        try:
            return self._make_request('GET', f'interview_topics?template_name=eq.{template_name}&order=topic_order.asc')
        except:
            return []
    
    def get_active_interview_templates(self) -> List[Dict]:
        """Get all active interview templates"""
        try:
            return self._make_request('GET', 'interview_templates?is_active=eq.true')
        except:
            return []
    
    # ============================================================================
    # INTERVIEW SESSIONS
    # ============================================================================
    
    def insert_interview_session(self, interview_data: Dict) -> Dict:
        """Insert interview session data"""
        return self._make_request('POST', 'interview_sessions', interview_data)
    
    def get_interview_session(self, session_id: str) -> Optional[Dict]:
        """Get interview session by session_id"""
        try:
            print(f"DEBUG: Querying interview_sessions for session_id: {session_id}")
            result = self._make_request('GET', f'interview_sessions?session_id=eq.{session_id}')
            print(f"DEBUG: Query result: {result}")
            return result[0] if result else None
        except Exception as e:
            print(f"DEBUG: Error querying interview session: {e}")
            return None
    
    def complete_interview_session(self, session_id: str, profile_id: str) -> Dict:
        """Mark interview session as complete and link to profile"""
        return self._make_request('PATCH', f'interview_sessions?session_id=eq.{session_id}', {
            'is_complete': True,
            'profile_id': profile_id,
            'completed_at': 'NOW()'
        })
    
    # ============================================================================
    # SURVEY & VALIDATION MANAGEMENT
    # ============================================================================
    
    def get_survey_template(self, survey_name: str) -> Optional[Dict]:
        """Get survey template by name"""
        try:
            result = self._make_request('GET', f'survey_templates?survey_name=eq.{survey_name}')
            return result[0] if result else None
        except:
            return None
    
    def create_validation_test_session(self, test_data: Dict) -> Dict:
        """Create a new validation test session"""
        return self._make_request('POST', 'validation_test_sessions', test_data)
    
    def insert_question_response(self, response_data: Dict) -> Dict:
        """Insert a question response"""
        return self._make_request('POST', 'question_responses', response_data)
    
    def insert_validation_result(self, result_data: Dict) -> Dict:
        """Insert validation test results"""
        return self._make_request('POST', 'validation_test_results', result_data)
    
    def get_validation_results(self, profile_id: str) -> List[Dict]:
        """Get all validation results for a profile"""
        try:
            return self._make_request('GET', f'validation_test_results?profile_id=eq.{profile_id}&order=created_at.desc')
        except:
            return []
    
    def get_test_session_results(self, test_session_id: str) -> Optional[Dict]:
        """Get detailed results for a specific test session"""
        try:
            result = self._make_request('GET', f'validation_test_results?test_session_id=eq.{test_session_id}')
            return result[0] if result else None
        except:
            return None
    
    # ============================================================================
    # AI PREDICTIONS & ANALYTICS
    # ============================================================================
    
    def insert_ai_prediction(self, prediction_data: Dict) -> Dict:
        """Insert AI prediction data"""
        return self._make_request('POST', 'ai_predictions', prediction_data)
    
    def get_profile_predictions(self, profile_id: str) -> List[Dict]:
        """Get all AI predictions for a profile"""
        try:
            return self._make_request('GET', f'ai_predictions?profile_id=eq.{profile_id}')
        except:
            return []
    
    def update_test_history_summary(self, profile_id: str, summary_data: Dict) -> Dict:
        """Update or create test history summary"""
        try:
            # Try to update existing
            return self._make_request('PATCH', f'test_history_summary?profile_id=eq.{profile_id}', summary_data)
        except:
            # Create new if doesn't exist
            summary_data['profile_id'] = profile_id
            return self._make_request('POST', 'test_history_summary', summary_data)
    
    def get_test_history_summary(self, profile_id: str) -> Optional[Dict]:
        """Get test history summary for a profile"""
        try:
            result = self._make_request('GET', f'test_history_summary?profile_id=eq.{profile_id}')
            return result[0] if result else None
        except:
            return None
    
    # ============================================================================
    # CUSTOM QUESTIONNAIRES
    # ============================================================================
    
    def create_custom_questionnaire(self, questionnaire_data: Dict) -> Dict:
        """Create a new custom questionnaire"""
        return self._make_request('POST', 'custom_questionnaires', questionnaire_data)
    
    def add_questionnaire_question(self, question_data: Dict) -> Dict:
        """Add a question to a questionnaire"""
        return self._make_request('POST', 'questionnaire_questions', question_data)
    
    def get_custom_questionnaire(self, questionnaire_id: str) -> Optional[Dict]:
        """Get a custom questionnaire by ID"""
        try:
            result = self._make_request('GET', f'custom_questionnaires?questionnaire_id=eq.{questionnaire_id}')
            return result[0] if result else None
        except:
            return None
    
    def get_questionnaire_questions(self, questionnaire_id: str) -> List[Dict]:
        """Get all questions for a questionnaire"""
        try:
            return self._make_request('GET', f'questionnaire_questions?questionnaire_id=eq.{questionnaire_id}&order=question_order.asc')
        except:
            return []
    
    def get_public_questionnaires(self) -> List[Dict]:
        """Get all public questionnaires"""
        try:
            return self._make_request('GET', 'custom_questionnaires?is_public=eq.true&is_active=eq.true&order=created_at.desc')
        except:
            return []
    
    def get_questionnaires_by_category(self, category: str) -> List[Dict]:
        """Get questionnaires by category"""
        try:
            return self._make_request('GET', f'custom_questionnaires?category=eq.{category}&is_active=eq.true&order=usage_count.desc')
        except:
            return []
    
    def increment_questionnaire_usage(self, questionnaire_id: str) -> Dict:
        """Increment usage count for a questionnaire"""
        return self._make_request('PATCH', f'custom_questionnaires?questionnaire_id=eq.{questionnaire_id}', {
            'usage_count': 'usage_count + 1',
            'updated_at': 'NOW()'
        })
    
    def record_questionnaire_usage(self, usage_data: Dict) -> Dict:
        """Record questionnaire usage tracking"""
        return self._make_request('POST', 'questionnaire_usage', usage_data)
    
    # ============================================================================
    # CONVERSATION MESSAGE STORAGE (stored in interview_sessions.messages JSONB)
    # ============================================================================
    
    def get_session_messages_from_interview(self, session_id: str) -> List[Dict]:
        """Get conversation messages from interview_sessions.messages JSONB field"""
        try:
            interview_session = self.get_interview_session(session_id)
            if interview_session:
                return interview_session.get('messages', [])
            return []
        except:
            return []
    
    # ============================================================================
    # INTERVIEW SESSIONS & PROFILE MANAGEMENT
    # ============================================================================
    
    def create_person(self, name: str) -> Dict:
        """Create a new person record"""
        person_data = {
            'name': name,
            'created_at': 'NOW()',
            'updated_at': 'NOW()'
        }
        return self._make_request('POST', 'people', person_data)
    
    def get_person(self, name: str) -> Optional[Dict]:
        """Get person by name"""
        try:
            result = self._make_request('GET', f'people?name=eq.{name}')
            return result[0] if result else None
        except:
            return None
    
    def create_interview_session(self, session_data: Dict) -> Dict:
        """Create a new interview session"""
        print(f"DEBUG: Creating interview session with data: {session_data}")
        result = self._make_request('POST', 'interview_sessions', session_data)
        print(f"DEBUG: Created interview session result: {result}")
        return result
    
    def update_interview_session(self, session_id: str, updates: Dict) -> Dict:
        """Update an existing interview session"""
        return self._make_request('PATCH', f'interview_sessions?session_id=eq.{session_id}', updates)
    
    
    def create_profile_version(self, profile_data: Dict) -> Dict:
        """Create a new profile version"""
        return self._make_request('POST', 'profile_versions', profile_data)
    
    def get_latest_profile_version(self, person_name: str) -> Optional[Dict]:
        """Get the latest profile version for a person"""
        try:
            import urllib.parse
            # URL encode the person name to handle spaces and special characters
            encoded_name = urllib.parse.quote(person_name.strip())
            print(f"DEBUG: Querying latest profile version for person: {person_name} (encoded: {encoded_name})")
            result = self._make_request('GET', f'profile_versions?person_name=eq.{encoded_name}&order=version_number.desc&limit=1')
            print(f"DEBUG: Latest profile query result: {result}")
            return result[0] if result else None
        except Exception as e:
            print(f"DEBUG: Error getting latest profile version: {e}")
            return None