import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import jsPDF from 'jspdf'

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

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [210, 297], // A4 landscape
    })

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) {
        pdf.addPage()
      }

      const page = pages[i]

      // Add image if available
      if (page.image_url) {
        try {
          const imageResponse = await fetch(page.image_url)
          const imageBlob = await imageResponse.blob()
          const imageUrl = URL.createObjectURL(imageBlob)

          // Add image (scaled to fit)
          pdf.addImage(imageUrl, 'PNG', 10, 10, 190, 120)
          URL.revokeObjectURL(imageUrl)
        } catch (error) {
          console.error('Error adding image to PDF:', error)
        }
      }

      // Add text
      pdf.setFontSize(12)
      pdf.text(page.text || '', 10, 140, {
        maxWidth: 190,
        align: 'left',
      })
    }

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${story.child_name}_story.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('PDF export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

