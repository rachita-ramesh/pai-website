import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Fetch surveys from Supabase survey_templates table
    const supabaseUrl = process.env.SUPABASE_URL || 'https://bbxqbozcdpdymuduyuel.supabase.co'
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieHFib3pjZHBkeW11ZHV5dWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTYzMTksImV4cCI6MjA3MDc3MjMxOX0.1yb1u_BUjlQ2-bQ8B0S50LUG2iH0ANntcPnxNvJFd40'
    
    const response = await fetch(`${supabaseUrl}/rest/v1/survey_templates?select=*&order=created_at.desc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`)
    }

    const surveyTemplates = await response.json()
    
    // Transform to match what the frontend expects
    const surveys = surveyTemplates.map((template: Record<string, unknown>) => ({
      survey_name: template.survey_name as string,
      survey_title: template.title as string || template.survey_name as string,
      description: template.description as string || '',
      target_accuracy: (template.target_accuracy as number) || 0.6,
      questions: template.questions as unknown[] || []
    }))

    return NextResponse.json({
      status: 'success',
      surveys: surveys,
      total_surveys: surveys.length
    })

  } catch (error) {
    console.error('Surveys API error:', error)
    
    // Fallback to mock surveys if database is unavailable
    const fallbackSurveys = [
      {
        survey_name: "validation_survey_1",
        survey_title: "Skincare Attitudes & Usage Validation Study",
        description: "Comprehensive validation questions to test digital twin accuracy in predicting skincare behaviors and attitudes",
        target_accuracy: 0.6,
        questions: []
      }
    ]

    return NextResponse.json({
      status: 'fallback',
      surveys: fallbackSurveys,
      total_surveys: fallbackSurveys.length,
      error: 'Using fallback data - database unavailable'
    })
  }
}