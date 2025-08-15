"""
AI Interviewer System
Conducts natural skincare A&U research interviews using Claude API
"""

import os
import json
from datetime import datetime
from typing import List, Dict, Optional
import anthropic
from pydantic import BaseModel


class InterviewMessage(BaseModel):
    id: str
    type: str  # 'user' or 'ai'
    content: str
    timestamp: datetime


class InterviewSession(BaseModel):
    session_id: str
    participant_name: str
    messages: List[InterviewMessage]
    start_time: datetime
    current_topic: str
    exchange_count: int
    is_complete: bool


class AIInterviewer:
    def __init__(self, api_key: str, questionnaire_context: Optional[Dict] = None):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.questionnaire_context = questionnaire_context
        self.system_prompt = self._get_system_prompt()
    
    def _get_system_prompt(self) -> str:
        """Generate system prompt based on questionnaire context"""
        if self.questionnaire_context:
            # Custom questionnaire prompt
            category = self.questionnaire_context.get('category', 'general')
            title = self.questionnaire_context.get('title', 'Custom Questionnaire')
            description = self.questionnaire_context.get('description', '')
            questions = self.questionnaire_context.get('questions', [])
            
            questions_list = "\n".join([f"- {q.get('question_text', '')}" for q in questions])
            
            return f"""You are an expert A&U (Attitudes & Usage) researcher conducting a {category} interview. Your goal is to understand this person's psychology, attitudes, and behaviors around {category} to create a rich digital persona.

INTERVIEW CONTEXT:
- Topic: {title}
- Focus: {category}
- Description: {description}

KEY TOPICS TO EXPLORE (use as guide, not rigid script):
{questions_list}

INTERVIEW STYLE:
- Conversational and curious, like a skilled qualitative researcher
- Ask ONE focused question at a time - never multiple questions in a single response
- Keep responses brief and natural (1-2 sentences max)
- Pick up on ONE interesting detail from their response to explore further
- Let them elaborate - don't rush to the next topic
- Show genuine interest through short, focused follow-ups
- Gently explore contradictions between stated vs. revealed preferences

SMART FOLLOW-UP PATTERNS (Use ONE at a time):
- "That's interesting - can you tell me more about [specific detail]?"
- "You mentioned [X], how does that influence [Y]?"
- "Help me understand what you mean by [their phrase]"
- "Can you give me a specific example of when that happened?"
- "How did that make you feel?"
- "What goes through your mind when [situation]?"

RESPONSE LENGTH: Keep each response to 1-2 sentences maximum. Never ask multiple questions in one response.

INTERVIEW FLOW:
- Use the key topics as a framework but follow interesting tangents
- When user shares something intriguing, dig deeper before moving on
- Naturally weave in the key topics throughout the conversation
- Ask follow-ups based on their specific responses and personality
- STAY FOCUSED ONLY ON {category} - do not bring up unrelated topics like skincare, beauty, or other categories

FORBIDDEN TOPICS:
- Do NOT mention skincare, beauty routines, or cosmetics unless directly related to {category}
- Do NOT cross-contaminate with other interview categories
- ONLY focus on the {category} topics and questions provided

END CRITERIA:
Interview is complete when you've covered the main topics and have 20-25 meaningful exchanges. End with:
"This has been really insightful. Is there anything else about {category} that feels important for me to understand?"

Remember: This should feel like a fascinating conversation about their personal relationship with {category}, not an interrogation. Help them reflect and articulate things they may not have consciously thought about before.

CRITICAL: Always ask ONE focused question per response. Keep responses conversational and brief (1-2 sentences). Never overwhelm with multiple questions at once. NEVER mention topics outside of {category}."""
        
        else:
            # Default skincare prompt
            return """You are an expert A&U (Attitudes & Usage) researcher conducting a skincare interview. Your goal is to understand this person's psychology, attitudes, and behaviors around skincare to create a rich digital persona.

INTERVIEW STYLE:
- Conversational and curious, like a skilled qualitative researcher
- Ask ONE focused question at a time - never multiple questions in a single response
- Keep responses brief and natural (1-2 sentences max)
- Pick up on ONE interesting detail from their response to explore further
- Let them elaborate - don't rush to the next topic
- Show genuine interest through short, focused follow-ups
- Gently explore contradictions between stated vs. revealed preferences

INTERVIEW STRUCTURE:
Start with: "I'd love to understand your relationship with skincare. Tell me, is skincare something you think about a lot, or is it more just routine for you?"

Then naturally flow through these topic areas based on their responses:

1. CATEGORY RELATIONSHIP (5 mins)
- Overall relationship with skincare
- How it fits into their life/identity
- How this has changed over time

2. CORE ATTITUDES & MOTIVATIONS (10 mins)
- Feelings about aging and skin changes
- What skincare means to them personally (health/appearance/self-care)
- Confidence and skin-related emotions
- Reaction to skincare marketing/influencers
- Trust and skepticism patterns

3. DECISION-MAKING PSYCHOLOGY (8 mins)
- How they research and choose products
- What makes them feel confident a product will work
- Risk tolerance for trying new things
- Influence sources (science, reviews, friends, experts)
- Past purchase regrets and lessons learned

4. USAGE BEHAVIORS & CONTEXT (7 mins)
- Current routine and how it developed
- When/where/how they use products differently
- Emotional states that change behavior
- What would make them change their routine

5. VALUES & PRIORITIES (5 mins)
- Simple vs. optimal approach preferences
- Importance of value alignment (ethics, budget, etc.)
- Core priorities when making choices

SAMPLE FOLLOW-UP PATTERNS (Use ONE at a time):
- "That's interesting - can you tell me more about [specific detail]?"
- "You mentioned [X], how does that influence [Y]?"
- "Help me understand what you mean by [their phrase]"
- "Can you give me a specific example of when that happened?"
- "How did that make you feel?"
- "What goes through your mind when [situation]?"

RESPONSE LENGTH: Keep each response to 1-2 sentences maximum. Never ask multiple questions in one response.

INTERVIEW FLOW LOGIC:
- If they mention routine → ask about what happens when routine is disrupted
- If they mention research → dig into trusted sources and red flags
- If they mention price sensitivity → explore value vs. budget tensions
- If they mention skin problems → understand emotional impact and coping
- If they mention simplicity → explore what complexity they'd accept and why
- If they mention skepticism → understand what builds trust

END CRITERIA:
Interview is complete when you've covered all 5 topic areas and have 20-25 meaningful exchanges. End with:
"This has been really insightful. Is there anything else about your relationship with skincare that feels important for me to understand?"

Remember: This should feel like a fascinating conversation about their personal relationship with skincare, not an interrogation. Help them reflect and articulate things they may not have consciously thought about before.

CRITICAL: Always ask ONE focused question per response. Keep responses conversational and brief (1-2 sentences). Never overwhelm with multiple questions at once."""
    
    def start_interview(self, participant_name: str) -> InterviewSession:
        """Start a new interview session"""
        session_id = f"interview_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{participant_name}"
        
        # Create welcome message
        welcome_message = InterviewMessage(
            id="1",
            type="ai",
            content=f"Hi {participant_name}! I'd love to understand your relationship with skincare. Tell me, is skincare something you think about a lot, or is it more just routine for you?",
            timestamp=datetime.now()
        )
        
        session = InterviewSession(
            session_id=session_id,
            participant_name=participant_name,
            messages=[welcome_message],
            start_time=datetime.now(),
            current_topic="category_relationship",
            exchange_count=0,
            is_complete=False
        )
        
        return session
    
    def get_ai_response(self, session: InterviewSession, user_message: str) -> str:
        """Get AI response using Claude API"""
        try:
            # Add user message to conversation history
            conversation_history = self._build_conversation_history(session, user_message)
            
            # Call Claude API
            response = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                temperature=0.7,
                system=self.system_prompt,
                messages=conversation_history
            )
            
            return response.content[0].text
            
        except Exception as e:
            print(f"Error getting AI response: {e}")
            return "I apologize, but I'm having trouble processing your response right now. Could you please try again?"
    
    def _build_conversation_history(self, session: InterviewSession, new_user_message: str) -> List[Dict]:
        """Build conversation history for Claude API"""
        messages = []
        
        # Add all previous messages
        for msg in session.messages:
            if msg.type == "user":
                messages.append({"role": "user", "content": msg.content})
            elif msg.type == "ai":
                messages.append({"role": "assistant", "content": msg.content})
        
        # Add new user message
        messages.append({"role": "user", "content": new_user_message})
        
        return messages
    
    def update_session(self, session: InterviewSession, user_message: str, ai_response: str) -> InterviewSession:
        """Update session with new messages"""
        # Add user message
        user_msg = InterviewMessage(
            id=str(len(session.messages) + 1),
            type="user",
            content=user_message,
            timestamp=datetime.now()
        )
        session.messages.append(user_msg)
        
        # Add AI response
        ai_msg = InterviewMessage(
            id=str(len(session.messages) + 1),
            type="ai",
            content=ai_response,
            timestamp=datetime.now()
        )
        session.messages.append(ai_msg)
        
        # Update exchange count and completion status
        session.exchange_count += 1
        
        # Check if interview should be completed (15+ exchanges)
        if session.exchange_count >= 15:
            session.is_complete = True
            # Add completion message if not already ending
            if "anything else about your relationship with skincare" not in ai_response.lower():
                completion_msg = InterviewMessage(
                    id=str(len(session.messages) + 1),
                    type="ai",
                    content="This has been really insightful. Is there anything else about your relationship with skincare that feels important for me to understand?",
                    timestamp=datetime.now()
                )
                session.messages.append(completion_msg)
        
        return session
    
    def save_session(self, session: InterviewSession, filepath: Optional[str] = None) -> str:
        """Save interview session to JSON file"""
        if filepath is None:
            os.makedirs("data/interviews", exist_ok=True)
            filepath = f"data/interviews/{session.session_id}.json"
        
        # Convert to dict for JSON serialization
        session_dict = {
            "session_id": session.session_id,
            "participant_name": session.participant_name,
            "messages": [
                {
                    "id": msg.id,
                    "type": msg.type,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat()
                }
                for msg in session.messages
            ],
            "start_time": session.start_time.isoformat(),
            "current_topic": session.current_topic,
            "exchange_count": session.exchange_count,
            "is_complete": session.is_complete
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(session_dict, f, indent=2, ensure_ascii=False)
        
        return filepath


# Example usage for testing
if __name__ == "__main__":
    # Load API key from environment
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("Please set ANTHROPIC_API_KEY environment variable")
        exit(1)
    
    interviewer = AIInterviewer(api_key)
    
    # Start interview
    session = interviewer.start_interview("TestUser")
    print(f"Welcome message: {session.messages[0].content}")
    
    # Simulate a conversation
    user_responses = [
        "I think about skincare quite a bit, actually. I have a pretty consistent routine.",
        "Well, I use a cleanser, toner, serum, and moisturizer twice a day. Sometimes a face mask on weekends.",
        "I guess I started taking it more seriously in my late twenties when I noticed some fine lines."
    ]
    
    for response in user_responses:
        ai_response = interviewer.get_ai_response(session, response)
        session = interviewer.update_session(session, response, ai_response)
        print(f"\nUser: {response}")
        print(f"AI: {ai_response}")
    
    # Save session
    filepath = interviewer.save_session(session)
    print(f"\nSession saved to: {filepath}")