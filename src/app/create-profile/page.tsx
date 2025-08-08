'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, ArrowRight, Save } from "lucide-react"
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
    // Here you'd save to your backend/database
    alert('Profile saved! Your digital twin training has begun.')
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div className="gradient-mesh absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1)_0%,transparent_50%)]" />
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-32 left-16 w-96 h-96 gradient-purple rounded-full mix-blend-screen filter blur-3xl opacity-20 floating" />
      <div className="absolute bottom-32 right-16 w-80 h-80 gradient-blue rounded-full mix-blend-screen filter blur-3xl opacity-25 floating-delayed" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
          <Link href="/" className="glass-card rounded-2xl p-4 flex items-center space-x-4">
            <div className="p-2 gradient-purple rounded-xl glow-subtle">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">Digital Twin Lab</span>
              <p className="text-xs text-gray-400 font-medium">Profile Creation</p>
            </div>
          </Link>
          <div className="glass-card rounded-full px-6 py-3">
            <span className="text-sm font-medium text-gray-300">Step 1 of 2</span>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto p-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Build Your
              <span className="block bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Digital Twin
              </span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Answer these questions to help the AI understand your personality, thinking patterns, and decision-making style.
            </p>
          </div>

          <Card className="glass border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Personal Profile</CardTitle>
              <CardDescription className="text-gray-300">
                Tell us about yourself so we can create an accurate digital representation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Your age"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Personality Description
                </label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe your personality in detail. Are you introverted/extroverted? Analytical/creative? Risk-taker/cautious? etc."
                  value={formData.personality}
                  onChange={(e) => handleInputChange('personality', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Work Style & Approach
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="How do you approach work? Do you prefer collaboration or solo work? Structured or flexible? Detail-oriented or big picture?"
                  value={formData.workStyle}
                  onChange={(e) => handleInputChange('workStyle', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Decision Making Process
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="How do you make decisions? Do you rely on data, intuition, or both? Fast or deliberate? Do you seek input from others?"
                  value={formData.decisionMaking}
                  onChange={(e) => handleInputChange('decisionMaking', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Communication Style
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="How do you communicate? Direct or diplomatic? Formal or casual? Do you use humor? How do you handle conflict?"
                  value={formData.communication}
                  onChange={(e) => handleInputChange('communication', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Core Values & Beliefs
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="What are your core values? What drives and motivates you? What principles do you live by?"
                  value={formData.values}
                  onChange={(e) => handleInputChange('values', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Interests & Hobbies
                </label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="What do you enjoy doing in your free time? Any specific interests, hobbies, or passions?"
                  value={formData.hobbies}
                  onChange={(e) => handleInputChange('hobbies', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Background & Experience
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Tell us about your professional/educational background, key experiences that shaped you, or anything else relevant"
                  value={formData.background}
                  onChange={(e) => handleInputChange('background', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white" asChild>
              <Link href="/">
                Back to Home
              </Link>
            </Button>
            <Button 
              onClick={handleSave}
              className="gradient-purple text-white font-semibold glow hover:glow-strong transition-all"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Profile & Start Training
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}