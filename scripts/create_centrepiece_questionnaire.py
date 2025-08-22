#!/usr/bin/env python3
"""
Script to create the centrepiece questionnaire in the database
"""

import os
import sys
import json
from datetime import datetime
import ssl
import urllib.request

# Handle SSL certificate issues on macOS
ssl._create_default_https_context = ssl._create_unverified_context

# Add the parent directory to the path to import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.supabase import SupabaseClient

# The 31 centrepiece questions provided by the user
CENTREPIECE_QUESTIONS = [
    {"id": "q1", "text": "Walk me through an average weekday in your life. Do you work right now? If so, what do you do? \nIf 'Yes' → Do you enjoy your job? What parts do you like most? Which parts do you like least? (this can surface motivations like creativity, structure, people work, etc.)", "type": "open_ended", "helpText": "", "required": True, "question_order": 1},
    {"id": "q2", "text": "Moving on to your lifestyle. In a typical week, how active are you? Do you go to the gym, play sports, go for walks, or is that not your thing?\nIf 'Yes' → Why do you do those activities? Is it strictly for fitness or do you find it fun, social or anything else?", "type": "open_ended", "helpText": "", "required": True, "question_order": 2},
    {"id": "q3", "text": "Overall, how important is wellness and mental health to you? Are there specific things you do to maintain it?", "type": "open_ended", "helpText": "", "required": True, "question_order": 3},
    {"id": "q4", "text": "What are some of your favorite hobbies, interests or things you like to do?\nFollow up: What do you like about them?\nFollow up: Are these things you do alone, with friends, or both?\n", "type": "open_ended", "helpText": "", "required": True, "question_order": 4},
    {"id": "q5", "text": "What's a typical weekend look like for you? Do you tend to go out, travel, spend time outdoors, or stay in?", "type": "open_ended", "helpText": "", "required": True, "question_order": 5},
    {"id": "q6", "text": "Let's move on to things you like to consume. Where do you typically get your news? Are there specific things you read, social media platforms you use, podcasts you listen to, or TV channels you watch?", "type": "open_ended", "helpText": "", "required": True, "question_order": 6},
    {"id": "q7", "text": "What are some of your favorite topics to learn about?", "type": "open_ended", "helpText": "", "required": True, "question_order": 7},
    {"id": "q8", "text": "How often are you on social media? What platforms are you on, and which do you like the most?", "type": "open_ended", "helpText": "", "required": True, "question_order": 8},
    {"id": "q9", "text": "What type of content do you enjoy on social media? Do you ever post yourself?", "type": "open_ended", "helpText": "", "required": True, "question_order": 9},
    {"id": "q10", "text": "How often do you watch TV? Do you have any streaming services or cable?", "type": "open_ended", "helpText": "", "required": True, "question_order": 10},
    {"id": "q11", "text": "What shows do you watch and what kinds of movies do you like?", "type": "open_ended", "helpText": "", "required": True, "question_order": 11},
    {"id": "q12", "text": "What's your favorite movie of all time?", "type": "open_ended", "helpText": "", "required": True, "question_order": 12},
    {"id": "q13", "text": "How often do you watch sports, and what teams are you a fan of?", "type": "open_ended", "helpText": "", "required": True, "question_order": 13},
    {"id": "q14", "text": "What kind of music do you listen to and how often?", "type": "open_ended", "helpText": "", "required": True, "question_order": 14},
    {"id": "q15", "text": "Do you go to concerts or festivals? If so, how often?", "type": "open_ended", "helpText": "", "required": True, "question_order": 15},
    {"id": "q16", "text": "Who are your favorite celebrities or public figures?", "type": "open_ended", "helpText": "", "required": True, "question_order": 16},
    {"id": "q17", "text": "Which celebrities or figures have influenced you the most, and how have they influenced you?", "type": "open_ended", "helpText": "", "required": True, "question_order": 17},
    {"id": "q18", "text": "Now let's move on to understanding your personality. if you had to describe yourself in a few words, what would you say?", "type": "open_ended", "helpText": "", "required": True, "question_order": 18},
    {"id": "q19", "text": "What's something about you that you think people often misunderstand or don't know about you?", "type": "open_ended", "helpText": "", "required": True, "question_order": 19},
    {"id": "q20", "text": "How eager would you say you are to explore new ideas, experiences, or creative hobbies?", "type": "open_ended", "helpText": "", "required": True, "question_order": 20},
    {"id": "q21", "text": "In general, do you prefer structure and plans, or do you like going with the flow?", "type": "open_ended", "helpText": "", "required": True, "question_order": 21},
    {"id": "q22", "text": "Would you say you're more energized by being around people, or by having time to yourself?", "type": "open_ended", "helpText": "", "required": True, "question_order": 22},
    {"id": "q23", "text": "When things get stressful, how do you usually handle it?", "type": "open_ended", "helpText": "", "required": True, "question_order": 23},
    {"id": "q24", "text": "What personal strengths do you think you rely on the most?", "type": "open_ended", "helpText": "", "required": True, "question_order": 24},
    {"id": "q25", "text": "Now let's move on to the final piece, your values and beliefs. When it comes to what's most important in life like family, health, freedom, financial security, community, what's at the top for you, and why?", "type": "open_ended", "helpText": "", "required": True, "question_order": 25},
    {"id": "q26", "text": "Who do you trust most for advice, and why?", "type": "open_ended", "helpText": "", "required": True, "question_order": 26},
    {"id": "q27", "text": "Do you follow politics or current events closely, casually, or not much at all?", "type": "open_ended", "helpText": "", "required": True, "question_order": 27},
    {"id": "q28", "text": "Do you discuss or post about political or social issues, or do you prefer to keep that private?", "type": "open_ended", "helpText": "", "required": True, "question_order": 28},
    {"id": "q29", "text": "If you had to place yourself on a scale from very liberal to very conservative, where would you say you lean?", "type": "open_ended", "helpText": "", "required": True, "question_order": 29},
    {"id": "q30", "text": "If you could make one positive change in the world, what would it be?", "type": "open_ended", "helpText": "", "required": True, "question_order": 30},
    {"id": "q31", "text": "When you make big decisions, what do you think about first—security, impact, personal meaning, or something else?", "type": "open_ended", "helpText": "", "required": True, "question_order": 31}
]

