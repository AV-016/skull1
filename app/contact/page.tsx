'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ContactSchema } from '@/lib/validators'

import api from '@/lib/api'
import { ENDPOINTS } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'

export default function ContactPage() {
  const { user } = useAuth()
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm({
    resolver: zodResolver(ContactSchema),
  })

  useEffect(() => {
    if (user) {
      setValue('name', user.name || '')
      setValue('email', user.email || '')
    }
  }, [user, setValue])

  const onSubmit = async (data: any) => {
    try {
      await api.post(ENDPOINTS.INQUIRIES, {
        ...data,
        userId: user?.id || undefined
      })
      setSubmitSuccess(true)
      reset()
      if (user) {
        setValue('name', user.name || '')
        setValue('email', user.email || '')
      }
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }
  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />

      <div className="pt-32 pb-12 md:pb-16 border-b border-border">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="heading-2 text-primary-text mb-4">Get In Touch</h1>
            <p className="text-secondary-text max-w-2xl">
              Have questions? We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {submitSuccess && (
                <motion.div
                  className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-green-400 text-sm">
                    Thank you for your message. We&apos;ll get back to you soon.
                  </p>
                </motion.div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  {...register('name')}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/50 smooth-transition"
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{(errors.name as any)?.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-2">Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  {...register('email')}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/50 smooth-transition"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{(errors.email as any)?.message}</p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-2">Subject</label>
                <input
                  type="text"
                  placeholder="How can we help?"
                  {...register('subject')}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/50 smooth-transition"
                  disabled={isSubmitting}
                />
                {errors.subject && (
                  <p className="text-red-400 text-sm mt-1">{(errors.subject as any)?.message}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-secondary-text mb-2">Message</label>
                <textarea
                  placeholder="Tell us more..."
                  {...register('message')}
                  rows={6}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/50 smooth-transition resize-none"
                  disabled={isSubmitting}
                />
                {errors.message && (
                  <p className="text-red-400 text-sm mt-1">{(errors.message as any)?.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed smooth-transition cursor-pointer"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </motion.form>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
