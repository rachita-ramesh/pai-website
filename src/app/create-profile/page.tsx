'use client'

import { useState, useEffect, useRef } from 'react'
import Link from "next/link"
import { ProfileDataDisplay } from '../../components/ProfileDataDisplay'

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

// Remove unused Questionnaire interface - now using modular questionnaire system

interface QuestionnaireItem {
  name: string
  display_name: string
}

interface CompletenessMetadata {
  centrepiece: QuestionnaireItem | null
  categories: QuestionnaireItem[]
  products: QuestionnaireItem[]
}

interface DatabaseQuestionnaire {
  questionnaire_id: string
  title: string
  questionnaire_type: string
  estimated_duration: number
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
  total_exchanges?: number
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
  // Remove unused state - questionnaire selection now handled by selectedQuestionnaires array
  const [extractedProfile, setExtractedProfile] = useState<ExtractedProfile | null>(null)
  const [isExtractingProfile, setIsExtractingProfile] = useState(false)
  const [profileExtractionError, setProfileExtractionError] = useState<string | null>(null)
  
  // Modular questionnaire state
  const [profileAction, setProfileAction] = useState<'new' | 'existing' | ''>('new')
  const [existingProfiles, setExistingProfiles] = useState<Array<{
    profile_id: string
    is_active: boolean
    created_at: string
    completeness_metadata?: Record<string, boolean> | CompletenessMetadata
  }>>([])
  const [selectedExistingProfile, setSelectedExistingProfile] = useState<string>('')
  const [modularQuestionnaires, setModularQuestionnaires] = useState<ModularQuestionnaire[]>([])
  const [selectedQuestionnaires, setSelectedQuestionnaires] = useState<string[]>([])
  const [currentQuestionnaireIndex, setCurrentQuestionnaireIndex] = useState(0)
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

