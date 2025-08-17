'use client'

import { useState, useEffect } from 'react'
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

interface ProfileVersion {
  profile_id: string
  version_number: number
  created_at: string
  is_active: boolean
}

export default function Chat() {
  const [selectedPerson, setSelectedPerson] = useState<string>('rachita')
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')
  const [availableVersions, setAvailableVersions] = useState<ProfileVersion[]>([])
  const [isLoadingVersions, setIsLoadingVersions] = useState(false)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm Rachita's digital twin, created from her real skincare interview. Ask me about skincare decisions, wellness approaches, or how I make choices - I'll respond based on her actual psychological profile!",
      person: 'rachita'
    }
  ])
  const [isLoading, setIsLoading] = useState(false)

  const people = [
    { id: 'rachita', name: 'Rachita', initial: 'R' },
    { id: 'everhett', name: 'Everhett', initial: 'E' },
    { id: 'gigi', name: 'Gigi', initial: 'G' },
  ]

  const selectedPersonData = people.find(f => f.id === selectedPerson)

  // Load versions for default selected person on mount
  useEffect(() => {
    if (selectedPersonData) {
      loadProfileVersions(selectedPersonData.name)
    }
  }, [selectedPersonData]) // Load when person changes

  const loadProfileVersions = async (personName: string) => {
    console.log('Loading profile versions for:', personName)
    setIsLoadingVersions(true)
    try {
      const response = await fetch(`/api/chat?person=${encodeURIComponent(personName)}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Profile versions loaded:', data)
        setAvailableVersions(data.profiles || [])
        
        // Auto-select the latest active version or first version
        if (data.profiles && data.profiles.length > 0) {
          const activeVersion = data.profiles.find((p: ProfileVersion) => p.is_active)
          const latestVersion = data.profiles[0] // Assuming sorted by latest first
          const defaultVersion = activeVersion || latestVersion
          setSelectedProfileId(defaultVersion.profile_id)
          console.log('Auto-selected profile:', defaultVersion.profile_id)
        } else {
          console.log('No profiles found in response')
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to load profile versions:', response.status, errorData)
        setAvailableVersions([])
      }
    } catch (error) {
      console.error('Error loading profile versions:', error)
      setAvailableVersions([])
    } finally {
      setIsLoadingVersions(false)
    }
  }

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

    try {
      // Use real digital twin if we have a selected profile ID, otherwise use mock responses
      if (selectedProfileId) {
        // Call backend to get digital twin response
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile_id: selectedProfileId,
            message: query
          })
        })

        if (response.ok) {
          const data = await response.json()
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: data.response,
            person: selectedPerson,
            timestamp: new Date(),
            rating: null
          }
          setMessages(prev => [...prev, aiMessage])
          
        } else {
          throw new Error('Backend API error')
        }
      } else {
        // Use mock response for other personas
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: generateMockResponse(query, selectedPerson),
          person: selectedPerson,
          timestamp: new Date(),
          rating: null
        }
        setMessages(prev => [...prev, aiMessage])
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      // Fallback to mock response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "I'm having trouble connecting to my digital twin right now. Could you try asking again?",
        person: selectedPerson,
        timestamp: new Date(),
        rating: null
      }
      setMessages(prev => [...prev, aiMessage])
    } finally {
      setIsLoading(false)
    }
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

  
  const clearChat = (personId?: string) => {
    const targetPerson = personId || selectedPerson
    const targetPersonData = people.find(f => f.id === targetPerson)
    
    // Generate specific welcome message based on person
    let welcomeContent
    if (targetPerson === 'rachita') {
      welcomeContent = "Hi! I'm Rachita's digital twin, created from her real skincare interview. Ask me about skincare decisions, wellness approaches, or how I make choices - I'll respond based on her actual psychological profile!"
    } else {
      welcomeContent = `Hi! I'm ${targetPersonData?.name}'s digital twin. Ask me anything and I'll respond as they would.`
    }
    
    const welcomeMessage = {
      id: '1',
      type: 'ai' as const,
      content: welcomeContent,
      person: targetPerson,
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
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
                        loadProfileVersions(person.name)
                        clearChat(person.id)
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

              {/* Version Selection */}
              {selectedPerson && (
                <div className="card" style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Select Version</h3>
                  {isLoadingVersions ? (
                    <div style={{ textAlign: 'center', padding: '16px', color: '#737373' }}>
                      Loading versions...
                    </div>
                  ) : availableVersions.length > 0 ? (
                    <select
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    >
                      {availableVersions.map(version => (
                        <option key={version.profile_id} value={version.profile_id}>
                          {version.profile_id} {version.is_active ? '(Active)' : ''} - {new Date(version.created_at).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px', color: '#737373', fontSize: '14px' }}>
                      No profiles found for {selectedPersonData?.name}
                    </div>
                  )}
                </div>
              )}

              <div className="card">
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Quick Questions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => setQuery("How do you choose skincare products?")}
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
                    Skincare decisions
                  </button>
                  <button 
                    onClick={() => setQuery("What's your approach to wellness and health?")}
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
                    Wellness philosophy
                  </button>
                  <button 
                    onClick={() => setQuery("How do you balance simplicity with effectiveness?")}
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
                    onClick={() => clearChat()}
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