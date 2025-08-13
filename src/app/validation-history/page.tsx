'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"

interface ValidationResult {
  filename: string
  profile_id: string
  digital_twin_version: string
  model_version: string
  accuracy_percentage: number
  total_questions: number
  correct_answers: number
  timestamp: string
  test_session_id: string
}

interface ValidationHistory {
  status: string
  total_tests: number
  results: ValidationResult[]
  message?: string
}

export default function ValidationHistory() {
  const [history, setHistory] = useState<ValidationHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<{ profile_id: string; accuracy_percentage: number; total_questions: number; correct_answers: number; timestamp: string; digital_twin_version: string; model_version: string; comparisons: { question_id: string; human_answer: string; predicted_answer: string; is_match: boolean; confidence: number; reasoning?: string }[] } | null>(null)
  const [showingDetails, setShowingDetails] = useState(false)

  useEffect(() => {
    loadValidationHistory()
  }, [])

  const loadValidationHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/validation/results/history')
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      } else {
        console.error('Failed to load validation history')
      }
    } catch (error) {
      console.error('Error loading validation history:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDetailedResults = async (testSessionId: string) => {
    try {
      setShowingDetails(true)
      const response = await fetch(`http://localhost:8000/validation/results/detail/${testSessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedResult(data)
      } else {
        console.error('Failed to load detailed results')
      }
    } catch (error) {
      console.error('Error loading detailed results:', error)
    }
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return '#00d924'
    if (accuracy >= 60) return '#f59e0b'
    return '#ef4444'
  }

  if (loading) {
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
                  <p>Validation History</p>
                </div>
              </Link>
              <div className="badge">Loading...</div>
            </nav>
          </div>
        </header>
        <main className="main">
          <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
            <h1>Loading validation history...</h1>
          </div>
        </main>
      </div>
    )
  }

  if (selectedResult && showingDetails) {
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
                  <p>Test Details</p>
                </div>
              </Link>
              <div className="badge">{selectedResult.accuracy_percentage}% Accuracy</div>
            </nav>
          </div>
        </header>

        <main className="main">
          <div className="container">
            <div style={{ marginBottom: '32px' }}>
              <button 
                onClick={() => setShowingDetails(false)}
                className="btn-secondary"
                style={{ marginBottom: '24px' }}
              >
                ← Back to History
              </button>
              
              <h1 style={{ fontSize: '36px', fontWeight: '600', marginBottom: '16px' }}>
                {selectedResult.digital_twin_version} Test Results
              </h1>
              <p style={{ color: '#737373', fontSize: '16px' }}>
                Tested on {formatDate(selectedResult.timestamp)} using {selectedResult.model_version}
              </p>
            </div>

            {/* Overall Results */}
            <div className="card" style={{ marginBottom: '32px', textAlign: 'center' }}>
              <h2 style={{ fontSize: '48px', fontWeight: '600', marginBottom: '16px', color: getAccuracyColor(selectedResult.accuracy_percentage) }}>
                {selectedResult.accuracy_percentage}%
              </h2>
              <p style={{ fontSize: '18px', color: '#737373', marginBottom: '24px' }}>
                {selectedResult.correct_answers} out of {selectedResult.total_questions} questions predicted correctly
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '24px',
                padding: '24px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#00d924' }}>
                    {selectedResult.correct_answers}
                  </div>
                  <div style={{ fontSize: '14px', color: '#737373' }}>Correct</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#ef4444' }}>
                    {selectedResult.total_questions - selectedResult.correct_answers}
                  </div>
                  <div style={{ fontSize: '14px', color: '#737373' }}>Incorrect</div>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#737373' }}>
                    {selectedResult.digital_twin_version}
                  </div>
                  <div style={{ fontSize: '14px', color: '#737373' }}>Digital Twin</div>
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#737373' }}>
                    {selectedResult.model_version.split('-')[2]}
                  </div>
                  <div style={{ fontSize: '14px', color: '#737373' }}>AI Model</div>
                </div>
              </div>
            </div>

            {/* Detailed Question Results */}
            <div style={{ display: 'grid', gap: '16px' }}>
              {selectedResult.comparisons.map((comparison: { question_id: string; human_answer: string; predicted_answer: string; is_match: boolean; confidence: number; reasoning?: string }, index: number) => (
                <div 
                  key={comparison.question_id} 
                  className="card"
                  style={{ 
                    borderLeft: comparison.is_match ? '4px solid #00d924' : '4px solid #ef4444',
                    padding: '24px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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

                  {comparison.reasoning && (
                    <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>AI Reasoning:</div>
                      <div style={{ fontSize: '14px', color: '#555' }}>
                        {comparison.reasoning}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
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
                <p>Validation History</p>
              </div>
            </Link>
            <div className="badge">
              {history?.total_tests || 0} Tests
            </div>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '600', lineHeight: '1.1', marginBottom: '24px' }}>
              Validation <span className="highlight">Test History</span>
            </h1>
            <p style={{ fontSize: '18px', color: '#737373', maxWidth: '600px', margin: '0 auto' }}>
              View all previous digital twin validation tests, compare accuracy across versions and models.
            </p>
          </div>

          {!history || history.status === 'no_tests_completed' ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
                No Validation Tests Yet
              </h2>
              <p style={{ fontSize: '16px', color: '#737373', marginBottom: '32px' }}>
                Take your first validation test to start tracking digital twin accuracy.
              </p>
              <Link href="/validation" className="btn-primary">
                Take Validation Test
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {history.results.map((result) => (
                <div key={result.test_session_id} className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0', marginBottom: '8px' }}>
                        {result.digital_twin_version} Validation Test
                      </h3>
                      <p style={{ fontSize: '14px', color: '#737373', margin: '0' }}>
                        {formatDate(result.timestamp)} • {result.model_version}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '32px', 
                        fontWeight: '600', 
                        color: getAccuracyColor(result.accuracy_percentage),
                        marginBottom: '4px'
                      }}>
                        {result.accuracy_percentage}%
                      </div>
                      <div style={{ fontSize: '14px', color: '#737373' }}>
                        {result.correct_answers}/{result.total_questions} correct
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                      onClick={() => loadDetailedResults(result.test_session_id)}
                      className="btn-secondary"
                      style={{ fontSize: '14px', padding: '8px 16px' }}
                    >
                      📊 View Details
                    </button>
                    <div style={{ fontSize: '12px', color: '#737373' }}>
                      Session: {result.test_session_id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link href="/validation" className="btn-primary" style={{ marginRight: '16px' }}>
              🧪 Take New Test
            </Link>
            <Link href="/" className="btn-secondary">
              🏠 Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}