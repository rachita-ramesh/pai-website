# Pai Interview Implementation Options

## Option 1: AI Interviewer (Recommended for Weekend Build)

### Setup:
- Claude/GPT with conversational prompt
- Voice-to-text for natural conversation
- Saves transcript automatically

### AI Interviewer Prompt:
```
You are conducting an A&U (Attitudes & Usage) research interview about skincare. 
Your goal is to understand this person's psychology, attitudes, and behaviors around skincare.

INTERVIEW STYLE:
- Conversational and friendly, like a skilled researcher
- Ask follow-up questions based on their responses
- Dig deeper when you hear interesting insights
- Don't rush - let them elaborate
- Notice contradictions and explore them gently

INTERVIEW FLOW:
1. Start with: "I'd love to understand your relationship with skincare. Tell me, is skincare something you think about a lot, or is it more just routine for you?"

2. Based on their answer, follow the natural conversation flow while covering these key areas:
   - Their overall relationship with skincare
   - How they feel about aging and skin changes
   - How they make decisions about products
   - What influences them (science, reviews, friends)
   - Their actual usage behaviors and routines
   - Their values and what matters most to them
   - How they want to feel about their skin in the future

INTERVIEW QUESTIONS TO COVER:
[Include the 22 questions from the interview guide as reference]

Remember: This should feel like a natural conversation, not a survey. Ask follow-ups, show curiosity, and help them reflect on their choices and feelings.
```

### Implementation:
```python
# Simple AI interviewer
def run_ai_interview(participant_name):
    interview_prompt = [above prompt]
    conversation = []
    
    while not interview_complete:
        ai_question = claude_api.call(interview_prompt + conversation)
        user_response = get_voice_or_text_input()
        conversation.append({"ai": ai_question, "human": user_response})
    
    return generate_transcript(conversation)
```

---

## Option 2: Lightweight Website

### Simple Web Form Structure:
```html
<!-- Multi-step form with conversation flow -->
<div class="interview-step">
    <h3>Let's start with your relationship to skincare</h3>
    <p>Tell me about skincare in your life. Is it something you think about a lot, or is it just routine?</p>
    <textarea placeholder="Take your time - there are no right or wrong answers..."></textarea>
    <button onclick="nextQuestion()">Continue</button>
</div>
```

### Key Features:
- **Progressive disclosure** - one question at a time
- **Conditional follow-ups** - "You mentioned X, can you tell me more about that?"
- **Auto-save** - don't lose progress
- **Conversational tone** - feels like chatting, not surveying

### Sample Question Flow:
1. **Category Relationship** → Based on answer, ask about routine vs. problem-solving
2. **Aging Attitudes** → If they mention concerns, dig into specific worries
3. **Decision Making** → If they mention research, ask about trusted sources
4. **Usage Context** → If routine is simple, ask what would make them change it

---

## Recommended: AI Interviewer for Weekend

### Why AI Interviewer is Better:
1. **More natural** - feels like conversation vs. form filling
2. **Adaptive follow-ups** - AI can pursue interesting threads
3. **Richer data** - people elaborate more in conversation
4. **Faster to build** - no complex web form logic needed
5. **Better for founders** - you'll get comfortable with the interview process

### Technical Implementation (Claude Code):
```python
# weekend_pai_interviewer.py
import anthropic
import speech_recognition as sr
import pyttsx3

class PaiInterviewer:
    def __init__(self):
        self.client = anthropic.Client()
        self.conversation = []
        self.interview_complete = False
    
    def conduct_interview(self, participant_name):
        print(f"Starting interview with {participant_name}")
        
        # Initial question
        current_question = "I'd love to understand your relationship with skincare..."
        
        while not self.interview_complete:
            print(f"AI: {current_question}")
            
            # Get response (voice or text)
            response = self.get_user_input()
            
            # Save to conversation
            self.conversation.append({
                "question": current_question,
                "response": response
            })
            
            # Generate next question
            current_question = self.generate_next_question()
            
            # Check if interview is complete (15-20 exchanges)
            if len(self.conversation) >= 20:
                self.interview_complete = True
        
        return self.save_transcript(participant_name)
    
    def generate_next_question(self):
        # Send conversation to Claude to generate follow-up
        prompt = f"""
        Based on this skincare interview so far, what should I ask next?
        Conversation: {self.conversation}
        
        Generate a natural follow-up question that digs deeper into their attitudes and behaviors.
        """
        
        response = self.client.messages.create(
            model="claude-3-sonnet-20240229",
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.content
```

### Weekend Timeline:
**Saturday Morning**: Build AI interviewer
**Saturday Afternoon**: All 3 founders complete interviews  
**Sunday**: Extract profiles and test prediction accuracy

Want me to help you design the specific prompts for extracting Pai profiles from these interview transcripts?