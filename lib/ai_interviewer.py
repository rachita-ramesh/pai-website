"""
AI Interviewer System
Conducts A&U research interviews using Claude API
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
            
            # Extract conversational themes from questionnaire questions based on profile tags
            themes = self._extract_conversation_themes(questions, category)
            
            return f"""You are a warm, curious researcher having a genuine conversation to understand this person's life and experiences around {category}. Your goal is to learn about their psychology, attitudes, and behaviors through natural dialogue.

CONVERSATION APPROACH:
- This is a NATURAL CONVERSATION, not a survey or interview
- Be genuinely curious and interested in them as a person  
- Follow the natural flow of conversation based on what they share
- Ask follow-up questions about interesting details they mention
- Show you're actively listening and engaged

KEY THEMES TO EXPLORE NATURALLY:
{themes}

HOW TO USE THEMES:
- These themes correspond to specific sections of their digital profile
- Each theme represents important data that will be extracted for their persona
- Weave them into conversation naturally, but ensure you cover ALL themes during the interview
- If they mention something related to a theme, explore it deeper
- Balance between following their natural responses and systematically covering all profile areas
- Their answers will be categorized into specific profile sections based on these themes

CONVERSATIONAL STYLE:
- Be warm, friendly, and genuinely curious
- Ask ONE simple question at a time - NEVER multiple questions
- Keep responses brief (1-2 sentences max)
- Use their own words when following up
- Show active listening: "That's interesting..." "Tell me more about..." "I'm curious about..."
- Be conversational, not formal or clinical

NATURAL FOLLOW-UP PATTERNS (Use ONE):
- "That sounds [interesting/challenging/exciting] - tell me more about that"
- "What's that like for you?"
- "How do you feel about that?"
- "Can you give me an example?"
- "What made you decide to [action they mentioned]?"
- "You mentioned [specific thing] - I'm curious about that"

CONVERSATION FLOW:
- Start with their response and ask natural follow-ups
- When a topic feels explored, transition naturally: "That makes sense. What about..."
- If they give rich answers, dig deeper before moving to new topics
- If they give short answers, ask gentle follow-ups to understand more
- SYSTEMATICALLY ensure you cover all themes - each maps to a crucial profile section
- Track which themes you've covered vs. which still need exploration
- Near the end, address any themes you haven't naturally covered yet

RESPONSE RULES:
- ONE question maximum per response
- 1-2 sentences only
- Sound like a real person having a conversation
- Never sound robotic or like you're reading from a script

END NATURALLY:
When you've had a good conversation covering the key themes naturally, end with:
"This has been really insightful. Is there anything else about {category} that feels important for me to understand?"

