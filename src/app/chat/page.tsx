'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Send, Bot, User, RefreshCw, ThumbsUp, ThumbsDown } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  founder?: string
  timestamp: Date
  rating?: 'good' | 'bad' | null
}

export default function Chat() {
  const [selectedFounder, setSelectedFounder] = useState<string>('rachita')
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi! I'm Rachita's digital twin. Ask me anything and I'll respond as she would. Try asking about work, decisions, or personal preferences.",
      founder: 'rachita',
      timestamp: new Date()
    }
  ])
  const [isLoading, setIsLoading] = useState(false)

  const founders = [
    { id: 'rachita', name: 'Rachita', color: 'gradient-purple', initial: 'R', role: 'CEO' },
    { id: 'everhett', name: 'Everhett', color: 'gradient-blue', initial: 'E', role: 'CTO' },
    { id: 'gigi', name: 'Gigi', color: 'gradient-pink', initial: 'G', role: 'COO' },
  ]

  const selectedFounderData = founders.find(f => f.id === selectedFounder)

  const handleSendMessage = async () => {
    if (!query.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setQuery('')
    setIsLoading(true)

    // Simulate AI response - in real app, this would call your AI API
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateMockResponse(query, selectedFounder),
        founder: selectedFounder,
        timestamp: new Date(),
        rating: null
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 2000)
  }

  const generateMockResponse = (question: string, founder: string): string => {
    // Mock responses based on founder and question type
    const responses = {
      rachita: {
        default: "As someone who's detail-oriented and analytical, I'd approach this by first gathering all the relevant data and considering multiple perspectives before making a decision.",
        work: "I prefer collaborative work environments where I can bounce ideas off others, but I also value focused solo time for deep thinking.",
        decision: "I make decisions by combining data analysis with intuition. I like to sleep on big decisions and often seek input from trusted advisors."
      }
    }

    // Simple keyword matching for demo
    if (question.toLowerCase().includes('work')) {
      return responses.rachita.work
    } else if (question.toLowerCase().includes('decision') || question.toLowerCase().includes('decide')) {
      return responses.rachita.decision
    } else {
      return responses.rachita.default + " What specific aspect would you like me to elaborate on?"
    }
  }

  const rateResponse = (messageId: string, rating: 'good' | 'bad') => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, rating } : msg
      )
    )
  }

  const clearChat = () => {
    setMessages([{
      id: '1',
      type: 'ai',
      content: `Hi! I'm ${selectedFounderData?.name}'s digital twin. Ask me anything and I'll respond as they would.`,
      founder: selectedFounder,
      timestamp: new Date()
    }])
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto glass rounded-2xl mx-6 mt-6">
          <Link href="/" className="flex items-center space-x-3">
            <div className="p-2 gradient-purple rounded-xl glow">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Digital Twin Lab</span>
          </Link>
          <div className="text-sm text-gray-400">
            Chat Interface
          </div>
        </nav>

        <div className="max-w-6xl mx-auto p-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
              Chat with
              <span className="block bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Digital Twins
              </span>
            </h1>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Founder Selection Sidebar */}
            <div className="lg:col-span-1">
              <Card className="glass border-gray-700 mb-6">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Select Founder</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {founders.map(founder => (
                    <button
                      key={founder.id}
                      onClick={() => {
                        setSelectedFounder(founder.id)
                        clearChat()
                      }}
                      className={`w-full p-3 rounded-lg border transition-all ${
                        selectedFounder === founder.id 
                          ? 'border-purple-500 bg-purple-500/10 glow' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${founder.color} rounded-full flex items-center justify-center`}>
                          <span className="font-bold text-white text-sm">{founder.initial}</span>
                        </div>
                        <span className="text-white font-medium">{founder.name}</span>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Test Ideas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button 
                    onClick={() => setQuery("How do you make difficult decisions?")}
                    className="text-sm text-gray-300 hover:text-white p-2 bg-gray-800/50 rounded w-full text-left"
                  >
                    Decision making process
                  </button>
                  <button 
                    onClick={() => setQuery("What's your work style like?")}
                    className="text-sm text-gray-300 hover:text-white p-2 bg-gray-800/50 rounded w-full text-left"
                  >
                    Work preferences
                  </button>
                  <button 
                    onClick={() => setQuery("How do you handle stress?")}
                    className="text-sm text-gray-300 hover:text-white p-2 bg-gray-800/50 rounded w-full text-left"
                  >
                    Stress management
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <Card className="glass border-gray-700 h-[600px] flex flex-col">
                <CardHeader className="border-b border-gray-600">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${selectedFounderData?.color} rounded-full flex items-center justify-center`}>
                        <span className="font-bold text-white text-sm">{selectedFounderData?.initial}</span>
                      </div>
                      <div>
                        <CardTitle className="text-white">{selectedFounderData?.name}'s Digital Twin</CardTitle>
                        <CardDescription className="text-gray-400">AI-powered personality replica</CardDescription>
                      </div>
                    </div>
                    <Button 
                      onClick={clearChat}
                      variant="outline" 
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </CardHeader>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' ? 'bg-blue-600' : `bg-gradient-to-br ${selectedFounderData?.color}`
                        }`}>
                          {message.type === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <span className="text-xs font-bold text-white">{selectedFounderData?.initial}</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className={`px-4 py-2 rounded-lg ${
                            message.type === 'user' 
                              ? 'bg-blue-600 text-white' 
                              : 'glass text-white'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          
                          {message.type === 'ai' && (
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={() => rateResponse(message.id, 'good')}
                                className={`p-1 rounded ${message.rating === 'good' ? 'text-green-400' : 'text-gray-500 hover:text-green-400'}`}
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => rateResponse(message.id, 'bad')}
                                className={`p-1 rounded ${message.rating === 'bad' ? 'text-red-400' : 'text-gray-500 hover:text-red-400'}`}
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex space-x-3 max-w-[80%]">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${selectedFounderData?.color} flex items-center justify-center`}>
                          <span className="text-xs font-bold text-white">{selectedFounderData?.initial}</span>
                        </div>
                        <div className="glass px-4 py-2 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-gray-600 p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder={`Ask ${selectedFounderData?.name} anything...`}
                      className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      disabled={isLoading}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!query.trim() || isLoading}
                      className="gradient-purple text-white"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}