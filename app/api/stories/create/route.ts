import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUserAccess } from '@/lib/payments'
import OpenAI from 'openai'
import Replicate from 'replicate'
import { ElevenLabsClient } from 'elevenlabs'

// Initialize clients only when needed (not at module level)
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

function getReplicateClient() {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('REPLICATE_API_TOKEN is not configured')
  }
  return new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  })
}

function getElevenLabsClient() {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured')
  }
  return new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access (subscription or credits)
    const access = await checkUserAccess(user.id)
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.reason || 'No access' },
        { status: 403 }
      )
    }

    const { childName, age, interests } = await request.json()

    // Initialize clients
    const openai = getOpenAIClient()
    const replicate = getReplicateClient()
    const elevenlabs = getElevenLabsClient()

    // Generate story text using OpenAI
    const storyPrompt = `Create a delightful, age-appropriate children's story for a ${age}-year-old child named ${childName}. 
    The story should incorporate their interests: ${interests}. 
    Make it engaging, positive, and magical. Include ${childName} as the main character.
    Format the story with clear paragraphs for each page (aim for 5-7 pages).`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a children\'s story writer. Create engaging, age-appropriate stories that are magical and educational.',
        },
        {
          role: 'user',
          content: storyPrompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 2000,
    })

    const storyText = completion.choices[0].message.content || ''
    
    // Split story into pages
    const pages = storyText.split(/\n\n+/).filter(page => page.trim().length > 0)

    // Create story record in database
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        child_name: childName,
        age: parseInt(age),
        interests,
        story_text: storyText,
        status: 'generating',
      })
      .select()
      .single()

    if (storyError) {
      return NextResponse.json({ error: storyError.message }, { status: 500 })
    }

    // Generate images for each page
    const imagePromises = pages.map(async (pageText, index) => {
      const imagePrompt = `Children's book illustration, ${pageText.substring(0, 200)}, colorful, whimsical, kid-friendly, digital art`
      
      try {
        const replicateClient = getReplicateClient()
        const output = await replicateClient.run(
          'black-forest-labs/flux-schnell',
          {
            input: {
              prompt: imagePrompt,
              num_outputs: 1,
              aspect_ratio: '16:9',
            },
          }
        ) as string[]

        return {
          pageNumber: index + 1,
          imageUrl: output[0],
          text: pageText,
        }
      } catch (error) {
        console.error(`Error generating image for page ${index + 1}:`, error)
        return {
          pageNumber: index + 1,
          imageUrl: null,
          text: pageText,
        }
      }
    })

    const pagesWithImages = await Promise.all(imagePromises)

    // Upload images to Supabase storage and create page records
    const pageRecords = await Promise.all(
      pagesWithImages.map(async (page, index) => {
        let imagePath = null

        if (page.imageUrl) {
          try {
            // Download image
            const imageResponse = await fetch(page.imageUrl)
            const imageBlob = await imageResponse.blob()
            const arrayBuffer = await imageBlob.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // Upload to Supabase storage
            const fileName = `${story.id}/page-${index + 1}.png`
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('story-images')
              .upload(fileName, buffer, {
                contentType: 'image/png',
                upsert: true,
              })

            if (!uploadError && uploadData) {
              const { data: { publicUrl } } = supabase.storage
                .from('story-images')
                .getPublicUrl(fileName)

              imagePath = publicUrl
            }
          } catch (error) {
            console.error(`Error uploading image for page ${index + 1}:`, error)
          }
        }

        // Create page record
        const { data: pageRecord } = await supabase
          .from('story_pages')
          .insert({
            story_id: story.id,
            page_number: page.pageNumber,
            text: page.text,
            image_url: imagePath,
          })
          .select()
          .single()

        return pageRecord
      })
    )

    // Generate audio narration using ElevenLabs
    let audioUrl = null
    try {
      const elevenlabsClient = getElevenLabsClient()
      const audio = await elevenlabsClient.generate({
        voice: 'Rachel', // Child-friendly voice
        text: storyText,
        model_id: 'eleven_multilingual_v2',
      })

      // Convert audio stream to buffer and upload to Supabase
      const chunks: Uint8Array[] = []
      for await (const chunk of audio) {
        chunks.push(chunk)
      }
      const audioBuffer = Buffer.concat(chunks)

      const audioFileName = `${story.id}/narration.mp3`
      const { data: audioUploadData, error: audioUploadError } = await supabase.storage
        .from('story-audio')
        .upload(audioFileName, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        })

      if (!audioUploadError && audioUploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('story-audio')
          .getPublicUrl(audioFileName)

        audioUrl = publicUrl
      }
    } catch (error) {
      console.error('Error generating audio:', error)
    }

    // Update story with audio URL and mark as complete
    await supabase
      .from('stories')
      .update({
        audio_url: audioUrl,
        status: 'completed',
      })
      .eq('id', story.id)

    return NextResponse.json({ 
      storyId: story.id,
      message: 'Story created successfully'
    })
  } catch (error: any) {
    console.error('Error creating story:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create story' },
      { status: 500 }
    )
  }
}

