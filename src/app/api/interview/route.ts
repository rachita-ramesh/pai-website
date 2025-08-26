import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { participant_name, questionnaire_id } = body

    if (!participant_name || !questionnaire_id) {
      return NextResponse.json(
        { error: 'participant_name and questionnaire_id are required' },
        { status: 400 }
      )
    }

    console.log('Interview API: Starting interview for:', participant_name, 'with questionnaire:', questionnaire_id)

    // Try to call Python interview API if available
    try {
      const pythonApiUrl = process.env.PYTHON_INTERVIEW_API_URL || 'http://localhost:8001/python-api/interview'
      
      const pythonResponse = await fetch(pythonApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant_name,
          questionnaire_id
        })
      })

      if (pythonResponse.ok) {
        const pythonData = await pythonResponse.json()
        console.log('Python interview API success')
        return NextResponse.json(pythonData)
      } else {
        console.warn('Python interview API failed with status:', pythonResponse.status)
        const errorText = await pythonResponse.text()
        console.warn('Python interview API error:', errorText)
      }
    } catch (pythonError) {
      console.warn('Python interview API error:', pythonError)
    }

    // Fallback to mock response for now
    console.log('Using fallback mock interview response')
    
    const mockSessionId = `interview_${Date.now()}_${participant_name}_${questionnaire_id}`
    const mockResponse = {
      session_id: mockSessionId,
      messages: [
        {
          id: '1',
          type: 'ai',
          content: `Hi ${participant_name}! I'm excited to learn more about you. Let's start with something simple - can you tell me a bit about yourself and what you do?`,
          timestamp: new Date().toISOString()
        }
      ],
      questionnaire_id,
      participant_name,
      status: 'active'
    }
    
    return NextResponse.json(mockResponse)

  } catch (error) {
    console.error('Interview API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Interview API ready',
    timestamp: new Date().toISOString()
  })
}