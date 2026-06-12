'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShieldCheck, ShieldAlert, Loader2, ArrowLeft } from 'lucide-react'
import { useVerifyOtp, useResendOtp } from '@/hooks/useAuth'
import { AuthLayout } from '@/components/auth/AuthLayout'

function VerifyOtpContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [activeInput, setActiveInput] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Resend Timer
  const [cooldown, setCooldown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  const verifyOtpMutation = useVerifyOtp()
  const resendOtpMutation = useResendOtp()

  useEffect(() => {
    if (!email) {
      setStatus('error')
      setErrorMessage('Email address is missing. Please register again.')
    }
  }, [email])

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown === 0) {
      setCanResend(true)
      return
    }

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleOtpChange = (val: string, index: number) => {
    // Only allow numbers
    if (val && !/^\d+$/.test(val)) return

    const newOtp = [...otp]
    newOtp[index] = val.substring(val.length - 1)
    setOtp(newOtp)

    // Move to next input
    if (val && index < 5) {
      setActiveInput(index + 1)
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move back
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        setActiveInput(index - 1)
        inputRefs.current[index - 1]?.focus()
      } else {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    if (!/^\d{6}$/.test(pastedData)) return

    const digits = pastedData.split('')
    setOtp(digits)
    setActiveInput(5)
    inputRefs.current[5]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullOtp = otp.join('')
    if (fullOtp.length !== 6) {
      setStatus('error')
      setErrorMessage('Please enter all 6 digits of the OTP code.')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    verifyOtpMutation.mutate(
      { email, otp: fullOtp },
      {
        onSuccess: () => {
          setStatus('success')
          setSuccessMessage('Your email has been verified successfully!')
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        },
        onError: (err: any) => {
          setStatus('error')
          setErrorMessage(
            err?.response?.data?.message || 'Verification failed. The OTP code is invalid or has expired.'
          )
        },
      }
    )
  }

  const handleResend = () => {
    if (!canResend) return

    setCanResend(false)
    setCooldown(60)
    setStatus('idle')
    setErrorMessage('')

    resendOtpMutation.mutate(email, {
      onSuccess: () => {
        setSuccessMessage('A new verification code has been sent to your email.')
        // Clear message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000)
      },
      onError: (err: any) => {
        setStatus('error')
        setErrorMessage(err?.response?.data?.message || 'Failed to resend verification code.')
        setCanResend(true)
        setCooldown(0)
      },
    })
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
            {successMessage || 'Your email has been verified successfully. Redirecting you to login...'}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/auth/login"
            className="inline-flex justify-center items-center px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 smooth-transition text-xs tracking-wider uppercase cursor-pointer"
          >
            Sign In Now
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="w-full space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-y-2">
        <p className="text-sm text-secondary-text">
          We have sent a 6-digit verification code to <br />
          <strong className="text-primary-text">{email}</strong>
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-500 text-xs leading-relaxed font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-500 text-xs leading-relaxed font-medium">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* OTP Inputs */}
        <div className="flex justify-between gap-2 max-w-sm mx-auto" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              className="w-12 h-14 text-center text-xl font-bold bg-secondary border border-border rounded-xl text-primary-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary smooth-transition"
              disabled={status === 'loading'}
            />
          ))}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === 'loading' || otp.join('').length !== 6}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed smooth-transition text-xs tracking-wider uppercase cursor-pointer"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying Code...
            </>
          ) : (
            'Verify Email'
          )}
        </button>
      </form>

      {/* Resend Options */}
      <div className="text-center pt-2">
        <p className="text-xs text-secondary-text">
          Didn't receive the code?{' '}
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resendOtpMutation.isPending}
              className="text-primary hover:underline font-bold bg-transparent border-none p-0 cursor-pointer"
            >
              {resendOtpMutation.isPending ? 'Sending...' : 'Resend Code'}
            </button>
          ) : (
            <span className="text-muted-text">Resend in {cooldown}s</span>
          )}
        </p>
      </div>

      <div className="flex justify-center pt-2">
        <Link
          href="/auth/register"
          className="inline-flex items-center gap-2 text-xs font-bold text-secondary-text hover:text-primary-text smooth-transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registration
        </Link>
      </div>
    </motion.div>
  )
}

export default function VerifyOtpPage() {
  return (
    <AuthLayout
      title="Enter Verification Code"
      subtitle="Verify your identity to complete registration"
    >
      <Suspense fallback={
        <div className="w-full text-center py-8 px-4 bg-secondary/30 backdrop-blur-md border border-border rounded-2xl flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-secondary-text">Loading verification form...</p>
        </div>
      }>
        <VerifyOtpContent />
      </Suspense>
    </AuthLayout>
  )
}
