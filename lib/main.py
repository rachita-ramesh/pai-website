"""
Main Orchestrator for Pai System
Coordinates the full pipeline: Interview -> Profile -> Predict -> Validate
"""

import os
import sys
from datetime import datetime
from typing import List, Optional
from dotenv import load_dotenv

# Import all our modules
from .ai_interviewer import AIInterviewer, InterviewSession
from .profile_extractor import ProfileExtractor, PaiProfile
from .response_predictor import ResponsePredictor, get_test_survey_questions
from .validation_tester import ValidationTester


class PaiOrchestrator:
    """Main coordinator for the Pai system"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.interviewer = AIInterviewer(api_key)
        self.extractor = ProfileExtractor(api_key)
        self.predictor = ResponsePredictor(api_key)
        self.validator = ValidationTester(api_key)
    
    def run_full_pipeline(self, participant_name: str, interactive: bool = True) -> dict:
        """Run the complete Pai pipeline for one participant"""
        results = {
            "participant_name": participant_name,
            "start_time": datetime.now(),
            "interview_file": None,
            "profile_file": None,
            "predictions_file": None,
            "validation_file": None,
            "success": False,
            "accuracy_rate": 0.0
        }
        
        try:
            print(f"🚀 Starting Pai pipeline for {participant_name}")
            print("="*60)
            
            # Step 1: Conduct Interview
            print("\n1️⃣ CONDUCTING AI INTERVIEW")
            print("-" * 30)
            
            if interactive:
                session = self._run_interactive_interview(participant_name)
            else:
                session = self._run_simulated_interview(participant_name)
            
            interview_file = self.interviewer.save_session(session)
            results["interview_file"] = interview_file
            print(f"✅ Interview completed: {session.exchange_count} exchanges")
            print(f"📁 Saved to: {interview_file}")
            
            # Step 2: Extract Profile
            print("\n2️⃣ EXTRACTING PAI PROFILE")
            print("-" * 30)
            
            transcript = self.extractor.load_interview_transcript(interview_file)
            profile = self.extractor.extract_profile(transcript, participant_name)
            profile_file = self.extractor.save_profile(profile)
            results["profile_file"] = profile_file
            
            print(f"✅ Profile extracted for {profile.pai_id}")
            print(f"📁 Saved to: {profile_file}")
            print(f"🧠 Key traits: {profile.core_attitudes.get('beauty_philosophy', 'N/A')}, "
                  f"{profile.decision_psychology.get('research_style', 'N/A')}")
            
            # Step 3: Predict Survey Responses
            print("\n3️⃣ PREDICTING SURVEY RESPONSES")
            print("-" * 30)
            
            questions = get_test_survey_questions()
            predictions = self.predictor.batch_predict(profile, questions)
            predictions_file = self.predictor.save_predictions(predictions, profile.pai_id)
            results["predictions_file"] = predictions_file
            
            avg_confidence = sum(p.confidence for p in predictions) / len(predictions)
            print(f"✅ Generated {len(predictions)} predictions")
            print(f"📁 Saved to: {predictions_file}")
            print(f"🎯 Average confidence: {avg_confidence:.2f}")
            
            # Step 4: Validate Accuracy
            print("\n4️⃣ VALIDATING PREDICTION ACCURACY")
            print("-" * 30)
            
            if interactive:
                print("Now we need your REAL answers to validate the predictions...")
                validation_result = self.validator.run_full_validation(profile_file, collect_responses=True)
            else:
                # For simulation, use the first prediction as "real" answer (not very useful but demonstrates flow)
                print("⚠️ Simulated validation (using predictions as real answers - not meaningful)")
                fake_responses = {p.question_id: p.predicted_answer for p in predictions}
                validation_result = self.validator.validate_predictions(profile, fake_responses)
            
            validation_file = self.validator.save_validation_results(validation_result)
            results["validation_file"] = validation_file
            results["accuracy_rate"] = validation_result.accuracy_rate
            
            print(f"✅ Validation completed")
            print(f"📁 Saved to: {validation_file}")
            
            # Print final results
            self.validator.print_validation_summary(validation_result)
            
            # Success criteria
            results["success"] = validation_result.accuracy_rate >= 0.60
            results["end_time"] = datetime.now()
            
            return results
            
        except KeyboardInterrupt:
            print("\n\n⚠️ Pipeline interrupted by user")
            return results
        except Exception as e:
            print(f"\n❌ Pipeline failed: {e}")
            import traceback
            traceback.print_exc()
            return results
    
    def _run_interactive_interview(self, participant_name: str) -> InterviewSession:
        """Run interactive interview with real user input"""
        print(f"Starting interactive interview with {participant_name}")
        print("Type your responses naturally. Type 'quit' to end early.\n")
        
        session = self.interviewer.start_interview(participant_name)
        print(f"AI: {session.messages[0].content}")
        
        while not session.is_complete:
            try:
                user_input = input(f"\n{participant_name}: ").strip()
                
                if user_input.lower() in ['quit', 'exit', 'stop']:
                    print("Interview ended by user")
                    break
                
                if not user_input:
                    print("Please provide a response or type 'quit' to end")
                    continue
                
                # Get AI response
                ai_response = self.interviewer.get_ai_response(session, user_input)
                session = self.interviewer.update_session(session, user_input, ai_response)
                
                print(f"AI: {ai_response}")
                
                # Show progress
                if session.exchange_count % 5 == 0:
                    print(f"\n[Progress: {session.exchange_count} exchanges completed]")
                
            except KeyboardInterrupt:
                print("\nInterview interrupted")
                break
        
        return session
    
    def _run_simulated_interview(self, participant_name: str) -> InterviewSession:
        """Run simulated interview with pre-defined responses"""
        print(f"Running simulated interview for {participant_name}")
        
        # Simulated responses for demo purposes
        simulated_responses = [
            "I think about skincare quite a bit, actually. I have a pretty consistent routine.",
            "I use a cleanser, toner, vitamin C serum, moisturizer, and SPF every morning. Evening is similar but with retinol instead of vitamin C.",
            "I started taking it more seriously in my late twenties when I noticed some fine lines around my eyes.",
            "I'm pretty cautious about trying new products. I usually read reviews and check ingredients first.",
            "Price matters to me, but I'm willing to spend more if there's good evidence it works.",
            "I trust dermatologists and scientific studies more than influencer recommendations.",
            "When I have a breakout, I research targeted treatments rather than just waiting it out.",
            "My routine changes seasonally - I use heavier moisturizers in winter.",
            "I get frustrated when products don't work as promised, especially expensive ones.",
            "I prefer products with minimal, effective ingredients rather than long ingredient lists."
        ]
        
        session = self.interviewer.start_interview(participant_name)
        print(f"AI: {session.messages[0].content}")
        
        for i, response in enumerate(simulated_responses):
            if session.is_complete:
                break
                
            print(f"\n{participant_name}: {response}")
            
            # Get AI response
            ai_response = self.interviewer.get_ai_response(session, response)
            session = self.interviewer.update_session(session, response, ai_response)
            
            print(f"AI: {ai_response}")
            
            # Brief pause for readability
            import time
            time.sleep(0.5)
        
        return session


def main():
    """Main entry point"""
    # Load environment variables
    load_dotenv()
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ Error: ANTHROPIC_API_KEY not found in environment variables")
        print("Please create a .env file with your Anthropic API key")
        print("See .env.example for format")
        sys.exit(1)
    
    # Create orchestrator
    orchestrator = PaiOrchestrator(api_key)
    
    # Menu system
    while True:
        print("\n" + "="*60)
        print("🧠 PAI SYSTEM - Digital Persona Builder")
        print("="*60)
        print("1. Run full pipeline (interactive)")
        print("2. Run full pipeline (simulated)")
        print("3. Test individual components")
        print("4. Validate existing profiles")
        print("5. Exit")
        
        choice = input("\nSelect option (1-5): ").strip()
        
        if choice == "1":
            participant_name = input("Enter participant name: ").strip()
            if participant_name:
                results = orchestrator.run_full_pipeline(participant_name, interactive=True)
                
                print(f"\n🎉 Pipeline completed for {participant_name}")
                print(f"Success: {'✅' if results['success'] else '❌'}")
                if results['accuracy_rate'] > 0:
                    print(f"Accuracy: {results['accuracy_rate']:.1%}")
            
        elif choice == "2":
            participant_name = input("Enter participant name for simulation: ").strip()
            if not participant_name:
                participant_name = "SimulatedUser"
            
            results = orchestrator.run_full_pipeline(participant_name, interactive=False)
            print(f"\n🤖 Simulated pipeline completed")
            print("Note: Simulated validation is not meaningful - use interactive mode for real testing")
        
        elif choice == "3":
            print("\n🔧 Component testing not implemented yet")
            print("You can run individual Python files directly:")
            print("- python ai_interviewer.py")
            print("- python profile_extractor.py") 
            print("- python response_predictor.py")
            print("- python validation_tester.py")
        
        elif choice == "4":
            print("\n📊 Running validation on existing profiles...")
            try:
                # Use the validation tester directly
                os.system("python validation_tester.py")
            except KeyboardInterrupt:
                print("Validation cancelled")
        
        elif choice == "5":
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice. Please select 1-5.")


if __name__ == "__main__":
    main()