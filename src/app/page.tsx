'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Plus, MessageCircle, Sparkles, Activity, Zap, Users, Target, Cpu } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-32 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-cyan-600/20 rounded-full blur-3xl animate-float"></div>
      </div>
      
      <div className="relative z-10">
        <nav className="flex justify-between items-center p-8 max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-gray-900">PAI Labs</span>
              <p className="text-sm text-gray-600 font-medium">Digital Twin Platform</p>
            </div>
          </div>
          <div className="glass-effect rounded-full px-8 py-4 shadow-lg">
            <span className="text-sm font-semibold text-gray-700">Internal Beta</span>
          </div>
        </nav>

        <section className="text-center py-32 px-6 max-w-6xl mx-auto">
          <div className="mb-12">
            <div className="inline-flex items-center glass-effect rounded-full px-8 py-4 mb-12 shadow-lg">
              <Sparkles className="h-5 w-5 text-blue-600 mr-3 animate-pulse" />
              <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI-Powered Digital Twins</span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black leading-none mb-12 tracking-tight">
            <span className="text-gray-900">Build Your</span>
            <br />
            <span className="text-gradient animate-pulse-slow">Digital Twin</span>
          </h1>
          
          <p className="text-2xl text-gray-700 mb-20 max-w-4xl mx-auto leading-relaxed font-medium">
            Advanced AI personality replication platform. Train sophisticated models on your unique 
            behavioral patterns and test their accuracy in real-time conversations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-20">
            <Link href="/create-profile" className="btn-primary group">
              <Plus className="mr-4 h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
              Create Digital Twin
            </Link>
            <Link href="/chat" className="btn-secondary group">
              <MessageCircle className="mr-4 h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
              Test Conversations
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="card-modern p-8 text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-black text-gray-900 mb-3">3</div>
              <div className="text-gray-600 font-semibold">Active Twins</div>
            </div>
            <div className="card-modern p-8 text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Cpu className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-black text-gray-900 mb-3">AI</div>
              <div className="text-gray-600 font-semibold">Powered</div>
            </div>
            <div className="card-modern p-8 text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl font-black text-gray-900 mb-3">∞</div>
              <div className="text-gray-600 font-semibold">Possibilities</div>
            </div>
          </div>
        </section>

        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-gray-900 mb-6">Digital Twin Profiles</h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Create and train AI replicas of each founder's unique personality and decision-making patterns
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="card-modern p-8 group">
              <div className="text-center mb-8">
                <div className="relative mb-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300">
                    <span className="text-5xl font-black text-white">R</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg"></div>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-2">Rachita</h3>
                <p className="text-lg text-gray-600 font-semibold">Co-Founder & CEO</p>
              </div>
              
              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Training Progress</span>
                  <span className="text-blue-600 font-black text-lg">0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: '0%' }}></div>
                </div>
              </div>
              
              <Link href="/create-profile?founder=rachita" className="block w-full btn-primary text-center group-hover:shadow-2xl">
                <Activity className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                Complete Profile
              </Link>
            </div>

            <div className="card-modern p-8 group">
              <div className="text-center mb-8">
                <div className="relative mb-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300">
                    <span className="text-5xl font-black text-white">E</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full border-4 border-white shadow-lg"></div>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-2">Everhett</h3>
                <p className="text-lg text-gray-600 font-semibold">Co-Founder & CTO</p>
              </div>
              
              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Training Progress</span>
                  <span className="text-blue-600 font-black text-lg">0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: '0%' }}></div>
                </div>
              </div>
              
              <Link href="/create-profile?founder=everhett" className="block w-full btn-primary text-center group-hover:shadow-2xl">
                <Activity className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                Complete Profile
              </Link>
            </div>

            <div className="card-modern p-8 group">
              <div className="text-center mb-8">
                <div className="relative mb-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300">
                    <span className="text-5xl font-black text-white">G</span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg"></div>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-2">Gigi</h3>
                <p className="text-lg text-gray-600 font-semibold">Co-Founder & COO</p>
              </div>
              
              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">Training Progress</span>
                  <span className="text-blue-600 font-black text-lg">0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: '0%' }}></div>
                </div>
              </div>
              
              <Link href="/create-profile?founder=gigi" className="block w-full btn-primary text-center group-hover:shadow-2xl">
                <Activity className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                Complete Profile
              </Link>
            </div>
          </div>
        </section>

        <section className="py-32 px-6 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <Link href="/create-profile" className="card-modern p-10 group block">
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mr-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Plus className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900 mb-2">Training Session</h3>
                  <p className="text-lg text-gray-600 font-semibold">Build your digital persona</p>
                </div>
              </div>
              <p className="text-xl text-gray-700 leading-relaxed">
                Complete comprehensive personality profiles and behavioral assessments to create highly accurate AI replicas of your decision-making patterns.
              </p>
            </Link>

            <Link href="/chat" className="card-modern p-10 group block">
              <div className="flex items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mr-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-gray-900 mb-2">AI Conversations</h3>
                  <p className="text-lg text-gray-600 font-semibold">Test twin accuracy</p>
                </div>
              </div>
              <p className="text-xl text-gray-700 leading-relaxed">
                Engage in real-time conversations with digital twins and evaluate response accuracy through advanced rating systems and comparison tools.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}