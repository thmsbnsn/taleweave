import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { childId, invitedEmail } = await request.json()

    if (!childId || !invitedEmail) {
      return NextResponse.json(
        { error: 'Child ID and invited email are required' },
        { status: 400 }
      )
    }

    // Verify parent has access to this child
    const { data: parentLink } = await supabase
      .from('parent_children')
      .select('*')
      .eq('parent_id', user.id)
      .eq('child_id', childId)
      .eq('status', 'active')
      .single()

    if (!parentLink) {
      return NextResponse.json(
        { error: 'You do not have permission to invite parents for this child' },
        { status: 403 }
      )
    }

    // Check if invitation already exists
    const { data: existingInvite } = await supabase
      .from('parent_invitations')
      .select('*')
      .eq('child_id', childId)
      .eq('invited_email', invitedEmail.toLowerCase())
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID() + '-' + Date.now().toString(36)

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('parent_invitations')
      .insert({
        inviter_id: user.id,
        child_id: childId,
        invited_email: invitedEmail.toLowerCase(),
        invitation_token: invitationToken,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json(
        { error: 'Failed to create invitation. Please try again.' },
        { status: 500 }
      )
    }

    // TODO: Send email with invitation link
    // For now, return the invitation link
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/parents/accept-invite?token=${invitationToken}`

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        token: invitationToken,
        link: invitationLink,
        expires_at: invitation.expires_at,
      },
      message: 'Invitation created successfully!',
    })
  } catch (error: any) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create invitation' },
      { status: 500 }
    )
  }
}

