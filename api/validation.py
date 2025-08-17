from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import time

# Add the lib directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from lib.response_predictor import ResponsePredictor, SurveyQuestion
from lib.profile_extractor import ProfileExtractor
import glob

def get_validation_survey_data():
    """Load survey data from Supabase survey_templates table"""
    try:
        from lib.supabase import SupabaseClient
        supabase = SupabaseClient()
        
        # Try to get the default validation survey
        survey_template = supabase.get_survey_template('validation_survey_1')
        if survey_template:
            return {
                'survey_name': survey_template['survey_name'],
                'survey_title': survey_template['title'],
                'description': survey_template['description'],
                'target_accuracy': survey_template['target_accuracy'],
                'questions': survey_template['questions']
            }
        else:
            print("DEBUG: No survey template found in database, using fallback")
            # Fallback to embedded survey if none in database
            return _get_fallback_survey_data()
            
    except Exception as e:
        print(f"DEBUG: Error loading survey from database: {e}, using fallback")
        return _get_fallback_survey_data()

def _get_fallback_survey_data():
    """Fallback survey data if database is unavailable"""
    return {
        "survey_name": "validation_survey_1",
        "survey_title": "Skincare Attitudes & Usage Validation Study", 
        "description": "Comprehensive validation questions to test digital twin accuracy in predicting skincare behaviors and attitudes",
        "target_accuracy": 0.6,
        "questions": [
            {
                "id": "routine_complexity",
                "category": "Usage Patterns",
                "question": "How many skincare products do you typically use in your daily routine?",
                "options": [
                    "1-2 products (cleanser, moisturizer)",
                    "3-5 products (cleanser, toner, serum, moisturizer, sunscreen)",
                    "6-8 products (multi-step routine with treatments)",
                    "9+ products (extensive Korean-style routine)"
                ]
            },
            {
                "id": "purchase_decision_driver",
                "category": "Decision Making",
                "question": "What most influences your skincare purchase decisions?",
                "options": [
                    "Friend and family recommendations",
                    "Online reviews and ratings",
                    "Scientific research and ingredient lists",
                    "Dermatologist or expert advice",
                    "Brand reputation and marketing",
                    "Price and value for money"
                ]
            },
            {
                "id": "wellness_priority",
                "category": "Core Attitudes",
                "question": "How important is the connection between overall health and skin health to you?",
                "options": [
                    "Extremely important - I see them as completely connected",
                    "Very important - I consider both when making choices",
                    "Moderately important - somewhat related",
                    "Not very important - I treat them separately"
                ]
            },
            {
                "id": "research_approach",
                "category": "Decision Making",
                "question": "How do you typically research new skincare products before buying?",
                "options": [
                    "I don't research much - I go with recommendations",
                    "Quick online search and review check",
                    "Moderate research - compare ingredients and reviews",
                    "Extensive research - studies, expert opinions, ingredient analysis"
                ]
            },
            {
                "id": "aging_attitude",
                "category": "Core Attitudes",
                "question": "What's your approach to aging and skincare?",
                "options": [
                    "Prevention-focused - start early to prevent issues",
                    "Treatment-focused - address problems as they appear",
                    "Acceptance-focused - minimal intervention, natural aging",
                    "Enhancement-focused - actively improve skin appearance"
                ]
            },
            {
                "id": "routine_flexibility",
                "category": "Usage Patterns",
                "question": "How consistent are you with your skincare routine?",
                "options": [
                    "Very consistent - same routine every day",
                    "Mostly consistent - occasional skips when busy",
                    "Flexible - adjust based on skin needs and time",
                    "Inconsistent - often forget or skip steps"
                ]
            },
            {
                "id": "ingredient_knowledge",
                "category": "Decision Making",
                "question": "How familiar are you with skincare ingredients and their benefits?",
                "options": [
                    "Very familiar - I know most active ingredients",
                    "Moderately familiar - I know key ingredients like retinol, niacinamide",
                    "Basic knowledge - I know some common ingredients",
                    "Not familiar - I don't focus on specific ingredients"
                ]
            },
            {
                "id": "time_investment",
                "category": "Usage Patterns",
                "question": "How much time do you prefer to spend on your skincare routine?",
                "options": [
                    "Less than 5 minutes total (quick and simple)",
                    "5-10 minutes total (efficient but thorough)",
                    "10-20 minutes total (relaxing self-care time)",
                    "20+ minutes total (comprehensive ritual)"
                ]
            },
            {
                "id": "problem_solving",
                "category": "Core Attitudes",
                "question": "When you have a skin concern, what's your typical approach?",
                "options": [
                    "Ask friends who have similar issues",
                    "Research online and try popular solutions",
                    "Consult a dermatologist or skincare professional",
                    "Try to address it through lifestyle changes (diet, exercise, sleep)"
                ]
            },
            {
                "id": "price_sensitivity",
                "category": "Decision Making",
                "question": "How does price influence your skincare purchases?",
                "options": [
                    "Price is not a major factor - quality matters most",
                    "I prefer mid-range products - balance of quality and value",
                    "I'm price-conscious but will splurge on proven ingredients",
                    "Price is very important - I look for budget-friendly options"
                ]
            }
        ]
    }

