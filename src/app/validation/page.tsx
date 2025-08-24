'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from "next/link"

interface Question {
  id: string
  category: string
  question: string
  options: string[]
}

interface Survey {
  survey_name: string
  survey_title: string
  description: string
  target_accuracy: number
  questions: Question[]
}

interface Comparison {
  question_id: string
  human_answer: string
  predicted_answer: string
  is_match: boolean
  confidence: number
  reasoning: string
}

interface ProfileVersion {
  profile_id: string
  version_number: number
  created_at: string
  is_active: boolean
}

export default function ValidationTest() {
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [humanAnswers, setHumanAnswers] = useState<{[key: string]: string}>({})
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [testPhase, setTestPhase] = useState<'person_selection' | 'profile_selection' | 'survey_selection' | 'loading' | 'questions' | 'results'>('person_selection')
  const [accuracy, setAccuracy] = useState(0)
  const [selectedPerson, setSelectedPerson] = useState('')
  const [selectedPersonName, setSelectedPersonName] = useState('')
  const [profileId, setProfileId] = useState('')
  const [availableVersions, setAvailableVersions] = useState<ProfileVersion[]>([])
  const [isLoadingVersions, setIsLoadingVersions] = useState(false)
  const [availableSurveys, setAvailableSurveys] = useState<Survey[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [isLoadingSurveys, setIsLoadingSurveys] = useState(false)

  const people = [
    { id: 'rachita', name: 'Rachita' },
    { id: 'everhett', name: 'Everhett' },
    { id: 'gigi', name: 'Gigi' },
  ]

  const loadAvailableSurveys = useCallback(async () => {
    setIsLoadingSurveys(true)
    try {
      const response = await fetch('/api/surveys')
      if (response.ok) {
        const data = await response.json()
        setAvailableSurveys(data.surveys || [])
        
        // Auto-select default survey if available
        const defaultSurvey = data.surveys?.find((s: Survey) => s.survey_title.includes('validation'))
        if (defaultSurvey) {
          setSelectedSurvey(defaultSurvey)
          setSurvey(defaultSurvey)
        }
      } else {
        console.error('Failed to load surveys')
        // Fallback to loading default survey from validation API
        loadDefaultSurvey()
      }
    } catch (error) {
      console.error('Error loading surveys:', error)
      // Fallback to loading default survey from validation API
      loadDefaultSurvey()
    } finally {
      setIsLoadingSurveys(false)
    }
  }, [])

  useEffect(() => {
    loadAvailableSurveys()
  }, [loadAvailableSurveys])

  const loadDefaultSurvey = async () => {
    try {
      const response = await fetch('/api/validation')
      if (response.ok) {
        const surveyData = await response.json()
        setSurvey(surveyData)
        setSelectedSurvey(surveyData)
      } else {
        console.error('Failed to load default survey')
      }
    } catch (error) {
      console.error('Error loading default survey:', error)
    }
  }

  const loadProfileVersions = async (personName: string) => {
    setIsLoadingVersions(true)
    try {
      const response = await fetch(`/api/chat?person=${encodeURIComponent(personName)}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableVersions(data.profiles || [])
        
        // Auto-select the latest active version or first version
        if (data.profiles && data.profiles.length > 0) {
          const activeVersion = data.profiles.find((p: ProfileVersion) => p.is_active)
          const latestVersion = data.profiles[0] // Assuming sorted by latest first
          const defaultVersion = activeVersion || latestVersion
          setProfileId(defaultVersion.profile_id)
        }
      } else {
        console.error('Failed to load profile versions')
        setAvailableVersions([])
      }
    } catch (error) {
      console.error('Error loading profile versions:', error)
      setAvailableVersions([])
    } finally {
      setIsLoadingVersions(false)
    }
  }

  const selectPerson = (person: { id: string; name: string }) => {
    setSelectedPerson(person.id)
    setSelectedPersonName(person.name)
    loadProfileVersions(person.name)
    setTestPhase('profile_selection')
  }

  const selectProfile = (profileId: string) => {
    setProfileId(profileId)
    setTestPhase('survey_selection')
  }

  const selectSurvey = (survey: Survey) => {
    setSelectedSurvey(survey)
    setSurvey(survey)
    setTestPhase('questions')
  }

  const handleAnswer = (answer: string) => {
    if (!survey) return
    
    const currentQuestion = survey.questions[currentQuestionIndex]
    setHumanAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }))

    // Move to next question or finish
    if (currentQuestionIndex < survey.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // All questions answered, start comparison
      compareAllResponses()
    }
  }

  const compareAllResponses = async () => {
    if (!survey) return
    
    setIsLoading(true)
    setTestPhase('results')

    try {
      const comparisonsResults: Comparison[] = []
      console.log('Starting comparison for', Object.keys(humanAnswers).length, 'responses')

      for (const question of survey.questions) {
        const humanAnswer = humanAnswers[question.id]
        if (humanAnswer) {
          console.log(`Processing question ${question.id}:`, humanAnswer)
          
          const response = await fetch('/api/validation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              profile_id: profileId,
              question_id: question.id,
              human_answer: humanAnswer
            })
          })

          if (response.ok) {
            const comparison = await response.json()
            console.log(`Comparison result for ${question.id}:`, comparison)
            comparisonsResults.push(comparison)
          } else {
            console.error(`Failed to compare question ${question.id}:`, response.status, response.statusText)
          }
        }
      }

      console.log('Final comparisons:', comparisonsResults)
      setComparisons(comparisonsResults)
      
      // Calculate accuracy
      const matches = comparisonsResults.filter(c => c.is_match).length
      const totalQuestions = comparisonsResults.length
      const accuracyPercentage = totalQuestions > 0 ? Math.round((matches / totalQuestions) * 100) : 0
      console.log(`Accuracy: ${matches}/${totalQuestions} = ${accuracyPercentage}%`)
      setAccuracy(accuracyPercentage)

      // Save results to backend
      try {
        const testSessionId = `test_${Date.now()}`
        const saveResponse = await fetch('/api/validation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile_id: profileId,
            test_session_id: testSessionId,
            comparisons: comparisonsResults,
            accuracy_percentage: accuracyPercentage,
            total_questions: totalQuestions,
            correct_answers: matches,
            model_version: 'claude-3-5-sonnet-20241022',
            digital_twin_version: null  // Let backend determine this from profile
          })
        })

        if (saveResponse.ok) {
          const saveResult = await saveResponse.json()
          console.log('Results saved:', saveResult)
        } else {
          console.error('Failed to save results:', saveResponse.status)
        }
      } catch (saveError) {
        console.error('Error saving results:', saveError)
      }

    } catch (error) {
      console.error('Error comparing responses:', error)
    } finally {
      console.log('Setting isLoading to false')
      setIsLoading(false)
    }
  }

  const restartTest = () => {
    setCurrentQuestionIndex(0)
    setHumanAnswers({})
    setComparisons([])
    setAccuracy(0)
    setSelectedPerson('')
    setSelectedPersonName('')
    setProfileId('')
    setAvailableVersions([])
    setSelectedSurvey(null)
    setSurvey(null)
    setTestPhase('person_selection')
  }

  if (testPhase === 'person_selection') {
    return (
      <div>
        <header className="header">
          <div className="container">
            <nav className="nav">
              <Link href="/" className="logo">
                <div className="logo-icon">
                  <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '2px' }}></div>
                </div>
                <div className="logo-text">
                  <h1>PAI</h1>
                  <p>Validation Test</p>
                </div>
              </Link>
              <div className="badge">Select Digital Twin</div>
            </nav>
          </div>
        </header>
        <main className="main">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h1 style={{ fontSize: '48px', fontWeight: '600', lineHeight: '1.1', marginBottom: '24px' }}>
                Choose <span className="highlight">Digital Twin</span> to Test
              </h1>
              <p style={{ fontSize: '18px', color: '#737373', maxWidth: '600px', margin: '0 auto' }}>
                Select which digital twin you want to validate. You'll answer questions as yourself, and we'll compare your responses to what that digital twin predicted.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
              {people.map(person => (
                <div 
                  key={person.id} 
                  className="card"
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => selectPerson(person)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#00d924',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: '600',
                      marginRight: '16px'
                    }}>
                      {person.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0' }}>{person.name}</h3>
                      <p style={{ fontSize: '14px', color: '#737373', margin: '0' }}>
                        Digital Twin Testing Available
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '12px 16px', 
                    backgroundColor: '#f0fdf0',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <span style={{ color: '#00d924', fontWeight: '600' }}>✓ Select for Testing</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (testPhase === 'profile_selection') {
    return (
      <div>
        <header className="header">
          <div className="container">
            <nav className="nav">
              <Link href="/" className="logo">
                <div className="logo-icon">
                  <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '2px' }}></div>
                </div>
                <div className="logo-text">
                  <h1>PAI</h1>
                  <p>Validation Test</p>
                </div>
              </Link>
              <div className="badge">Select Profile Version</div>
            </nav>
          </div>
        </header>
        <main className="main">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h1 style={{ fontSize: '48px', fontWeight: '600', lineHeight: '1.1', marginBottom: '24px' }}>
                Choose <span className="highlight">{selectedPersonName}'s</span> Profile Version
              </h1>
              <p style={{ fontSize: '18px', color: '#737373', maxWidth: '600px', margin: '0 auto' }}>
                Select which version of {selectedPersonName}'s digital twin you want to test for accuracy.
              </p>
            </div>

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Available Profile Versions</h3>
              {isLoadingVersions ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#737373' }}>
                  Loading available versions...
                </div>
              ) : availableVersions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {availableVersions.map(version => (
                    <button
                      key={version.profile_id}
                      onClick={() => selectProfile(version.profile_id)}
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: '1px solid #e5e5e5',
                        borderRadius: '12px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#00d924'
                        e.currentTarget.style.backgroundColor = '#f0fdf0'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e5e5'
                        e.currentTarget.style.backgroundColor = 'white'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                            {version.profile_id} {version.is_active ? '(Active)' : ''}
                          </div>
                          <div style={{ fontSize: '14px', color: '#737373' }}>
                            Created: {new Date(version.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ fontSize: '24px' }}>→</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <div style={{ color: '#dc2626', marginBottom: '8px', fontSize: '16px' }}>
                    No profiles found for {selectedPersonName}
                  </div>
                  <div style={{ color: '#737373', fontSize: '14px', marginBottom: '16px' }}>
                    {selectedPersonName} needs to complete their profile interview first.
                  </div>
                  <button
                    onClick={() => setTestPhase('person_selection')}
                    className="btn-secondary"
                  >
                    ← Choose Different Person
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (testPhase === 'survey_selection') {
    return (
      <div>
        <header className="header">
          <div className="container">
            <nav className="nav">
              <Link href="/" className="logo">
                <div className="logo-icon">
                  <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '2px' }}></div>
                </div>
                <div className="logo-text">
                  <h1>PAI</h1>
                  <p>Validation Test</p>
                </div>
              </Link>
              <div className="badge">Select Survey</div>
            </nav>
          </div>
        </header>
        <main className="main">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h1 style={{ fontSize: '48px', fontWeight: '600', lineHeight: '1.1', marginBottom: '24px' }}>
                Choose <span className="highlight">Survey Questions</span>
              </h1>
              <p style={{ fontSize: '18px', color: '#737373', maxWidth: '600px', margin: '0 auto' }}>
                Select which set of questions you want to use to test {selectedPersonName}'s digital twin accuracy.
              </p>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              {isLoadingSurveys ? (
                <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                  <div style={{ color: '#737373' }}>Loading available surveys...</div>
                </div>
              ) : availableSurveys.length > 0 ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {availableSurveys.map((survey, index) => (
                    <div 
                      key={survey.survey_name || index}
                      className="card"
                      style={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: selectedSurvey?.survey_name === survey.survey_name ? '2px solid #00d924' : '1px solid #e5e5e5'
                      }}
                      onClick={() => selectSurvey(survey)}
                      onMouseEnter={(e) => {
                        if (selectedSurvey?.survey_name !== survey.survey_name) {
                          e.currentTarget.style.borderColor = '#00d924'
                          e.currentTarget.style.backgroundColor = '#f0fdf0'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedSurvey?.survey_name !== survey.survey_name) {
                          e.currentTarget.style.borderColor = '#e5e5e5'
                          e.currentTarget.style.backgroundColor = 'white'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                            {survey.survey_title}
                          </h3>
                          <p style={{ fontSize: '14px', color: '#737373', marginBottom: '16px' }}>
                            {survey.description}
                          </p>
                          <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
                            <div>
                              <strong>{survey.questions?.length || 0}</strong> questions
                            </div>
                            <div>
                              Target: <strong>{Math.round((survey.target_accuracy || 0) * 100)}%</strong> accuracy
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '24px', marginLeft: '16px' }}>
                          {selectedSurvey?.survey_name === survey.survey_name ? '✓' : '→'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                  <div style={{ color: '#dc2626', marginBottom: '16px', fontSize: '18px' }}>
                    No surveys available
                  </div>
                  <div style={{ color: '#737373', fontSize: '14px', marginBottom: '24px' }}>
                    You need to create a survey first before running accuracy tests.
                  </div>
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <Link href="/create-survey" className="btn-primary">
                      📋 Create Survey
                    </Link>
                    <button
                      onClick={() => setTestPhase('profile_selection')}
                      className="btn-secondary"
                    >
                      ← Back to Profile Selection
                    </button>
                  </div>
                </div>
              )}
              
              {availableSurveys.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                  <button
                    onClick={() => setTestPhase('profile_selection')}
                    className="btn-secondary"
                    style={{ marginRight: '16px' }}
                  >
                    ← Back to Profile Selection
                  </button>
                  {selectedSurvey && (
                    <button
                      onClick={() => selectSurvey(selectedSurvey)}
                      className="btn-primary"
                    >
                      Start Test with Selected Survey →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (testPhase === 'loading' || !survey) {
    return (
      <div>
        <header className="header">
          <div className="container">
            <nav className="nav">
              <Link href="/" className="logo">
                <div className="logo-icon">
                  <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '2px' }}></div>
                </div>
                <div className="logo-text">
                  <h1>PAI</h1>
                  <p>Validation Test</p>
                </div>
              </Link>
              <div className="badge">Digital Twin Testing</div>
            </nav>
          </div>
        </header>
        <main className="main">
          <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
            <h1>Loading Validation Survey...</h1>
          </div>
        </main>
      </div>
    )
  }

  if (testPhase === 'questions') {
    const currentQuestion = survey.questions[currentQuestionIndex]
    const progress = Math.round(((currentQuestionIndex + 1) / survey.questions.length) * 100)

    return (
      <div>
        <header className="header">
          <div className="container">
            <nav className="nav">
              <Link href="/" className="logo">
                <div className="logo-icon">
                  <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '2px' }}></div>
                </div>
                <div className="logo-text">
                  <h1>PAI</h1>
                  <p>Validation Test</p>
                </div>
              </Link>
              <div className="badge">{progress}% Complete</div>
            </nav>
          </div>
        </header>

        <main className="main">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h1 style={{ fontSize: '48px', fontWeight: '600', lineHeight: '1.1', marginBottom: '24px' }}>
                Testing <span className="highlight">{people.find(p => p.id === selectedPerson)?.name}'s Digital Twin</span>
              </h1>
              <p style={{ fontSize: '18px', color: '#737373', maxWidth: '600px', margin: '0 auto' }}>
                Answer these questions as yourself. We'll compare your answers to what {people.find(p => p.id === selectedPerson)?.name}'s digital twin predicted.
              </p>
            </div>

            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#737373' }}>
                    Question {currentQuestionIndex + 1} of {survey.questions.length}
                  </span>
                  <span style={{ fontSize: '14px', color: '#737373' }}>
                    Category: {currentQuestion.category}
                  </span>
                </div>
                
                <div style={{ width: '100%', height: '6px', backgroundColor: '#f0f0f0', borderRadius: '3px', marginBottom: '24px' }}>
                  <div 
                    style={{ 
                      width: `${progress}%`, 
                      height: '100%', 
                      backgroundColor: '#00d924', 
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }}
                  ></div>
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '32px', lineHeight: '1.3' }}>
                  {currentQuestion.question}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        border: '2px solid #e5e5e5',
                        borderRadius: '12px',
                        backgroundColor: 'white',
                        fontSize: '16px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#00d924'
                        e.currentTarget.style.backgroundColor = '#f0fdf0'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e5e5'
                        e.currentTarget.style.backgroundColor = 'white'
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Results phase
  return (
    <div>
      <header className="header">
        <div className="container">
          <nav className="nav">
            <Link href="/" className="logo">
              <div className="logo-icon">
                <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '2px' }}></div>
              </div>
              <div className="logo-text">
                <h1>PAI</h1>
                <p>Validation Results</p>
              </div>
            </Link>
            <div className="badge">{accuracy}% Accuracy</div>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '600', lineHeight: '1.1', marginBottom: '24px' }}>
              <span className="highlight">{people.find(p => p.id === selectedPerson)?.name}'s</span> Validation Results
            </h1>
            <p style={{ fontSize: '18px', color: '#737373', maxWidth: '600px', margin: '0 auto' }}>
              {people.find(p => p.id === selectedPerson)?.name}'s digital twin achieved {accuracy}% accuracy in predicting your responses.
            </p>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <h2>Analyzing responses...</h2>
              <p>Comparing your answers to digital twin predictions</p>
            </div>
          ) : (
            <div>
              {/* Overall Results */}
              <div className="card" style={{ marginBottom: '32px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '36px', fontWeight: '600', marginBottom: '16px' }}>
                  {accuracy}% Accuracy
                </h2>
                <p style={{ fontSize: '18px', color: '#737373', marginBottom: '24px' }}>
                  {comparisons.filter(c => c.is_match).length} out of {comparisons.length} questions predicted correctly
                </p>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '32px',
                  padding: '24px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px'
                }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#00d924' }}>
                      {comparisons.filter(c => c.is_match).length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#737373' }}>Correct</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#ef4444' }}>
                      {comparisons.filter(c => !c.is_match).length}
                    </div>
                    <div style={{ fontSize: '14px', color: '#737373' }}>Incorrect</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: '#737373' }}>
                      {Math.round(comparisons.reduce((sum, c) => sum + c.confidence, 0) / comparisons.length * 100)}%
                    </div>
                    <div style={{ fontSize: '14px', color: '#737373' }}>Avg Confidence</div>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div style={{ display: 'grid', gap: '16px' }}>
                {comparisons.map((comparison, index) => (
                  <div 
                    key={comparison.question_id} 
                    className="card"
                    style={{ 
                      borderLeft: comparison.is_match ? '4px solid #00d924' : '4px solid #ef4444',
                      padding: '24px'
                    }}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0' }}>
                          Question {index + 1}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: '600',
                            color: comparison.is_match ? '#00d924' : '#ef4444'
                          }}>
                            {comparison.is_match ? '✓ Match' : '✗ No Match'}
                          </span>
                          <span style={{ fontSize: '14px', color: '#737373' }}>
                            {Math.round(comparison.confidence * 100)}% confident
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Your Answer:</div>
                          <div style={{ 
                            padding: '12px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}>
                            {comparison.human_answer}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Digital Twin Predicted:</div>
                          <div style={{ 
                            padding: '12px', 
                            backgroundColor: comparison.is_match ? '#f0fdf0' : '#fef2f2', 
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}>
                            {comparison.predicted_answer}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '48px' }}>
                <button 
                  onClick={restartTest}
                  className="btn-primary"
                  style={{ marginRight: '16px' }}
                >
                  🔄 Take Test Again
                </button>
                <Link href="/validation-history" className="btn-secondary" style={{ marginRight: '16px' }}>
                  📈 View All Results
                </Link>
                <Link href="/chat" className="btn-secondary">
                  💬 Chat with Digital Twin
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}