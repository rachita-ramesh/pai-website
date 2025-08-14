#!/usr/bin/env python3
"""
Script to populate Supabase with initial data from local files
Run this once after setting up your Supabase database
"""

import os
import json
import sys

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️  python-dotenv not installed. Make sure environment variables are set manually.")
    pass

# Add lib to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from lib.supabase import SupabaseClient

def populate_survey_templates():
    """Load validation survey from local file and insert into Supabase"""
    survey_file = "backend/data/validation_results/validation_survey_1.json"
    
    if not os.path.exists(survey_file):
        print(f"Survey file not found: {survey_file}")
        return False
    
    try:
        supabase = SupabaseClient()
        
        # Load survey data
        with open(survey_file, 'r') as f:
            survey_data = json.load(f)
        
        # Prepare data for Supabase
        template_data = {
            'survey_name': 'validation_survey_1',
            'title': survey_data['survey_title'],
            'description': survey_data['description'],
            'target_accuracy': survey_data['target_accuracy'],
            'questions': survey_data['questions'],
            'version': 1,
            'is_active': True
        }
        
        # Insert survey template
        result = supabase._make_request('POST', 'survey_templates', template_data)
        print(f"✅ Survey template inserted successfully: {result}")
        return True
        
    except Exception as e:
        print(f"❌ Error inserting survey template: {str(e)}")
        return False

def populate_existing_profiles():
    """Load existing profiles from local files and insert into Supabase"""
    profiles_dir = "backend/data/profiles"
    
    if not os.path.exists(profiles_dir):
        print(f"Profiles directory not found: {profiles_dir}")
        return False
    
    try:
        supabase = SupabaseClient()
        
        # Get all profile files
        profile_files = [f for f in os.listdir(profiles_dir) if f.endswith('_profile.json')]
        
        for profile_file in profile_files:
            file_path = os.path.join(profiles_dir, profile_file)
            
            # Parse profile ID from filename (e.g., rachita_v1_profile.json -> rachita_v1)
            profile_id = profile_file.replace('_profile.json', '')
            
            # Extract person name and version
            if '_v' in profile_id:
                person_name, version_part = profile_id.rsplit('_v', 1)
                version_number = int(version_part)
            else:
                person_name = profile_id
                version_number = 1
                profile_id = f"{profile_id}_v1"
            
            # Load profile data
            with open(file_path, 'r') as f:
                profile_data = json.load(f)
            
            # Create person first
            supabase.create_person(person_name)
            
            # Prepare profile version data
            profile_version_data = {
                'profile_id': profile_id,
                'person_name': person_name,
                'version_number': version_number,
                'profile_data': profile_data,
                'is_active': True
            }
            
            # Insert profile version
            result = supabase.insert_profile_version(profile_version_data)
            print(f"✅ Profile inserted: {profile_id}")
    
    except Exception as e:
        print(f"❌ Error inserting profiles: {str(e)}")
        return False
    
    return True

def check_interview_templates():
    """Check if interview templates are loaded in Supabase"""
    try:
        supabase = SupabaseClient()
        templates = supabase.get_active_interview_templates()
        
        if templates:
            print(f"✅ Found {len(templates)} interview templates in database")
            for template in templates:
                print(f"   - {template['template_name']}: {template['title']}")
            return True
        else:
            print("⚠️  No interview templates found. Run supabase_interview_templates.sql first!")
            return False
            
    except Exception as e:
        print(f"❌ Error checking interview templates: {str(e)}")
        return False

def main():
    print("🚀 Populating Supabase with initial data...")
    
    # Check environment variables
    if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_ANON_KEY'):
        print("❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables")
        print("Please set them in your environment or .env file")
        return
    
    success = True
    
    print("\n1️⃣ Checking interview templates...")
    if not check_interview_templates():
        print("   💡 To fix: Run supabase_interview_templates.sql in your Supabase SQL editor")
        success = False
    
    print("\n2️⃣ Populating survey templates...")
    if not populate_survey_templates():
        success = False
    
    print("\n3️⃣ Populating existing profiles...")
    if not populate_existing_profiles():
        success = False
    
    if success:
        print("\n🎉 All data populated successfully!")
        print("Your Supabase database is ready for the PAI platform.")
        print("\n📊 Database contains:")
        print("   - Interview templates (for profile creation)")
        print("   - Survey templates (for validation)")
        print("   - Existing profile data")
    else:
        print("\n❌ Some operations failed. Check the errors above.")

if __name__ == "__main__":
    main()