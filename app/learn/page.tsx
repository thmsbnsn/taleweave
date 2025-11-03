'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

interface Character {
  id: string
  name: string
  age: number
  appearance: string | null
  personality: string | null
  image_url: string | null
  voice_id: string | null
}

export default function LearnPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuthAndLoadCharacters() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login?redirect=/learn')
        return
      }

      setUser(authUser)

      // Load user's characters
      const { data: chars, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && chars) {
        setCharacters(chars)
        // Auto-select first character if available
        if (chars.length > 0) {
          setSelectedCharacter(chars[0])
        }
      }
      
      setLoading(false)
    }

    checkAuthAndLoadCharacters()
  }, [supabase, router])

  const subjects = [
    { id: 'math', name: 'Math', icon: '🔢', color: 'coral' },
    { id: 'science', name: 'Science', icon: '🔬', color: 'turquoise' },
    { id: 'reading', name: 'Reading', icon: '📚', color: 'lemon' },
    { id: 'art', name: 'Art', icon: '🎨', color: 'mint' },
  ]

  const isVisualMode = selectedCharacter && selectedCharacter.age < 4

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📚</div>
          <p className="font-fredoka text-2xl text-coral">Loading Academy...</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return null
  }

  if (characters.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon">
        <nav className="container mx-auto px-6 py-4">
          <Link href="/" className="font-fredoka text-2xl text-coral hover:text-turquoise transition">
            ← Back to Home
          </Link>
        </nav>
        <div className="container mx-auto px-6 py-20 text-center">
          <div className="card max-w-2xl mx-auto py-16">
            <div className="text-6xl mb-6">🎓</div>
            <h1 className="font-fredoka text-4xl text-coral mb-4">
              No Characters Yet!
            </h1>
            <p className="font-nunito text-xl text-gray-600 mb-8">
              Create your first story to unlock TaleWeave Academy. Your character will be your learning companion!
            </p>
            <Link href="/create" className="btn-primary text-xl px-8 py-4 inline-block">
              Create Your First Story
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon">
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-fredoka text-2xl text-coral hover:text-turquoise transition">
          ← Back to Home
        </Link>
        <h1 className="font-fredoka text-3xl text-coral">TaleWeave Academy</h1>
        <div className="w-24"></div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        {/* Character Selection */}
        <section className="mb-12">
          <h2 className="font-fredoka text-3xl text-coral mb-6 text-center">
            Choose Your Learning Companion
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {characters.map((char) => (
              <div
                key={char.id}
                onClick={() => setSelectedCharacter(char)}
                className={`card cursor-pointer transition-all transform hover:scale-105 ${
                  selectedCharacter?.id === char.id
                    ? 'ring-4 ring-coral shadow-2xl'
                    : 'hover:shadow-xl'
                }`}
              >
                {char.image_url && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <Image
                      src={char.image_url}
                      alt={`${char.name} character`}
                      width={200}
                      height={200}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                <h3 className="font-fredoka text-2xl text-coral mb-2">{char.name}</h3>
                <p className="font-nunito text-gray-600">Age: {char.age}</p>
                {selectedCharacter?.id === char.id && (
                  <div className="mt-4 p-3 bg-coral/10 rounded-lg">
                    <p className="font-nunito text-sm text-coral">
                      ✓ Active Learning Companion
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {selectedCharacter && (
          <>
            {/* Character Greeting */}
            <section className="card mb-12 max-w-3xl mx-auto text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                {selectedCharacter.image_url && (
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-coral">
                    <Image
                      src={selectedCharacter.image_url}
                      alt={selectedCharacter.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="font-fredoka text-3xl text-coral">
                    Hi! I&apos;m {selectedCharacter.name}
                  </h3>
                  <p className="font-nunito text-gray-600">
                    {selectedCharacter.age} years old • Ready to learn together!
                  </p>
                </div>
              </div>
              <p className="font-nunito text-xl text-gray-700 mb-4">
                {isVisualMode 
                  ? 'Let\'s play and learn with colors, shapes, and fun activities!'
                  : `Ready to learn, ${selectedCharacter.name}? Let's pick a subject!`}
              </p>
            </section>

            {/* Mode-Based Content */}
            {isVisualMode ? (
              <section className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="font-fredoka text-4xl text-coral mb-4">
                    Visual Play Mode
                  </h2>
                  <p className="font-nunito text-xl text-gray-600">
                    Perfect for ages 1-4: Learning through play!
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="card text-center hover:shadow-xl transition-all transform hover:-translate-y-2">
                    <div className="text-6xl mb-4">🖍️</div>
                    <h3 className="font-fredoka text-2xl text-coral mb-3">Coloring Book</h3>
                    <p className="font-nunito text-gray-600 mb-4">
                      Color fun pictures from your stories!
                    </p>
                    <button className="btn-primary w-full" disabled>
                      Coming Soon!
                    </button>
                  </div>
                  <div className="card text-center hover:shadow-xl transition-all transform hover:-translate-y-2">
                    <div className="text-6xl mb-4">🔷</div>
                    <h3 className="font-fredoka text-2xl text-turquoise mb-3">Shape Matching</h3>
                    <p className="font-nunito text-gray-600 mb-4">
                      Match shapes and learn patterns!
                    </p>
                    <button className="btn-secondary w-full" disabled>
                      Coming Soon!
                    </button>
                  </div>
                  <div className="card text-center hover:shadow-xl transition-all transform hover:-translate-y-2">
                    <div className="text-6xl mb-4">🔗</div>
                    <h3 className="font-fredoka text-2xl text-lemon mb-3">Connect the Dots</h3>
                    <p className="font-nunito text-gray-600 mb-4">
                      Connect dots to reveal pictures!
                    </p>
                    <button className="btn-secondary w-full" disabled>
                      Coming Soon!
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              <section className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="font-fredoka text-4xl text-coral mb-4">
                    Quiz Academy
                  </h2>
                  <p className="font-nunito text-xl text-gray-600 mb-6">
                    Pick a subject and let&apos;s learn together!
                  </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => setSelectedSubject(subject.id)}
                      className={`card text-center hover:shadow-xl transition-all transform hover:-translate-y-2 ${
                        selectedSubject === subject.id
                          ? 'ring-4 ring-coral'
                          : ''
                      }`}
                    >
                      <div className="text-6xl mb-4">{subject.icon}</div>
                      <h3 className={`font-fredoka text-2xl text-${subject.color} mb-3`}>
                        {subject.name}
                      </h3>
                      <p className="font-nunito text-gray-600 text-sm">
                        {selectedSubject === subject.id
                          ? '✓ Selected'
                          : 'Click to start'}
                      </p>
                    </button>
                  ))}
                </div>
                {selectedSubject && (
                  <div className="mt-8 card max-w-2xl mx-auto text-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="font-fredoka text-2xl text-coral mb-4">
                      Ready to play &quot;Are You Smarter Than a 5th Grader?&quot;
                    </h3>
                    <p className="font-nunito text-gray-600 mb-6">
                      {selectedCharacter.name} will cheer you on and give hints when you need them!
                    </p>
                    <button className="btn-primary text-xl px-8 py-4" disabled>
                      Quiz Coming Soon!
                    </button>
                    <p className="font-nunito text-sm text-gray-500 mt-4">
                      Phase 2: Quiz games will be available soon!
                    </p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}

