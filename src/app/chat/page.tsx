'use client'

import { useState, useEffect, useRef } from 'react'
import Link from "next/link"

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  person?: string
  timestamp?: Date
  rating?: 'good' | 'bad' | null
  isPlaying?: boolean
}

export default function Chat() {
  const [selectedPerson, setSelectedPerson] = useState<string>('rachita')
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm Rachita's digital twin. Ask me anything and I'll respond as she would.",
      person: 'rachita'
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechEnabled, setSpeechEnabled] = useState(true)
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

  const people = [
    { id: 'rachita', name: 'Rachita', initial: 'R', voice: 'female' },
    { id: 'everhett', name: 'Everhett', initial: 'E', voice: 'male' },
    { id: 'gigi', name: 'Gigi', initial: 'G', voice: 'female' },
  ]

  const selectedPersonData = people.find(f => f.id === selectedPerson)

  const handleSendMessage = async () => {
    if (!query.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setQuery('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateMockResponse(query, selectedPerson),
        person: selectedPerson,
        timestamp: new Date(),
        rating: null
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
      
      // Auto-speak AI response if speech is enabled
      if (speechEnabled) {
        setTimeout(() => {
          speakMessage(aiMessage.content, selectedPerson)
        }, 500)
      }
    }, 2000)
  }

  const generateMockResponse = (question: string, person: string): string => {
    const responses = {
      rachita: {
        default: "As someone who's detail-oriented and analytical, I'd approach this by first gathering all the relevant data and considering multiple perspectives before making a decision.",
        work: "I prefer collaborative work environments where I can bounce ideas off others, but I also value focused solo time for deep thinking.",
        decision: "I make decisions by combining data analysis with intuition. I like to sleep on big decisions and often seek input from trusted advisors."
      },
      everhett: {
        default: "I believe in taking a pragmatic approach to everything. Let me think through this systematically.",
        work: "I'm very methodical in my work approach and prefer clear processes.",
        decision: "I make decisions based on careful analysis and past experience."
      },
      gigi: {
        default: "That's an interesting question! I like to approach things creatively and consider all angles.",
        work: "I enjoy collaborative environments and bringing fresh perspectives to projects.",
        decision: "I make decisions by considering the human impact and long-term consequences."
      }
    }

    const personResponses = responses[person as keyof typeof responses] || responses.rachita
    
    if (question.toLowerCase().includes('work')) {
      return personResponses.work
    } else if (question.toLowerCase().includes('decision') || question.toLowerCase().includes('decide')) {
      return personResponses.decision
    } else {
      return personResponses.default + " What specific aspect would you like me to elaborate on?"
    }
  }

  const rateResponse = (messageId: string, rating: 'good' | 'bad') => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, rating } : msg
      )
    )
  }

  const speakMessage = (text: string, person: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return
    
    // Stop any current speech
    window.speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    
    // Configure voice based on person
    const voices = window.speechSynthesis.getVoices()
    const personData = people.find(p => p.id === person)
    
    if (personData?.voice === 'female') {
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('victoria') ||
        voice.gender === 'female'
      )
      if (femaleVoice) utterance.voice = femaleVoice
    } else {
      const maleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('man') ||
        voice.name.toLowerCase().includes('daniel') ||
        voice.name.toLowerCase().includes('alex') ||
        voice.gender === 'male'
      )
      if (maleVoice) utterance.voice = maleVoice
    }
    
    // Configure speech parameters
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 0.8
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    
    speechRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }
  
  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }
  
  const clearChat = () => {
    stopSpeaking()
    const welcomeMessage = {
      id: '1',
      type: 'ai' as const,
      content: `Hi! I'm ${selectedPersonData?.name}'s digital twin. Ask me anything and I'll respond as they would.`,
      person: selectedPerson,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
    
    // Speak welcome message if speech is enabled
    if (speechEnabled) {
      setTimeout(() => {
        speakMessage(welcomeMessage.content, selectedPerson)
      }, 500)
    }
  }
  
  // Load voices when component mounts
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices()
      }
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

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
                <p>Digital Chat</p>
              </div>
            </Link>
            <div className="badge">Chat Interface</div>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '600', lineHeight: '1.1', marginBottom: '24px' }}>
              Chat with <span className="highlight">Digital Twins</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#737373', maxWidth: '600px', margin: '0 auto' }}>
              Select a person and start a conversation with their AI-powered digital twin.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', marginBottom: '48px' }}>
            {/* Person Selection */}
            <div>
              <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Select Person</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {people.map(person => (
                    <button
                      key={person.id}
                      onClick={() => {
                        setSelectedPerson(person.id)
                        clearChat()
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: selectedPerson === person.id ? '2px solid #00d924' : '1px solid #e5e5e5',
                        borderRadius: '12px',
                        backgroundColor: selectedPerson === person.id ? '#f0fdf0' : 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                        {person.initial}
                      </div>
                      <span style={{ fontWeight: '500' }}>{person.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Quick Questions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => setQuery("How do you make difficult decisions?")}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#f5f5f5',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left'
                    }}
                  >
                    Decision making
                  </button>
                  <button 
                    onClick={() => setQuery("What's your work style like?")}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#f5f5f5',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left'
                    }}
                  >
                    Work style
                  </button>
                  <button 
                    onClick={() => setQuery("How do you handle stress?")}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: '#f5f5f5',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left'
                    }}
                  >
                    Stress management
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                paddingBottom: '16px', 
                borderBottom: '1px solid #e5e5e5',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                    {selectedPersonData?.initial}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0' }}>
                      {selectedPersonData?.name}'s Digital Twin
                    </h3>
                    <p style={{ fontSize: '14px', color: '#737373', margin: '0' }}>
                      AI-powered personality replica
                    </p>
                  </div>
                </div>
