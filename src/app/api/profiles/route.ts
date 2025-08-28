import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const personName = searchParams.get('person_name')
    
    console.log('DEBUG: Profiles API called with person_name:', personName)
    
    if (!personName) {
      return NextResponse.json({ error: 'person_name parameter is required' }, { status: 400 })
    }
    // Use Supabase client with case-insensitive search
    console.log('DEBUG: Querying for profiles with ilike:', personName)
    
    const { data: profiles, error } = await supabase
      .from('profile_versions')
      .select('*')
      .ilike('person_name', personName)
      .order('version_number', { ascending: false })

    console.log('DEBUG: Supabase query result - profiles:', profiles?.length, 'error:', error)

    if (error) {
      console.error('DEBUG: Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    return NextResponse.json(profiles || [])

  } catch (error: unknown) {
    console.error('Profiles API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}