'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

export default function CreateStoryPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    childName: '',
    age: '',
    interests: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login?redirect=/create')
        return
      }

      // Create story
      const response = await fetch('/api/stories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        alert(data.error || 'Failed to create story. Please check if you have credits or an active subscription.')
        return
      }

      if (!data.storyId) {
        alert('Story creation started but no ID returned. Please check your stories later.')
        return
      }

      router.push(`/stories/${data.storyId}`)
    } catch (error) {
      console.error('Error creating story:', error)
      alert('Failed to create story. Please try again.')
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
        
        <form onSubmit={handleSubmit} className="card space-y-6">
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

