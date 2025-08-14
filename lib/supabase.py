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
    
    def insert_profile(self, profile_data: Dict) -> Dict:
        """Insert a new profile into the profiles table"""
        return self._make_request('POST', 'profiles', profile_data)
    
    def get_profile(self, profile_id: str) -> Optional[Dict]:
        """Get a profile by profile_id"""
        try:
            result = self._make_request('GET', f'profiles?profile_id=eq.{profile_id}')
            return result[0] if result else None
        except:
            return None
    
    def update_profile(self, profile_id: str, profile_data: Dict) -> Dict:
        """Update an existing profile"""
        return self._make_request('PATCH', f'profiles?profile_id=eq.{profile_id}', profile_data)
    
    def get_all_profiles(self) -> List[Dict]:
        """Get all profiles"""
        try:
            return self._make_request('GET', 'profiles')
        except:
            return []
    
    def insert_interview(self, interview_data: Dict) -> Dict:
        """Insert interview data"""
        return self._make_request('POST', 'interviews', interview_data)
    
    def insert_validation_result(self, validation_data: Dict) -> Dict:
        """Insert validation test results"""
        return self._make_request('POST', 'validation_results', validation_data)