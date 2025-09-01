"""
Survey Response Predictor
Predicts how someone would answer survey questions based on their Pai profile
"""

import os
import json
from typing import Dict, List, Any, Optional, Tuple
import anthropic
from pydantic import BaseModel
from .profile_extractor import PaiProfile


class SurveyQuestion(BaseModel):
    id: str
    category: str
    question: str
    options: List[str]


class PredictionResult(BaseModel):
    question_id: str
    predicted_answer: str
    confidence: float  # 0-1 scale
    reasoning: str
    uncertainty_flags: List[str]
    option_analysis: Dict[str, str]  # analysis of each option


class ResponsePredictor:
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.prediction_prompt = self._get_prediction_prompt()
    
    def _get_prediction_prompt(self) -> str:
        """Prediction system prompt from the PDF"""
        return """You are predicting how a specific person (represented by this Pai profile) would answer a skincare survey question.

PAI PROFILE:
{profile}

SURVEY QUESTION:
{question}

OPTIONS:
{options}

PREDICTION PROCESS:
Step 1: OPTION ANALYSIS
For each response option, describe what type of person would typically choose it and why.

Step 2: PROFILE MATCHING
Based on the Pai profile, analyze which option(s) best match their:
- Core attitudes and values
- Decision-making patterns
- Past behaviors and preferences
- Emotional drivers and motivations

Step 3: REASONING
Explain your prediction logic, citing specific elements from the profile. Include:
- Primary factors driving the choice
- Any competing considerations
- Why other options don't fit as well

Step 4: PREDICTION
Choose ONE best matching option from the provided choices. State your predicted answer and confidence level (0-100%).
IMPORTANT: predicted_answer must be exactly one of the provided options as a string.

Step 5: UNCERTAINTY FLAGS
Note any aspects where the profile lacks information or contains contradictions that affect confidence.

Format your response as JSON:
{
  "predicted_answer": "exact option text from the list - must be a single string",
  "confidence": 0.85,
  "reasoning": "Detailed explanation of why this person would choose this option...",
  "uncertainty_flags": ["list of factors that reduce confidence"],
  "option_analysis": {
    "Option 1": "Analysis of who would choose this",
    "Option 2": "Analysis of who would choose this"
  }
}

Return ONLY the JSON response, no additional text."""
    
    def predict_response(self, profile: PaiProfile, question: SurveyQuestion) -> PredictionResult:
        """Predict how this person would answer the survey question"""
        try:
            # Format the prompt
            profile_json = json.dumps(profile.dict(), indent=2)
            options_text = "\n".join([f"- {opt}" for opt in question.options])
            
            prompt = self.prediction_prompt.replace("{profile}", profile_json).replace("{question}", question.question).replace("{options}", options_text)
            
            # Call Claude API
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1500,
                temperature=0.3,
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse JSON response
            prediction_json = response.content[0].text.strip()
            
            # Clean up markdown formatting
            if prediction_json.startswith('```json'):
                prediction_json = prediction_json.replace('```json', '').replace('```', '').strip()
            elif prediction_json.startswith('```'):
                prediction_json = prediction_json.replace('```', '').strip()
            
            # Parse the JSON
            prediction_data = json.loads(prediction_json)
            
            # Handle predicted_answer being either string or list
            predicted_answer = prediction_data["predicted_answer"]
            if isinstance(predicted_answer, list):
                # If Claude returned multiple answers, join them or take the first one
                predicted_answer = ", ".join(predicted_answer) if len(predicted_answer) > 1 else predicted_answer[0]
            
            # Create prediction result
            result = PredictionResult(
                question_id=question.id,
                predicted_answer=predicted_answer,
                confidence=prediction_data["confidence"],
                reasoning=prediction_data["reasoning"],
                uncertainty_flags=prediction_data.get("uncertainty_flags", []),
                option_analysis=prediction_data.get("option_analysis", {})
            )
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON response: {e}")
            print(f"Raw response: {response.content[0].text}")
            raise
        except Exception as e:
            print(f"Error predicting response: {e}")
            raise
    
    def batch_predict(self, profile: PaiProfile, questions: List[SurveyQuestion]) -> List[PredictionResult]:
        """Predict responses to multiple questions"""
        results = []
        
        for question in questions:
            print(f"Predicting response to: {question.id}")
            try:
                result = self.predict_response(profile, question)
                results.append(result)
                print(f"Predicted: {result.predicted_answer} (confidence: {result.confidence:.2f})")
            except Exception as e:
                print(f"Error predicting question {question.id}: {e}")
                continue
        
        return results
    
    def save_predictions(self, predictions: List[PredictionResult], profile_id: str, filepath: Optional[str] = None) -> str:
        """Save predictions to JSON file"""
        if filepath is None:
            os.makedirs("data/predictions", exist_ok=True)
            filepath = f"data/predictions/{profile_id}_predictions.json"
        
        predictions_data = {
            "profile_id": profile_id,
            "timestamp": datetime.now().isoformat(),
            "predictions": [pred.dict() for pred in predictions]
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(predictions_data, f, indent=2, ensure_ascii=False)
        
        return filepath


def get_test_survey_questions() -> List[SurveyQuestion]:
    """Test survey questions from the PDF"""
    return [
        SurveyQuestion(
            id="research_depth",
            category="Research & Decision Making",
            question="How much do you typically research before buying a new skincare product?",
            options=[
                "I research extensively (read reviews, compare ingredients, check studies)",
                "I do moderate research (quick review check, maybe ask friends)",
                "I do minimal research (glance at packaging, basic info)",
                "I rarely research (go with gut feeling or recommendations)"
            ]
        ),
        SurveyQuestion(
            id="purchase_influences",
            category="Research & Decision Making", 
            question="What most influences your skincare purchase decisions?",
            options=[
                "Scientific evidence and ingredient research",
                "Reviews from other users",
                "Recommendations from friends/family",
                "Brand reputation and trust",
                "Price and value",
                "Dermatologist or expert advice"
            ]
        ),
        SurveyQuestion(
            id="trying_new_products",
            category="Product Preferences",
            question="How do you feel about trying new skincare products?",
            options=[
                "Excited - I love discovering new products",
                "Cautiously optimistic - willing to try with research",
                "Hesitant - prefer to stick with what works", 
                "Resistant - only change when forced to"
            ]
        ),
        SurveyQuestion(
            id="routine_complexity",
            category="Product Preferences",
            question="What's your ideal skincare routine complexity?",
            options=[
                "Very simple (2-3 products max)",
                "Moderately simple (4-6 products)",
                "Comprehensive (7-10 products)",
                "Elaborate (10+ products, multiple steps)"
            ]
        ),
        SurveyQuestion(
            id="price_vs_effectiveness",
            category="Values & Priorities",
            question="If you had to choose between a $15 product that works okay and a $50 product that works great, you would:",
            options=[
                "Always choose the $15 option",
                "Usually choose the $15 option", 
                "It depends on other factors",
                "Usually choose the $50 option",
                "Always choose the $50 option"
            ]
        )
    ]


# Example usage
if __name__ == "__main__":
    from datetime import datetime
    
    # Load API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Please set ANTHROPIC_API_KEY environment variable")
        exit(1)
    
    predictor = ResponsePredictor(api_key)
    
    # Example: Load a profile and predict responses
    profile_file = "data/profiles/example_profile.json"
    if os.path.exists(profile_file):
        print(f"Loading profile from {profile_file}")
        
        # Load profile
        from profile_extractor import ProfileExtractor
        extractor = ProfileExtractor(api_key)
        profile = extractor.load_profile(profile_file)
        
        # Get test questions
        questions = get_test_survey_questions()
        print(f"Testing {len(questions)} survey questions")
        
        # Predict responses
        predictions = predictor.batch_predict(profile, questions)
        
        # Save results
        results_file = predictor.save_predictions(predictions, profile.pai_id)
        print(f"Predictions saved to: {results_file}")
        
        # Display summary
        print(f"\nPrediction Summary:")
        avg_confidence = sum(p.confidence for p in predictions) / len(predictions)
        print(f"- Average confidence: {avg_confidence:.2f}")
        print(f"- High confidence predictions (>0.7): {sum(1 for p in predictions if p.confidence > 0.7)}")
        print(f"- Low confidence predictions (<0.5): {sum(1 for p in predictions if p.confidence < 0.5)}")
        
        # Show detailed results
        for pred in predictions:
            question = next(q for q in questions if q.id == pred.question_id)
            print(f"\nQ: {question.question}")
            print(f"A: {pred.predicted_answer}")
            print(f"Confidence: {pred.confidence:.2f}")
            if pred.uncertainty_flags:
                print(f"Uncertainty: {', '.join(pred.uncertainty_flags)}")
    
    else:
        print(f"No profile file found at {profile_file}")
        print("Run profile_extractor.py first to create a profile")