'use client'

import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ResetPasswordSchema } from '@/lib/validators'
import { useResetPassword } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShieldAlert, CheckCircle2 } from 'lucide-react'

type ResetPasswordFormData = {
  token: string
  password: string
  confirmPassword: string
}

const ResetPasswordFormInner = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
  })

  const { mutate: resetPassword, isPending, error } = useResetPassword()

  const onSubmit = (data: ResetPasswordFormData) => {
    resetPassword({
      email,
      token: data.token,
      password: data.password,
    }, {
      onSuccess: (res) => {
        setSuccessMsg(res?.message || 'Password reset successful! Redirecting to login page...')
        setTimeout(() => {
          router.push('/auth/login')
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
            {(error as any)?.response?.data?.message || 'Failed to reset password. Please try again.'}
          </p>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-500 text-xs leading-relaxed font-medium">
            {successMsg}
          </p>
        </div>
      )}

      {/* Email Display (Read-Only) */}
      <div className="space-y-1.5 opacity-80">
        <label className="block text-xs font-bold text-secondary-text uppercase tracking-wider">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl text-muted-text text-sm cursor-not-allowed"
        />
      </div>

      {/* Verification OTP Field */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-secondary-text uppercase tracking-wider">
          6-Digit OTP Code
        </label>
        <input
          type="text"
          maxLength={6}
          placeholder="123456"
          {...register('token')}
          className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/50 smooth-transition text-sm text-center tracking-widest font-bold"
          disabled={isPending || !!successMsg}
        />
        {errors.token && (
          <p className="text-red-500 text-xs font-medium mt-1">{errors.token.message}</p>
        )}
      </div>

      {/* New Password Field */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-secondary-text uppercase tracking-wider">
          New Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/50 smooth-transition text-sm pr-12"
            disabled={isPending || !!successMsg}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-text hover:text-primary-text smooth-transition cursor-pointer"
            disabled={isPending || !!successMsg}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-xs font-medium mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-secondary-text uppercase tracking-wider">
          Confirm Password
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          {...register('confirmPassword')}
          className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/50 smooth-transition text-sm"
          disabled={isPending || !!successMsg}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs font-medium mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending || !!successMsg}
        className="w-full px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed smooth-transition text-sm tracking-wide uppercase cursor-pointer"
      >
        {isPending ? 'Resetting password...' : 'Reset Password'}
      </button>
    </motion.form>
  )
}

export const ResetPasswordForm = () => {
  return (
    <Suspense fallback={<div className="text-center text-muted-text text-sm">Loading reset form...</div>}>
      <ResetPasswordFormInner />
    </Suspense>
  )
}
