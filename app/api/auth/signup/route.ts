import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { email, password, captchaToken } = await request.json()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        captchaToken: captchaToken || undefined,
      },
    })

    if (error) {
      // Provide more helpful error messages
      let errorMessage = error.message
      
      if (error.message.includes('captcha') || error.message.includes('verification') || error.message.includes('CAPTCHA')) {
        errorMessage = 'CAPTCHA verification failed. Please disable CAPTCHA in Supabase dashboard (Authentication > Providers > Email) or try again.'
      } else if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        errorMessage = 'This email is already registered. Please login instead.'
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password format.'
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    // Success - user created (may need email confirmation depending on settings)
    return NextResponse.json({ 
      user: data.user,
      needsConfirmation: !data.session, // If no session, email confirmation is required
      message: data.session ? 'Account created successfully!' : 'Please check your email to confirm your account.'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sign up' },
      { status: 500 }
    )
  }
}

