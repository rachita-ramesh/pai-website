#!/usr/bin/env python3
"""
Add tags to moisturizer_v1 questionnaire based on PDF structure.
Maps each question to appropriate profile sections and fields.
"""

import sys
import os
import ssl
ssl._create_default_https_context = ssl._create_unverified_context

# Add project root to path
sys.path.append('.')

from lib.supabase import SupabaseClient

def main():
    supabase = SupabaseClient()
    
    print("=== ADDING TAGS TO MOISTURIZER_V1 QUESTIONNAIRE ===")
    
    # Get current moisturizer questionnaire
    moisturizer_quest = supabase.get_custom_questionnaire('moisturizer_v1')
    if not moisturizer_quest:
        print("❌ moisturizer_v1 questionnaire not found")
        return
    
    questions = moisturizer_quest.get('questions', [])
    print(f"Found moisturizer_v1 with {len(questions)} questions")
    
    # Define tag mapping based on PDF sections
    # Section 1: Facial Moisturizer Attitudes (Questions 1-7)
    # Section 2: Moisturizer Usage (Questions 8-13)  
    # Section 3: Shopping Behaviors (Questions 14-20)
    # Section 4: Information Sources & Messaging (Questions 21-23)
    
    question_tags = {
        'q1': [['facial_moisturizer_attitudes', 'benefits_sought']],
        'q2': [['facial_moisturizer_attitudes', 'most_important_benefit']],
        'q3': [['facial_moisturizer_attitudes', 'sustainable_values']],
        'q4': [['facial_moisturizer_attitudes', 'ingredients_seeking']],
        'q5': [['facial_moisturizer_attitudes', 'ingredients_avoided']],
        'q6': [['facial_moisturizer_attitudes', 'dermatologist_recommended']],
        'q7': [['facial_moisturizer_attitudes', 'moisturizer_frustrations']],
        
        'q8': [['moisturizer_usage', 'current_product_usage']],
        'q9': [['moisturizer_usage', 'current_product_satisfaction']],
        'q10': [['moisturizer_usage', 'brand_awareness']],
        'q11': [['moisturizer_usage', 'brand_consideration']],
        'q12': [['moisturizer_usage', 'past_usage']],
        'q13': [['moisturizer_usage', 'switching_triggers']],
        
        'q14': [['shopping_behaviors', 'online_vs_instore_shopping']],
        'q15': [['shopping_behaviors', 'purchase_frequency']],
        'q16': [['shopping_behaviors', 'budget_price_point']],
        'q17': [['shopping_behaviors', 'premium_cues']],
        'q18': [['shopping_behaviors', 'deal_sensitivity']],
        'q19': [['shopping_behaviors', 'packaging_presentation']],
        'q20': [['shopping_behaviors', 'brand_attributes']],
        
        'q21': [['information_sources_messaging', 'information_searching']],
        'q22': [['information_sources_messaging', 'general_information_sources']],
        'q23': [['information_sources_messaging', 'ideal_product']]
    }
    
    # Update each question with appropriate tags
    updated_count = 0
    for question in questions:
        question_id = question.get('id', '')
        if question_id in question_tags:
            question['tags'] = question_tags[question_id]
            updated_count += 1
            print(f"✅ Added tags to {question_id}: {question_tags[question_id]}")
        else:
            print(f"⚠️  No tags defined for {question_id}")
    
    print(f"\nUpdated {updated_count} questions with tags")
    
    # Save updated questionnaire back to database
    print("\nSaving updated questionnaire to database...")
    try:
        moisturizer_quest['questions'] = questions
        result = supabase._make_request('PATCH', 'custom_questionnaires?questionnaire_id=eq.moisturizer_v1', moisturizer_quest)
        print("✅ Successfully updated moisturizer_v1 questionnaire with tags")
        
        # Verify the update
        print("\n=== VERIFICATION ===")
        updated_quest = supabase.get_custom_questionnaire('moisturizer_v1')
        if updated_quest:
            updated_questions = updated_quest.get('questions', [])
            tagged_questions = [q for q in updated_questions if q.get('tags')]
            print(f"Verified: {len(tagged_questions)} questions now have tags")
            
            # Show first few examples
            for i, q in enumerate(updated_questions[:3]):
                tags = q.get('tags', [])
                print(f"Q{i+1} tags: {tags}")
        
    except Exception as e:
        print(f"❌ Error updating questionnaire: {e}")

if __name__ == "__main__":
    main()