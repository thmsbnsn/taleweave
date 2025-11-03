'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Story {
  id: string
  child_name: string
  created_at: string
  status: string
  audio_url: string | null
}

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState<string>('')
  const [subscriptionActive, setSubscriptionActive] = useState(false)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        setUser(authUser)
        
        // Extract first name from email (before @) or use full_name from metadata
        const firstName = authUser.user_metadata?.full_name?.split(' ')[0] || 
                         authUser.user_metadata?.first_name ||
                         authUser.email?.split('@')[0].split('.')[0] || 
                         'there'
        setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1))

        // Check subscription status
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_active')
          .eq('id', authUser.id)
          .single()

        if (userData?.subscription_active) {
          setSubscriptionActive(true)
        }
        // Fetch user's stories for all logged-in users
        fetchUserStories(authUser.id)
      } else {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase])

  async function fetchUserStories(userId: string) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('id, child_name, created_at, status, audio_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!error && data) {
        setStories(data as Story[])
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon">
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Image
            src="/tw-logo.ico"
            alt="Tale Weave Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
          <Link href="/" className="font-fredoka text-2xl text-coral">
            Tale Weave
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="font-nunito text-gray-700">
                Welcome back, {userName}!
              </span>
              <button
                onClick={handleLogout}
                className="font-nunito text-gray-700 hover:text-coral transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-nunito text-gray-700 hover:text-coral transition">
                Log In
              </Link>
              <Link href="/signup" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="font-fredoka text-6xl md:text-7xl text-coral mb-6">
          Create Magical Stories
        </h1>
        <p className="font-nunito text-xl text-gray-700 mb-12 max-w-2xl mx-auto">
          Personalize magical stories for your child with AI-generated text, beautiful images, and audio narration. 
          Watch their face light up as they become the hero of their own tale!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/create" className="btn-primary text-xl px-8 py-4">
            Create Your Story
          </Link>
          {!subscriptionActive && (
            <Link href="/pricing" className="btn-secondary text-xl px-8 py-4">
              View Pricing
            </Link>
          )}
        </div>
      </section>

      {user && !loading && (
        <section className="container mx-auto px-6 py-12">
          <h2 className="font-fredoka text-4xl text-coral mb-8 text-center">
            Your Stories
          </h2>
          {stories.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-nunito text-gray-600 text-lg mb-4">
                You haven&apos;t created any stories yet!
              </p>
              <Link href="/create" className="btn-primary inline-block">
                Create Your First Story
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="font-fredoka text-2xl text-coral mb-3">AI-Generated Stories</h3>
            <p className="font-nunito text-gray-600">
              Custom stories tailored to your child&apos;s name, age, and interests using advanced AI technology.
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="font-fredoka text-2xl text-turquoise mb-3">Beautiful Images</h3>
            <p className="font-nunito text-gray-600">
              Stunning illustrations generated for each story page, bringing the tale to life visually.
            </p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="font-fredoka text-2xl text-lemon mb-3">Audio Narration</h3>
            <p className="font-nunito text-gray-600">
              Professional voice narration that reads the story aloud, perfect for bedtime or car rides.
            </p>
          </div>
        </div>
      </section>

      <footer className="container mx-auto px-6 py-8 border-t border-gray-200">
        <p className="text-center font-nunito text-gray-600">
          © 2024 Tale Weave. All rights reserved.
        </p>
      </footer>
    </main>
  )
}

function StoryCard({ story }: { story: Story }) {
  const router = useRouter()
  const [downloading, setDownloading] = useState(false)

  const handlePlay = () => {
    router.push(`/stories/${story.id}`)
  }

  const handleDownload = async (format: 'pdf' | 'epub') => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/stories/${story.id}/export/${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tale-weave-${story.child_name}-${story.id}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert(`Failed to download ${format.toUpperCase()}`)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('An error occurred while downloading')
    } finally {
      setDownloading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="mb-4">
        <h3 className="font-fredoka text-xl text-coral mb-2">
          Story for {story.child_name}
        </h3>
        <p className="font-nunito text-sm text-gray-500">
          Created {formatDate(story.created_at)}
        </p>
        <p className="font-nunito text-sm">
          Status: <span className={story.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}>
            {story.status}
          </span>
        </p>
      </div>
      
      <div className="flex flex-col gap-2">
        {story.status === 'completed' && (
          <>
            <button
              onClick={handlePlay}
              className="btn-primary w-full"
            >
              🎵 Play Story
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload('pdf')}
                disabled={downloading}
                className="btn-secondary flex-1 text-sm disabled:opacity-50"
              >
                {downloading ? '⏳' : '📄 PDF'}
              </button>
              <button
                onClick={() => handleDownload('epub')}
                disabled={downloading}
                className="btn-secondary flex-1 text-sm disabled:opacity-50"
              >
                {downloading ? '⏳' : '📚 ePub'}
              </button>
            </div>
          </>
        )}
        {story.status !== 'completed' && (
          <button
            onClick={handlePlay}
            className="btn-secondary w-full"
            disabled
          >
            {story.status === 'pending' || story.status === 'generating' 
              ? '⏳ Generating...' 
              : '❌ Failed'}
          </button>
        )}
      </div>
    </div>
  )
}
