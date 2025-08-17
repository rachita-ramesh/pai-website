"""
Validation Testing Suite
Tests prediction accuracy against real responses
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from pydantic import BaseModel
from .response_predictor import ResponsePredictor, SurveyQuestion, PredictionResult, get_test_survey_questions
from .profile_extractor import PaiProfile, ProfileExtractor


class ValidationResult(BaseModel):
    profile_id: str
    total_questions: int
    correct_predictions: int
    accuracy_rate: float
    avg_confidence: float
    high_confidence_accuracy: float  # Accuracy for predictions with >0.7 confidence
    low_confidence_accuracy: float   # Accuracy for predictions with <0.5 confidence
    question_results: List[Dict[str, Any]]


class ValidationTester:
    def __init__(self, api_key: str):
        self.predictor = ResponsePredictor(api_key)
        self.questions = get_test_survey_questions()
    
    def collect_real_responses(self, profile_id: str, questions: List[SurveyQuestion]) -> Dict[str, str]:
        """Collect real responses from a person (interactive or pre-recorded)"""
        print(f"\nCollecting real responses for validation of {profile_id}")
        print("=" * 60)
        
        responses = {}
        
        for i, question in enumerate(questions, 1):
            print(f"\nQuestion {i}/{len(questions)}: {question.question}")
            print("Options:")
            for j, option in enumerate(question.options, 1):
                print(f"  {j}. {option}")
            
            while True:
                try:
                    choice = input(f"\nEnter choice (1-{len(question.options)}): ").strip()
                    choice_idx = int(choice) - 1
                    
                    if 0 <= choice_idx < len(question.options):
                        responses[question.id] = question.options[choice_idx]
                        print(f"Recorded: {question.options[choice_idx]}")
                        break
                    else:
                        print(f"Please enter a number between 1 and {len(question.options)}")
                
                except ValueError:
                    print("Please enter a valid number")
                except KeyboardInterrupt:
                    print("\n\nValidation cancelled")
                    return responses
        
        return responses
    
    def load_real_responses(self, filepath: str) -> Dict[str, str]:
        """Load pre-recorded real responses from JSON file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get("responses", {})
    
    def validate_predictions(self, profile: PaiProfile, real_responses: Dict[str, str]) -> ValidationResult:
        """Validate predictions against real responses"""
        print(f"\nValidating predictions for {profile.pai_id}")
        
        # Get predictions for all questions
        questions_to_test = [q for q in self.questions if q.id in real_responses]
        predictions = self.predictor.batch_predict(profile, questions_to_test)
        
        # Compare predictions with real responses
        results = []
        correct_count = 0
        high_conf_correct = 0
        high_conf_total = 0
        low_conf_correct = 0
        low_conf_total = 0
        
        for pred in predictions:
            real_answer = real_responses.get(pred.question_id)
            if real_answer is None:
                continue
            
            is_correct = pred.predicted_answer.strip() == real_answer.strip()
            if is_correct:
                correct_count += 1
            
            # Track confidence-based accuracy
            if pred.confidence > 0.7:
                high_conf_total += 1
                if is_correct:
                    high_conf_correct += 1
            elif pred.confidence < 0.5:
                low_conf_total += 1
                if is_correct:
                    low_conf_correct += 1
            
            question = next(q for q in questions_to_test if q.id == pred.question_id)
            
            result = {
                "question_id": pred.question_id,
                "question": question.question,
                "predicted_answer": pred.predicted_answer,
                "real_answer": real_answer,
                "is_correct": is_correct,
                "confidence": pred.confidence,
                "reasoning": pred.reasoning,
                "uncertainty_flags": pred.uncertainty_flags
            }
            results.append(result)
        
        # Calculate metrics
        total_questions = len(results)
        accuracy_rate = correct_count / total_questions if total_questions > 0 else 0
        avg_confidence = sum(r["confidence"] for r in results) / total_questions if total_questions > 0 else 0
        
        high_conf_accuracy = high_conf_correct / high_conf_total if high_conf_total > 0 else 0
        low_conf_accuracy = low_conf_correct / low_conf_total if low_conf_total > 0 else 0
        
        validation_result = ValidationResult(
            profile_id=profile.pai_id,
            total_questions=total_questions,
            correct_predictions=correct_count,
            accuracy_rate=accuracy_rate,
            avg_confidence=avg_confidence,
            high_confidence_accuracy=high_conf_accuracy,
            low_confidence_accuracy=low_conf_accuracy,
            question_results=results
        )
        
        return validation_result
    
    def run_full_validation(self, profile_filepath: str, collect_responses: bool = True) -> ValidationResult:
        """Run complete validation pipeline"""
        # Load profile
        extractor = ProfileExtractor(os.getenv("ANTHROPIC_API_KEY"))
        profile = extractor.load_profile(profile_filepath)
        
        # Get real responses
        responses_file = f"data/validation/{profile.pai_id}_responses.json"
        
        if collect_responses or not os.path.exists(responses_file):
            # Collect new responses
            real_responses = self.collect_real_responses(profile.pai_id, self.questions)
            
            # Save responses for future use
            os.makedirs("data/validation", exist_ok=True)
            responses_data = {
                "profile_id": profile.pai_id,
                "timestamp": datetime.now().isoformat(),
                "responses": real_responses
            }
            with open(responses_file, 'w', encoding='utf-8') as f:
                json.dump(responses_data, f, indent=2, ensure_ascii=False)
            print(f"Real responses saved to: {responses_file}")
        else:
            # Load existing responses
            real_responses = self.load_real_responses(responses_file)
            print(f"Loaded existing responses from: {responses_file}")
        
        # Run validation
        validation_result = self.validate_predictions(profile, real_responses)
        
        return validation_result
    
    def save_validation_results(self, result: ValidationResult, filepath: Optional[str] = None) -> str:
        """Save validation results to file"""
        if filepath is None:
            os.makedirs("data/validation", exist_ok=True)
            filepath = f"data/validation/{result.profile_id}_validation.json"
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(result.dict(), f, indent=2, ensure_ascii=False)
        
        return filepath
    
    def print_validation_summary(self, result: ValidationResult):
        """Print detailed validation summary"""
        print(f"\n{'='*60}")
        print(f"VALIDATION RESULTS FOR {result.profile_id}")
        print(f"{'='*60}")
        
        print(f"Overall Accuracy: {result.accuracy_rate:.1%} ({result.correct_predictions}/{result.total_questions})")
        print(f"Average Confidence: {result.avg_confidence:.2f}")
        print(f"High Confidence Accuracy (>0.7): {result.high_confidence_accuracy:.1%}")
        print(f"Low Confidence Accuracy (<0.5): {result.low_confidence_accuracy:.1%}")
        
        # Success criteria check
        success_rate = 0.60  # 60% target from PDF
        is_successful = result.accuracy_rate >= success_rate
        status = "✅ SUCCESS" if is_successful else "❌ BELOW TARGET"
        print(f"\nTarget: 60% accuracy - {status}")
        
        print(f"\nDetailed Results:")
        print(f"{'-'*60}")
        
        for i, qr in enumerate(result.question_results, 1):
            status_emoji = "✅" if qr["is_correct"] else "❌"
            print(f"{i}. {status_emoji} Q: {qr['question'][:50]}...")
            print(f"   Predicted: {qr['predicted_answer']}")
            print(f"   Actual: {qr['real_answer']}")
            print(f"   Confidence: {qr['confidence']:.2f}")
            if qr['uncertainty_flags']:
                print(f"   Uncertainty: {', '.join(qr['uncertainty_flags'])}")
            print()
        
        return is_successful


