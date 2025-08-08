'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Plus, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      </div>
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 gradient-purple rounded-full mix-blend-multiply filter blur-xl opacity-20 floating"></div>
      <div className="absolute top-40 right-20 w-72 h-72 gradient-cyan rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-delayed"></div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-6 max-w-5xl mx-auto glass rounded-2xl mx-6 mt-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 gradient-purple rounded-xl glow">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Digital Twin Lab</span>
          </div>
          <div className="text-sm text-gray-400">
            Founder Testing Platform
          </div>
        </nav>

        {/* Hero Section */}
        <section className="text-center py-20 px-6 max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Create Your
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Digital Twin
            </span>
          </h1>
          
          <p className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto">
            Internal testing platform for founders to experiment with AI digital twins. 
            Train AI models on your personality and see how well they can replicate your responses.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gradient-purple text-white font-semibold px-8 py-4 glow hover:glow-strong transition-all" asChild>
              <Link href="/create-profile">
                <Plus className="mr-2 h-5 w-5" />
                Create My Twin
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-4" asChild>
              <Link href="/chat">
                <MessageCircle className="mr-2 h-5 w-5" />
                Chat with Twins
              </Link>
            </Button>
          </div>
        </section>

        {/* Founder Cards */}
        <section className="py-16 px-6 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Active Digital Twins</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass border-gray-700">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">R</span>
                </div>
                <CardTitle className="text-white">Rachita</CardTitle>
                <CardDescription className="text-gray-400">Founder #1</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-gray-300 mb-4">Training Progress: 0%</p>
                  <Button className="w-full gradient-purple text-white" asChild>
                    <Link href="/create-profile?founder=rachita">Complete Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-700">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">F2</span>
                </div>
                <CardTitle className="text-white">Founder 2</CardTitle>
                <CardDescription className="text-gray-400">Founder #2</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-gray-300 mb-4">Training Progress: 0%</p>
                  <Button className="w-full gradient-cyan text-white" asChild>
                    <Link href="/create-profile?founder=founder2">Complete Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-gray-700">
              <CardHeader className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">F3</span>
                </div>
                <CardTitle className="text-white">Founder 3</CardTitle>
                <CardDescription className="text-gray-400">Founder #3</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-gray-300 mb-4">Training Progress: 0%</p>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white" asChild>
                    <Link href="/create-profile?founder=founder3">Complete Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-16 px-6 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass border-gray-700 hover:glow transition-all cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Plus className="mr-2 h-5 w-5 text-purple-400" />
                  Training Session
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Add more personality data and responses to improve your digital twin
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass border-gray-700 hover:glow transition-all cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MessageCircle className="mr-2 h-5 w-5 text-cyan-400" />
                  Test & Compare
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Chat with digital twins and rate how accurate their responses are
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}