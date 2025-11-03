import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find child user by username
    const { data: childUser, error: findError } = await supabase
      .from('users')
      .select('id, email, username, is_child')
      .eq('username', username.toLowerCase())
      .eq('is_child', true)
      .single()

    if (findError || !childUser) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    // Login with the system-generated email
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: childUser.email,
      password,
    })

    if (authError) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: authData.user,
      message: 'Login successful!',
    })
  } catch (error: any) {
    console.error('Child login error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to login' },
      { status: 500 }
    )
  }
}

