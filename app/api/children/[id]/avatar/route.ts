import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
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
        { error: 'You do not have access to this child' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase storage
    const fileName = `avatars/${childId}/${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('story-images') // Reuse existing bucket or create 'avatars' bucket
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload avatar' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('story-images')
      .getPublicUrl(fileName)

    // Update user's avatar_url
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', childId)

    if (updateError) {
      console.error('Error updating avatar URL:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      avatar_url: publicUrl,
      message: 'Avatar uploaded successfully',
    })
  } catch (error: any) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