<div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSpeechEnabled(!speechEnabled)}
                    className={speechEnabled ? "btn-primary" : "btn-secondary"}
                    style={{ fontSize: '14px', padding: '8px 12px' }}
                    title={speechEnabled ? "Voice enabled" : "Voice disabled"}
                  >
                    {speechEnabled ? '🔊' : '🔇'}
                  </button>
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="btn-secondary"
                      style={{ fontSize: '14px', padding: '8px 12px' }}
                      title="Stop speaking"
                    >
                      ⏹️
                    </button>
                  )}
                  <button
                    onClick={clearChat}
                    className="btn-secondary"
                    style={{ fontSize: '14px', padding: '8px 16px' }}
                  >
                    🔄 Clear
                  </button>
                </div>
              </div>
              
              {/* Messages */}
              <div style={{ flex: '1', overflowY: 'auto', marginBottom: '16px', paddingRight: '8px' }}>
                {messages.map((message) => (
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
                        backgroundColor: message.type === 'user' ? '#00d924' : '#00d924',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {message.type === 'user' ? 'U' : selectedPersonData?.initial}
                      </div>
                      <div>
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
                        
                        {message.type === 'ai' && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button
                              onClick={() => speakMessage(message.content, message.person || selectedPerson)}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                opacity: isSpeaking ? '0.5' : '1'
                              }}
                              disabled={isSpeaking}
                              title="Play voice"
                            >
                              🔊
                            </button>
                            <button
                              onClick={() => rateResponse(message.id, 'good')}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                opacity: message.rating === 'good' ? '1' : '0.5'
                              }}
                            >
                              👍
                            </button>
                            <button
                              onClick={() => rateResponse(message.id, 'bad')}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                opacity: message.rating === 'bad' ? '1' : '0.5'
                              }}
                            >
                              👎
                            </button>
                          </div>
                        )}
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
                        backgroundColor: '#00d924',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>
                        {selectedPersonData?.initial}
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
              </div>

              {/* Input */}
              <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder={`Ask ${selectedPersonData?.name} anything...`}
                    style={{
                      flex: '1',
                      padding: '12px 16px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '24px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!query.trim() || isLoading}
                    className="btn-primary"
                    style={{ borderRadius: '24px', fontSize: '14px' }}
                  >
                    Send ➤
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}