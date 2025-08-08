'use client'

import Link from "next/link"
import { ArrowRight, Users, Cpu, Target, Play, Settings } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">PAI</h1>
                <p className="text-xs text-muted-foreground">Digital Twin Platform</p>
              </div>
            </div>
            <div className="bg-secondary rounded-full px-4 py-1.5">
              <span className="text-xs font-medium text-secondary-foreground">Internal Beta</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="max-w-4xl">
          <div className="mb-8">
            <div className="inline-flex items-center bg-secondary rounded-full px-4 py-2 mb-8">
              <div className="status-dot status-active mr-2"></div>
              <span className="text-sm font-medium text-foreground">AI-Powered Digital Twins</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl rh-heading mb-8 leading-[1.1]">
            Build your
            <br />
            <span className="text-primary">Digital Twin</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
            Advanced AI personality replication platform. Train sophisticated models on your unique 
            behavioral patterns and test their accuracy in real-time conversations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link href="/create-profile" className="rh-btn-primary inline-flex items-center">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/chat" className="rh-btn-secondary inline-flex items-center">
              <Play className="mr-2 h-4 w-4" />
              Test Conversations
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-semibold text-foreground mb-2">3</div>
              <div className="text-sm text-muted-foreground">Active Twins</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Cpu className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-semibold text-foreground mb-2">AI</div>
              <div className="text-sm text-muted-foreground">Powered</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-semibold text-foreground mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Possibilities</div>
            </div>
          </div>
        </div>

        {/* Digital Twin Profiles */}
        <section className="mb-20">
          <div className="mb-12">
            <h2 className="text-3xl rh-heading mb-4">Digital Twin Profiles</h2>
            <p className="text-lg rh-subheading max-w-2xl">
              Create and train AI replicas of each founder's unique personality and decision-making patterns
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rh-card">
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xl font-semibold text-white">R</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 status-dot status-active border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="text-xl rh-heading mb-1">Rachita</h3>
                  <p className="text-sm rh-subheading">Co-Founder & CEO</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm rh-subheading">Training Progress</span>
                  <span className="text-sm font-semibold text-foreground">0%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
                </div>
              </div>
              
              <Link href="/create-profile?founder=rachita" className="rh-btn-secondary w-full text-center">
                <Settings className="mr-2 h-4 w-4" />
                Complete Profile
              </Link>
            </div>

            <div className="rh-card">
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xl font-semibold text-white">E</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 status-dot status-pending border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="text-xl rh-heading mb-1">Everhett</h3>
                  <p className="text-sm rh-subheading">Co-Founder & CTO</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm rh-subheading">Training Progress</span>
                  <span className="text-sm font-semibold text-foreground">0%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
                </div>
              </div>
              
              <Link href="/create-profile?founder=everhett" className="rh-btn-secondary w-full text-center">
                <Settings className="mr-2 h-4 w-4" />
                Complete Profile
              </Link>
            </div>

            <div className="rh-card">
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xl font-semibold text-white">G</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 status-dot bg-red-500 border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="text-xl rh-heading mb-1">Gigi</h3>
                  <p className="text-sm rh-subheading">Co-Founder & COO</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm rh-subheading">Training Progress</span>
                  <span className="text-sm font-semibold text-foreground">0%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
                </div>
              </div>
              
              <Link href="/create-profile?founder=gigi" className="rh-btn-secondary w-full text-center">
                <Settings className="mr-2 h-4 w-4" />
                Complete Profile
              </Link>
            </div>
          </div>
        </section>

        {/* Action Cards */}
        <section className="grid md:grid-cols-2 gap-6">
          <Link href="/create-profile" className="rh-card group">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl rh-heading mb-1">Training Session</h3>
                <p className="text-sm rh-subheading">Build your digital persona</p>
              </div>
            </div>
            <p className="rh-subheading leading-relaxed">
              Complete comprehensive personality profiles and behavioral assessments to create highly accurate AI replicas.
            </p>
          </Link>

          <Link href="/chat" className="rh-card group">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Play className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl rh-heading mb-1">AI Conversations</h3>
                <p className="text-sm rh-subheading">Test twin accuracy</p>
              </div>
            </div>
            <p className="rh-subheading leading-relaxed">
              Engage in real-time conversations with digital twins and evaluate response accuracy through advanced rating systems.
            </p>
          </Link>
        </section>
      </main>
    </div>
  )
}