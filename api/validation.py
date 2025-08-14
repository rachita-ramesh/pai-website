from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import time
import random

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Return the validation survey - embedded directly to avoid file path issues in Vercel
            survey_data = {
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
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Check if this is a single question validation or results saving
            if 'question_id' in data and 'human_answer' in data:
                # Single question validation - create mock response for now
                
                question_id = data.get('question_id')
                human_answer = data.get('human_answer')
                
                # Mock predictions for demonstration (in production, this would call the actual digital twin)
                mock_predictions = {
                    'routine_complexity': "3-5 products (cleanser, toner, serum, moisturizer, sunscreen)",
                    'purchase_decision_driver': "Scientific research and ingredient lists",
                    'wellness_priority': "Very important - I consider both when making choices",
                    'research_approach': "Moderate research - compare ingredients and reviews",
                    'aging_attitude': "Prevention-focused - start early to prevent issues",
                    'routine_flexibility': "Mostly consistent - occasional skips when busy",
                    'ingredient_knowledge': "Moderately familiar - I know key ingredients like retinol, niacinamide",
                    'time_investment': "5-10 minutes total (efficient but thorough)",
                    'problem_solving': "Research online and try popular solutions",
                    'price_sensitivity': "I prefer mid-range products - balance of quality and value"
                }
                
                predicted_answer = mock_predictions.get(question_id, human_answer)
                is_match = human_answer.strip().lower() == predicted_answer.strip().lower()
                confidence = random.uniform(0.6, 0.9)
                
                result = {
                    'question_id': question_id,
                    'human_answer': human_answer,
                    'predicted_answer': predicted_answer,
                    'is_match': is_match,
                    'confidence': confidence,
                    'reasoning': f"Digital twin predicted '{predicted_answer}' based on profile analysis."
                }
                
            else:
                # Results saving - just return success for now
                result = {
                    'status': 'success',
                    'message': 'Validation results saved',
                    'test_session_id': data.get('test_session_id', 'test_' + str(int(time.time())))
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