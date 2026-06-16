'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ForgotPasswordSchema } from '@/lib/validators'
import { useForgotPassword } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShieldAlert, CheckCircle2 } from 'lucide-react'

type ForgotPasswordFormData = {
  email: string
}

export const ForgotPasswordForm = () => {
  const router = useRouter()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
  })

  const { mutate: forgotPassword, isPending, error } = useForgotPassword()

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPassword(data.email, {
      onSuccess: (res) => {
        setSuccessMsg(res?.message || 'A reset verification code has been sent to your email.')
        setTimeout(() => {
          router.push(`/auth/reset-password?email=${encodeURIComponent(data.email)}`)
        }, 2500)
      },
    })
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-500 text-xs leading-relaxed font-medium">
            {(error as any)?.response?.data?.message || 'Failed to send reset code. Please try again.'}
          </p>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-500 text-xs leading-relaxed font-medium">
            {successMsg} Redirecting to reset password page...
          </p>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-secondary-text uppercase tracking-wider">
          Email Address
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/50 smooth-transition text-sm"
          disabled={isPending || !!successMsg}
        />
        {errors.email && (
          <p className="text-red-500 text-xs font-medium mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || !!successMsg}
        className="w-full px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed smooth-transition text-sm tracking-wide uppercase cursor-pointer"
      >
        {isPending ? 'Sending code...' : 'Send Reset Code'}
      </button>

      {/* Redirect back to login */}
      <p className="text-center text-secondary-text text-xs pt-2">
        Remembered your password?{' '}
        <Link
          href="/auth/login"
          className="text-primary hover:underline font-bold"
        >
          Sign In
        </Link>
      </p>
    </motion.form>
  )
}
