'use client'

import { useState, useEffect, useRef } from 'react'
import Link from "next/link"

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface InterviewData {
  name: string
  messages: Message[]
  startTime: Date
  currentTopic: string
  exchangeCount: number
  isComplete: boolean
}

export default function CreateProfile() {
  const [interviewPhase, setInterviewPhase] = useState<'setup' | 'interview' | 'complete'>('setup')
  const [userName, setUserName] = useState('')
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [interviewData, setInterviewData] = useState<InterviewData>({
    name: '',
    messages: [],
    startTime: new Date(),
    currentTopic: 'category_relationship',
    exchangeCount: 0,
    isComplete: false
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [interviewData.messages])
  
  const startInterview = () => {
    if (!userName.trim()) return
    
    const welcomeMessage: Message = {
      id: '1',
      type: 'ai',
      content: `Hi ${userName}! I'd love to understand your relationship with skincare. Tell me, is skincare something you think about a lot, or is it more just routine for you?`,
      timestamp: new Date()
    }
    
    setInterviewData({
      name: userName,
      messages: [welcomeMessage],
      startTime: new Date(),
      currentTopic: 'category_relationship',
      exchangeCount: 0,
      isComplete: false
    })
    
    setInterviewPhase('interview')
  }
  
  const generateAIResponse = async (userResponse: string, currentData: InterviewData): Promise<string> => {
    // This will eventually call Claude API - for now using mock responses
    const mockResponses = [
      "That's really interesting! Can you tell me more about how that fits into your daily routine?",
      "I hear what you're saying. How has your approach to skincare changed over time?",
      "Help me understand what you mean by that - can you give me a specific example?",
      "That's fascinating. What goes through your mind when you're choosing a new product?",
      "How does that make you feel when that happens?",
      "You mentioned something interesting there - how does that influence your decisions?"
    ]
    
    // Simple logic for now - will be replaced with actual AI
    const responseIndex = currentData.exchangeCount % mockResponses.length
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Check if interview should end (20+ exchanges)
    if (currentData.exchangeCount >= 19) {
      return "This has been really insightful, ${userName}. Is there anything else about your relationship with skincare that feels important for me to understand?"
    }
    
    return mockResponses[responseIndex]
  }
  
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    }
    
    const updatedData = {
      ...interviewData,
      messages: [...interviewData.messages, userMessage],
      exchangeCount: interviewData.exchangeCount + 1
    }
    
    setInterviewData(updatedData)
    setCurrentMessage('')
    setIsLoading(true)
    
    try {
      const aiResponse = await generateAIResponse(currentMessage, updatedData)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }
      
      const finalData = {
        ...updatedData,
        messages: [...updatedData.messages, aiMessage],
        isComplete: updatedData.exchangeCount >= 20
      }
      
      setInterviewData(finalData)
      
      if (finalData.isComplete) {
        setInterviewPhase('complete')
      }
    } catch (error) {
      console.error('Error generating AI response:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCompleteInterview = () => {
    // This will eventually extract profile and save data
    console.log('Interview complete:', interviewData)
    alert(`Interview completed! ${interviewData.exchangeCount} exchanges recorded. Profile extraction coming next.`)
  }

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="container">
          <nav className="nav">
            <Link href="/" className="logo">
              <div className="logo-icon">
                <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '2px' }}></div>
              </div>
              <div className="logo-text">
                <h1>PAI</h1>
                <p>Profile Creation</p>
              </div>
            </Link>
            <div className="badge">Step 1 of 2</div>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '600', lineHeight: '1.1', marginBottom: '24px' }}>
              Build Your <span className="highlight">Digital Twin</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#737373', maxWidth: '600px', margin: '0 auto' }}>
              {interviewPhase === 'setup' && 'Our AI will conduct a natural 15-20 minute conversation to understand your skincare attitudes and behaviors.'}
              {interviewPhase === 'interview' && `AI Interview in Progress - ${interviewData.exchangeCount} exchanges so far`}
              {interviewPhase === 'complete' && 'Interview Complete! Your responses will be analyzed to create your digital twin.'}
            </p>
          </div>

          {interviewPhase === 'setup' && (
            <div className="card" style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>AI Skincare Interview</h2>
              <p style={{ fontSize: '16px', color: '#737373', marginBottom: '32px' }}>
                Our AI researcher will conduct a natural conversation to understand your attitudes and behaviors around skincare. 
                This typically takes 15-20 minutes and helps us create a detailed psychological profile.
              </p>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  What should we call you?
                </label>
                <input
                  type="text"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    marginBottom: '24px'
                  }}
                  placeholder="Your first name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && startInterview()}
                />
                
                <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>What to expect:</h3>
                  <ul style={{ fontSize: '14px', color: '#737373', paddingLeft: '20px', margin: '0' }}>
                    <li>Natural conversation about your skincare habits and attitudes</li>
                    <li>Questions about your relationship with skincare and beauty</li>
                    <li>Discussion of your decision-making patterns and preferences</li>
                    <li>Exploration of your values and priorities around self-care</li>
                    <li>Approximately 20-25 back-and-forth exchanges</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {interviewPhase === 'interview' && (
            <div className="card" style={{ marginBottom: '32px', height: '600px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                paddingBottom: '16px', 
                borderBottom: '1px solid #e5e5e5',
                marginBottom: '16px'
              }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>Interview with {interviewData.name}</h2>
                  <p style={{ fontSize: '14px', color: '#737373', margin: '0' }}>Exchange {interviewData.exchangeCount} of ~20</p>
                </div>
                <div style={{ fontSize: '14px', color: '#737373' }}>
                  Started {interviewData.startTime.toLocaleTimeString()}
                </div>
              </div>
              
              <div style={{ flex: '1', overflowY: 'auto', marginBottom: '16px', paddingRight: '8px' }}>
                {interviewData.messages.map((message) => (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      maxWidth: '80%',
                      flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: message.type === 'user' ? '#00d924' : '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: message.type === 'user' ? 'white' : '#171717',
                        fontSize: '14px',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {message.type === 'user' ? userName.charAt(0).toUpperCase() : 'AI'}
                      </div>
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: '16px',
                        backgroundColor: message.type === 'user' ? '#00d924' : '#f5f5f5',
                        color: message.type === 'user' ? 'white' : '#171717'
                      }}>
                        <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.4' }}>
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', maxWidth: '80%' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#171717',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        AI
                      </div>
                      <div style={{ padding: '12px 16px', borderRadius: '16px', backgroundColor: '#f5f5f5' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <div style={{ width: '8px', height: '8px', backgroundColor: '#737373', borderRadius: '50%', animation: 'bounce 1s infinite' }}></div>
                          <div style={{ width: '8px', height: '8px', backgroundColor: '#737373', borderRadius: '50%', animation: 'bounce 1s infinite 0.1s' }}></div>
                          <div style={{ width: '8px', height: '8px', backgroundColor: '#737373', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Share your thoughts..."
                    style={{
                      flex: '1',
                      padding: '12px 16px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '24px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isLoading}
                    className="btn-primary"
                    style={{ borderRadius: '24px', fontSize: '14px' }}
                  >
                    Send ➤
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {interviewPhase === 'complete' && (
            <div className="card" style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>Interview Complete! 🎉</h2>
              <div style={{ padding: '16px', backgroundColor: '#f0fdf0', borderRadius: '8px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#00d924' }}>Interview Summary</h3>
                <ul style={{ fontSize: '14px', color: '#737373', paddingLeft: '20px', margin: '0' }}>
                  <li>Participant: {interviewData.name}</li>
                  <li>Total exchanges: {interviewData.exchangeCount}</li>
                  <li>Duration: {Math.round((new Date().getTime() - interviewData.startTime.getTime()) / 1000 / 60)} minutes</li>
                  <li>Messages recorded: {interviewData.messages.length}</li>
                </ul>
              </div>
              <p style={{ fontSize: '16px', color: '#737373', marginBottom: '24px' }}>
                Your interview has been recorded and will be processed to create your digital twin profile. 
                This involves extracting psychological patterns, behavioral preferences, and decision-making styles.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
            <Link href="/" className="btn-secondary">
              ← Back to Home
            </Link>
            {interviewPhase === 'setup' && (
              <button 
                onClick={startInterview} 
                disabled={!userName.trim()}
                className="btn-primary"
              >
                🎤 Start Interview
              </button>
            )}
            {interviewPhase === 'complete' && (
              <button onClick={handleCompleteInterview} className="btn-primary">
                📊 Extract Profile & Continue
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}