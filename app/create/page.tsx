'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

interface Character {
  id: string
  name: string
  age: number
  appearance: string | null
  personality: string | null
  image_url: string | null
  voice_settings: any
}

export default function CreateStoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('')
  const [formData, setFormData] = useState({
    childName: '',
    age: '',
    interests: '',
  })

  // Load user's characters
  useEffect(() => {
    async function loadCharacters() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('characters')
        .select('id, name, age, appearance, personality, image_url, voice_settings')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setCharacters(data)
      }
    }
    loadCharacters()
  }, [supabase])

  // Auto-fill form when character is selected
  useEffect(() => {
    if (selectedCharacterId && characters.length > 0) {
      const character = characters.find(c => c.id === selectedCharacterId)
      if (character) {
        setFormData({
          childName: character.name,
          age: character.age.toString(),
          interests: `${character.appearance || ''} ${character.personality || ''}`.trim() || '',
        })
      }
    }
  }, [selectedCharacterId, characters])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login?redirect=/create')
        return
      }

      // Create story with optional character
      const response = await fetch('/api/stories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          characterId: selectedCharacterId || undefined,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || 'Failed to create story. Please check if you have credits or an active subscription.')
        return
      }

      if (!data.storyId) {
        setError('Story creation started but no ID returned. Please check your stories later.')
        return
      }

      router.push(`/stories/${data.storyId}`)
    } catch (error) {
      console.error('Error creating story:', error)
      setError('Failed to create story. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon py-20">
      <div className="container mx-auto px-6 max-w-2xl">
        <h1 className="font-fredoka text-5xl text-coral text-center mb-12">
          Create Your Story
        </h1>
        
        {error && (
          <div className="card bg-red-50 border-2 border-red-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-fredoka text-xl text-red-800 mb-2">
                  Unable to Create Story
                </h3>
                <p className="font-nunito text-red-700 mb-4">
                  {error}
                </p>
                {error.includes('subscription') || error.includes('credits') ? (
                  <div className="flex gap-3">
                    <Link 
                      href="/pricing" 
                      className="btn-primary text-sm px-4 py-2"
                    >
                      View Pricing
                    </Link>
                    <button
                      onClick={() => setError(null)}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setError(null)}
                    className="btn-secondary text-sm px-4 py-2"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Character Selector */}
          {characters.length > 0 && (
            <div>
              <label htmlFor="character" className="block font-fredoka text-xl text-gray-800 mb-2">
                Use Saved Character (Optional)
              </label>
              <select
                id="character"
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                className="input-field"
              >
                <option value="">Create new story (no character)</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name} (Age {char.age})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600 mt-2 font-nunito">
                Select a character to auto-fill the form, or choose &quot;Create new story&quot; to start fresh.
              </p>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h2 className="font-fredoka text-2xl text-turquoise">Story Details</h2>
            {characters.length === 0 && (
              <Link href="/characters/create" className="btn-secondary text-sm">
                Create Character First
              </Link>
            )}
          </div>

          <div>
            <label htmlFor="childName" className="block font-fredoka text-xl text-gray-800 mb-2">
              Child&apos;s Name
            </label>
            <input
              type="text"
              id="childName"
              value={formData.childName}
              onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
              className="input-field"
              placeholder="Enter your child's name"
              required
            />
          </div>

          <div>
            <label htmlFor="age" className="block font-fredoka text-xl text-gray-800 mb-2">
              Age
            </label>
            <input
              type="number"
              id="age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="input-field"
              placeholder="Enter age"
              min="1"
              max="12"
              required
            />
          </div>

          <div>
            <label htmlFor="interests" className="block font-fredoka text-xl text-gray-800 mb-2">
              Interests & Themes
            </label>
            <textarea
              id="interests"
              value={formData.interests}
              onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
              className="input-field min-h-[150px]"
              placeholder="e.g., dinosaurs, space, princesses, superheroes, animals..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-xl py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Your Story...' : 'Generate Story'}
          </button>
        </form>
      </div>
    </main>
  )
}
