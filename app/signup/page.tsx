'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ReCAPTCHA from 'react-google-recaptcha'

const RECAPTCHA_SITE_KEY = '6LfeNf8rAAAAAAzaSq_diz8NDzrYaVJwBcHAzGeT'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Get reCAPTCHA token
    const captchaToken = recaptchaRef.current?.getValue()
    
    if (!captchaToken) {
      alert('Please complete the CAPTCHA verification.')
      return
    }
    
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, captchaToken }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.needsConfirmation) {
          alert('Account created! Please check your email to verify your account, then login.')
        } else {
          alert('Account created successfully! Redirecting...')
          router.push('/create')
          router.refresh()
        }
        router.push('/login')
      } else {
        const { error } = await response.json()
        alert(error || 'Sign up failed. Please try again.')
        // Reset CAPTCHA on error
        recaptchaRef.current?.reset()
      }
    } catch (error) {
      console.error('Signup error:', error)
      alert('An error occurred. Please try again.')
      recaptchaRef.current?.reset()
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint via-white to-lemon flex items-center justify-center py-20">
      <div className="card max-w-md w-full">
        <h1 className="font-fredoka text-4xl text-coral text-center mb-8">
          Create Account
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block font-fredoka text-lg text-gray-800 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block font-fredoka text-lg text-gray-800 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Create a password"
              required
              minLength={6}
            />
          </div>

          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              theme="light"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center font-nunito text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-coral hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  )
}

