import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profile_id, message } = body

    if (!profile_id || !message) {
      return NextResponse.json(
        { error: 'profile_id and message are required' },
        { status: 400 }
      )
    }

    console.log('Chat API: Received request for profile:', profile_id)

    // Try to call Python chat API if available
    try {
      const pythonApiUrl = process.env.PYTHON_CHAT_API_URL || 'http://localhost:8001/python-api/chat'
      
      const pythonResponse = await fetch(pythonApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_id,
          message
        })
      })

      if (pythonResponse.ok) {
        const pythonData = await pythonResponse.json()
        console.log('Python API success')
        return NextResponse.json(pythonData)
      } else {
        console.warn('Python API failed with status:', pythonResponse.status)
      }
    } catch (pythonError) {
      console.warn('Python API error:', pythonError)
    }

    // Fallback to mock response based on profile
    console.log('Using fallback mock response')
    
    // Generate a realistic response based on the profile and message
    const mockResponse = generateMockChatResponse(profile_id, message)
    
    return NextResponse.json({
      response: mockResponse,
      source: 'mock_fallback'
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateMockChatResponse(profileId: string, message: string): string {
  // Simple keyword-based responses for different topics
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('skincare') || lowerMessage.includes('routine')) {
    return `As someone who values evidence-based skincare, I'd say consistency is key. I personally use a simple routine with cleanser, moisturizer, and sunscreen daily. The most important thing is finding products that work for your specific skin type and sticking with them long enough to see results.`
  }
  
  if (lowerMessage.includes('health') || lowerMessage.includes('wellness')) {
    return `I believe in a holistic approach to health - it's not just about one thing, but how everything connects. Good sleep, regular movement, nutrition that feels sustainable, and managing stress all play important roles. What matters most is finding what works for your lifestyle.`
  }
  
  if (lowerMessage.includes('decision') || lowerMessage.includes('choose')) {
    return `When I'm making decisions, I like to gather information first, but I don't get stuck in analysis paralysis. I consider both the practical aspects and how I feel about it. Sometimes the best choice becomes clear when you think about what you'll regret not trying.`
  }
  
  if (lowerMessage.includes('work') || lowerMessage.includes('career')) {
    return `I think finding meaning in your work is really important, whether that's through the impact you have, the people you work with, or the skills you're developing. It's also okay for work to just be one part of your life rather than your entire identity.`
  }
  
  // Default response
  return `That's an interesting question! I think it really depends on the specific context and what matters most to you. What's your take on it? I'd love to hear your perspective - it might help me think about it in a new way.`
}

export async function GET() {
  return NextResponse.json({
    status: 'Chat API ready',
    timestamp: new Date().toISOString()
  })
}