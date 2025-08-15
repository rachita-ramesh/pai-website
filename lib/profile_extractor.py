"""
Profile Extraction System
Converts interview transcripts into structured Pai profiles
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
import anthropic
from pydantic import BaseModel


class PaiProfile(BaseModel):
    """Structured Pai profile following the PDF specification"""
    pai_id: str
    demographics: Dict[str, str]
    core_attitudes: Dict[str, str]
    decision_psychology: Dict[str, Any]
    usage_patterns: Dict[str, Any]
    value_system: Dict[str, Any]
    behavioral_quotes: List[str]
    prediction_weights: Dict[str, float]


class ProfileExtractor:
    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.extraction_prompt = self._get_extraction_prompt()
    
    def _get_extraction_prompt(self) -> str:
        """Profile extraction prompt from the PDF"""
        return """Extract a structured Pai profile from this skincare interview transcript. Focus on psychological patterns, attitudes, and behavioral drivers that would predict future choices.

INTERVIEW TRANSCRIPT:
{transcript}

Create a comprehensive profile following this structure:

{
  "pai_id": "founder_1",
  "demographics": {
    "age_range": "25-34",
    "lifestyle": "urban_professional",
    "context": "tech_founder"
  },
  "core_attitudes": {
    "aging_approach": "proactive_prevention|acceptance|denial|anxiety",
    "beauty_philosophy": "natural|scientific|minimal|maximalist",
    "risk_tolerance": "conservative|moderate|experimental",
    "trust_orientation": "science_driven|social_proof|brand_loyalty|price_focused"
  },
  "decision_psychology": {
    "research_style": "deep_researcher|quick_decider|social_validator|impulse_buyer",
    "influence_hierarchy": ["peer_recommendations", "scientific_studies", "price", "reviews"],
    "purchase_triggers": ["skin_problems", "routine_optimization", "seasonal_changes"],
    "regret_patterns": ["overspending", "too_complex", "skin_reactions", "ineffective"]
  },
  "usage_patterns": {
    "routine_adherence": "rigid|flexible|minimal|elaborate",
    "context_sensitivity": "travel|stress|seasons|events",
    "emotional_drivers": ["confidence", "self_care", "problem_solving"],
    "change_catalysts": ["skin_issues", "life_changes", "new_information"]
  },
  "value_system": {
    "priority_hierarchy": ["effectiveness", "gentleness", "price", "ethics", "convenience"],
    "non_negotiables": ["fragrance_free", "dermatologist_approved"],
    "ideal_outcome": "clear_healthy_skin|minimal_effort|premium_experience",
    "core_motivation": "health|appearance|routine|prevention"
  },
  "behavioral_quotes": [
    "Key phrases that reveal decision-making patterns",
    "Emotional language about skin/products",
    "Contradictions between stated and revealed preferences"
  ],
  "prediction_weights": {
    "price_sensitivity": 0.8,
    "ingredient_focus": 0.6,
    "routine_complexity_tolerance": 0.3,
    "brand_loyalty": 0.4,
    "social_influence_susceptibility": 0.2
  }
}

EXTRACTION GUIDELINES:
1. Look for contradictions between what they say vs. what they do
2. Identify emotional language that reveals deeper motivations
3. Extract decision-making patterns from specific examples
4. Note value hierarchies from trade-off discussions
5. Capture personality through their language and reasoning style
6. Assign prediction weights based on emphasis and consistency in responses

Pay special attention to:
- How they describe past purchase decisions
- What makes them trust or distrust products/brands
- Their emotional relationship with their skin
- How they balance competing priorities (price vs. quality, simple vs. effective)
- What would make them change their current approach

The goal is creating a profile rich enough that another AI could predict how this person would answer skincare survey questions.

Return ONLY the JSON profile, no additional text."""
    
    def extract_profile(self, interview_transcript: str, participant_name: str) -> PaiProfile:
        """Extract structured profile from interview transcript"""
        try:
            # Format the prompt with the transcript
            prompt = self.extraction_prompt.replace("{transcript}", interview_transcript)
            
            # Call Claude API for extraction
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                temperature=0.3,  # Lower temperature for more consistent structured output
                messages=[{"role": "user", "content": prompt}]
            )
            
            # Parse JSON response
            profile_json = response.content[0].text.strip()
            
            # Clean up any markdown formatting
            if profile_json.startswith('```json'):
                profile_json = profile_json.replace('```json', '').replace('```', '').strip()
            elif profile_json.startswith('```'):
                profile_json = profile_json.replace('```', '').strip()
            
            # Parse the JSON
            profile_data = json.loads(profile_json)
            
            # Update with participant info
            profile_data["pai_id"] = f"{participant_name.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}"
            
            # Convert to Pydantic model
            profile = PaiProfile(**profile_data)
            
            return profile
            
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON response: {e}")
            print(f"Raw response: {response.content[0].text}")
            raise
        except Exception as e:
            print(f"Error extracting profile: {e}")
            raise
    
    def load_interview_transcript(self, filepath: str) -> str:
        """Load interview transcript from saved session file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            session_data = json.load(f)
        
        # Convert messages to readable transcript
        transcript_lines = []
        for msg in session_data['messages']:
            speaker = "AI Interviewer" if msg['type'] == 'ai' else session_data['participant_name']
            timestamp = msg['timestamp']
            content = msg['content']
            transcript_lines.append(f"[{timestamp}] {speaker}: {content}")
        
        return "\n".join(transcript_lines)
    
    def save_profile(self, profile: PaiProfile, filepath: Optional[str] = None) -> str:
        """Save profile to JSON file"""
        if filepath is None:
            os.makedirs("data/profiles", exist_ok=True)
            filepath = f"data/profiles/{profile.pai_id}_profile.json"
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(profile.dict(), f, indent=2, ensure_ascii=False)
        
        return filepath
    
    def load_profile(self, filepath: str) -> PaiProfile:
        """Load profile from JSON file"""
        with open(filepath, 'r', encoding='utf-8') as f:
            profile_data = json.load(f)
        
        return PaiProfile(**profile_data)


# Example usage and testing
if __name__ == "__main__":
    # Load API key from environment
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Please set ANTHROPIC_API_KEY environment variable")
        exit(1)
    
    extractor = ProfileExtractor(api_key)
    
    # Example: Load an interview and extract profile
    interview_file = "data/interviews/example_interview.json"
    if os.path.exists(interview_file):
        print(f"Loading interview from {interview_file}")
        transcript = extractor.load_interview_transcript(interview_file)
        print(f"Transcript length: {len(transcript)} characters")
        
        # Extract profile
        print("Extracting profile...")
        profile = extractor.extract_profile(transcript, "Example User")
        
        # Save profile
        profile_file = extractor.save_profile(profile)
        print(f"Profile saved to: {profile_file}")
        
        # Display key insights
        print(f"\nProfile Summary for {profile.pai_id}:")
        print(f"- Beauty philosophy: {profile.core_attitudes['beauty_philosophy']}")
        print(f"- Research style: {profile.decision_psychology['research_style']}")
        print(f"- Risk tolerance: {profile.core_attitudes['risk_tolerance']}")
        print(f"- Top priorities: {profile.value_system['priority_hierarchy'][:3]}")
        print(f"- Key behavioral quotes: {len(profile.behavioral_quotes)} identified")
    else:
        print(f"No interview file found at {interview_file}")
        print("Run ai_interviewer.py first to create an interview session")