'use client'

import { useState } from 'react'
import Link from "next/link"
import { useRouter } from 'next/navigation'

interface Question {
  id: string
  category: string
  question: string
  options: string[]
}

interface Survey {
  survey_name: string
  title: string
  description: string
  target_accuracy: number
  questions: Question[]
}

export default function CreateSurvey() {
  const router = useRouter()
  const [survey, setSurvey] = useState<Survey>({
    survey_name: '',
    title: '',
    description: '',
    target_accuracy: 0.6,
    questions: []
  })
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    category: '',
    question: '',
    options: ['', '', '', '']
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState(-1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = [
    'Usage Patterns',
    'Brand Preferences', 
    'Shopping Behavior',
    'Lifestyle',
    'Attitudes',
    'Demographics',
    'Product Features',
    'Other'
  ]

  const addQuestion = () => {
    if (!currentQuestion.question || !currentQuestion.category || currentQuestion.options.some(opt => !opt.trim())) {
      alert('Please fill in all fields and options')
      return
    }

    const questionWithId = {
      ...currentQuestion,
      id: currentQuestion.id || `q_${Date.now()}`,
      options: currentQuestion.options.filter(opt => opt.trim())
    }

    if (isEditing) {
      const updatedQuestions = [...survey.questions]
      updatedQuestions[editingIndex] = questionWithId
      setSurvey(prev => ({ ...prev, questions: updatedQuestions }))
      setIsEditing(false)
      setEditingIndex(-1)
    } else {
      setSurvey(prev => ({ 
        ...prev, 
        questions: [...prev.questions, questionWithId]
      }))
    }

    // Reset form
    setCurrentQuestion({
      id: '',
      category: '',
      question: '',
      options: ['', '', '', '']
    })
  }

  const editQuestion = (index: number) => {
    const question = survey.questions[index]
    setCurrentQuestion({
      ...question,
      options: [...question.options, '', '', '', ''].slice(0, 4) // Ensure 4 options
    })
    setIsEditing(true)
    setEditingIndex(index)
  }

  const deleteQuestion = (index: number) => {
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const addOption = () => {
    if (currentQuestion.options.length < 6) {
      setCurrentQuestion(prev => ({
        ...prev,
        options: [...prev.options, '']
      }))
    }
  }

  const removeOption = (index: number) => {
    if (currentQuestion.options.length > 2) {
      setCurrentQuestion(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }))
    }
  }

  const updateOption = (index: number, value: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }))
  }

  const saveSurvey = async () => {
    if (!survey.survey_name || !survey.title || survey.questions.length === 0) {
      alert('Please fill in survey name, title, and add at least one question')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(survey)
      })

      if (response.ok) {
        alert('Survey created successfully!')
        router.push('/')
      } else {
        const error = await response.json()
        alert(`Failed to create survey: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      alert('Error creating survey. Please try again.')
      console.error('Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

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
                <p>Create Survey</p>
              </div>
            </Link>
            <div className="badge">Survey Builder</div>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '600', lineHeight: '1.1', marginBottom: '24px' }}>
              Create <span className="highlight">Validation Survey</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#737373', maxWidth: '600px', margin: '0 auto' }}>
              Build custom surveys to test the accuracy of your digital twins. Add questions with multiple choice answers to validate prediction capabilities.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Survey Details */}
            <div className="card">
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>Survey Details</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Survey Name (ID)
                </label>
                <input
                  type="text"
                  value={survey.survey_name}
                  onChange={(e) => setSurvey(prev => ({ ...prev, survey_name: e.target.value }))}
                  placeholder="e.g., beauty_validation_2024"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Survey Title
                </label>
                <input
                  type="text"
                  value={survey.title}
                  onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Beauty Attitudes Validation Study"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Description
                </label>
                <textarea
                  value={survey.description}
                  onChange={(e) => setSurvey(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this survey tests..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Target Accuracy (0.0 - 1.0)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={survey.target_accuracy}
                  onChange={(e) => setSurvey(prev => ({ ...prev, target_accuracy: parseFloat(e.target.value) }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Survey Summary */}
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Survey Summary</h4>
                <div style={{ fontSize: '14px', color: '#737373' }}>
                  <div>Questions: {survey.questions.length}</div>
                  <div>Target Accuracy: {Math.round(survey.target_accuracy * 100)}%</div>
                </div>
              </div>

              <button
                onClick={saveSurvey}
                disabled={isSubmitting || survey.questions.length === 0}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                {isSubmitting ? 'Saving...' : '💾 Save Survey'}
              </button>
            </div>

            {/* Question Builder */}
            <div className="card">
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
                {isEditing ? 'Edit Question' : 'Add Question'}
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Category
                </label>
                <select
                  value={currentQuestion.category}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Question
                </label>
                <textarea
                  value={currentQuestion.question}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="What question do you want to ask?"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Answer Options
                </label>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        border: '1px solid #e5e5e5',
                        borderRadius: '6px',
                        fontSize: '14px',
                        marginRight: '8px'
                      }}
                    />
                    {currentQuestion.options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        style={{
                          padding: '8px',
                          border: 'none',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                
                {currentQuestion.options.length < 6 && (
                  <button
                    onClick={addOption}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid #e5e5e5',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#737373'
                    }}
                  >
                    + Add Option
                  </button>
                )}
              </div>

              <button
                onClick={addQuestion}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                {isEditing ? '✓ Update Question' : '+ Add Question'}
              </button>

              {isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditingIndex(-1)
                    setCurrentQuestion({
                      id: '',
                      category: '',
                      question: '',
                      options: ['', '', '', '']
                    })
                  }}
                  className="btn-secondary"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          {/* Questions List */}
          {survey.questions.length > 0 && (
            <div style={{ maxWidth: '1200px', margin: '48px auto 0' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
                Questions ({survey.questions.length})
              </h2>
              
              <div style={{ display: 'grid', gap: '16px' }}>
                {survey.questions.map((question, index) => (
                  <div key={question.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: '600', 
                            color: '#737373',
                            marginRight: '12px'
                          }}>
                            Q{index + 1}
                          </span>
                          <span style={{ 
                            fontSize: '12px', 
                            padding: '2px 8px',
                            backgroundColor: '#f0fdf0',
                            color: '#00d924',
                            borderRadius: '4px'
                          }}>
                            {question.category}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                          {question.question}
                        </h4>
                        <div style={{ fontSize: '14px', color: '#737373' }}>
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} style={{ marginBottom: '4px' }}>
                              • {option}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => editQuestion(index)}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #e5e5e5',
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => deleteQuestion(index)}
                          style={{
                            padding: '8px 12px',
                            border: 'none',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}