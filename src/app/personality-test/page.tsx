'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, ArrowRight, CheckCircle, RotateCcw } from "lucide-react"
import Link from "next/link"

interface Question {
  id: number
  text: string
  options: { value: number; label: string }[]
}

const questions: Question[] = [
  {
    id: 1,
    text: "I enjoy meeting new people and being in social situations.",
    options: [
      { value: 1, label: "Strongly Disagree" },
      { value: 2, label: "Disagree" },
      { value: 3, label: "Neutral" },
      { value: 4, label: "Agree" },
      { value: 5, label: "Strongly Agree" }
    ]
  },
  {
    id: 2,
    text: "I prefer to plan things ahead rather than be spontaneous.",
    options: [
      { value: 1, label: "Strongly Disagree" },
      { value: 2, label: "Disagree" },
      { value: 3, label: "Neutral" },
      { value: 4, label: "Agree" },
      { value: 5, label: "Strongly Agree" }
    ]
  },
  {
    id: 3,
    text: "I often think about how my actions affect others.",
    options: [
      { value: 1, label: "Strongly Disagree" },
      { value: 2, label: "Disagree" },
      { value: 3, label: "Neutral" },
      { value: 4, label: "Agree" },
      { value: 5, label: "Strongly Agree" }
    ]
  },
  {
    id: 4,
    text: "I'm comfortable taking risks when I see potential benefits.",
    options: [
      { value: 1, label: "Strongly Disagree" },
      { value: 2, label: "Disagree" },
      { value: 3, label: "Neutral" },
      { value: 4, label: "Agree" },
      { value: 5, label: "Strongly Agree" }
    ]
  },
  {
    id: 5,
    text: "I value experiences more than material possessions.",
    options: [
      { value: 1, label: "Strongly Disagree" },
      { value: 2, label: "Disagree" },
      { value: 3, label: "Neutral" },
      { value: 4, label: "Agree" },
      { value: 5, label: "Strongly Agree" }
    ]
  },
  {
    id: 6,
    text: "I tend to research products thoroughly before making purchases.",
    options: [
      { value: 1, label: "Strongly Disagree" },
      { value: 2, label: "Disagree" },
      { value: 3, label: "Neutral" },
      { value: 4, label: "Agree" },
      { value: 5, label: "Strongly Agree" }
    ]
  },
  {
    id: 7,
    text: "I'm influenced by what others think about my choices.",
    options: [
      { value: 1, label: "Strongly Disagree" },
      { value: 2, label: "Disagree" },
      { value: 3, label: "Neutral" },
      { value: 4, label: "Agree" },
      { value: 5, label: "Strongly Agree" }
    ]
  },
  {
    id: 8,
    text: "I'm optimistic about the future.",
    options: [
      { value: 1, label: "Strongly Disagree" },
      { value: 2, label: "Disagree" },
      { value: 3, label: "Neutral" },
      { value: 4, label: "Agree" },
      { value: 5, label: "Strongly Agree" }
    ]
  }
]

export default function PersonalityTest() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [isComplete, setIsComplete] = useState(false)

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setIsComplete(true)
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const restartTest = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setIsComplete(false)
  }

  const handleComplete = () => {
    // Process personality test results
    console.log('Personality test answers:', answers)
    // Redirect to category selection
    window.location.href = '/categories'
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Pai</span>
          </Link>
        </nav>

        <div className="max-w-2xl mx-auto px-6 py-12 text-center">
          <Card>
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Personality Assessment Complete!</CardTitle>
              <CardDescription>
                Thank you for completing the personality test. Your responses help us create a more accurate digital twin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Your Personality Insights</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Social Orientation</p>
                    <p className="text-gray-600">Moderately Extroverted</p>
                  </div>
                  <div>
                    <p className="font-medium">Planning Style</p>
                    <p className="text-gray-600">Structured Approach</p>
                  </div>
                  <div>
                    <p className="font-medium">Decision Making</p>
                    <p className="text-gray-600">Research-Oriented</p>
                  </div>
                  <div>
                    <p className="font-medium">Risk Tolerance</p>
                    <p className="text-gray-600">Calculated Risk-Taker</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold">What's Next?</h3>
                <p className="text-gray-600 text-left">
                  Now you can choose specific categories (like beauty, fitness, or finance) to deepen your digital twin. 
                  Each category includes a 15-30 minute interview and comes with additional rewards!
                </p>
              </div>

              <div className="flex space-x-3">
                <Button onClick={restartTest} variant="outline">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retake Test
                </Button>
                <Button onClick={handleComplete} className="flex-1">
                  Continue to Categories <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">Pai</span>
        </Link>
        <div className="text-sm text-gray-600">
          Question {currentQuestion + 1} of {questions.length}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Personality Assessment</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {question.text}
            </CardTitle>
            <CardDescription>
              Select the option that best describes you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {question.options.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    answers[question.id] === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.value}
                    checked={answers[question.id] === option.value}
                    onChange={() => handleAnswer(question.id, option.value)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                    answers[question.id] === option.value
                      ? 'border-blue-600'
                      : 'border-gray-300'
                  }`}>
                    {answers[question.id] === option.value && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              {currentQuestion > 0 && (
                <Button type="button" variant="outline" onClick={prevQuestion}>
                  Previous
                </Button>
              )}
              <Button 
                type="button" 
                onClick={nextQuestion}
                disabled={!answers[question.id]}
                className="ml-auto"
              >
                {currentQuestion === questions.length - 1 ? 'Complete' : 'Next'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          Your responses are used to create an accurate digital representation and are kept completely private.
        </div>
      </div>
    </div>
  )
}