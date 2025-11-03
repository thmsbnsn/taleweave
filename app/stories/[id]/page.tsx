'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

interface StoryPage {
  id: string
  page_number: number
  text: string
  image_url: string | null
}

interface Story {
  id: string
  child_name: string
  story_text: string
  audio_url: string | null
  status: string
  story_pages: StoryPage[]
}

export default function StoryViewerPage() {
  const params = useParams()
  const storyId = params.id as string
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [audioPlaying, setAudioPlaying] = useState(false)

  useEffect(() => {
    if (!storyId || storyId === 'undefined') {
      setLoading(false)
      return
    }

    async function fetchStory() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          story_pages (
            id,
            page_number,
            text,
            image_url
          )
        `)
        .eq('id', storyId)
        .single()

      if (!error && data) {
        setStory(data)
        // Sort pages by page_number
        if (data.story_pages) {
          data.story_pages.sort((a: StoryPage, b: StoryPage) => a.page_number - b.page_number)
        }
      } else {
        console.error('Error fetching story:', error)
      }
      setLoading(false)
    }

    fetchStory()
  }, [storyId])

  const handleAudioPlay = () => {
    setAudioPlaying(!audioPlaying)
  }

  const handleExportPDF = async () => {
    window.location.href = `/api/stories/${storyId}/export/pdf`
  }

  const handleExportEPub = async () => {
    window.location.href = `/api/stories/${storyId}/export/epub`
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center">
        <div className="text-center">
          <div className="font-fredoka text-3xl text-coral mb-4">Loading your story...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coral mx-auto"></div>
        </div>
      </main>
    )
  }

  if (!story) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center">
        <div className="text-center">
          <div className="font-fredoka text-3xl text-coral">Story not found</div>
        </div>
      </main>
    )
  }

  const pages = story.story_pages || []
  const currentPageData = pages[currentPage]

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon py-12">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-fredoka text-4xl text-coral">
            {story.child_name}&apos;s Story
          </h1>
          <div className="flex gap-4">
            {story.audio_url && (
              <button
                onClick={handleAudioPlay}
                className="btn-secondary"
              >
                {audioPlaying ? '⏸️ Pause' : '▶️ Play Audio'}
              </button>
            )}
            <button onClick={handleExportPDF} className="btn-primary">
              📄 Export PDF
            </button>
            <button onClick={handleExportEPub} className="btn-secondary">
              📚 Export ePub
            </button>
          </div>
        </div>

        {story.status === 'generating' && (
          <div className="card bg-lemon mb-6">
            <p className="font-nunito text-center">
              Your story is being generated! This may take a few minutes. Please refresh the page.
            </p>
          </div>
        )}

        {currentPageData && (
          <div className="card mb-6">
            <div className="mb-6">
              {currentPageData.image_url && (
                <div className="relative w-full h-96 mb-6 rounded-lg overflow-hidden">
                  <Image
                    src={currentPageData.image_url}
                    alt={`Page ${currentPageData.page_number}`}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div className="prose max-w-none">
                <p className="font-nunito text-lg text-gray-800 leading-relaxed whitespace-pre-line">
                  {currentPageData.text}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="font-nunito text-gray-600">
                Page {currentPage + 1} of {pages.length}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                disabled={currentPage === pages.length - 1}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {story.audio_url && audioPlaying && (
          <div className="card">
            <audio
              src={story.audio_url}
              controls
              autoPlay
              className="w-full"
            />
          </div>
        )}
      </div>
    </main>
  )
}

