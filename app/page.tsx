'use client'

import { useEffect, useState, useCallback } from 'react'
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

  const fetchUserStories = useCallback(async (userId: string) => {
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
  }, [supabase])

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
  }, [supabase, fetchUserStories])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 group">
            <Image
              src="/tw-logo.ico"
              alt="Tale Weave - AI-Generated Children's Stories Logo"
              width={48}
              height={48}
              className="rounded-full group-hover:scale-110 transition-transform"
            />
            <span className="font-fredoka text-2xl text-coral group-hover:text-turquoise transition-colors">
              Tale Weave
            </span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/#features" className="font-nunito text-gray-700 hover:text-coral transition">
              Features
            </Link>
            <Link href="/#how-it-works" className="font-nunito text-gray-700 hover:text-coral transition">
              How It Works
            </Link>
            {user && (
              <>
                <Link href="/learn" className="font-nunito text-gray-700 hover:text-coral transition">
                  Academy
                </Link>
                <Link href="/play" className="font-nunito text-gray-700 hover:text-coral transition">
                  🎮 Games
                </Link>
              </>
            )}
            {!user && (
              <Link href="/pricing" className="font-nunito text-gray-700 hover:text-coral transition">
                Pricing
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="hidden sm:inline font-nunito text-gray-700">
                  Welcome back, <span className="font-fredoka text-coral">{userName}</span>!
                </span>
                <Link href="/create" className="btn-primary text-sm px-4 py-2">
                  Create Story
                </Link>
                <button
                  onClick={handleLogout}
                  className="font-nunito text-gray-700 hover:text-coral transition text-sm"
                  aria-label="Log out"
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
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left">
              <h1 className="font-fredoka text-5xl md:text-6xl lg:text-7xl text-coral mb-6 leading-tight">
                Create Magical Stories
                <span className="block text-turquoise">Your Child Will Love</span>
              </h1>
              <p className="font-nunito text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl lg:max-w-none">
                Personalize enchanting stories for your child with AI-generated text, beautiful illustrations, and professional audio narration. Watch their face light up as they become the hero of their own tale!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                {!user ? (
                  <>
                    <Link 
                      href="/create" 
                      className="btn-primary text-xl px-8 py-4 shadow-2xl hover:scale-105 transition-transform inline-block text-center"
                      aria-label="Create your first story free"
                    >
                      ✨ Create Your First Story Free
                    </Link>
                    <Link 
                      href="/signup" 
                      className="btn-secondary text-xl px-8 py-4 shadow-2xl hover:scale-105 transition-transform inline-block text-center"
                      aria-label="Sign up for an account"
                    >
                      Start Creating
                    </Link>
                  </>
                ) : (
                  <Link 
                    href="/create" 
                    className="btn-primary text-xl px-8 py-4 shadow-2xl hover:scale-105 transition-transform inline-block text-center"
                  >
                    Create New Story
                  </Link>
                )}
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-6 text-sm font-nunito text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">✓</span>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">✓</span>
                  <span>Try free preview</span>
                </div>
              </div>
            </div>

            {/* Right: Hero Image */}
            <div className="relative">
              <div className="card p-4 transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="relative rounded-lg overflow-hidden">
                  <Image
                    src="/images/homestory1.jpeg"
                    alt="Magical AI-generated children's story illustration"
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover rounded-lg shadow-xl"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-lemon rounded-full opacity-50 blur-xl" aria-hidden="true"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-turquoise rounded-full opacity-50 blur-xl" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      </section>

      {/* User Stories Section (if logged in) */}
      {user && !loading && (
        <section className="container mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h2 className="font-fredoka text-4xl md:text-5xl text-coral mb-4">
              Your Stories
            </h2>
            <p className="font-nunito text-xl text-gray-600">
              All your magical creations in one place
            </p>
          </div>
          {stories.length === 0 ? (
            <div className="card text-center py-16 max-w-2xl mx-auto">
              <div className="text-6xl mb-6" role="img" aria-label="No stories yet">
                📖
              </div>
              <h3 className="font-fredoka text-3xl text-coral mb-4">
                No Stories Yet!
              </h3>
              <p className="font-nunito text-gray-600 text-lg mb-8">
                Create your first magical story and watch your child&apos;s imagination come to life!
              </p>
              <Link href="/create" className="btn-primary text-xl px-8 py-4 inline-block">
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

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="font-fredoka text-4xl md:text-5xl text-coral mb-4">
            Why Parents Love Tale Weave
          </h2>
          <p className="font-nunito text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to create personalized bedtime stories your kids will treasure
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-center hover:shadow-2xl transition-shadow transform hover:-translate-y-2 duration-300 overflow-hidden">
            <div className="mb-6 rounded-lg overflow-hidden">
              <Image
                src="/images/homestory2.jpeg"
                alt="AI-Generated story example with magical characters"
                width={300}
                height={200}
                className="w-full h-48 object-cover hover:scale-110 transition-transform duration-300"
              />
            </div>
            <h3 className="font-fredoka text-2xl text-coral mb-4">AI-Generated Stories</h3>
            <p className="font-nunito text-gray-600 leading-relaxed">
              Custom stories tailored to your child&apos;s name, age, and interests using advanced AI technology. Every story is unique and age-appropriate.
            </p>
          </div>
          <div className="card text-center hover:shadow-2xl transition-shadow transform hover:-translate-y-2 duration-300 overflow-hidden">
            <div className="mb-6 rounded-lg overflow-hidden">
              <Image
                src="/images/homestory3.jpeg"
                alt="Beautiful AI-generated story illustration"
                width={300}
                height={200}
                className="w-full h-48 object-cover hover:scale-110 transition-transform duration-300"
              />
            </div>
            <h3 className="font-fredoka text-2xl text-turquoise mb-4">Beautiful Images</h3>
            <p className="font-nunito text-gray-600 leading-relaxed">
              Stunning AI-generated illustrations for each story page, bringing the tale to life visually. Each image is custom-created for your story.
            </p>
          </div>
          <div className="card text-center hover:shadow-2xl transition-shadow transform hover:-translate-y-2 duration-300 overflow-hidden">
            <div className="mb-6 rounded-lg overflow-hidden">
              <Image
                src="/images/homestory4.jpeg"
                alt="Children's story with audio narration feature"
                width={300}
                height={200}
                className="w-full h-48 object-cover hover:scale-110 transition-transform duration-300"
              />
            </div>
            <h3 className="font-fredoka text-2xl text-lemon mb-4">Audio Narration</h3>
            <p className="font-nunito text-gray-600 leading-relaxed">
              Professional voice narration that reads the story aloud, perfect for bedtime stories, car rides, or anytime you want to spark imagination.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-fredoka text-4xl md:text-5xl text-coral mb-4">
              How It Works
            </h2>
            <p className="font-nunito text-xl text-gray-600 max-w-2xl mx-auto">
              Create a magical story in just three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-coral text-white rounded-full font-fredoka text-3xl mb-6 shadow-lg">
                1
              </div>
              <h3 className="font-fredoka text-2xl text-coral mb-4">Enter Details</h3>
              <p className="font-nunito text-gray-600">
                Tell us your child&apos;s name, age, and favorite interests or themes. The more details, the better the story!
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-turquoise text-white rounded-full font-fredoka text-3xl mb-6 shadow-lg">
                2
              </div>
              <h3 className="font-fredoka text-2xl text-turquoise mb-4">AI Creates Magic</h3>
              <p className="font-nunito text-gray-600">
                Our AI generates a custom story, creates beautiful illustrations, and records professional narration—all personalized for your child.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-lemon text-white rounded-full font-fredoka text-3xl mb-6 shadow-lg">
                3
              </div>
              <h3 className="font-fredoka text-2xl text-lemon mb-4">Enjoy Together</h3>
              <p className="font-nunito text-gray-600">
                Read, listen, and download your story. Perfect for bedtime, travel, or anytime you want to spark creativity!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      {!user && (
        <section className="container mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="font-fredoka text-3xl md:text-4xl text-coral mb-4">
              Loved by Parents Everywhere
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-coral to-turquoise rounded-full flex items-center justify-center text-white font-fredoka text-xl mr-3">
                  SM
                </div>
                <div>
                  <p className="font-fredoka text-coral">Sarah M.</p>
                  <p className="font-nunito text-sm text-gray-500">Mom of 2</p>
                </div>
              </div>
              <p className="font-nunito text-gray-600 italic">
                &quot;My 5-year-old asks for her personalized story every night. The AI really captured her love of dinosaurs!&quot;
              </p>
              <div className="mt-3 text-yellow-500" aria-label="5 star rating">
                ⭐⭐⭐⭐⭐
              </div>
            </div>
            <div className="card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-turquoise to-lemon rounded-full flex items-center justify-center text-white font-fredoka text-xl mr-3">
                  JD
                </div>
                <div>
                  <p className="font-fredoka text-turquoise">James D.</p>
                  <p className="font-nunito text-sm text-gray-500">Dad of 1</p>
                </div>
              </div>
              <p className="font-nunito text-gray-600 italic">
                &quot;Perfect for long car rides! The audio narration keeps our daughter engaged for hours.&quot;
              </p>
              <div className="mt-3 text-yellow-500" aria-label="5 star rating">
                ⭐⭐⭐⭐⭐
              </div>
            </div>
            <div className="card">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-lemon to-coral rounded-full flex items-center justify-center text-white font-fredoka text-xl mr-3">
                  EL
                </div>
                <div>
                  <p className="font-fredoka text-lemon">Emma L.</p>
                  <p className="font-nunito text-sm text-gray-500">Parent</p>
                </div>
              </div>
              <p className="font-nunito text-gray-600 italic">
                &quot;The stories are so creative and the illustrations are beautiful. Worth every penny!&quot;
              </p>
              <div className="mt-3 text-yellow-500" aria-label="5 star rating">
                ⭐⭐⭐⭐⭐
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {!user && (
        <section className="bg-white py-16">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="font-fredoka text-3xl md:text-4xl text-coral mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-6">
              <div className="card">
                <h3 className="font-fredoka text-xl text-coral mb-2">
                  How long does it take to create a story?
                </h3>
                <p className="font-nunito text-gray-600">
                  Most stories are ready in 2-5 minutes. The AI generates text, creates images, and records narration automatically.
                </p>
              </div>
              <div className="card">
                <h3 className="font-fredoka text-xl text-turquoise mb-2">
                  Can I download the stories?
                </h3>
                <p className="font-nunito text-gray-600">
                  Yes! Every completed story can be downloaded as PDF or ePub format, perfect for keeping forever or sharing with family.
                </p>
              </div>
              <div className="card">
                <h3 className="font-fredoka text-xl text-lemon mb-2">
                  What age range is this for?
                </h3>
                <p className="font-nunito text-gray-600">
                  Our stories are perfect for children ages 3-12. The content and language are automatically adjusted based on the age you provide.
                </p>
              </div>
              <div className="card">
                <h3 className="font-fredoka text-xl text-coral mb-2">
                  Do I need to subscribe?
                </h3>
                <p className="font-nunito text-gray-600">
                  No subscription required! You can purchase individual stories for $1.99, or subscribe for unlimited stories at $9.99/month.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!user && (
        <section className="bg-gradient-to-r from-coral to-turquoise py-20">
          <div className="container mx-auto px-6 text-center">
            <h2 className="font-fredoka text-4xl md:text-5xl text-white mb-6">
              Ready to Create Magic?
            </h2>
            <p className="font-nunito text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of parents creating personalized stories their children love
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/signup" 
                className="bg-white text-coral px-8 py-4 rounded-lg font-fredoka text-xl hover:bg-opacity-90 transition-all shadow-2xl inline-block hover:scale-105 transform duration-200"
                aria-label="Sign up to start creating stories"
              >
                Start Creating Free
              </Link>
              <Link 
                href="/pricing" 
                className="bg-white/20 text-white border-2 border-white px-8 py-4 rounded-lg font-fredoka text-xl hover:bg-white/30 transition-all inline-block hover:scale-105 transform duration-200"
                aria-label="View pricing plans"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image
                  src="/tw-logo.ico"
                  alt="Tale Weave Logo"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="font-fredoka text-xl">Tale Weave</span>
              </div>
              <p className="font-nunito text-gray-400 text-sm">
                Creating magical, personalized stories for children everywhere.
              </p>
            </div>
            <div>
              <h4 className="font-fredoka text-lg mb-4">Product</h4>
              <ul className="space-y-2 font-nunito text-sm text-gray-400">
                <li>
                  <Link href="/create" className="hover:text-white transition">
                    Create Story
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/#features" className="hover:text-white transition">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="hover:text-white transition">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-fredoka text-lg mb-4">Account</h4>
              <ul className="space-y-2 font-nunito text-sm text-gray-400">
                {user ? (
                  <>
                    <li>
                      <Link href="/create" className="hover:text-white transition">
                        Create Story
                      </Link>
                    </li>
                    <li>
                      <button onClick={handleLogout} className="hover:text-white transition">
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/login" className="hover:text-white transition">
                        Log In
                      </Link>
                    </li>
                    <li>
                      <Link href="/signup" className="hover:text-white transition">
                        Sign Up
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-fredoka text-lg mb-4">Support</h4>
              <ul className="space-y-2 font-nunito text-sm text-gray-400">
                <li>
                  <a href="mailto:support@taleweave.com" className="hover:text-white transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="font-nunito text-gray-400 text-sm">
              © 2024 Tale Weave. All rights reserved.
            </p>
          </div>
        </div>
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
    <div className="card hover:shadow-xl transition-all transform hover:-translate-y-1 duration-300">
      <div className="mb-4">
        <h3 className="font-fredoka text-xl text-coral mb-2">
          Story for {story.child_name}
        </h3>
        <p className="font-nunito text-sm text-gray-500 mb-2">
          Created {formatDate(story.created_at)}
        </p>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-nunito ${
          story.status === 'completed' 
            ? 'bg-green-100 text-green-700' 
            : story.status === 'generating'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {story.status === 'completed' ? '✓ Ready' : story.status === 'generating' ? '⏳ Creating...' : '⚠ Failed'}
        </span>
      </div>
      
      <div className="flex flex-col gap-2">
        {story.status === 'completed' && (
          <>
            <button
              onClick={handlePlay}
              className="btn-primary w-full"
              aria-label={`Play story for ${story.child_name}`}
            >
              🎵 Play Story
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload('pdf')}
                disabled={downloading}
                className="btn-secondary flex-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Download PDF of story for ${story.child_name}`}
              >
                {downloading ? '⏳' : '📄 PDF'}
              </button>
              <button
                onClick={() => handleDownload('epub')}
                disabled={downloading}
                className="btn-secondary flex-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Download ePub of story for ${story.child_name}`}
              >
                {downloading ? '⏳' : '📚 ePub'}
              </button>
            </div>
          </>
        )}
        {story.status !== 'completed' && (
          <button
            onClick={handlePlay}
            className="btn-secondary w-full opacity-50 cursor-not-allowed"
            disabled
            aria-label={`Story for ${story.child_name} is ${story.status}`}
          >
            {story.status === 'pending' || story.status === 'generating' 
              ? '⏳ Generating...' 
              : '❌ Failed - Try Again'}
          </button>
        )}
      </div>
    </div>
  )
}
