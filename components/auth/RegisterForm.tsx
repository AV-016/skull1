'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRegister } from '@/hooks/useAuth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'

// Local registration validation schema including client-only validation fields
const registerFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms & Privacy Policy',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterFormInput = z.infer<typeof registerFormSchema>

export const RegisterForm = () => {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      agreeTerms: false,
    }
  })

  const { mutate: registerUser, isPending, error } = useRegister()

  const onSubmit = (data: RegisterFormInput) => {
    // Send only what the backend requires
    registerUser(
      {
        name: data.name,
        email: data.email,
        password: data.password,
      },
      {
        onSuccess: () => {
          router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}`)
        },
      }
    )
  }

  if (isRegistered) {
    return (
      <motion.div
        className="w-full text-center space-y-6 py-8 px-4 bg-secondary/30 backdrop-blur-md border border-border rounded-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-primary-text">Verify Your Email</h2>
          <p className="text-sm text-secondary-text leading-relaxed">
            We've sent a verification link to your email address. Please click the link to activate your account.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/auth/login"
            className="inline-flex justify-center items-center px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 smooth-transition text-xs tracking-wider uppercase cursor-pointer"
          >
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    )
  }

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/google`
  }

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-500 text-xs leading-relaxed font-medium">
            {(error as any)?.response?.data?.message || 'Registration failed. Please try again.'}
          </p>
        </div>
      )}

      {/* Name Field */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-secondary-text uppercase tracking-wider">
          Full Name
        </label>
        <input
          type="text"
          placeholder="John Doe"
          {...register('name')}
          className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/50 smooth-transition text-sm"
          disabled={isPending}
        />
        {errors.name && (
          <p className="text-red-500 text-[11px] font-medium mt-0.5">{errors.name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-secondary-text uppercase tracking-wider">
          Email Address
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/50 smooth-transition text-sm"
          disabled={isPending}
        />
        {errors.email && (
          <p className="text-red-500 text-[11px] font-medium mt-0.5">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-secondary-text uppercase tracking-wider">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('password')}
            className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/50 smooth-transition text-sm pr-12"
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-text hover:text-primary-text smooth-transition cursor-pointer"
            disabled={isPending}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-[11px] font-medium mt-0.5">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-secondary-text uppercase tracking-wider">
          Confirm Password
        </label>
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          {...register('confirmPassword')}
          className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/50 smooth-transition text-sm"
          disabled={isPending}
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-[11px] font-medium mt-0.5">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Terms & Privacy Policy Checkbox */}
      <div className="space-y-1 pt-1">
        <label className="flex items-start gap-2.5 text-xs font-medium text-secondary-text cursor-pointer select-none">
          <input
            type="checkbox"
            {...register('agreeTerms')}
            className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-primary focus:ring-offset-0 accent-primary mt-0.5"
          />
          <span className="leading-tight">
            I agree to the{' '}
            <Link href="/terms" className="text-primary hover:underline font-bold">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-primary hover:underline font-bold">Privacy Policy</Link>
          </span>
        </label>
        {errors.agreeTerms && (
          <p className="text-red-500 text-[11px] font-medium mt-0.5">{errors.agreeTerms.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed smooth-transition text-sm tracking-wide uppercase cursor-pointer pt-2"
      >
        {isPending ? 'Creating account...' : 'Create Account'}
      </button>

      {/* Divider */}
      <div className="flex items-center my-3">
        <div className="flex-grow border-t border-border"></div>
        <span className="px-3 text-[10px] font-bold text-muted-text uppercase tracking-widest">OR</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      {/* Google Signup Button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-50 border border-gray-200 smooth-transition text-sm cursor-pointer"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" className="w-5 h-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Continue With Google</span>
      </button>

      {/* Redirect to Login Link */}
      <p className="text-center text-secondary-text text-xs pt-1">
        Already have an account?{' '}
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

