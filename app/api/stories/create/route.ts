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
    // Log for debugging
    console.log('Checking access for user:', user.id, 'email:', user.email)
    
    let access
    try {
      access = await checkUserAccess(user.id)
      console.log('Access check result:', access)
    } catch (error: any) {
      console.error('Error in checkUserAccess:', error)
      // If regular check fails, try service role fallback
      if (error.message?.includes('schema') || error.code === 'PGRST106') {
        const { checkUserAccessWithServiceRole } = await import('@/lib/payments-service')
        access = await checkUserAccessWithServiceRole(user.id, user.email || '')
        console.log('Fallback access check result:', access)
      } else {
        return NextResponse.json(
          { error: 'Unable to verify access. Please try again or contact support.' },
          { status: 500 }
        )
      }
    }
    
    if (!access.hasAccess) {
      return NextResponse.json(
        { error: access.reason || 'No access available. Please purchase a story or subscribe.' },
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

    // Auto-generate and save character profile for TaleWeave Academy
    try {
      const firstPageImage = pagesWithImages[0]?.imageUrl || null
      const voiceId = 'Rachel' // The voice used for narration

      // Extract character appearance and personality from the story using AI
      const characterPrompt = `Based on this children's story, extract the main character's details:
      
Story: ${storyText.substring(0, 1000)}

The main character is ${childName}, age ${age}. Extract and provide:
1. Appearance: Physical description (hair color, clothing, distinctive features)
2. Personality: Character traits, behaviors, interests (from: ${interests})

Respond in JSON format:
{
  "appearance": "description here",
  "personality": "traits here"
}`

      const characterCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a character profile extractor. Extract character details from stories and return only valid JSON.',
          },
          {
            role: 'user',
            content: characterPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      })

      let appearance = `A ${age}-year-old child`
      let personality = interests

      try {
        const characterData = JSON.parse(characterCompletion.choices[0].message.content || '{}')
        if (characterData.appearance) {
          appearance = characterData.appearance
        }
        if (characterData.personality) {
          personality = characterData.personality
        }
      } catch (parseError) {
        console.error('Error parsing character data:', parseError)
        // Use fallback values already set above
      }

      // Get the first page image URL from Supabase if available
      let characterImageUrl = firstPageImage
      if (firstPageImage && pageRecords && pageRecords[0]?.image_url) {
        characterImageUrl = pageRecords[0].image_url
      }

      // Save character to database
      const { error: characterError } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
          story_id: story.id,
          name: childName,
          age: parseInt(age),
          appearance,
          personality,
          image_url: characterImageUrl,
          voice_id: voiceId,
        })

      if (characterError) {
        console.error('Error saving character:', characterError)
        // Don't fail the story creation if character save fails
      } else {
        console.log('Character profile saved successfully for:', childName)
      }
    } catch (characterError) {
      console.error('Error generating character profile:', characterError)
      // Don't fail the story creation if character generation fails
    }

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

