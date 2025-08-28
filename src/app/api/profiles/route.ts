import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const personName = searchParams.get('person_name')
    
    console.log('DEBUG: Profiles API called with person_name:', personName)
    
    if (!personName) {
      return NextResponse.json({ error: 'person_name parameter is required' }, { status: 400 })
    }

    // Make direct request to Supabase
    const supabaseUrl = process.env.SUPABASE_URL || 'https://bbxqbozcdpdymuduyuel.supabase.co'
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieHFib3pjZHBkeW11ZHV5dWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTYzMTksImV4cCI6MjA3MDc3MjMxOX0.1yb1u_BUjlQ2-bQ8B0S50LUG2iH0ANntcPnxNvJFd40'
    
    // Try both exact case and lowercase to handle case sensitivity issues
    const url = `${supabaseUrl}/rest/v1/profile_versions?person_name=ilike.${encodeURIComponent(personName)}&order=version_number.desc`
    console.log('DEBUG: First trying exact case query:', url)
    
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('DEBUG: Supabase response status:', response.status)

    if (response.ok) {
      const profiles = await response.json()
      console.log('DEBUG: Found profiles:', profiles.length)
      
      // If no profiles found, try lowercase version
      if (profiles.length === 0 && personName !== personName.toLowerCase()) {
        const lowercaseUrl = `${supabaseUrl}/rest/v1/profile_versions?person_name=ilike.${encodeURIComponent(personName.toLowerCase())}&order=version_number.desc`
        console.log('DEBUG: Trying lowercase query:', lowercaseUrl)
        
        const lowercaseResponse = await fetch(lowercaseUrl, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (lowercaseResponse.ok) {
          const lowercaseProfiles = await lowercaseResponse.json()
          console.log('DEBUG: Found profiles with lowercase:', lowercaseProfiles.length)
          return NextResponse.json(lowercaseProfiles)
        }
      }
      
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