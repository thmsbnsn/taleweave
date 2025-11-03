import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username, password, displayName } = await request.json()

    // Validate input
    if (!username || !password || !displayName) {
      return NextResponse.json(
        { error: 'Username, password, and display name are required' },
        { status: 400 }
      )
    }

    // Check username availability
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken. Please choose another.' },
        { status: 400 }
      )
    }

    // Generate unique email for child (Supabase requires email)
    // Format: username+parent_id@taleweave.internal
    const childEmail = `${username.toLowerCase()}+${user.id}@taleweave.internal`

    // Create child account in Supabase Auth using service role
    // We need to use admin API which requires service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error. Please contact support.' },
        { status: 500 }
      )
    }

    // Create admin client for user creation
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: childEmail,
      password,
      email_confirm: true, // Auto-confirm since it's a system email
      user_metadata: {
        username: username.toLowerCase(),
        display_name: displayName,
        is_child: true,
        parent_id: user.id,
      },
    })

    if (authError) {
      console.error('Error creating child auth:', authError)
      return NextResponse.json(
        { error: 'Failed to create child account. Please try again.' },
        { status: 500 }
      )
    }

    // Create user record in public.users table
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: childEmail,
        is_child: true,
        username: username.toLowerCase(),
        display_name: displayName,
        parent_id: user.id,
        subscription_active: false, // Children inherit parent's subscription
      })
      .select()
      .single()

    if (userError) {
      // If user record creation fails, try to clean up auth user
      console.error('Error creating user record:', userError)
      // Note: Admin API would be needed to delete, but we'll log it
      return NextResponse.json(
        { error: 'Failed to create child profile. Please contact support.' },
        { status: 500 }
      )
    }

    // The trigger should auto-create parent_children link, but let's ensure it
    const { error: linkError } = await supabase
      .from('parent_children')
      .insert({
        parent_id: user.id,
        child_id: authData.user.id,
        relationship_type: 'parent',
        status: 'active',
      })
      .select()
      .single()

    // Link error is non-critical (trigger might have created it)
    if (linkError && !linkError.message.includes('duplicate')) {
      console.warn('Warning: Could not create parent_children link:', linkError)
    }

    // Get parent email for notification
    const { data: parentData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    // Send confirmation email to parent
    try {
      const { sendChildAccountCreated } = await import('@/lib/email')
      if (parentData?.email) {
        await sendChildAccountCreated({
          to: parentData.email,
          childName: displayName,
          username: username.toLowerCase(),
        })
      }
    } catch (emailError) {
      console.error('Error sending child account email:', emailError)
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      child: {
        id: authData.user.id,
        username: username.toLowerCase(),
        display_name: displayName,
      },
      message: 'Child account created successfully!',
    })
  } catch (error: any) {
    console.error('Error creating child account:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create child account' },
      { status: 500 }
    )
  }
}

