import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const personName = searchParams.get('person_name')
    
    if (!personName) {
      return NextResponse.json({ error: 'person_name parameter is required' }, { status: 400 })
    }

    // Make direct request to Supabase
    const supabaseUrl = process.env.SUPABASE_URL || 'https://bbxqbozcdpdymuduyuel.supabase.co'
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieHFib3pjZHBkeW11ZHV5dWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTYzMTksImV4cCI6MjA3MDc3MjMxOX0.1yb1u_BUjlQ2-bQ8B0S50LUG2iH0ANntcPnxNvJFd40'
    
    const response = await fetch(`${supabaseUrl}/rest/v1/profile_versions?person_name=ilike.${encodeURIComponent(personName)}&order=version_number.desc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`)
    }

    const profiles = await response.json()
    
    // Transform the data to match frontend expectations
    const transformedProfiles = profiles.map((profile: any) => ({
      profile_id: profile.profile_id,
      is_active: profile.is_active || false,
      created_at: profile.created_at,
      completeness_metadata: profile.completeness_metadata || {}
    }))

    return NextResponse.json(transformedProfiles)
    
  } catch (error) {
    console.error('Error fetching profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profiles' }, 
      { status: 500 }
    )
  }
}