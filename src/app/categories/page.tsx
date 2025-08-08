'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, ArrowRight, CheckCircle, Clock, DollarSign, Sparkles, Heart, Dumbbell, CreditCard, Car, Home, Briefcase } from "lucide-react"
import Link from "next/link"

interface Category {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  reward: number
  timeEstimate: string
  popular: boolean
}

const categories: Category[] = [
  {
    id: 'beauty',
    name: 'Beauty & Personal Care',
    description: 'Skincare routines, makeup preferences, personal grooming habits',
    icon: <Sparkles className="w-6 h-6" />,
    reward: 25,
    timeEstimate: '20-25 min',
    popular: true
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    description: 'Fitness habits, health concerns, wellness practices, medical preferences',
    icon: <Heart className="w-6 h-6" />,
    reward: 30,
    timeEstimate: '25-30 min',
    popular: true
  },
  {
    id: 'fitness',
    name: 'Fitness & Exercise',
    description: 'Workout routines, gym preferences, sports activities, fitness goals',
    icon: <Dumbbell className="w-6 h-6" />,
    reward: 25,
    timeEstimate: '20-25 min',
    popular: false
  },
  {
    id: 'finance',
    name: 'Personal Finance',
    description: 'Spending habits, investment preferences, financial goals, banking',
    icon: <CreditCard className="w-6 h-6" />,
    reward: 35,
    timeEstimate: '30-35 min',
    popular: true
  },
  {
    id: 'automotive',
    name: 'Automotive',
    description: 'Car preferences, driving habits, maintenance practices, transportation',
    icon: <Car className="w-6 h-6" />,
    reward: 20,
    timeEstimate: '15-20 min',
    popular: false
  },
  {
    id: 'home',
    name: 'Home & Living',
    description: 'Interior design, home improvement, household products, living preferences',
    icon: <Home className="w-6 h-6" />,
    reward: 25,
    timeEstimate: '20-25 min',
    popular: false
  },
  {
    id: 'career',
    name: 'Career & Professional',
    description: 'Work preferences, career goals, professional development, workplace culture',
    icon: <Briefcase className="w-6 h-6" />,
    reward: 30,
    timeEstimate: '25-30 min',
    popular: false
  }
]

export default function Categories() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const totalReward = selectedCategories.reduce((sum, categoryId) => {
    const category = categories.find(c => c.id === categoryId)
    return sum + (category?.reward || 0)
  }, 0)

  const handleContinue = () => {
    if (selectedCategories.length > 0) {
      // Save selected categories and proceed to first deep dive
      console.log('Selected categories:', selectedCategories)
      window.location.href = `/deep-dive/${selectedCategories[0]}`
    }
  }

  const handleSkip = () => {
    // Skip category selection and go to dashboard
    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">Pai</span>
        </Link>
        <div className="text-sm text-gray-600">
          Step 3 of 4
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Categories
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Select categories you'd like to explore in-depth. Each category includes a detailed interview and earns you rewards.
          </p>
          {selectedCategories.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
              <p className="text-green-700 font-medium">
                You'll earn ${totalReward} for completing {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'}
              </p>
            </div>
          )}
        </div>

        {/* Popular Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded mr-3">POPULAR</span>
            Most Requested Categories
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.filter(c => c.popular).map((category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all ${
                  selectedCategories.includes(category.id)
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'hover:shadow-md hover:border-blue-300'
                }`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedCategories.includes(category.id)
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedCategories.includes(category.id) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {category.timeEstimate}
                      </div>
                      <div className="flex items-center text-green-600 font-medium">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ${category.reward}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Other Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Other Categories</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.filter(c => !c.popular).map((category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all ${
                  selectedCategories.includes(category.id)
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'hover:shadow-md hover:border-blue-300'
                }`}
                onClick={() => handleCategoryToggle(category.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                        {category.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedCategories.includes(category.id)
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedCategories.includes(category.id) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-sm">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {category.timeEstimate}
                      </div>
                      <div className="flex items-center text-green-600 font-medium">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ${category.reward}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Information Box */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">How Deep Dives Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-blue-800">
              <p>• Each category includes a 15-30 minute interview with detailed questions about your preferences and behaviors</p>
              <p>• You can complete them at your own pace - start one now or save for later</p>
              <p>• The more categories you complete, the more accurate your digital twin becomes</p>
              <p>• You'll receive monthly follow-up surveys to keep your data fresh and earn ongoing rewards</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleSkip}>
            Skip for Now
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={selectedCategories.length === 0}
            className="min-w-[160px]"
          >
            {selectedCategories.length > 0 
              ? `Start Deep Dive${selectedCategories.length > 1 ? 's' : ''}`
              : 'Select Categories'
            }
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          You can always add more categories later from your dashboard
        </div>
      </div>
    </div>
  )
}