# Example usage
if __name__ == "__main__":
    # Load API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Please set ANTHROPIC_API_KEY environment variable")
        exit(1)
    
    tester = ValidationTester(api_key)
    
    # Look for available profiles
    profiles_dir = "data/profiles"
    if os.path.exists(profiles_dir):
        profile_files = [f for f in os.listdir(profiles_dir) if f.endswith('_profile.json')]
        
        if profile_files:
            print(f"Found {len(profile_files)} profile(s):")
            for i, filename in enumerate(profile_files, 1):
                print(f"  {i}. {filename}")
            
            # Let user select profile to test
            try:
                choice = input(f"\nEnter profile number to validate (1-{len(profile_files)}) or 'all': ")
                
                if choice.lower() == 'all':
                    # Test all profiles
                    all_results = []
                    for profile_file in profile_files:
                        filepath = os.path.join(profiles_dir, profile_file)
                        print(f"\n{'='*60}")
                        print(f"Testing {profile_file}")
                        
                        try:
                            result = tester.run_full_validation(filepath, collect_responses=True)
                            all_results.append(result)
                            
                            # Save results
                            results_file = tester.save_validation_results(result)
                            print(f"Results saved to: {results_file}")
                            
                            # Print summary
                            tester.print_validation_summary(result)
                            
                        except KeyboardInterrupt:
                            print(f"Skipped {profile_file}")
                            continue
                    
                    # Overall summary
                    if all_results:
                        overall_accuracy = sum(r.accuracy_rate for r in all_results) / len(all_results)
                        successful_profiles = sum(1 for r in all_results if r.accuracy_rate >= 0.60)
                        
                        print(f"\n{'='*60}")
                        print(f"OVERALL VALIDATION SUMMARY")
                        print(f"{'='*60}")
                        print(f"Profiles tested: {len(all_results)}")
                        print(f"Average accuracy: {overall_accuracy:.1%}")
                        print(f"Profiles meeting 60% target: {successful_profiles}/{len(all_results)}")
                        
                        if overall_accuracy >= 0.60:
                            print("🎉 VALIDATION SUCCESS - Core Pai concept proven!")
                        else:
                            print("🔄 Need more profile refinement to reach target accuracy")
                
                else:
                    # Test single profile
                    choice_idx = int(choice) - 1
                    if 0 <= choice_idx < len(profile_files):
                        profile_file = profile_files[choice_idx]
                        filepath = os.path.join(profiles_dir, profile_file)
                        
                        result = tester.run_full_validation(filepath, collect_responses=True)
                        
                        # Save and display results
                        results_file = tester.save_validation_results(result)
                        print(f"Results saved to: {results_file}")
                        
                        success = tester.print_validation_summary(result)
                        
                        if success:
                            print("🎉 This profile meets the 60% accuracy target!")
                        else:
                            print("🔄 This profile needs refinement to improve accuracy")
                    
                    else:
                        print("Invalid selection")
            
            except ValueError:
                print("Please enter a valid number")
            except KeyboardInterrupt:
                print("\nValidation cancelled")
        
        else:
            print(f"No profile files found in {profiles_dir}")
            print("Run profile_extractor.py first to create profiles")
    
    else:
        print(f"Profiles directory {profiles_dir} not found")
        print("Run the complete pipeline first: ai_interviewer.py -> profile_extractor.py")