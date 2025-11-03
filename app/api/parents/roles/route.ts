import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const childId = searchParams.get('childId')

    if (!childId) {
      return NextResponse.json(
        { error: 'Child ID is required' },
        { status: 400 }
      )
    }

    // Get all parents linked to this child with their roles
    const { data: parentLinks } = await supabase
      .from('parent_children')
      .select(`
        id,
        parent_id,
        role,
        relationship_type,
        permissions,
        status,
        users:parent_id (
          id,
          email,
          parent_profiles (
            name
          )
        )
      `)
      .eq('child_id', childId)
      .eq('status', 'active')

    return NextResponse.json({
      parents: parentLinks || [],
    })
  } catch (error: any) {
    console.error('Error fetching parent roles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { linkId, role, permissions } = await request.json()

    if (!linkId) {
      return NextResponse.json(
        { error: 'Link ID is required' },
        { status: 400 }
      )
    }

    // Get the link to verify ownership
    const { data: link } = await supabase
      .from('parent_children')
      .select('child_id, parent_id, role')
      .eq('id', linkId)
      .single()

    if (!link) {
      return NextResponse.json(
        { error: 'Parent-child link not found' },
        { status: 404 }
      )
    }

    // Only primary parent or the link owner can modify roles
    const { data: userLink } = await supabase
      .from('parent_children')
      .select('role')
      .eq('parent_id', user.id)
      .eq('child_id', link.child_id)
      .eq('status', 'active')
      .single()

    const isPrimaryParent = userLink?.role === 'primary_parent'
    const isLinkOwner = link.parent_id === user.id

    if (!isPrimaryParent && !isLinkOwner) {
      return NextResponse.json(
        { error: 'Only primary parent can modify roles' },
        { status: 403 }
      )
    }

    // Prevent changing primary_parent role (or only allow if you're primary)
    if (role === 'primary_parent' && !isPrimaryParent) {
      return NextResponse.json(
        { error: 'Only current primary parent can assign primary parent role' },
        { status: 403 }
      )
    }

    // Update role and permissions
    const updateData: any = {}
    if (role) updateData.role = role
    if (permissions) updateData.permissions = permissions

    const { error: updateError } = await supabase
      .from('parent_children')
      .update(updateData)
      .eq('id', linkId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating parent role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update role' },
      { status: 500 }
    )
  }
}

