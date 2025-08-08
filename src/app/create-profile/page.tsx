'use client'

import { useState } from 'react'
import Link from "next/link"

export default function CreateProfile() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    personality: '',
    workStyle: '',
    decisionMaking: '',
    communication: '',
    values: '',
    hobbies: '',
    background: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    console.log('Saving profile data:', formData)
    alert('Profile saved! Your digital twin training has begun.')
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
              Answer these questions to help the AI understand your personality, thinking patterns, and decision-making style.
            </p>
          </div>

          <div className="card" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Personal Profile</h2>
            <p style={{ fontSize: '16px', color: '#737373', marginBottom: '32px' }}>
              Tell us about yourself so we can create an accurate digital representation
            </p>

            <div style={{ display: 'grid', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Age
                </label>
                <input
                  type="number"
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                  placeholder="Your age"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Personality Description
                </label>
                <textarea
                  rows={4}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Describe your personality in detail. Are you introverted/extroverted? Analytical/creative? Risk-taker/cautious? etc."
                  value={formData.personality}
                  onChange={(e) => handleInputChange('personality', e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Work Style & Approach
                </label>
                <textarea
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  placeholder="How do you approach work? Do you prefer collaboration or solo work? Structured or flexible? Detail-oriented or big picture?"
                  value={formData.workStyle}
                  onChange={(e) => handleInputChange('workStyle', e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Decision Making Process
                </label>
                <textarea
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  placeholder="How do you make decisions? Do you rely on data, intuition, or both? Fast or deliberate? Do you seek input from others?"
                  value={formData.decisionMaking}
                  onChange={(e) => handleInputChange('decisionMaking', e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Communication Style
                </label>
                <textarea
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  placeholder="How do you communicate? Direct or diplomatic? Formal or casual? Do you use humor? How do you handle conflict?"
                  value={formData.communication}
                  onChange={(e) => handleInputChange('communication', e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Core Values & Beliefs
                </label>
                <textarea
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  placeholder="What are your core values? What drives and motivates you? What principles do you live by?"
                  value={formData.values}
                  onChange={(e) => handleInputChange('values', e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Interests & Hobbies
                </label>
                <textarea
                  rows={2}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  placeholder="What do you enjoy doing in your free time? Any specific interests, hobbies, or passions?"
                  value={formData.hobbies}
                  onChange={(e) => handleInputChange('hobbies', e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Background & Experience
                </label>
                <textarea
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px', 
                    border: '1px solid #e5e5e5', 
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Tell us about your professional/educational background, key experiences that shaped you, or anything else relevant"
                  value={formData.background}
                  onChange={(e) => handleInputChange('background', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
            <Link href="/" className="btn-secondary">
              ← Back to Home
            </Link>
            <button onClick={handleSave} className="btn-primary">
              💾 Save Profile & Start Training
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}