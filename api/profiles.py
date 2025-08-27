#!/usr/bin/env python3
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            # Get person_name from query parameters
            person_name = query_params.get('person_name', [''])[0]
            
            if not person_name:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                self.wfile.write(json.dumps({'error': 'person_name parameter is required'}).encode('utf-8'))
                return
            
            # Import Supabase client
            sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
            from lib.supabase import SupabaseClient
            import ssl
            ssl._create_default_https_context = ssl._create_unverified_context
            
            supabase = SupabaseClient()
            profiles = supabase.get_person_profiles(person_name)
            
            print(f"DEBUG: Found {len(profiles)} profiles for {person_name}")
            for p in profiles[:2]:
                print(f"DEBUG: Profile {p.get('profile_id')} - Active: {p.get('is_active')}")
            
            # Transform the data to match frontend expectations
            transformed_profiles = []
            for profile in profiles:
                transformed_profiles.append({
                    'profile_id': profile.get('profile_id'),
                    'is_active': profile.get('is_active', False),
                    'created_at': profile.get('created_at'),
                    'completeness_metadata': profile.get('completeness_metadata', {})
                })
                
            print(f"DEBUG: Transformed {len(transformed_profiles)} profiles")
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(transformed_profiles).encode('utf-8'))
            
        except Exception as e:
            print(f"Error in ProfilesHandler: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

# Vercel serverless function - no main server needed