import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const personName = searchParams.get('person_name')
    
    console.log('DEBUG: Profiles API called with person_name:', personName)
    
    if (!personName) {
      return NextResponse.json({ error: 'person_name parameter is required' }, { status: 400 })
    }

    // Make direct request to Supabase - using hardcoded values since env vars are not working
    const supabaseUrl = 'https://bbxqbozcdpdymuduyuel.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieHFib3pjZHBkeW11ZHV5dWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTYzMTksImV4cCI6MjA3MDc3MjMxOX0.1yb1u_BUjlQ2-bQ8B0S50LUG2iH0ANntcPnxNvJFd40'
    
    // Try case-insensitive query
    const url = `${supabaseUrl}/rest/v1/profile_versions?person_name=ilike.${encodeURIComponent(personName)}&order=version_number.desc`
    console.log('DEBUG: Querying:', url)
    
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('DEBUG: Response status:', response.status)

    if (response.ok) {
      const profiles = await response.json()
      console.log('DEBUG: Found profiles:', profiles.length)
      return NextResponse.json(profiles)
    } else {
      const errorText = await response.text()
      console.error('DEBUG: Supabase error:', errorText)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }
  } catch (error) {
    console.error('Profiles API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}