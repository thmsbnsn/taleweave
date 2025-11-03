import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import EPub from 'epub-gen'

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

    const storyId = params.id

    // Fetch story with pages
    const { data: story, error } = await supabase
      .from('stories')
      .select('*, story_pages(*)')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single()

    if (error || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    const pages = story.story_pages.sort((a: any, b: any) => a.page_number - b.page_number)

    // Create content array for ePub
    const content = pages.map((page: any) => ({
      title: `Page ${page.page_number}`,
      data: `
        <div style="text-align: center; margin: 20px 0;">
          ${page.image_url ? `<img src="${page.image_url}" alt="Page ${page.page_number}" style="max-width: 100%; height: auto;" />` : ''}
        </div>
        <div style="padding: 20px; font-size: 16px; line-height: 1.6;">
          ${(page.text || '').split('\n').filter((p: string) => p.trim()).map((para: string) => `<p>${para}</p>`).join('')}
        </div>
      `,
    }))

    // Generate ePub
    const epubOptions = {
      title: `${story.child_name}'s Story`,
      author: 'Tale Weave',
      description: `A custom story for ${story.child_name}`,
      content,
    }

    // Use epub-gen to generate buffer
    return new Promise<NextResponse>((resolve, reject) => {
      const epub = new EPub(epubOptions)
      const chunks: Buffer[] = []

      epub.on('end', () => {
        const epubBuffer = Buffer.concat(chunks)
        resolve(
          new NextResponse(epubBuffer, {
            headers: {
              'Content-Type': 'application/epub+zip',
              'Content-Disposition': `attachment; filename="${story.child_name.replace(/\s+/g, '_')}_story.epub"`,
            },
          })
        )
      })

      epub.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })

      epub.on('error', (error: Error) => {
        reject(error)
      })
    })
  } catch (error: any) {
    console.error('ePub export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