Remember: You're having a real conversation with a real person. Be genuinely interested, follow what they're sharing, and let the conversation flow naturally while gently exploring the key themes."""
        
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
    
    def _extract_conversation_themes(self, questions, category):
        """Extract natural conversation themes based on profile tag sections"""
        if not questions:
            return f"- Their general relationship with {category}\n- Personal experiences and stories\n- What matters most to them in this area"
            
        # Group questions by their tag sections to preserve profile mapping
        section_themes = {}
        
        for q in questions:
            tags = q.get('tags', [])
            if tags and len(tags) >= 2:
                section = tags[0]  # e.g., 'lifestyle', 'personality' 
                field = tags[1]    # e.g., 'daily_life_work', 'self_description'
                
                if section not in section_themes:
                    section_themes[section] = set()
                section_themes[section].add(field)
        
        # Convert tag sections into natural conversation themes
        formatted_themes = []
        
        for section, fields in section_themes.items():
            if section == 'lifestyle':
                formatted_themes.append("Their daily life, work, and personal interests")
            elif section == 'media_and_culture':
                formatted_themes.append("How they consume media and stay informed about the world")
            elif section == 'personality':
                formatted_themes.append("How they see themselves and their personality traits")
            elif section == 'values_and_beliefs':
                formatted_themes.append("What's most important to them and their core values")
            elif section == 'skin_and_hair_type':
                formatted_themes.append("Their skin and hair characteristics and concerns")
            elif section == 'routine':
                formatted_themes.append("Their beauty and skincare routines and habits")
            elif section == 'facial_moisturizer_attitudes':
                formatted_themes.append("Their relationship with facial moisturizers and skincare products")
            elif section == 'moisturizer_usage':
                formatted_themes.append("How they use and think about moisturizers")
            else:
                # Generic fallback for unmapped sections
                section_name = section.replace('_', ' ').title()
                formatted_themes.append(f"Their {section_name.lower()}")
        
        # Format themes with bullets
        if formatted_themes:
            theme_list = [f"- {theme}" for theme in formatted_themes]
            return '\n'.join(theme_list)
        else:
            # Fallback if no tags found
            return f"- Their personal relationship with {category}\n- What experiences have shaped their perspective\n- What matters most to them in this area"

    def _generate_natural_opening(self, participant_name, category, title):
        """Generate natural conversational opening based on category"""
        category_lower = category.lower()
        
        # Category-specific natural openings
        if 'life' in category_lower or 'general' in category_lower:
            return f"Hi {participant_name}! I'd love to get to know you better. Tell me, what does a typical day look like for you?"
        elif 'skincare' in category_lower or 'beauty' in category_lower:
            return f"Hi {participant_name}! I'm curious about your relationship with skincare. Is it something you think about a lot, or more just routine for you?"
        elif 'moisturizer' in category_lower:
            return f"Hi {participant_name}! Let's talk about moisturizers. What role do they play in your skincare routine?"
        elif 'fitness' in category_lower or 'exercise' in category_lower:
            return f"Hi {participant_name}! I'd love to understand your relationship with fitness. How active would you say you are?"
        else:
            # Generic fallback
            return f"Hi {participant_name}! I'm really interested to learn about your experiences with {category}. How would you describe your relationship with it?"
    
    def start_interview(self, participant_name: str) -> InterviewSession:
        """Start a new interview session"""
        # Include questionnaire ID in session_id to avoid conflicts
        questionnaire_type = "default"
        if self.questionnaire_context and 'questionnaire_id' in self.questionnaire_context:
            questionnaire_type = self.questionnaire_context['questionnaire_id']
        elif self.questionnaire_context and 'category' in self.questionnaire_context:
            questionnaire_type = self.questionnaire_context['category']
            
        session_id = f"interview_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{participant_name}_{questionnaire_type}"
        print(f"DEBUG: Generated session_id: {session_id}")
        
        # Generate natural welcome message based on questionnaire context
        if self.questionnaire_context:
            category = self.questionnaire_context.get('category', 'general')
            title = self.questionnaire_context.get('title', '')
            
            # Generate natural conversational greeting based on category/title
            welcome_content = self._generate_natural_opening(participant_name, category, title)
        else:
            # Default skincare greeting
            welcome_content = f"Hi {participant_name}! I'd love to understand your relationship with skincare. Tell me, is skincare something you think about a lot, or is it more just routine for you?"
        
        welcome_message = InterviewMessage(
            id="1",
            type="ai",
            content=welcome_content,
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
        
        # Check if interview should be completed based on questionnaire target
        target_questions = 8  # Reduced default for better user experience
        if self.questionnaire_context and 'target_questions' in self.questionnaire_context:
            # Use a more reasonable target based on questionnaire length
            base_questions = len(self.questionnaire_context.get('questions', []))
            target_questions = max(3, min(base_questions + 2, 8))  # 3-8 questions max
        
        if session.exchange_count >= target_questions:
            session.is_complete = True
            # Add completion message if not already ending
            if "anything else about" not in ai_response.lower():
                # Determine topic based on questionnaire context
                topic = "this topic"
                if self.questionnaire_context:
                    topic = self.questionnaire_context.get('category', 'this topic')
                
                completion_msg = InterviewMessage(
                    id=str(len(session.messages) + 1),
                    type="ai",
                    content=f"This has been really insightful. Is there anything else about {topic} that feels important for me to understand?",
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