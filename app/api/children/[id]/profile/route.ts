import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const childId = params.id

    // Verify parent has access
    const { data: parentLink } = await supabase
      .from('parent_children')
      .select('*')
      .eq('parent_id', user.id)
      .eq('child_id', childId)
      .eq('status', 'active')
      .single()

    if (!parentLink) {
      return NextResponse.json(
        { error: 'You do not have access to this child profile' },
        { status: 403 }
      )
    }

    // Get child profile
    const { data: childProfile } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url, favorite_color, preferences')
      .eq('id', childId)
      .single()

    // Get child preferences
    const { data: preferences } = await supabase
      .from('child_preferences')
      .select('*')
      .eq('child_id', childId)
      .single()

    return NextResponse.json({
      profile: childProfile,
      preferences: preferences || null,
    })
  } catch (error: any) {
    console.error('Error fetching child profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const childId = params.id
    const body = await request.json()

    // Verify parent has access and can manage
    const { data: parentLink } = await supabase
      .from('parent_children')
      .select('*')
      .eq('parent_id', user.id)
      .eq('child_id', childId)
      .eq('status', 'active')
      .single()

    if (!parentLink) {
      return NextResponse.json(
        { error: 'You do not have access to this child profile' },
        { status: 403 }
      )
    }

    // Check permission (guardian might not have can_manage_characters)
    const canManage = parentLink.role === 'primary_parent' || 
                     (parentLink.permissions as any)?.can_manage_characters !== false

    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to update this profile' },
        { status: 403 }
      )
    }

    // Update user profile
    const updateData: any = {}
    if (body.display_name !== undefined) updateData.display_name = body.display_name
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url
    if (body.favorite_color !== undefined) updateData.favorite_color = body.favorite_color
    if (body.preferences !== undefined) updateData.preferences = body.preferences

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', childId)

      if (updateError) {
        throw updateError
      }
    }

    // Update or create preferences
    if (body.child_preferences) {
      const { error: prefError } = await supabase
        .from('child_preferences')
        .upsert({
          child_id: childId,
          ...body.child_preferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'child_id',
        })

      if (prefError) {
        console.error('Error updating preferences:', prefError)
        // Non-critical, continue
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating child profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}

