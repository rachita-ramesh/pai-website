import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock surveys data that matches what the validation page expects
    const surveys = [
      {
        survey_name: "moisturizer_test",
        survey_title: "Test A&U: Facial Moisturizers",
        description: "Specialized questions focused on facial moisturizer attitudes and usage patterns",
        target_accuracy: 0.6,
        questions: [] // Questions would be loaded separately
      },
      {
        survey_name: "validation_survey_1",
        survey_title: "Skincare Attitudes & Usage Validation Study",
        description: "Comprehensive validation questions to test digital twin accuracy in predicting skincare behaviors and attitudes",
        target_accuracy: 0.6,
        questions: [] // Questions would be loaded separately
      }
    ]

    return NextResponse.json({
      status: 'success',
      surveys: surveys,
      total_surveys: surveys.length
    })

  } catch (error) {
    console.error('Surveys API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}