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
  targetQuestions?: number
}

interface Questionnaire {
  questionnaire_id: string
  title: string
  description: string
  category: string
  estimated_duration: number
  questions: {
    id: string
    text: string
    type: string
    options?: string[]
    required: boolean
    helpText?: string
  }[]
}

interface ExtractedProfile {
  profile_id: string
  profile_data: {
    profile_id: string
    demographics?: {
      age_range?: string
      lifestyle?: string
      context?: string
    }
    core_attitudes?: {
      [key: string]: string
    }
    decision_psychology?: {
      research_style?: string
      influence_hierarchy?: string[]
      purchase_triggers?: string[]
      regret_patterns?: string[]
    }
    usage_patterns?: {
      routine_adherence?: string
      context_sensitivity?: string
      emotional_drivers?: string[]
      change_catalysts?: string[]
    }
    value_system?: {
      priority_hierarchy?: string[]
      non_negotiables?: string[]
      ideal_outcome?: string
      core_motivation?: string
    }
    behavioral_quotes?: string[]
    prediction_weights?: {
      [key: string]: number
    }
  }
  questionnaire_id: string
  person_name: string
}

interface ModularQuestionnaire {
  type: 'centrepiece' | 'category' | 'product'
  name: string
  display_name: string
  required: boolean
  estimated_time: number
  completed: boolean
  skipped: boolean
}