  // Initialize username from URL params on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const personName = urlParams.get('name') || 'rachita'
    console.log('DEBUG: URL params:', window.location.search)
    console.log('DEBUG: Extracted person name:', personName)
    setUserName(personName)
  }, [])
  
  // Load available questionnaires from database
  useEffect(() => {
    const loadQuestionnaires = async () => {
      try {
        const response = await fetch('/python-api/questionnaires')
        if (response.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data: any = await response.json()
          const questionnaires = data.questionnaires || []
          
          // Convert database questionnaires to ModularQuestionnaire format
          const converted: ModularQuestionnaire[] = questionnaires.map((q: DatabaseQuestionnaire) => ({
            type: q.questionnaire_type || 'category',
            name: q.questionnaire_id,
            display_name: q.title,
            required: q.questionnaire_type === 'centrepiece',
            estimated_time: q.estimated_duration || 15,
            completed: false,
            skipped: false
          }))
          
          setModularQuestionnaires(converted)
          
          // Auto-select centrepiece questionnaires for new profiles
          const centrepieceQuests = converted
            .filter(q => q.type === 'centrepiece')
            .map(q => q.name)
          setSelectedQuestionnaires(centrepieceQuests)
          
        } else {
          console.error('Failed to load questionnaires')
          // Fallback to hardcoded questionnaires
          setModularQuestionnaires([
            { type: 'centrepiece', name: 'centrepiece', display_name: 'Centrepiece (General Life)', required: true, estimated_time: 15, completed: false, skipped: false },
            { type: 'category', name: 'beauty', display_name: 'Beauty & Skincare', required: false, estimated_time: 10, completed: false, skipped: false },
            { type: 'category', name: 'fitness', display_name: 'Fitness & Health', required: false, estimated_time: 10, completed: false, skipped: false },
            { type: 'product', name: 'moisturizer', display_name: 'Moisturizer Products', required: false, estimated_time: 5, completed: false, skipped: false },
            { type: 'product', name: 'sunscreen', display_name: 'Sunscreen Products', required: false, estimated_time: 5, completed: false, skipped: false }
          ])
          setSelectedQuestionnaires(['centrepiece'])
        }
      } catch (error) {
        console.error('Error loading questionnaires:', error)
        // Fallback to hardcoded questionnaires
        setModularQuestionnaires([
          { type: 'centrepiece', name: 'centrepiece', display_name: 'Centrepiece (General Life)', required: true, estimated_time: 15, completed: false, skipped: false },
          { type: 'category', name: 'beauty', display_name: 'Beauty & Skincare', required: false, estimated_time: 10, completed: false, skipped: false },
          { type: 'category', name: 'fitness', display_name: 'Fitness & Health', required: false, estimated_time: 10, completed: false, skipped: false },
          { type: 'product', name: 'moisturizer', display_name: 'Moisturizer Products', required: false, estimated_time: 5, completed: false, skipped: false },
          { type: 'product', name: 'sunscreen', display_name: 'Sunscreen Products', required: false, estimated_time: 5, completed: false, skipped: false }
        ])
        setSelectedQuestionnaires(['centrepiece'])
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
  
  const startInterview = async (overrideQuestionnaireIndex?: number) => {
    if (!userName.trim()) return
    
    const activeQuestionnaireIndex = overrideQuestionnaireIndex !== undefined ? overrideQuestionnaireIndex : currentQuestionnaireIndex
    const currentQuestionnaire = selectedQuestionnaires[activeQuestionnaireIndex] || 'default'
    console.log('DEBUG: Starting interview with:', { 
      userName, 
      selectedQuestionnaires, 
      currentQuestionnaireIndex,
      activeQuestionnaireIndex,
      overrideQuestionnaireIndex,
      currentQuestionnaire 
    })
    setIsLoading(true)
    
    try {
      // Call backend to start interview session
      console.log('DEBUG: Calling /python-api/interview')
      const response = await fetch('/python-api/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_name: userName,
          questionnaire_id: currentQuestionnaire // Use current questionnaire
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
      console.log('Loading existing profiles for:', personName)
      
      // Call the Next.js API route (works on Vercel)
      const response = await fetch(`api/profiles?person_name=${encodeURIComponent(personName)}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profiles: ${response.status}`)
      }
      
      const profiles = await response.json()
      console.log('Loaded profiles for', personName, ':', profiles)
      setExistingProfiles(profiles)
      
    } catch (error) {
      console.error('Error loading existing profiles:', error)
      setExistingProfiles([])
    }
  }
  
  // Check what questionnaires are already completed for existing profile
  const checkExistingCompletions = async (profileId: string) => {
    try {
      console.log('Checking completions for profile:', profileId)
      
      // Find the selected profile to get its completeness metadata
      const selectedProfile = existingProfiles.find(p => p.profile_id === profileId)
      const completeness = selectedProfile?.completeness_metadata
      
      if (completeness && 'centrepiece' in completeness && typeof completeness.centrepiece === 'object') {
        // Use the new format (CompletenessMetadata)
        const metadata = completeness as CompletenessMetadata
        
        // Update questionnaires based on completeness metadata
        setModularQuestionnaires(prev => prev.map(q => {
          let isCompleted = false
          
          // Check if this questionnaire is completed based on metadata
          if (q.name === 'centrepiece') {
            isCompleted = metadata.centrepiece !== null
          } else {
            // Check categories (beauty_v1, fitness_v1, etc.)
            isCompleted = metadata.categories.some(cat => cat.name === q.name)
            
            // Check products (moisturizer_v1, etc.) 
            if (!isCompleted) {
              isCompleted = metadata.products.some(prod => prod.name === q.name)
            }
          }
          
          return {
            ...q,
            completed: isCompleted,
            skipped: false
          }
        }))
        
        console.log('Updated questionnaires based on completeness metadata:', metadata)
      } else {
        // Fallback for old format or missing data
        setModularQuestionnaires(prev => prev.map(q => ({
          ...q,
          completed: q.name === 'centrepiece', // Only mark centrepiece as completed for safety
          skipped: false
        })))
        
        console.log('Using fallback completion logic')
      }
      
      // NOTE: Do NOT remove questionnaires from selection!
      // User should be able to redo questionnaires even if completed before
    } catch (error) {
      console.error('Error checking completions:', error)
      // Fallback simulation
      setModularQuestionnaires(prev => prev.map(q => ({
        ...q,
        completed: q.name === 'centrepiece',
        skipped: false
      })))
    }
  }
  
  // Build completeness metadata from selected questionnaires
  const buildCompletenessMetadata = (completedQuestionnaires: string[]): CompletenessMetadata => {
    const metadata: CompletenessMetadata = {
      centrepiece: null,
      categories: [],
      products: []
    }

    completedQuestionnaires.forEach(qName => {
      const questionnaire = modularQuestionnaires.find(q => q.name === qName)
      if (!questionnaire) return

      const item = {
        name: questionnaire.name,
        display_name: questionnaire.display_name
      }

      switch (questionnaire.type) {
        case 'centrepiece':
          metadata.centrepiece = item
          break
        case 'category':
          metadata.categories.push(item)
          break
        case 'product':
          metadata.products.push(item)
          break
      }
    })

    return metadata
  }

  // Save individual questionnaire completion records to database
  const saveQuestionnaireCompletions = async (profileId: string, completedQuestionnaires: string[]) => {
    try {
      console.log('Saving questionnaire completions for profile:', profileId)
      
      for (const qName of completedQuestionnaires) {
        const questionnaire = modularQuestionnaires.find(q => q.name === qName)
        if (!questionnaire) continue

        // Save each questionnaire completion record
        const response = await fetch('/api/questionnaire-completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile_id: profileId,
            questionnaire_type: questionnaire.type,
            questionnaire_name: questionnaire.name,
            completion_data: {
              display_name: questionnaire.display_name,
              estimated_time: questionnaire.estimated_time,
              completed_at: new Date().toISOString()
            },
            completed_at: new Date().toISOString(),
            skipped: false,
            estimated_duration: questionnaire.estimated_time
          })
        })

        if (response.ok) {
          console.log(`Saved completion record for ${qName}`)
        } else {
          console.error(`Failed to save completion record for ${qName}`, await response.text())
        }
      }
    } catch (error) {
      console.error('Error saving questionnaire completions:', error)
    }
  }
  
  // Handle profile action selection
  const handleProfileActionChange = (action: 'new' | 'existing') => {
    setProfileAction(action)
    if (action === 'existing') {
      // Load existing profiles for the current user (username already set from URL)
      loadExistingProfiles(userName)
      
      // For existing profiles, reset questionnaires to show none completed initially
      // They will be updated when a specific profile is selected
      setModularQuestionnaires(prev => prev.map(q => ({
        ...q,
        completed: false,
        skipped: false
      })))
      setSelectedQuestionnaires([]) // Start with no selections for existing profiles
      setSelectedExistingProfile('') // Reset profile selection
    } else {
      // Reset questionnaires for new profile - all available, centrepiece required
      setModularQuestionnaires(prev => prev.map(q => ({
        ...q,
        completed: false,
        skipped: false
      })))
      // Auto-select all centrepiece questionnaires for new profiles
      const centrepieceQuests = modularQuestionnaires
        .filter(q => q.type === 'centrepiece')
        .map(q => q.name)
      setSelectedQuestionnaires(centrepieceQuests)
    }
  }
  
  // Start interview directly (skip setup phase)
  const startInterviewDirectly = () => {
    if (profileAction === 'existing' && !selectedExistingProfile) {
      alert('Please select an existing profile to enhance')
      return
    }
    
    if (selectedQuestionnaires.length === 0) {
      if (profileAction === 'existing') {
        alert('Please select at least one questionnaire to add to your existing profile')
      } else {
        alert('Please select at least one questionnaire')
      }
      return
    }
    
    // Reset questionnaire index when starting fresh
    setCurrentQuestionnaireIndex(0)
    
    // For new profiles, at least one centrepiece questionnaire is required
    if (profileAction === 'new') {
      const hasCentrepiece = selectedQuestionnaires.some(qName => {
        const q = modularQuestionnaires.find(mq => mq.name === qName)
        return q?.type === 'centrepiece'
      })
      if (!hasCentrepiece) {
        alert('At least one centrepiece questionnaire is required for new profiles')
        return
      }
    }
    
    // Skip setup and go directly to interview
    startInterview()
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
      const response = await fetch('/python-api/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: updatedData.sessionId,
          message: currentMessage,
          exchange_count: updatedData.exchangeCount, // This should increment with each user message
          questionnaire_id: selectedQuestionnaires[currentQuestionnaireIndex] || 'default' // Pass current questionnaire only
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
        console.log(`DEBUG: Questionnaire completed! Current index: ${currentQuestionnaireIndex}, Total: ${selectedQuestionnaires.length}`)
        console.log(`DEBUG: Selected questionnaires: ${selectedQuestionnaires}`)
        
        // Check if there are more questionnaires to process
        if (currentQuestionnaireIndex < selectedQuestionnaires.length - 1) {
          // Move to next questionnaire
          const nextIndex = currentQuestionnaireIndex + 1
          const nextQuestionnaire = selectedQuestionnaires[nextIndex]
          console.log(`DEBUG: Moving to questionnaire ${nextIndex + 1}/${selectedQuestionnaires.length}: ${nextQuestionnaire}`)
          
          setCurrentQuestionnaireIndex(nextIndex)
          console.log(`Moving to next questionnaire: ${nextQuestionnaire}`)
          
          // Start new interview for next questionnaire
          setInterviewData({
            name: userName,
            sessionId: '',
            messages: [],
            startTime: new Date(),
            currentTopic: 'category_relationship',
            exchangeCount: 0,
            isComplete: false,
            targetQuestions: 20
          })
          
          // Auto-start next questionnaire with explicit index
          console.log(`DEBUG: Auto-starting next questionnaire in 1 second with index ${nextIndex}...`)
          setTimeout(() => startInterview(nextIndex), 1000)
        } else {
          // All questionnaires completed, extract profile
          console.log(`DEBUG: All questionnaires completed! Starting profile extraction...`)
          setInterviewPhase('complete')
          startProfileExtraction(finalData.sessionId)
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
  

  const startProfileExtraction = async (sessionId: string) => {
    console.log('Starting profile extraction for session:', sessionId)
    console.log('DEBUG: selectedQuestionnaires at extraction time:', selectedQuestionnaires)
    console.log('DEBUG: currentQuestionnaireIndex:', currentQuestionnaireIndex)
    setIsExtractingProfile(true)
    setProfileExtractionError(null)
    
    try {
      // Build completeness metadata for this profile
      const completenessMetadata = buildCompletenessMetadata(selectedQuestionnaires)
      console.log('Built completeness metadata:', completenessMetadata)

      const requestBody = {
        session_id: sessionId,
        completeness_metadata: completenessMetadata,
        questionnaires_completed: selectedQuestionnaires,
        profile_action: profileAction,
        existing_profile_id: profileAction === 'existing' ? selectedExistingProfile : null
      }
      
      console.log('DEBUG: Sending to complete-interview API:', requestBody)
      
      const completeResponse = await fetch(`/python-api/interview?action=complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })
      
      if (completeResponse.ok) {
        const completeResult = await completeResponse.json()
        console.log('Profile extraction completed:', completeResult)
        
        // Only set extracted profile if we have valid profile data
        if (completeResult.profile_data && !completeResult.error) {
          setExtractedProfile(completeResult)
          console.log('Successfully set extracted profile state')
          
          // Save individual questionnaire completion records
          await saveQuestionnaireCompletions(completeResult.profile_id, selectedQuestionnaires)
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
    
    const filename = `${extractedProfile.profile_id}.json`
    // Download the complete profile including profile_id and all profile_data sections
    const dataStr = JSON.stringify(extractedProfile, null, 2)
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
            <div className="badge">
              {interviewPhase === 'complete' ? 'Complete' : 
               interviewPhase === 'interview' ? `Step ${currentQuestionnaireIndex + 1} of ${selectedQuestionnaires.length}` :
               'Setup'}
            </div>
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
              {interviewPhase === 'interview' && (
                selectedQuestionnaires.length > 1 
                  ? `AI Interview in Progress - ${modularQuestionnaires.find(q => q.name === selectedQuestionnaires[currentQuestionnaireIndex])?.display_name || 'Current Questionnaire'} (${currentQuestionnaireIndex + 1}/${selectedQuestionnaires.length})`
                  : 'AI Interview in Progress'
              )}
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
              {profileAction === 'existing' && (
                <div className="card" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Select Existing Profile</h3>
                  
                  {existingProfiles.length > 0 ? (
                    <select
                      value={selectedExistingProfile}
                      onChange={(e) => {
                        const profileId = e.target.value
                        setSelectedExistingProfile(profileId)
                        if (profileId) {
                          checkExistingCompletions(profileId)
                        }
                      }}
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
                      {existingProfiles.map(profile => {
                        // Extract completeness data and handle both old and new formats
                        const completeness = profile.completeness_metadata
                        let completedQuests = 'No data'
                        
                        if (completeness) {
                          // Check if it's the new format (CompletenessMetadata)
                          if ('centrepiece' in completeness && typeof completeness.centrepiece === 'object') {
                            const newFormat = completeness as CompletenessMetadata
                            const completed = []
                            if (newFormat.centrepiece) completed.push('Centrepiece')
                            if (newFormat.categories?.length) completed.push(`${newFormat.categories.length} Category`)
                            if (newFormat.products?.length) completed.push(`${newFormat.products.length} Product`)
                            completedQuests = completed.join(', ') || 'No data'
                          } else {
                            // Old format (Record<string, boolean>) - use clear names
                            const oldFormat = completeness as Record<string, boolean>
                            const completed = []
                            if (oldFormat.centrepiece) completed.push('Centrepiece')
                            const otherTypes = Object.keys(oldFormat).filter(key => oldFormat[key] === true && key !== 'centrepiece')
                            if (otherTypes.length) completed.push(`${otherTypes.length} Category`)
                            completedQuests = completed.join(', ') || 'No data'
                          }
                        }
                        
                        // Extract just the version number for cleaner display
                        const versionMatch = profile.profile_id.match(/v(\d+)/)
                        const versionNumber = versionMatch ? `v${versionMatch[1]}` : profile.profile_id
                        const isActive = profile.is_active ? ' (Active)' : ''
                        const date = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        
                        return (
                          <option key={profile.profile_id} value={profile.profile_id}>
                            {versionNumber}{isActive} • {completedQuests} • {date}
                          </option>
                        )
                      })}
                    </select>
                  ) : (
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: '#fef3c7', 
                      borderRadius: '8px', 
                      border: '1px solid #f59e0b',
                      textAlign: 'center'
                    }}>
                      <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px', color: '#92400e' }}>
                        No existing profiles found for {userName}
                      </p>
                      <p style={{ fontSize: '14px', color: '#78350f', marginBottom: '16px' }}>
                        You need to create a profile first before you can enhance an existing one.
                      </p>
                      <button 
                        onClick={() => handleProfileActionChange('new')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Create New Profile Instead
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Questionnaire Selection */}
              {((profileAction === 'new') || (profileAction === 'existing' && selectedExistingProfile)) && (
                <div className="card" style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Select Questionnaires</h3>
                  <p style={{ fontSize: '14px', color: '#737373', marginBottom: '24px' }}>
                    {profileAction === 'existing' 
                      ? 'Choose additional questionnaires to complete for your existing profile.'
                      : 'Choose which questionnaires to complete. You can always add more later.'
                    }
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {modularQuestionnaires.map(questionnaire => {
                      // Define colors for different questionnaire types
                      const getTypeColors = () => {
                        switch (questionnaire.type) {
                          case 'centrepiece':
                            return {
                              bg: questionnaire.completed ? '#f0fdf0' : 'white',
                              border: '#e5e5e5',
                              badge: { bg: '#fae8ff', color: '#a21caf' }
                            }
                          case 'category':
                            return {
                              bg: questionnaire.completed ? '#f0fdf0' : 'white',
                              border: '#e5e5e5',
                              badge: { bg: '#dbeafe', color: '#1d4ed8' }
                            }
                          case 'product':
                            return {
                              bg: questionnaire.completed ? '#f0fdf0' : 'white',
                              border: '#e5e5e5',
                              badge: { bg: '#d1fae5', color: '#059669' }
                            }
                          default:
                            return {
                              bg: 'white',
                              border: '#e5e5e5',
                              badge: { bg: '#f3f4f6', color: '#374151' }
                            }
                        }
                      }
                      
                      const colors = getTypeColors()
                      
                      return (
                      <div 
                        key={questionnaire.name}
                        style={{ 
                          padding: '16px',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '8px',
                          backgroundColor: colors.bg
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <h4 style={{ 
                                margin: 0, 
                                fontSize: '16px', 
                                fontWeight: '600',
                                color: questionnaire.completed ? '#16a34a' : 'inherit',
                                textDecoration: questionnaire.completed ? 'none' : 'none'
                              }}>
{questionnaire.display_name}
                              </h4>
                              <span style={{ 
                                fontSize: '11px', 
                                color: colors.badge.color,
                                backgroundColor: colors.badge.bg,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontWeight: '500',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {questionnaire.type}
                              </span>
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
                            </div>
                            <div style={{ fontSize: '14px', color: '#737373' }}>
                              ~{questionnaire.estimated_time} minutes
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {questionnaire.completed ? (
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                padding: '8px 12px',
                                backgroundColor: '#dcfce7',
                                border: '1px solid #16a34a',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#16a34a'
                              }}>
                                ✅ Already Completed
                              </div>
                            ) : (
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedQuestionnaires.includes(questionnaire.name)}
                                  onChange={() => {
                                    if (selectedQuestionnaires.includes(questionnaire.name)) {
                                      setSelectedQuestionnaires(curr => curr.filter(name => name !== questionnaire.name))
                                    } else {
                                      setSelectedQuestionnaires(curr => [...curr, questionnaire.name])
                                    }
                                  }}
                                  disabled={questionnaire.required}
                                  style={{ 
                                    width: '16px', 
                                    height: '16px'
                                  }}
                                />
                                <span style={{ fontSize: '14px', fontWeight: '500' }}>Include</span>
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                      )
                    })}
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

          {/* Remove setup screen - go directly from questionnaire selection to interview */}
          
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
                  <li>Total exchanges: {extractedProfile?.total_exchanges || interviewData.exchangeCount}</li>
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
                  
                  <ProfileDataDisplay 
                    profileData={extractedProfile.profile_data} 
                    profileId={extractedProfile.profile_id}
                  />
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
                onClick={startInterviewDirectly} 
                disabled={
                  !profileAction || 
                  selectedQuestionnaires.length === 0 ||
                  (profileAction === 'existing' && !selectedExistingProfile) ||
                  isLoading
                }
                className="btn-primary"
              >
                {isLoading ? '🔄 Starting Interview...' : '🎤 Start Interview →'}
              </button>
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