'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProductCard } from '@/components/products/ProductCard'
import { sanitizeProducts } from '@/lib/mockProducts'
import api from '@/lib/api'
import Link from 'next/link'
import { Calendar, Loader2 } from 'lucide-react'

const EventCountdown = ({ endDate }: { endDate: string }) => {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endDate) - +new Date()
      if (difference <= 0) {
        return 'Event Ended'
      }

      const parts = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      }

      return `${parts.days}d ${parts.hours}h ${parts.minutes}m ${parts.seconds}s remaining`
    }

    setTimeLeft(calculateTimeLeft())
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  return (
    <span className="font-bold bg-primary/25 text-primary border border-primary/20 px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider animate-pulse">
      {timeLeft}
    </span>
  )
}

export default function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const id = resolvedParams.id

  const [event, setEvent] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEventDetails = async () => {
      setIsLoading(true)
      try {
        const res = await api.get(`/events/${id}`)
        if (res.data?.success && res.data?.data) {
          setEvent(res.data.data)
        } else {
          setError('Event not found')
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load event details')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchEventDetails()
    }
  }, [id])

  const sanitizedProducts = event?.products ? sanitizeProducts(event.products) : []

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
        <Navbar />
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">Loading Event Page...</p>
        </div>
        <Footer />
      </main>
    )
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
        <Navbar />
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
          <p className="text-red-500 font-bold uppercase tracking-wider text-sm">{error || 'Event Not Found'}</p>
          <Link href="/dashboard" className="text-xs bg-secondary hover:bg-primary hover:text-white px-4 py-2 border border-border rounded font-bold uppercase tracking-wider smooth-transition">
            Back to Dashboard
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />

      {/* Hero Welcome Banner */}
      <div className="pt-32 pb-16 relative overflow-hidden bg-gradient-to-r from-red-600/10 via-orange-500/5 to-transparent border-b border-border/60">
        {event.bannerUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center pointer-events-none transition-opacity duration-300 z-0"
            style={{ 
              backgroundImage: `linear-gradient(to right, rgba(18, 19, 26, 0.95) 40%, rgba(18, 19, 26, 0.6) 70%, rgba(18, 19, 26, 0.25) 100%), url(${event.bannerUrl})` 
            }}
          />
        )}
        <div className="relative z-10 container mx-auto px-4 md:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <Link href="/dashboard" className="text-xs font-bold text-muted-text hover:text-primary uppercase tracking-wider smooth-transition block mb-2">
              ← Back to Dashboard
            </Link>
            
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-primary text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest rounded">Active Event</span>
              <EventCountdown endDate={event.endDate} />
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-black dark:text-white tracking-tight leading-tight uppercase">
              {event.title}
            </h1>
            <p className="text-[#4f5d75] dark:text-[#9da8b6] max-w-2xl text-sm md:text-base leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Products Showcase */}
      <div className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="space-y-6">
            <h3 className="font-black text-xs uppercase tracking-wider text-secondary-text pb-2 border-b border-border">Event Products Catalog ({sanitizedProducts.length})</h3>
            
            {sanitizedProducts.length === 0 ? (
              <div className="text-center py-16 text-xs text-muted-text italic border border-dashed border-border rounded-xl">
                No products are classified under this event yet.
              </div>
            ) : (
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                {sanitizedProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
