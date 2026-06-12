'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import { AuthLayout } from '@/components/auth/AuthLayout'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage('Verification token is missing.')
      return
    }

    const verify = async () => {
      try {
        await api.get(`${ENDPOINTS.VERIFY_EMAIL}?token=${token}`)
        setStatus('success')
      } catch (err: any) {
        setStatus('error')
        setErrorMessage(
          err?.response?.data?.message || 'Verification failed. The link may have expired or is invalid.'
        )
      }
    }

    verify()
  }, [token])

  if (status === 'loading') {
    return (
      <div className="w-full text-center py-8 px-4 bg-secondary/30 backdrop-blur-md border border-border rounded-2xl flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-secondary-text">Verifying your email address...</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <motion.div
        className="w-full text-center space-y-6 py-8 px-4 bg-secondary/30 backdrop-blur-md border border-border rounded-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-green-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-primary-text">Email Verified!</h2>
          <p className="text-sm text-secondary-text leading-relaxed">
            Thank you! Your email address has been verified successfully. You can now log in to your account.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/auth/login"
            className="inline-flex justify-center items-center px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 smooth-transition text-xs tracking-wider uppercase cursor-pointer"
          >
            Sign In
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="w-full text-center space-y-6 py-8 px-4 bg-secondary/30 backdrop-blur-md border border-border rounded-2xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
        <ShieldAlert className="w-8 h-8 text-red-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-primary-text">Verification Failed</h2>
        <p className="text-sm text-secondary-text leading-relaxed">
          {errorMessage}
        </p>
      </div>
      <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/auth/register"
          className="inline-flex justify-center items-center px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 smooth-transition text-xs tracking-wider uppercase cursor-pointer"
        >
          Register Again
        </Link>
        <Link
          href="/auth/login"
          className="inline-flex justify-center items-center px-6 py-2.5 bg-secondary border border-border text-primary-text font-bold rounded-xl hover:bg-secondary/80 smooth-transition text-xs tracking-wider uppercase cursor-pointer"
        >
          Back to Login
        </Link>
      </div>
    </motion.div>
  )
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      title="Email Verification"
      subtitle="Confirming your account credentials"
    >
      <Suspense fallback={
        <div className="w-full text-center py-8 px-4 bg-secondary/30 backdrop-blur-md border border-border rounded-2xl flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-secondary-text">Loading...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </AuthLayout>
  )
}
