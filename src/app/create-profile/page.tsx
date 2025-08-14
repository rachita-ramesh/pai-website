'use client'

import { useState, useEffect, useRef } from 'react'
import Link from "next/link"

// Add TypeScript declarations for speech recognition
interface SpeechRecognitionConstructor {
  new(): SpeechRecognition
}

interface SpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: () => void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onend: () => void
  start: () => void
  stop: () => void
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent {
  error: string
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor
    webkitSpeechRecognition: SpeechRecognitionConstructor
  }
}

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface InterviewData {
  name: string
  sessionId: string
  messages: Message[]
  startTime: Date
  currentTopic: string
  exchangeCount: number
  isComplete: boolean
}

interface Questionnaire {
  questionnaire_id: string
  title: string
  description: string
  category: string
  estimated_duration: number
  questions: unknown[]
}

export default function CreateProfile() {
  const [interviewPhase, setInterviewPhase] = useState<'setup' | 'interview' | 'complete'>('setup')
  const [userName, setUserName] = useState('')
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<Questionnaire[]>([])
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string>('default')
  const [interviewData, setInterviewData] = useState<InterviewData>({
    name: '',
    sessionId: '',
    messages: [],
    startTime: new Date(),
    currentTopic: 'category_relationship',
    exchangeCount: 0,
    isComplete: false
  })
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [interviewData.messages])
  
  // Load available questionnaires
  useEffect(() => {
    const loadQuestionnaires = async () => {
      try {
        const response = await fetch('/api/questionnaires')
        if (response.ok) {
          const data = await response.json()
          setAvailableQuestionnaires(data.questionnaires || [])
        }
      } catch (error) {
        console.error('Error loading questionnaires:', error)
      }
    }
    
    loadQuestionnaires()
  }, [])
  
  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      
      // Better settings for natural conversation
      recognition.continuous = true          // Keep listening continuously
      recognition.interimResults = true     // Show results as you speak
      recognition.lang = 'en-US'
      
      // Add timeout to prevent premature ending
      let silenceTimer: NodeJS.Timeout | null = null
      let lastTranscriptTime = Date.now()
      
      recognition.onstart = () => {
        setIsListening(true)
        lastTranscriptTime = Date.now()
      }
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('Speech recognition result received:', event)
        lastTranscriptTime = Date.now()
        
        // Clear any existing silence timer
        if (silenceTimer) {
          clearTimeout(silenceTimer)
          silenceTimer = null
        }
        
        // Get the latest transcript - simplified approach
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        
        console.log('Transcript:', transcript)
        setCurrentMessage(transcript)
        
        // Check if we have final results
        const hasFinalResult = Array.from(event.results).some(result => result.isFinal)
        
        // Set a timer to stop after silence (only if no final result)
        if (!hasFinalResult) {
          silenceTimer = setTimeout(() => {
            if (Date.now() - lastTranscriptTime > 2000) { // 2 seconds of silence
              recognition.stop()
            }
          }, 2500)
        }
      }
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        setIsListening(false)
      }
      
      recognition.onend = () => {
        setIsListening(false)
        setIsRecording(false)
        if (silenceTimer) {
          clearTimeout(silenceTimer)
        }
      }
      
      recognitionRef.current = recognition
    }
  }, [])
  
  const startVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition not supported in this browser')
      return
    }
    
    console.log('Starting voice recording...')
    setIsRecording(true)
    setCurrentMessage('')
    
    try {
      recognitionRef.current.start()
      console.log('Voice recognition started successfully')
    } catch (error) {
      console.error('Error starting voice recognition:', error)
      setIsRecording(false)
    }
  }
  
  const stopVoiceRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
    }
  }
  
  const startInterview = async () => {
    if (!userName.trim()) return
    
    setIsLoading(true)
    
    try {
      // Call backend to start interview session
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_name: userName
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to start interview: ${response.status}`)
      }
      
      const sessionData = await response.json()
      
      // Convert backend messages to our format
      const messages = sessionData.messages.map((msg: {
        id: string
        type: string
        content: string
        timestamp: string
      }) => ({
        id: msg.id,
        type: msg.type as 'user' | 'ai',
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }))
      
      setInterviewData({
        name: sessionData.participant_name,
        sessionId: sessionData.session_id,
        messages: messages,
        startTime: new Date(sessionData.start_time),
        currentTopic: 'category_relationship',
        exchangeCount: sessionData.exchange_count,
        isComplete: sessionData.is_complete
      })
      
      setInterviewPhase('interview')
      
    } catch (error) {
      console.error('Error starting interview:', error)
      alert('Failed to start interview. Please try again or check your internet connection.')
    } finally {
      setIsLoading(false)
    }
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
      // Call the Python backend API (using direct HTTP approach)
      const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: updatedData.sessionId,
          message: currentMessage,
          exchange_count: updatedData.exchangeCount
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API Error ${response.status}: ${errorData.error || 'Unknown error'}`)
      }
      
      const data = await response.json()
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.ai_response,
        timestamp: new Date()
      }
      
      const finalData = {
        ...updatedData,
        messages: [...updatedData.messages, aiMessage],
        exchangeCount: data.exchange_count,
        isComplete: data.is_complete
      }
      
      setInterviewData(finalData)
      
      if (finalData.isComplete) {
        setInterviewPhase('complete')
        // Automatically complete the interview on the backend
        try {
          await fetch(`/api/interview?action=complete`, {
            method: 'POST'
          })
          console.log('Interview completed on backend')
        } catch (completeError) {
          console.error('Error completing interview on backend:', completeError)
        }
      }
    } catch (error) {
      console.error('Error generating AI response:', error)
      
      // Show the actual error message
      let errorMessage = "Unknown error occurred"
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `🚨 DEBUG - ${errorMessage}`,
        timestamp: new Date()
      }
      
      const finalData = {
        ...updatedData,
        messages: [...updatedData.messages, aiMessage]
      }
      
      setInterviewData(finalData)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCompleteInterview = async () => {
    try {
      // Call backend to extract profile
      const response = await fetch(`/api/interview?action=complete`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Profile extraction started:', result)
        alert(`Interview completed! ${interviewData.exchangeCount} exchanges recorded. Profile extraction has started in the background. Check the backend logs for progress.`)
      } else {
        throw new Error('Failed to complete interview')
      }
      
      // Optionally redirect to a results page or show profile extraction status
      // For now, just log the completion
      console.log('Interview complete:', interviewData)
      
    } catch (error) {
      console.error('Error completing interview:', error)
      alert('Interview completed! Profile extraction is processing in the background.')
    }
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
                
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Choose Interview Type
                </label>
                <select
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    marginBottom: '24px'
                  }}
                  value={selectedQuestionnaire}
                  onChange={(e) => setSelectedQuestionnaire(e.target.value)}
                >
                  <option value="default">Default AI Skincare Interview (~20 min)</option>
                  {availableQuestionnaires.map((q) => (
                    <option key={q.questionnaire_id} value={q.questionnaire_id}>
                      {q.title} (~{q.estimated_duration} min) - {q.category}
                    </option>
                  ))}
                </select>
                
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={isListening ? "Listening..." : "Share your thoughts or click mic to speak..."}
                    style={{
                      flex: '1',
                      padding: '12px 16px',
                      border: isListening ? '2px solid #00d924' : '1px solid #e5e5e5',
                      borderRadius: '24px',
                      fontSize: '16px',
                      outline: 'none',
                      backgroundColor: isListening ? '#f0fdf0' : 'white'
                    }}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={isLoading || isListening}
                  />
                  <button
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    disabled={isLoading}
                    className={isRecording ? "btn-secondary" : "btn-primary"}
                    style={{ 
                      borderRadius: '50%', 
                      width: '48px', 
                      height: '48px', 
                      fontSize: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isRecording ? '#ef4444' : (isListening ? '#00d924' : '#00d924'),
                      animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none'
                    }}
                    title={isRecording ? "Click to stop recording" : "Start voice recording"}
                  >
                    {isRecording ? '⏹️' : '🎤'}
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || isLoading || isListening}
                    className="btn-primary"
                    style={{ borderRadius: '24px', fontSize: '14px', minWidth: '80px' }}
                  >
                    {isLoading ? '...' : 'Send ➤'}
                  </button>
                </div>
                {isListening && (
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '8px', 
                    fontSize: '14px', 
                    color: '#00d924',
                    fontWeight: '500'
                  }}>
                    🎙️ Listening... Take your time, I'll wait for you to finish speaking
                  </div>
                )}
                {isRecording && !isListening && (
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '8px', 
                    fontSize: '14px', 
                    color: '#737373',
                    fontWeight: '500'
                  }}>
                    Processing your speech...
                  </div>
                )}
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
                disabled={!userName.trim() || isLoading}
                className="btn-primary"
              >
                {isLoading ? '🔄 Connecting...' : '🎤 Start Interview'}
              </button>
            )}
            {interviewPhase === 'complete' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleCompleteInterview} className="btn-primary">
                  📊 Extract Profile & Continue
                </button>
                <button onClick={() => window.open('/profile', '_blank')} className="btn-secondary">
                  👤 View My Digital Twin
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}