'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Plus, MessageCircle, Sparkles, Activity, Zap } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0">
        <div className="gradient-mesh absolute inset-0" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1)_0%,transparent_50%)]" />
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-32 left-16 w-96 h-96 gradient-purple rounded-full mix-blend-screen filter blur-3xl opacity-20 floating" />
      <div className="absolute top-64 right-16 w-80 h-80 gradient-blue rounded-full mix-blend-screen filter blur-3xl opacity-25 floating-delayed" />
      <div className="absolute bottom-32 left-1/3 w-72 h-72 gradient-pink rounded-full mix-blend-screen filter blur-3xl opacity-20 floating-slow" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
          <div className="glass-card rounded-2xl p-4 flex items-center space-x-4">
            <div className="p-2 gradient-purple rounded-xl glow-subtle">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">Digital Twin Lab</span>
              <p className="text-xs text-gray-400 font-medium">Founder AI Testing</p>
            </div>
          </div>
          <div className="glass-card rounded-full px-6 py-3">
            <span className="text-sm font-medium text-gray-300">Internal Platform</span>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="text-center py-24 px-6 max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center glass-card rounded-full px-6 py-3 mb-8 animate-pulse-glow">
              <Sparkles className="h-4 w-4 text-gradient mr-2" />
              <span className="text-sm font-semibold text-gradient">AI-Powered Digital Twins</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold leading-none mb-8 tracking-tight">
            <span className="text-white">Build Your</span>
            <br />
            <span className="text-gradient text-7xl md:text-8xl">Digital Twin</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed font-medium">
            Advanced AI personality replication platform. Train sophisticated models on your unique 
            behavioral patterns and test their accuracy in real-time conversations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button size="lg" className="gradient-purple text-white font-bold px-10 py-6 text-lg glow-subtle hover:glow-strong transition-all rounded-2xl border-0 shadow-2xl" asChild>
              <Link href="/create-profile">
                <Plus className="mr-3 h-5 w-5" />
                Create Digital Twin
              </Link>
            </Button>
            <Button size="lg" className="glass-card border-0 text-white hover:glow-subtle transition-all px-10 py-6 text-lg rounded-2xl" asChild>
              <Link href="/chat">
                <MessageCircle className="mr-3 h-5 w-5" />
                Test Conversations
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="glass-card rounded-3xl p-6 text-center">
              <div className="text-3xl font-bold text-gradient mb-2">3</div>
              <div className="text-gray-400 font-medium">Active Twins</div>
            </div>
            <div className="glass-card rounded-3xl p-6 text-center">
              <div className="text-3xl font-bold text-gradient-alt mb-2">AI</div>
              <div className="text-gray-400 font-medium">Powered</div>
            </div>
            <div className="glass-card rounded-3xl p-6 text-center">
              <div className="text-3xl font-bold text-gradient mb-2">∞</div>
              <div className="text-gray-400 font-medium">Possibilities</div>
            </div>
          </div>
        </section>

        {/* Founder Cards */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Digital Twin Profiles</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Create and train AI replicas of each founder's unique personality and decision-making patterns
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Rachita */}
            <div className="glass-card rounded-3xl p-8 hover:glow-subtle transition-all duration-500 group border-gradient">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 gradient-purple rounded-2xl mx-auto flex items-center justify-center glow-subtle group-hover:glow-strong transition-all">
                    <span className="text-3xl font-bold text-white">R</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-black"></div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Rachita</h3>
                <p className="text-gray-400 mb-6">Co-Founder & CEO</p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Training Progress</span>
                    <span className="text-gradient font-semibold">0%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="gradient-purple h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                
                <Button className="w-full gradient-purple text-white font-semibold py-3 rounded-xl glow-subtle hover:glow-strong transition-all" asChild>
                  <Link href="/create-profile?founder=rachita">
                    <Activity className="mr-2 h-4 w-4" />
                    Complete Profile
                  </Link>
                </Button>
              </div>
            </div>

            {/* Everhett */}
            <div className="glass-card rounded-3xl p-8 hover:glow-subtle transition-all duration-500 group border-gradient">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 gradient-blue rounded-2xl mx-auto flex items-center justify-center glow-subtle group-hover:glow-strong transition-all">
                    <span className="text-3xl font-bold text-white">E</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 rounded-full border-4 border-black"></div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Everhett</h3>
                <p className="text-gray-400 mb-6">Co-Founder & CTO</p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Training Progress</span>
                    <span className="text-gradient font-semibold">0%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="gradient-blue h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                
                <Button className="w-full gradient-blue text-white font-semibold py-3 rounded-xl glow-subtle hover:glow-strong transition-all" asChild>
                  <Link href="/create-profile?founder=everhett">
                    <Activity className="mr-2 h-4 w-4" />
                    Complete Profile
                  </Link>
                </Button>
              </div>
            </div>

            {/* Gigi */}
            <div className="glass-card rounded-3xl p-8 hover:glow-subtle transition-all duration-500 group border-gradient">
              <div className="text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 gradient-pink rounded-2xl mx-auto flex items-center justify-center glow-subtle group-hover:glow-strong transition-all">
                    <span className="text-3xl font-bold text-white">G</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 rounded-full border-4 border-black"></div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Gigi</h3>
                <p className="text-gray-400 mb-6">Co-Founder & COO</p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Training Progress</span>
                    <span className="text-gradient font-semibold">0%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="gradient-pink h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                
                <Button className="w-full gradient-pink text-white font-semibold py-3 rounded-xl glow-subtle hover:glow-strong transition-all" asChild>
                  <Link href="/create-profile?founder=gigi">
                    <Activity className="mr-2 h-4 w-4" />
                    Complete Profile
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-24 px-6 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <Link href="/create-profile" className="group">
              <div className="glass-card rounded-3xl p-8 hover:glow-subtle transition-all duration-500 border-gradient h-full">
                <div className="flex items-center mb-6">
                  <div className="p-3 gradient-purple rounded-xl glow-subtle mr-4 group-hover:glow-strong transition-all">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Training Session</h3>
                    <p className="text-gray-400">Build your digital persona</p>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Complete comprehensive personality profiles and behavioral assessments to create highly accurate AI replicas of your decision-making patterns.
                </p>
              </div>
            </Link>

            <Link href="/chat" className="group">
              <div className="glass-card rounded-3xl p-8 hover:glow-subtle transition-all duration-500 border-gradient h-full">
                <div className="flex items-center mb-6">
                  <div className="p-3 gradient-blue rounded-xl glow-subtle mr-4 group-hover:glow-strong transition-all">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">AI Conversations</h3>
                    <p className="text-gray-400">Test twin accuracy</p>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  Engage in real-time conversations with digital twins and evaluate response accuracy through advanced rating systems and comparison tools.
                </p>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}