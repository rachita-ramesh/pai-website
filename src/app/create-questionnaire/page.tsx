'use client'

import { useState } from 'react'
import Link from "next/link"

interface Question {
  id: string
  text: string
  type: 'open_ended' | 'multiple_choice' | 'yes_no' | 'scale'
  options?: string[]
  required: boolean
  helpText?: string
}

export default function CreateQuestionnaire() {
  const [questionnaire, setQuestionnaire] = useState({
    title: '',
    description: '',
    category: '',
    estimatedDuration: 15,
    isPublic: false
  })
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    text: '',
    type: 'open_ended',
    required: true,
    helpText: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)

  const questionTypes = [
    { value: 'open_ended', label: 'Open-ended Text' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'yes_no', label: 'Yes/No' },
    { value: 'scale', label: 'Rating Scale (1-10)' }
  ]

  const categories = [
    'skincare', 'fitness', 'nutrition', 'career', 'relationships', 
    'lifestyle', 'mental_health', 'hobbies', 'travel', 'other'
  ]

  const addQuestion = () => {
    if (!currentQuestion.text.trim()) return

    const questionId = `q${questions.length + 1}`
    const newQuestion = {
      ...currentQuestion,
      id: questionId
    }

    setQuestions([...questions, newQuestion])
    setCurrentQuestion({
      id: '',
      text: '',
      type: 'open_ended',
      required: true,
      helpText: ''
    })
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const addMultipleChoiceOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...(currentQuestion.options || []), '']
    })
  }

  const updateMultipleChoiceOption = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])]
    newOptions[index] = value
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions
    })
  }

  const removeMultipleChoiceOption = (index: number) => {
    const newOptions = currentQuestion.options?.filter((_, i) => i !== index) || []
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions
    })
  }

  const saveQuestionnaire = async () => {
    if (!questionnaire.title.trim() || questions.length === 0) {
      alert('Please provide a title and at least one question')
      return
    }

    setIsLoading(true)

    try {
      const questionnaireId = questionnaire.title.toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')

      const response = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionnaire_id: questionnaireId,
          title: questionnaire.title,
          description: questionnaire.description,
          category: questionnaire.category,
          questions: questions.map((q, index) => ({
            ...q,
            question_order: index + 1
          })),
          estimated_duration: questionnaire.estimatedDuration,
          is_public: questionnaire.isPublic
        })
      })

      if (response.ok) {
        alert('Questionnaire created successfully!')
        // Reset form
        setQuestionnaire({
          title: '',
          description: '',
          category: '',
          estimatedDuration: 15,
          isPublic: false
        })
        setQuestions([])
      } else {
        throw new Error('Failed to save questionnaire')
      }
    } catch (error) {
      console.error('Error saving questionnaire:', error)
      alert('Failed to save questionnaire. Please try again.')
    } finally {
      setIsLoading(false)
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
                <p>Create Questionnaire</p>
              </div>
            </Link>
            <div className="badge">Questionnaire Builder</div>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '600', lineHeight: '1.1', marginBottom: '24px' }}>
              Create Custom <span className="highlight">Questionnaire</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#737373', maxWidth: '600px', margin: '0 auto' }}>
              Build a custom questionnaire to gather specific insights about any category or topic.
            </p>
          </div>

          {/* Questionnaire Details */}
          <div className="card" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>Questionnaire Details</h2>
            
            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Fitness & Wellness Deep Dive"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  value={questionnaire.title}
                  onChange={(e) => setQuestionnaire({...questionnaire, title: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Category *
                </label>
                <select
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  value={questionnaire.category}
                  onChange={(e) => setQuestionnaire({...questionnaire, category: e.target.value})}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Description
              </label>
              <textarea
                placeholder="Describe what insights this questionnaire will gather..."
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '1px solid #e5e5e5', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '100px'
                }}
                value={questionnaire.description}
                onChange={(e) => setQuestionnaire({...questionnaire, description: e.target.value})}
              />
            </div>

            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr', marginTop: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  value={questionnaire.estimatedDuration}
                  onChange={(e) => setQuestionnaire({...questionnaire, estimatedDuration: parseInt(e.target.value)})}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={questionnaire.isPublic}
                  onChange={(e) => setQuestionnaire({...questionnaire, isPublic: e.target.checked})}
                />
                <label htmlFor="isPublic" style={{ fontSize: '14px', fontWeight: '500' }}>
                  Make public (others can use this questionnaire)
                </label>
              </div>
            </div>
          </div>

          {/* Add Questions */}
          <div className="card" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>Add Questions</h2>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Question Text *
              </label>
              <textarea
                placeholder="Enter your question here..."
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '1px solid #e5e5e5', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
                value={currentQuestion.text}
                onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
              />
            </div>

            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '1fr 1fr', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Question Type
                </label>
                <select
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  value={currentQuestion.type}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, type: e.target.value as 'open_ended' | 'multiple_choice' | 'yes_no' | 'scale'})}
                >
                  {questionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
                <input
                  type="checkbox"
                  id="required"
                  checked={currentQuestion.required}
                  onChange={(e) => setCurrentQuestion({...currentQuestion, required: e.target.checked})}
                />
                <label htmlFor="required" style={{ fontSize: '14px', fontWeight: '500' }}>
                  Required question
                </label>
              </div>
            </div>

            {/* Multiple Choice Options */}
            {currentQuestion.type === 'multiple_choice' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
                  Answer Options
                </label>
                {currentQuestion.options?.map((option, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      style={{ 
                        flex: '1', 
                        padding: '8px 12px', 
                        border: '1px solid #e5e5e5', 
                        borderRadius: '4px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      value={option}
                      onChange={(e) => updateMultipleChoiceOption(index, e.target.value)}
                    />
                    <button 
                      onClick={() => removeMultipleChoiceOption(index)}
                      style={{ 
                        padding: '8px 12px', 
                        background: '#ef4444', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button 
                  onClick={addMultipleChoiceOption}
                  style={{ 
                    padding: '8px 16px', 
                    background: '#f3f4f6', 
                    color: '#374151', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  + Add Option
                </button>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Help Text (optional)
              </label>
              <input
                type="text"
                placeholder="Additional guidance or clarification for this question..."
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '1px solid #e5e5e5', 
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                value={currentQuestion.helpText}
                onChange={(e) => setCurrentQuestion({...currentQuestion, helpText: e.target.value})}
              />
            </div>

            <button 
              onClick={addQuestion}
              disabled={!currentQuestion.text.trim()}
              className="btn-primary"
              style={{ opacity: !currentQuestion.text.trim() ? 0.5 : 1 }}
            >
              Add Question
            </button>
          </div>

          {/* Questions List */}
          {questions.length > 0 && (
            <div className="card" style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
                Questions ({questions.length})
              </h2>
              
              {questions.map((question, index) => (
                <div key={index} style={{ 
                  padding: '16px', 
                  border: '1px solid #e5e5e5', 
                  borderRadius: '8px', 
                  marginBottom: '16px',
                  backgroundColor: '#f9f9f9'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: '1' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                        {index + 1}. {question.text}
                        {question.required && <span style={{ color: '#ef4444' }}> *</span>}
                      </h4>
                      <p style={{ fontSize: '14px', color: '#737373', marginBottom: '4px' }}>
                        Type: {questionTypes.find(t => t.value === question.type)?.label}
                      </p>
                      {question.options && (
                        <p style={{ fontSize: '14px', color: '#737373', marginBottom: '4px' }}>
                          Options: {question.options.join(', ')}
                        </p>
                      )}
                      {question.helpText && (
                        <p style={{ fontSize: '14px', color: '#737373', fontStyle: 'italic' }}>
                          Help: {question.helpText}
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => removeQuestion(index)}
                      style={{ 
                        padding: '4px 8px', 
                        background: '#ef4444', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
            <Link href="/" className="btn-secondary">
              ← Back to Home
            </Link>
            
            <button 
              onClick={saveQuestionnaire}
              disabled={!questionnaire.title.trim() || questions.length === 0 || isLoading}
              className="btn-primary"
              style={{ opacity: (!questionnaire.title.trim() || questions.length === 0 || isLoading) ? 0.5 : 1 }}
            >
              {isLoading ? '🔄 Saving...' : '💾 Save Questionnaire'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}