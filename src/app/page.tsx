'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Plus, MessageCircle, Sparkles, Activity, Zap } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative z-10">
        <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary rounded-xl">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl font-bold">Digital Twin Lab</span>
              <p className="text-xs text-muted-foreground font-medium">Founder AI Testing</p>
            </div>
          </div>
          <div className="border border-border rounded-full px-6 py-3">
            <span className="text-sm font-medium text-muted-foreground">Internal Platform</span>
          </div>
        </nav>

        <section className="text-center py-24 px-6 max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center bg-muted rounded-full px-6 py-3 mb-8">
              <Sparkles className="h-4 w-4 text-primary mr-2" />
              <span className="text-sm font-semibold text-primary">AI-Powered Digital Twins</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold leading-none mb-8 tracking-tight">
            <span>Build Your</span>
            <br />
            <span className="text-primary text-7xl md:text-8xl">Digital Twin</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto leading-relaxed font-medium">
            Advanced AI personality replication platform. Train sophisticated models on your unique 
            behavioral patterns and test their accuracy in real-time conversations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button size="lg" className="bg-primary text-primary-foreground font-bold px-10 py-6 text-lg rounded-2xl" asChild>
              <Link href="/create-profile">
                <Plus className="mr-3 h-5 w-5" />
                Create Digital Twin
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-10 py-6 text-lg rounded-2xl" asChild>
              <Link href="/chat">
                <MessageCircle className="mr-3 h-5 w-5" />
                Test Conversations
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">3</div>
                <div className="text-muted-foreground font-medium">Active Twins</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-secondary mb-2">AI</div>
                <div className="text-muted-foreground font-medium">Powered</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">∞</div>
                <div className="text-muted-foreground font-medium">Possibilities</div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Digital Twin Profiles</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create and train AI replicas of each founder's unique personality and decision-making patterns
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-primary rounded-2xl mx-auto flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary-foreground">R</span>
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-2">Rachita</CardTitle>
                <CardDescription>Co-Founder & CEO</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Training Progress</span>
                    <span className="text-primary font-semibold">0%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                
                <Button className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl" asChild>
                  <Link href="/create-profile?founder=rachita">
                    <Activity className="mr-2 h-4 w-4" />
                    Complete Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-primary rounded-2xl mx-auto flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary-foreground">E</span>
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-2">Everhett</CardTitle>
                <CardDescription>Co-Founder & CTO</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Training Progress</span>
                    <span className="text-primary font-semibold">0%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                
                <Button className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl" asChild>
                  <Link href="/create-profile?founder=everhett">
                    <Activity className="mr-2 h-4 w-4" />
                    Complete Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-primary rounded-2xl mx-auto flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary-foreground">G</span>
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-2">Gigi</CardTitle>
                <CardDescription>Co-Founder & COO</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Training Progress</span>
                    <span className="text-primary font-semibold">0%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
                
                <Button className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl" asChild>
                  <Link href="/create-profile?founder=gigi">
                    <Activity className="mr-2 h-4 w-4" />
                    Complete Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-24 px-6 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <Link href="/create-profile">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-primary rounded-xl mr-4">
                      <Plus className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Training Session</CardTitle>
                      <CardDescription>Build your digital persona</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Complete comprehensive personality profiles and behavioral assessments to create highly accurate AI replicas of your decision-making patterns.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/chat">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-primary rounded-xl mr-4">
                      <Zap className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">AI Conversations</CardTitle>
                      <CardDescription>Test twin accuracy</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Engage in real-time conversations with digital twins and evaluate response accuracy through advanced rating systems and comparison tools.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}