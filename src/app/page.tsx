'use client'

import Link from "next/link"
import { useState, useEffect } from 'react'

export default function Home() {
  const [profileProgress, setProfileProgress] = useState({
    rachita: 0,
    everhett: 0,
    gigi: 0
  })

  // Check profile completion status for each person
  useEffect(() => {
    const checkProfileCompletion = async () => {
      try {
        const people = ['rachita', 'everhett', 'gigi']
        const progress: Record<string, number> = {}
        
        for (const person of people) {
          try {
            // Check if this person has profiles via chat API
            const response = await fetch(`/python-api/chat?person=${encodeURIComponent(person)}`)
            if (response.ok) {
              const data = await response.json()
              // If profiles exist, set to 100%
              progress[person] = (data.profiles && data.profiles.length > 0) ? 100 : 0
            } else {
              progress[person] = 0
            }
          } catch (error) {
            console.error(`Error checking ${person} profile:`, error)
            progress[person] = 0
          }
        }
        
        setProfileProgress(progress as { rachita: number; everhett: number; gigi: number; })
      } catch (error) {
        console.error('Error checking profiles:', error)
        setProfileProgress({ rachita: 0, everhett: 0, gigi: 0 })
      }
    }
    
    checkProfileCompletion()
  }, [])
  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="container">
          <nav className="nav">
            <div className="logo">
              <div className="logo-icon">
                <div style={{ width: '16px', height: '16px', backgroundColor: 'white', borderRadius: '2px' }}></div>
              </div>
              <div className="logo-text">
                <h1>PAI</h1>
                <p>Digital Twin Platform</p>
              </div>
            </div>
            <div className="badge">Internal Beta</div>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        <div className="container">
          {/* Hero */}
          <section className="hero">
            <h1>
              Build your<br />
              <span className="highlight">Digital Twin</span>
            </h1>
            
            <p>
              Advanced AI personality replication platform. Train sophisticated models on your unique 
              behavioral patterns and test their accuracy in real-time conversations.
            </p>
            
            <div className="buttons">
              <Link href="/create-questionnaire" className="btn-primary">
                📝 Create Questionnaire
              </Link>
              <Link href="/create-survey" className="btn-primary">
                📋 Create Survey
              </Link>
              <Link href="/chat" className="btn-secondary" title="Have open conversations with digital twins">
                ▶ Chat with Twins
              </Link>
              <Link href="/validation" className="btn-secondary" title="Scientific accuracy testing with multiple choice questions">
                📊 Accuracy Test
              </Link>
              <Link href="/validation-history" className="btn-secondary" title="View all previous validation test results">
                📈 Test History
              </Link>
            </div>
          </section>

          {/* Stats */}
          <section className="stats">
            <div className="stat">
              <div className="stat-number">3</div>
              <div className="stat-label">Active Twins</div>
            </div>
            <div className="stat">
              <div className="stat-number">AI</div>
              <div className="stat-label">Powered</div>
            </div>
            <div className="stat">
              <div className="stat-number">∞</div>
              <div className="stat-label">Possibilities</div>
            </div>
          </section>

          {/* Profiles */}
          <section>
            <h2 className="section-title">Digital Twin Profiles</h2>
            <p className="section-desc">
              Create and train AI replicas of unique personality and decision-making patterns
            </p>
            
            <div className="profiles">
              <div className="card">
                <div className="profile-header">
                  <div className="avatar">
                    R
                    <div className="status-dot status-active"></div>
                  </div>
                  <div className="profile-info">
                    <h3>Rachita</h3>
                  </div>
                </div>
                
                <div className="progress">
                  <div className="progress-header">
                    <span className="progress-label">Training Progress</span>
                    <span className="progress-value">{profileProgress.rachita}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${profileProgress.rachita}%` }}></div>
                  </div>
                </div>
                
                <Link href="/create-profile?name=rachita" className="btn-card">
                  {profileProgress.rachita === 100 ? 'Re-create Profile' : 'Complete Profile'}
                </Link>
              </div>

              <div className="card">
                <div className="profile-header">
                  <div className="avatar">
                    E
                    <div className="status-dot status-pending"></div>
                  </div>
                  <div className="profile-info">
                    <h3>Everhett</h3>
                  </div>
                </div>
                
                <div className="progress">
                  <div className="progress-header">
                    <span className="progress-label">Training Progress</span>
                    <span className="progress-value">{profileProgress.everhett}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${profileProgress.everhett}%` }}></div>
                  </div>
                </div>
                
                <Link href="/create-profile?name=everhett" className="btn-card">
                  {profileProgress.everhett === 100 ? 'Re-create Profile' : '⚙ Complete Profile'}
                </Link>
              </div>

              <div className="card">
                <div className="profile-header">
                  <div className="avatar">
                    G
                    <div className="status-dot status-offline"></div>
                  </div>
                  <div className="profile-info">
                    <h3>Gigi</h3>
                  </div>
                </div>
                
                <div className="progress">
                  <div className="progress-header">
                    <span className="progress-label">Training Progress</span>
                    <span className="progress-value">{profileProgress.gigi}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${profileProgress.gigi}%` }}></div>
                  </div>
                </div>
                
                <Link href="/create-profile?name=gigi" className="btn-card">
                  {profileProgress.gigi === 100 ? 'Re-create Profile' : '⚙ Complete Profile'}
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}