def create_centrepiece_questionnaire():
    """Create the centrepiece questionnaire in the database"""
    
    print("Creating centrepiece questionnaire...")
    
    # Initialize Supabase client
    supabase = SupabaseClient()
    
    # Questionnaire data
    questionnaire_data = {
        'questionnaire_id': 'centrepiece',
        'title': 'Centrepiece Interview v1',
        'description': 'Core personality and general life attitudes questionnaire for building digital twin foundation',
        'questionnaire_type': 'centrepiece',
        'category': 'general_life',
        'questions': CENTREPIECE_QUESTIONS,  # Store as JSONB
        'estimated_duration': 20,  # 20 minutes for 31 questions
        'is_public': True,
        'created_by': 'system',
        'is_active': True
    }
    
    print(f"Questionnaire data: {questionnaire_data['questionnaire_id']}")
    print(f"Title: {questionnaire_data['title']}")
    print(f"Questions: {len(questionnaire_data['questions'])}")
    
    try:
        # Check if questionnaire already exists
        existing = supabase.get_custom_questionnaire('centrepiece')
        if existing:
            print("Centrepiece questionnaire already exists. Updating...")
            # Update the existing questionnaire
            update_result = supabase._make_request('PATCH', 
                f'custom_questionnaires?questionnaire_id=eq.centrepiece', 
                questionnaire_data)
            print(f"Updated questionnaire: {update_result}")
        else:
            print("Creating new centrepiece questionnaire...")
            # Create new questionnaire
            result = supabase.create_custom_questionnaire(questionnaire_data)
            print(f"Created questionnaire: {result}")
        
        print("SUCCESS: Centrepiece questionnaire created/updated successfully!")
        
        # Verify it was created
        verify = supabase.get_custom_questionnaire('centrepiece')
        if verify:
            print(f"Verification: Found questionnaire with {len(verify.get('questions', []))} questions")
        else:
            print("ERROR: Could not verify questionnaire was created")
            
    except Exception as e:
        print(f"ERROR creating questionnaire: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = create_centrepiece_questionnaire()
    sys.exit(0 if success else 1)