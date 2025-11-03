import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Please login first to accept the invitation' },
        { status: 401 }
      )
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Find invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('parent_invitations')
      .select('*')
      .eq('invitation_token', token)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Check if invitation is already accepted
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'This invitation has already been processed' },
        { status: 400 }
      )
    }

    // Verify email matches (optional - could allow any logged-in user)
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    if (userData?.email.toLowerCase() !== invitation.invited_email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      )
    }

    // Create parent_children link with co_parent role and default permissions
    const { error: linkError } = await supabase
      .from('parent_children')
      .insert({
        parent_id: user.id,
        child_id: invitation.child_id,
        relationship_type: 'co_parent',
        role: 'co_parent',
        invited_by: invitation.inviter_id,
        permissions: {
          can_manage_access: true,
          can_create_stories: true,
          can_view_progress: true,
          can_manage_characters: true,
          can_invite_others: false,
          can_remove_children: false,
        },
        status: 'active',
      })

    if (linkError && !linkError.message.includes('duplicate')) {
      console.error('Error creating parent_children link:', linkError)
      return NextResponse.json(
        { error: 'Failed to link accounts. Please try again.' },
        { status: 500 }
      )
    }

    // Update invitation status
    await supabase
      .from('parent_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted! You can now manage this child account.',
    })
  } catch (error: any) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}