export default function CreateProfile() {
  const [interviewPhase, setInterviewPhase] = useState<'questionnaire_selection' | 'setup' | 'interview' | 'complete'>('questionnaire_selection')
  const [userName, setUserName] = useState('')
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<Questionnaire[]>([])
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string>('default')
  const [extractedProfile, setExtractedProfile] = useState<ExtractedProfile | null>(null)
  const [isExtractingProfile, setIsExtractingProfile] = useState(false)
  const [profileExtractionError, setProfileExtractionError] = useState<string | null>(null)
  
  // Modular questionnaire state
  const [profileAction, setProfileAction] = useState<'new' | 'existing' | ''>('')
  const [existingProfiles, setExistingProfiles] = useState<Array<{
    profile_id: string
    is_active: boolean
    created_at: string
  }>>([])
  const [selectedExistingProfile, setSelectedExistingProfile] = useState<string>('')
  const [modularQuestionnaires, setModularQuestionnaires] = useState<ModularQuestionnaire[]>([
    { type: 'centrepiece', name: 'centrepiece', display_name: 'Centrepiece (General Life)', required: true, estimated_time: 15, completed: false, skipped: false },
    { type: 'category', name: 'beauty', display_name: 'Beauty & Skincare', required: false, estimated_time: 10, completed: false, skipped: false },
    { type: 'category', name: 'fitness', display_name: 'Fitness & Health', required: false, estimated_time: 10, completed: false, skipped: false },
    { type: 'product', name: 'moisturizer', display_name: 'Moisturizer Products', required: false, estimated_time: 5, completed: false, skipped: false },
    { type: 'product', name: 'sunscreen', display_name: 'Sunscreen Products', required: false, estimated_time: 5, completed: false, skipped: false }
  ])
  const [selectedQuestionnaires, setSelectedQuestionnaires] = useState<string[]>(['centrepiece'])
  const [interviewData, setInterviewData] = useState<InterviewData>({
    name: '',
    sessionId: '',
    messages: [],
    startTime: new Date(),
    currentTopic: 'category_relationship',
    exchangeCount: 0,
    isComplete: false,
    targetQuestions: 20
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
    
    console.log('DEBUG: Starting interview with:', { userName, selectedQuestionnaire })
    setIsLoading(true)
    
    try {
      // Call backend to start interview session
      console.log('DEBUG: Calling /api/interview')
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_name: userName,
          questionnaire_id: selectedQuestionnaire
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to start interview: ${response.status}`)
      }
      
      const sessionData = await response.json()
      console.log('DEBUG: Interview session data:', sessionData)
      
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
        isComplete: sessionData.is_complete,
        targetQuestions: sessionData.target_questions || 20
      })
      
      setInterviewPhase('interview')
      
    } catch (error) {
      console.error('Error starting interview:', error)
      alert('Failed to start interview. Please try again or check your internet connection.')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Load existing profiles for a person
  const loadExistingProfiles = async (personName: string) => {
    try {
      const response = await fetch(`/api/chat?person=${encodeURIComponent(personName)}`)
      if (response.ok) {
        const data = await response.json()
        setExistingProfiles(data.profiles || [])
        
        // If existing profiles found, check completions
        if (data.profiles && data.profiles.length > 0) {
          await checkExistingCompletions(data.profiles[0].profile_id)
        }
      }
    } catch (error) {
      console.error('Error loading existing profiles:', error)
    }
  }
  
  // Check what questionnaires are already completed for existing profile
  const checkExistingCompletions = async (profileId: string) => {
    try {
      // This would call a new API to get questionnaire completions
      // For now, we'll simulate this
      console.log('Checking completions for profile:', profileId)
      setModularQuestionnaires(prev => prev.map(q => ({
        ...q,
        completed: q.name === 'centrepiece', // Simulate centrepiece already completed
        skipped: false
      })))
    } catch (error) {
      console.error('Error checking completions:', error)
    }
  }
  
  // Handle questionnaire selection changes
  const toggleQuestionnaireSelection = (questionnaireName: string, action: 'select' | 'skip') => {
    setModularQuestionnaires(prev => prev.map(q => {
      if (q.name === questionnaireName) {
        if (action === 'select') {
          // Add to selected if not already there
          if (!selectedQuestionnaires.includes(questionnaireName)) {
            setSelectedQuestionnaires(curr => [...curr, questionnaireName])
          }
          return { ...q, skipped: false }
        } else {
          // Remove from selected and mark as skipped
          setSelectedQuestionnaires(curr => curr.filter(name => name !== questionnaireName))
          return { ...q, skipped: true }
        }
      }
      return q
    }))
  }
  
  // Handle profile action selection
  const handleProfileActionChange = (action: 'new' | 'existing') => {
    setProfileAction(action)
    if (action === 'existing') {
      // Load existing profiles for the current user
      const urlParams = new URLSearchParams(window.location.search)
      const personName = urlParams.get('name') || 'rachita'
      loadExistingProfiles(personName)
    } else {
      // Reset questionnaires for new profile
      setModularQuestionnaires(prev => prev.map(q => ({
        ...q,
        completed: false,
        skipped: false
      })))
      setSelectedQuestionnaires(['centrepiece'])
    }
  }
  
  // Proceed to setup phase
  const proceedToSetup = () => {
    if (selectedQuestionnaires.length === 0) {
      alert('Please select at least one questionnaire')
      return
    }
    setInterviewPhase('setup')
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
      exchangeCount: interviewData.exchangeCount + 1 // Increment for each user message
    }
    
    setInterviewData(updatedData)
    setCurrentMessage('')
    setIsLoading(true)
    
    try {
      // Call the interview API to continue the conversation
      const response = await fetch('/api/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: updatedData.sessionId,
          message: currentMessage,
          exchange_count: updatedData.exchangeCount, // This should increment with each user message
          questionnaire_id: selectedQuestionnaire
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
        isComplete: data.is_complete,
        targetQuestions: data.target_questions || updatedData.targetQuestions
      }
      
      setInterviewData(finalData)
      
      if (finalData.isComplete) {
        setInterviewPhase('complete')
        // Start profile extraction process asynchronously
        startProfileExtraction(finalData.sessionId)
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
  

  const startProfileExtraction = async (sessionId: string) => {
    console.log('Starting profile extraction for session:', sessionId)
    setIsExtractingProfile(true)
    setProfileExtractionError(null)
    
    try {
      const completeResponse = await fetch(`/api/interview?action=complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId
        })
      })
      
      if (completeResponse.ok) {
        const completeResult = await completeResponse.json()
        console.log('Profile extraction completed:', completeResult)
        
        // Only set extracted profile if we have valid profile data
        if (completeResult.profile_data && !completeResult.error) {
          setExtractedProfile(completeResult)
          console.log('Successfully set extracted profile state')
        } else {
          console.error('Profile extraction failed or returned error:', completeResult)
          setProfileExtractionError(completeResult.error || 'Profile extraction failed')
        }
      } else {
        const errorData = await completeResponse.json()
        setProfileExtractionError(errorData.error || 'Failed to extract profile')
      }
    } catch (error) {
      console.error('Error in profile extraction:', error)
      setProfileExtractionError('Network error during profile extraction')
    } finally {
      setIsExtractingProfile(false)
    }
  }

  const downloadProfile = () => {
    if (!extractedProfile?.profile_data) return
    
    const filename = `${extractedProfile.person_name}_${extractedProfile.profile_id}_${extractedProfile.questionnaire_id}.json`
    const dataStr = JSON.stringify(extractedProfile.profile_data, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = filename
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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
              {interviewPhase === 'questionnaire_selection' && 'Choose which questionnaires to complete for your digital twin profile.'}
              {interviewPhase === 'setup' && 'Our AI will conduct a natural 15-20 minute conversation to understand your attitudes and behaviors.'}
              {interviewPhase === 'interview' && 'AI Interview in Progress'}
              {interviewPhase === 'complete' && 'Interview Complete! Your responses will be analyzed to create your digital twin.'}
            </p>
          </div>

          {interviewPhase === 'questionnaire_selection' && (
            <div>
              {/* Profile Action Selection */}
              <div className="card" style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>Choose Profile Action</h2>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '16px',
                    border: profileAction === 'new' ? '2px solid #00d924' : '1px solid #e5e5e5',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    flex: 1
                  }}>
                    <input
                      type="radio"
                      name="profileAction"
                      value="new"
                      checked={profileAction === 'new'}
                      onChange={() => handleProfileActionChange('new')}
                      style={{ margin: 0 }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>Create New Profile</div>
                      <div style={{ fontSize: '14px', color: '#737373' }}>Start fresh with a new version</div>
                    </div>
                  </label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '16px',
                    border: profileAction === 'existing' ? '2px solid #00d924' : '1px solid #e5e5e5',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    flex: 1
                  }}>
                    <input
                      type="radio"
                      name="profileAction"
                      value="existing"
                      checked={profileAction === 'existing'}
                      onChange={() => handleProfileActionChange('existing')}
                      style={{ margin: 0 }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>Add to Existing Profile</div>
                      <div style={{ fontSize: '14px', color: '#737373' }}>Enhance an existing version</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Existing Profile Selection */}
              {profileAction === 'existing' && existingProfiles.length > 0 && (
                <div className="card" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Select Existing Profile</h3>
                  <select
                    value={selectedExistingProfile}
                    onChange={(e) => setSelectedExistingProfile(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none'
                    }}
                  >
                    <option value="">Choose a profile to enhance...</option>
                    {existingProfiles.map(profile => (
                      <option key={profile.profile_id} value={profile.profile_id}>
                        {profile.profile_id} {profile.is_active ? '(Active)' : ''} - {new Date(profile.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Questionnaire Selection */}
              {profileAction && (
                <div className="card" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Select Questionnaires</h3>
                  <p style={{ fontSize: '14px', color: '#737373', marginBottom: '24px' }}>
                    Choose which questionnaires to complete. You can always add more later.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {modularQuestionnaires.map(questionnaire => (
                      <div 
                        key={questionnaire.name}
                        style={{ 
                          padding: '16px',
                          border: '1px solid #e5e5e5',
                          borderRadius: '8px',
                          backgroundColor: questionnaire.completed ? '#f0fdf0' : 'white'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                                {questionnaire.display_name}
                              </h4>
                              {questionnaire.required && (
                                <span style={{ 
                                  fontSize: '12px', 
                                  color: '#dc2626', 
                                  backgroundColor: '#fef2f2',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}>
                                  Required
                                </span>
                              )}
                              {questionnaire.completed && (
                                <span style={{ 
                                  fontSize: '12px', 
                                  color: '#16a34a', 
                                  backgroundColor: '#f0fdf0',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}>
                                  ✓ Completed
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '14px', color: '#737373' }}>
                              ~{questionnaire.estimated_time} minutes • {questionnaire.type}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {!questionnaire.completed && (
                              <>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedQuestionnaires.includes(questionnaire.name)}
                                    onChange={() => toggleQuestionnaireSelection(questionnaire.name, 'select')}
                                    disabled={questionnaire.required}
                                  />
                                  <span style={{ fontSize: '14px' }}>Include</span>
                                </label>
                                {!questionnaire.required && (
                                  <button
                                    onClick={() => toggleQuestionnaireSelection(questionnaire.name, 'skip')}
                                    style={{
                                      padding: '4px 8px',
                                      fontSize: '12px',
                                      border: '1px solid #e5e5e5',
                                      borderRadius: '4px',
                                      backgroundColor: questionnaire.skipped ? '#fef2f2' : 'white',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {questionnaire.skipped ? 'Skipped' : 'Skip'}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                      Selected: {selectedQuestionnaires.length} questionnaires
                    </div>
                    <div style={{ fontSize: '14px', color: '#737373' }}>
                      Estimated time: {modularQuestionnaires
                        .filter(q => selectedQuestionnaires.includes(q.name))
                        .reduce((total, q) => total + q.estimated_time, 0)} minutes
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {interviewPhase === 'setup' && (
            <div className="card" style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>AI Interview</h2>
              <p style={{ fontSize: '16px', color: '#737373', marginBottom: '32px' }}>
                Our AI researcher will conduct a natural conversation to understand your attitudes and behaviors. 
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
                  {extractedProfile && (
                    <li>Profile ID: {extractedProfile.profile_id}</li>
                  )}
                </ul>
              </div>
              
              {/* Profile Extraction Loading */}
              {isExtractingProfile && (
                <div style={{ padding: '24px', backgroundColor: '#fef3c7', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      border: '2px solid #f59e0b', 
                      borderTop: '2px solid transparent', 
                      borderRadius: '50%', 
                      animation: 'spin 1s linear infinite' 
                    }}></div>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                      Extracting Your Digital Twin Profile...
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#78350f', margin: '0' }}>
                    Analyzing your responses and creating your personality profile. This may take a few moments.
                  </p>
                </div>
              )}
              
              {/* Profile Extraction Error */}
              {profileExtractionError && !isExtractingProfile && (
                <div style={{ padding: '16px', backgroundColor: '#fef2f2', borderRadius: '8px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#dc2626' }}>Profile Extraction Failed</h3>
                  <p style={{ fontSize: '14px', color: '#991b1b', margin: '0 0 12px 0' }}>
                    {profileExtractionError}
                  </p>
                  <button 
                    onClick={() => startProfileExtraction(interviewData.sessionId)}
                    className="btn-primary"
                    style={{ fontSize: '14px' }}
                  >
                    🔄 Retry Profile Extraction
                  </button>
                </div>
              )}
              
              {extractedProfile?.profile_data && (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>Your Digital Twin Profile</h3>
                    <button 
                      onClick={downloadProfile}
                      className="btn-secondary"
                      style={{ fontSize: '14px' }}
                    >
                      📥 Download JSON
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {/* Demographics Section */}
                    {extractedProfile.profile_data.demographics && (
                      <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#171717' }}>Demographics</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '14px' }}>
                          {extractedProfile.profile_data.demographics.age_range && (
                            <div><strong>Age Range:</strong> {extractedProfile.profile_data.demographics.age_range}</div>
                          )}
                          {extractedProfile.profile_data.demographics.lifestyle && (
                            <div><strong>Lifestyle:</strong> {extractedProfile.profile_data.demographics.lifestyle}</div>
                          )}
                          {extractedProfile.profile_data.demographics.context && (
                            <div><strong>Context:</strong> {extractedProfile.profile_data.demographics.context}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Core Attitudes Section */}
                    {extractedProfile.profile_data.core_attitudes && (
                      <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#171717' }}>Core Attitudes</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '14px' }}>
                          {Object.entries(extractedProfile.profile_data.core_attitudes).map(([key, value]) => (
                            <div key={key}><strong>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Decision Psychology Section */}
                    {extractedProfile.profile_data.decision_psychology && (
                      <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#171717' }}>Decision Psychology</h4>
                        <div style={{ fontSize: '14px' }}>
                          {extractedProfile.profile_data.decision_psychology.research_style && (
                            <div style={{ marginBottom: '8px' }}><strong>Research Style:</strong> {extractedProfile.profile_data.decision_psychology.research_style}</div>
                          )}
                          {extractedProfile.profile_data.decision_psychology.influence_hierarchy && (
                            <div style={{ marginBottom: '8px' }}>
                              <strong>Influence Hierarchy:</strong>
                              <ul style={{ marginLeft: '16px', marginTop: '4px' }}>
                                {extractedProfile.profile_data.decision_psychology.influence_hierarchy.map((item, idx) => (
                                  <li key={idx}>{item.replace(/_/g, ' ')}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {extractedProfile.profile_data.decision_psychology.purchase_triggers && (
                            <div style={{ marginBottom: '8px' }}>
                              <strong>Purchase Triggers:</strong>
                              <ul style={{ marginLeft: '16px', marginTop: '4px' }}>
                                {extractedProfile.profile_data.decision_psychology.purchase_triggers.map((item, idx) => (
                                  <li key={idx}>{item.replace(/_/g, ' ')}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Usage Patterns Section */}
                    {extractedProfile.profile_data.usage_patterns && (
                      <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#171717' }}>Usage Patterns</h4>
                        <div style={{ fontSize: '14px' }}>
                          {extractedProfile.profile_data.usage_patterns.routine_adherence && (
                            <div style={{ marginBottom: '8px' }}><strong>Routine Adherence:</strong> {extractedProfile.profile_data.usage_patterns.routine_adherence}</div>
                          )}
                          {extractedProfile.profile_data.usage_patterns.context_sensitivity && (
                            <div style={{ marginBottom: '8px' }}><strong>Context Sensitivity:</strong> {extractedProfile.profile_data.usage_patterns.context_sensitivity}</div>
                          )}
                          {extractedProfile.profile_data.usage_patterns.emotional_drivers && (
                            <div style={{ marginBottom: '8px' }}>
                              <strong>Emotional Drivers:</strong>
                              <ul style={{ marginLeft: '16px', marginTop: '4px' }}>
                                {extractedProfile.profile_data.usage_patterns.emotional_drivers.map((item, idx) => (
                                  <li key={idx}>{item.replace(/_/g, ' ')}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Value System Section */}
                    {extractedProfile.profile_data.value_system && (
                      <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#171717' }}>Value System</h4>
                        <div style={{ fontSize: '14px' }}>
                          {extractedProfile.profile_data.value_system.priority_hierarchy && (
                            <div style={{ marginBottom: '8px' }}>
                              <strong>Priority Hierarchy:</strong>
                              <ol style={{ marginLeft: '16px', marginTop: '4px' }}>
                                {extractedProfile.profile_data.value_system.priority_hierarchy.map((item, idx) => (
                                  <li key={idx}>{item.replace(/_/g, ' ')}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                          {extractedProfile.profile_data.value_system.ideal_outcome && (
                            <div style={{ marginBottom: '8px' }}><strong>Ideal Outcome:</strong> {extractedProfile.profile_data.value_system.ideal_outcome}</div>
                          )}
                          {extractedProfile.profile_data.value_system.core_motivation && (
                            <div style={{ marginBottom: '8px' }}><strong>Core Motivation:</strong> {extractedProfile.profile_data.value_system.core_motivation}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Behavioral Quotes Section */}
                    {extractedProfile.profile_data.behavioral_quotes && extractedProfile.profile_data.behavioral_quotes.length > 0 && (
                      <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#171717' }}>Key Insights</h4>
                        <div style={{ fontSize: '14px' }}>
                          {extractedProfile.profile_data.behavioral_quotes.map((quote, idx) => (
                            <div key={idx} style={{ marginBottom: '8px', fontStyle: 'italic', padding: '8px', backgroundColor: '#ffffff', borderRadius: '4px', borderLeft: '3px solid #00d924' }}>
                              "{quote}"
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!extractedProfile?.profile_data && (
                <p style={{ fontSize: '16px', color: '#737373', marginBottom: '24px' }}>
                  Your interview has been recorded and will be processed to create your digital twin profile. 
                  This involves extracting psychological patterns, behavioral preferences, and decision-making styles.
                </p>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
            <Link href="/" className="btn-secondary">
              ← Back to Home
            </Link>
            
            {interviewPhase === 'questionnaire_selection' && (
              <button 
                onClick={proceedToSetup} 
                disabled={!profileAction || selectedQuestionnaires.length === 0}
                className="btn-primary"
              >
                Continue to Interview Setup →
              </button>
            )}
            
            {interviewPhase === 'setup' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setInterviewPhase('questionnaire_selection')} 
                  className="btn-secondary"
                >
                  ← Back to Selection
                </button>
                <button 
                  onClick={startInterview} 
                  disabled={!userName.trim() || isLoading}
                  className="btn-primary"
                >
                  {isLoading ? '🔄 Connecting...' : '🎤 Start Interview'}
                </button>
              </div>
            )}
            {interviewPhase === 'complete' && (
              <Link href="/create-profile" className="btn-primary">
                🎤 Create Another Profile
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}