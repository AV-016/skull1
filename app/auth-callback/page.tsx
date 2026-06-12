'use client'

import React, { useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { setToken, removeToken } from '@/lib/auth'
import api from '@/lib/api'
import { Loader2 } from 'lucide-react'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    
    const token = searchParams.get('token')
    if (token) {
      handled.current = true
      
      // Store token immediately so subsequent requests are authenticated
      setToken(token)

      // Fetch user details from /auth/me
      api.get('/auth/me')
        .then((response) => {
          if (response.data?.success && response.data?.data) {
            login(token, response.data.data)
            router.replace('/dashboard')
          } else {
            removeToken()
            router.replace('/auth/login?error=invalid_token')
          }
        })
        .catch((err) => {
          console.error('Error fetching user info during Google callback:', err)
          removeToken()
          router.replace('/auth/login?error=auth_failed')
        })
    } else {
      router.replace('/auth/login?error=no_token')
    }
  }, [searchParams, login, router])

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Premium rotating loading circle */}
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <div className="absolute w-16 h-16 border-2 border-primary/20 rounded-full animate-ping pointer-events-none" />
      </div>
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold tracking-tight text-primary-text uppercase">
          Verifying Account
        </h2>
        <p className="text-xs font-medium text-secondary-text uppercase tracking-widest">
          Completing your connection to Skulture...
        </p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative technical drafting grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(250,245,215,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(250,245,215,0.045)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none" />
      
      {/* Premium Glassmorphic Card Container */}
      <div className="relative w-full max-w-md p-8 border border-border bg-card/20 backdrop-blur-xl shadow-2xl z-10 flex flex-col items-center justify-center">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-xs font-medium text-secondary-text uppercase tracking-widest">
              Loading...
            </p>
          </div>
        }>
          <CallbackHandler />
        </Suspense>
      </div>
    </main>
  )
}