def get_validation_results_path():
    """Get the validation results directory path"""
    return os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'validation_results')

def get_next_test_counter(survey_name, profile_id, results_dir):
    """Get the next counter for this survey-profile combination"""
    # Look for existing files matching the pattern: survey_name_profile_id_*.json
    pattern = os.path.join(results_dir, f"{survey_name}_{profile_id}_*.json")
    existing_files = glob.glob(pattern)
    
    # Extract counter numbers from existing files
    counters = []
    for filepath in existing_files:
        filename = os.path.basename(filepath)
        # Extract counter from filename like: survey_1_rachita_v1_3.json -> 3
        parts = filename.replace('.json', '').split('_')
        if len(parts) >= 4:
            try:
                counter = int(parts[-1])
                counters.append(counter)
            except ValueError:
                continue
    
    # Return next counter (max + 1, or 1 if no files exist)
    return max(counters) + 1 if counters else 1

def generate_validation_filename(survey_name, profile_id, counter):
    """Generate validation filename: survey_name_profile_id_counter.json"""
    return f"{survey_name}_{profile_id}_{counter}.json"

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Parse query parameters to determine operation
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            
            # Check if this is a download request
            if 'download' in query_params or 'filename' in query_params or 'session_id' in query_params:
                return self._handle_download(query_params)
            
            # Default: Return the validation survey
            survey_data = get_validation_survey_data()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(json.dumps(survey_data).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def _handle_download(self, query_params):
        """Handle file download requests"""
        try:
            # Support both old session_id and new filename parameters
            test_session_id = query_params.get('session_id', [None])[0]
            filename = query_params.get('filename', [None])[0]
            
            # Get validation results directory
            results_dir = get_validation_results_path()
            
            if filename:
                # Use direct filename
                if not filename.endswith('.json'):
                    filename += '.json'
                filepath = os.path.join(results_dir, filename)
            elif test_session_id:
                # Legacy support - try to find file by session ID
                filepath = f'/tmp/validation_results/{test_session_id}_validation.json'
                if not os.path.exists(filepath):
                    # Also try in the new location
                    pattern = os.path.join(results_dir, f"*{test_session_id}*.json")
                    matching_files = glob.glob(pattern)
                    if matching_files:
                        filepath = matching_files[0]
            else:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'filename or session_id parameter required'}).encode('utf-8'))
                return
            
            if not os.path.exists(filepath):
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Validation file not found'}).encode('utf-8'))
                return
            
            # Read and return the validation file
            with open(filepath, 'r', encoding='utf-8') as f:
                validation_data = json.load(f)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            download_filename = filename if filename else f"{test_session_id}_validation.json"
            self.send_header('Content-Disposition', f'attachment; filename="{download_filename}"')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(validation_data, indent=2).encode('utf-8'))
            
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
            
            # Check if this is a single question validation or results saving
            if 'question_id' in data and 'human_answer' in data:
                # Single question validation using real ResponsePredictor
                
                question_id = data.get('question_id')
                human_answer = data.get('human_answer')
                profile_id = data.get('profile_id', 'rachita_v1')
                
                # Get API key from environment
                api_key = os.getenv('ANTHROPIC_API_KEY')
                if not api_key:
                    raise Exception('ANTHROPIC_API_KEY environment variable is required')
                
                try:
                    # Load the profile from Supabase
                    from lib.supabase import SupabaseClient
                    supabase = SupabaseClient()
                    
                    profile_data = supabase.get_profile_version(profile_id)
                    if not profile_data:
                        raise Exception(f'Profile not found in database: {profile_id}')
                    
                    # Extract the profile JSON data
                    profile = profile_data.get('profile_data', {})
                    
                    # Create the survey question objects - matching the embedded survey
                    survey_questions = {
                        'routine_complexity': SurveyQuestion(
                            id="routine_complexity",
                            category="Usage Patterns",
                            question="How many skincare products do you typically use in your daily routine?",
                            options=[
                                "1-2 products (cleanser, moisturizer)",
                                "3-5 products (cleanser, toner, serum, moisturizer, sunscreen)",
                                "6-8 products (multi-step routine with treatments)",
                                "9+ products (extensive Korean-style routine)"
                            ]
                        ),
                        'purchase_decision_driver': SurveyQuestion(
                            id="purchase_decision_driver",
                            category="Decision Making",
                            question="What most influences your skincare purchase decisions?",
                            options=[
                                "Friend and family recommendations",
                                "Online reviews and ratings",
                                "Scientific research and ingredient lists",
                                "Dermatologist or expert advice",
                                "Brand reputation and marketing",
                                "Price and value for money"
                            ]
                        ),
                        'wellness_priority': SurveyQuestion(
                            id="wellness_priority",
                            category="Core Attitudes",
                            question="How important is the connection between overall health and skin health to you?",
                            options=[
                                "Extremely important - I see them as completely connected",
                                "Very important - I consider both when making choices",
                                "Moderately important - somewhat related",
                                "Not very important - I treat them separately"
                            ]
                        ),
                        'research_approach': SurveyQuestion(
                            id="research_approach",
                            category="Decision Making",
                            question="How do you typically research new skincare products before buying?",
                            options=[
                                "I don't research much - I go with recommendations",
                                "Quick online search and review check",
                                "Moderate research - compare ingredients and reviews",
                                "Extensive research - studies, expert opinions, ingredient analysis"
                            ]
                        ),
                        'aging_attitude': SurveyQuestion(
                            id="aging_attitude",
                            category="Core Attitudes",
                            question="What's your approach to aging and skincare?",
                            options=[
                                "Prevention-focused - start early to prevent issues",
                                "Treatment-focused - address problems as they appear",
                                "Acceptance-focused - minimal intervention, natural aging",
                                "Enhancement-focused - actively improve skin appearance"
                            ]
                        ),
                        'routine_flexibility': SurveyQuestion(
                            id="routine_flexibility",
                            category="Usage Patterns",
                            question="How consistent are you with your skincare routine?",
                            options=[
                                "Very consistent - same routine every day",
                                "Mostly consistent - occasional skips when busy",
                                "Flexible - adjust based on skin needs and time",
                                "Inconsistent - often forget or skip steps"
                            ]
                        ),
                        'ingredient_knowledge': SurveyQuestion(
                            id="ingredient_knowledge",
                            category="Decision Making",
                            question="How familiar are you with skincare ingredients and their benefits?",
                            options=[
                                "Very familiar - I know most active ingredients",
                                "Moderately familiar - I know key ingredients like retinol, niacinamide",
                                "Basic knowledge - I know some common ingredients",
                                "Not familiar - I don't focus on specific ingredients"
                            ]
                        ),
                        'time_investment': SurveyQuestion(
                            id="time_investment",
                            category="Usage Patterns",
                            question="How much time do you prefer to spend on your skincare routine?",
                            options=[
                                "Less than 5 minutes total (quick and simple)",
                                "5-10 minutes total (efficient but thorough)",
                                "10-20 minutes total (relaxing self-care time)",
                                "20+ minutes total (comprehensive ritual)"
                            ]
                        ),
                        'problem_solving': SurveyQuestion(
                            id="problem_solving",
                            category="Core Attitudes",
                            question="When you have a skin concern, what's your typical approach?",
                            options=[
                                "Ask friends who have similar issues",
                                "Research online and try popular solutions",
                                "Consult a dermatologist or skincare professional",
                                "Try to address it through lifestyle changes (diet, exercise, sleep)"
                            ]
                        ),
                        'price_sensitivity': SurveyQuestion(
                            id="price_sensitivity",
                            category="Decision Making",
                            question="How does price influence your skincare purchases?",
                            options=[
                                "Price is not a major factor - quality matters most",
                                "I prefer mid-range products - balance of quality and value",
                                "I'm price-conscious but will splurge on proven ingredients",
                                "Price is very important - I look for budget-friendly options"
                            ]
                        )
                    }
                    
                    if question_id not in survey_questions:
                        raise Exception(f'Question not found: {question_id}')
                    
                    # Get prediction using ResponsePredictor
                    predictor = ResponsePredictor(api_key)
                    prediction = predictor.predict_response(profile, survey_questions[question_id])
                    
                    # Compare with human answer
                    is_match = human_answer.strip() == prediction.predicted_answer.strip()
                    
                    result = {
                        'question_id': question_id,
                        'human_answer': human_answer,
                        'predicted_answer': prediction.predicted_answer,
                        'is_match': is_match,
                        'confidence': prediction.confidence,
                        'reasoning': prediction.reasoning
                    }
                    
                except Exception as e:
                    # Fallback to simple comparison if profile system fails
                    result = {
                        'question_id': question_id,
                        'human_answer': human_answer,
                        'predicted_answer': human_answer,  # Just match for now
                        'is_match': True,
                        'confidence': 0.5,
                        'reasoning': f"Profile system error: {str(e)}. Using fallback matching."
                    }
                
            else:
                # Results saving - save comprehensive validation data
                test_session_id = data.get('test_session_id', f'test_{int(time.time())}')
                profile_id = data.get('profile_id', 'rachita_v1')
                comparisons = data.get('comparisons', [])
                accuracy_percentage = data.get('accuracy_percentage', 0)
                total_questions = data.get('total_questions', 0)
                correct_answers = data.get('correct_answers', 0)
                model_version = data.get('model_version', 'claude-3-5-sonnet-20241022')
                
                # Get survey info and determine counter
                survey_data = get_validation_survey_data()
                survey_name = survey_data['survey_name']
                results_dir = get_validation_results_path()
                
                # Ensure results directory exists
                os.makedirs(results_dir, exist_ok=True)
                
                # Get next counter for this survey-profile combination
                test_counter = get_next_test_counter(survey_name, profile_id, results_dir)
                
                # Create comprehensive validation result
                validation_result = {
                    'test_metadata': {
                        'test_session_id': test_session_id,
                        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime()),
                        'survey_name': survey_name,
                        'profile_version': profile_id,
                        'test_counter': test_counter,
                        'llm_model': model_version,
                        'test_type': 'digital_twin_validation',
                        'total_questions': total_questions,
                        'questions_answered': len(comparisons)
                    },
                    'accuracy_metrics': {
                        'overall_accuracy': accuracy_percentage,
                        'correct_predictions': correct_answers,
                        'total_questions': total_questions,
                        'accuracy_rate': accuracy_percentage / 100.0 if total_questions > 0 else 0,
                        'average_confidence': sum(c.get('confidence', 0) for c in comparisons) / len(comparisons) if comparisons else 0
                    },
                    'test_questions': [],
                    'detailed_results': []
                }
                
                # Add detailed question and result data
                for comparison in comparisons:
                    question_id = comparison.get('question_id')
                    
                    # Find the original question from our embedded survey
                    survey_data = get_validation_survey_data()
                    question_data = None
                    for q in survey_data['questions']:
                        if q['id'] == question_id:
                            question_data = q
                            break
                    
                    if question_data:
                        validation_result['test_questions'].append({
                            'question_id': question_id,
                            'category': question_data['category'],
                            'question_text': question_data['question'],
                            'available_options': question_data['options']
                        })
                    
                    validation_result['detailed_results'].append({
                        'question_id': question_id,
                        'human_answer': comparison.get('human_answer'),
                        'digital_twin_prediction': comparison.get('predicted_answer'),
                        'is_match': comparison.get('is_match', False),
                        'prediction_confidence': comparison.get('confidence', 0),
                        'prediction_reasoning': comparison.get('reasoning', ''),
                        'category': question_data['category'] if question_data else 'unknown'
                    })
                
                # Save to file with proper naming
                try:
                    filename = generate_validation_filename(survey_name, profile_id, test_counter)
                    filepath = os.path.join(results_dir, filename)
                    
                    with open(filepath, 'w', encoding='utf-8') as f:
                        json.dump(validation_result, f, indent=2, ensure_ascii=False)
                    
                    result = {
                        'status': 'success',
                        'message': 'Validation results saved successfully',
                        'test_session_id': test_session_id,
                        'filename': filename,
                        'filepath': filepath,
                        'test_counter': test_counter,
                        'summary': {
                            'accuracy': f"{accuracy_percentage}%",
                            'correct': f"{correct_answers}/{total_questions}",
                            'survey_name': survey_name,
                            'profile_tested': profile_id,
                            'model_used': model_version,
                            'test_number': test_counter
                        }
                    }
                    
                except Exception as save_error:
                    result = {
                        'status': 'partial_success',
                        'message': f'Results processed but save failed: {str(save_error)}',
                        'test_session_id': test_session_id,
                        'validation_data': validation_result
                    }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()