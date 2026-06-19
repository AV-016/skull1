'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import api from '@/lib/api'

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
    <span className="font-bold bg-primary/25 text-primary border border-primary/20 px-3 py-1 rounded text-xs uppercase tracking-wider animate-pulse">
      {timeLeft}
    </span>
  )
}

export function EventBannerSection() {
  const [activeEvents, setActiveEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActiveEvents = async () => {
      try {
        const res = await api.get('/events/active')
        setActiveEvents(res.data?.data || [])
      } catch (e) {
        console.error('Error fetching active events:', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchActiveEvents()
  }, [])

  if (isLoading || activeEvents.length === 0) return null

  return (
    <section className="py-6 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="space-y-6">
          {activeEvents.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden rounded-2xl border border-primary/20 bg-secondary/20 p-6 md:p-8 shadow-xl flex flex-col gap-6"
            >
              {/* Banner background with premium gradient overlay */}
              {event.bannerUrl && (
                <div 
                  className="absolute inset-0 bg-cover bg-center pointer-events-none transition-opacity duration-300 z-0"
                  style={{ 
                    backgroundImage: `linear-gradient(to right, rgba(18, 19, 26, 0.95) 40%, rgba(18, 19, 26, 0.6) 70%, rgba(18, 19, 26, 0.25) 100%), url(${event.bannerUrl})` 
                  }}
                />
              )}
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Event Info */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-primary text-white text-[9px] font-black px-2.5 py-1 uppercase tracking-widest rounded">Active Promo</span>
                    <EventCountdown endDate={event.endDate} />
                  </div>
                  
                  <h2 className="text-xl md:text-2xl font-black text-primary-text uppercase tracking-wide">
                    {event.title}
                  </h2>
                  
                  <p className="text-xs text-muted-text leading-relaxed max-w-xl">
                    {event.description}
                  </p>
                  
                  <div className="pt-2">
                    <Link 
                      href={`/events/${event.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-[10px] uppercase tracking-wider rounded transition-all shadow-md cursor-pointer"
                    >
                      Explore Event Items →
                    </Link>
                  </div>
                </div>

                {/* Associated Event Products Showcase */}
                {event.products && event.products.length > 0 && (
                  <div className="lg:col-span-5 space-y-2.5">
                    <h4 className="text-[9px] font-black text-secondary-text uppercase tracking-widest">Featured Promo items</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {event.products.slice(0, 2).map((prod: any) => {
                        const primaryImg = prod.images?.find((img: any) => img.isPrimary)?.url || prod.image || '/placeholder.jpg'
                        return (
                          <Link 
                            href={`/products/${prod.slug}`} 
                            key={prod.id}
                            className="group p-2.5 bg-background border border-border/80 hover:border-primary/45 rounded-xl smooth-transition flex items-center gap-3 cursor-pointer shadow-sm"
                          >
                            <div className="w-10 h-10 rounded border border-border overflow-hidden bg-secondary flex-shrink-0">
                              <img 
                                src={primaryImg} 
                                alt={prod.name} 
                                className="w-full h-full object-cover group-hover:scale-105 smooth-transition" 
                              />
                            </div>
                            <div className="overflow-hidden flex-1 text-xs">
                              <p className="font-bold text-[11px] text-primary-text truncate group-hover:text-primary smooth-transition leading-tight">{prod.name}</p>
                              <p className="text-[9px] text-muted-text capitalize mt-0.5">{prod.category?.name || 'Category'}</p>
                              <p className="text-xs font-black text-primary mt-1">₹{prod.price}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
