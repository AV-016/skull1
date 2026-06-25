'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import api from '@/lib/api'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const EventCountdown = ({ endDate, themeColor }: { endDate: string, themeColor?: string }) => {
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

  // Helper to convert hex to RGBA for transparent backgrounds
  const getRgba = (hex: string, alpha: number) => {
    if (!hex) return '';
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return (
    <span 
      className="font-bold px-3 py-1 rounded text-xs uppercase tracking-wider animate-pulse border"
      style={{
        backgroundColor: themeColor ? getRgba(themeColor, 0.2) : 'rgba(var(--primary-rgb), 0.25)',
        color: themeColor || 'var(--primary)',
        borderColor: themeColor ? getRgba(themeColor, 0.3) : 'rgba(var(--primary-rgb), 0.2)'
      }}
    >
      {timeLeft}
    </span>
  )
}

export function EventBannerSection() {
  const [activeEvents, setActiveEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

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

  useEffect(() => {
    if (activeEvents.length <= 1) return
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % activeEvents.length)
    }, 6000) // auto-scroll every 6 seconds
    return () => clearInterval(timer)
  }, [activeEvents.length])

  if (isLoading || activeEvents.length === 0) return null

  const handleNext = () => {
    if (activeEvents.length <= 1) return
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % activeEvents.length)
  }

  const handlePrev = () => {
    if (activeEvents.length <= 1) return
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + activeEvents.length) % activeEvents.length)
  }

  const handleDotClick = (index: number) => {
    if (index === currentIndex) return
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  const currentEvent = activeEvents[currentIndex]

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0
    })
  }

  return (
    <section className="py-12 bg-background border-b border-border relative">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Heading matching item sections */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-2">Active Promotions</h2>
          <h3 className="heading-2 text-primary-text">Special Events & Offers</h3>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/20 shadow-lg group transition-all duration-300">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="relative p-6 md:p-8 flex flex-col gap-6 min-h-[280px] w-full"
            >
              {/* Banner background with gradient overlay constrained to the text area */}
              {currentEvent.bannerUrl && (
                <div 
                  className="absolute inset-0 bg-cover bg-center pointer-events-none transition-opacity duration-300 z-0"
                  style={{ 
                    backgroundImage: `linear-gradient(to right, rgba(18, 19, 26, 0.95) 35%, rgba(18, 19, 26, 0.8) 45%, rgba(18, 19, 26, 0) 65%), url(${currentEvent.bannerUrl})` 
                  }}
                />
              )}
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Event Info */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span 
                      className="text-white text-[9px] font-black px-2.5 py-1 uppercase tracking-widest rounded"
                      style={{ backgroundColor: currentEvent.themeColor || 'var(--primary)' }}
                    >
                      Active Promo
                    </span>
                    <EventCountdown endDate={currentEvent.endDate} themeColor={currentEvent.themeColor} />
                  </div>
                  
                  <h2 className="text-xl md:text-2xl font-black text-primary-text uppercase tracking-wide">
                    {currentEvent.title}
                  </h2>
                  
                  <p 
                    className="text-xs leading-relaxed max-w-xl font-medium"
                    style={{ color: currentEvent.themeColor || 'var(--muted-text)', opacity: currentEvent.themeColor ? 0.9 : undefined }}
                  >
                    {currentEvent.description}
                  </p>
                  
                  <div className="pt-2">
                    <Link 
                      href={`/events/${currentEvent.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-white font-bold text-[10px] uppercase tracking-wider rounded transition-all shadow-md cursor-pointer"
                      style={{ backgroundColor: currentEvent.themeColor || 'var(--primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = currentEvent.themeColor 
                          ? `${currentEvent.themeColor}dd` 
                          : 'var(--primary-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = currentEvent.themeColor || 'var(--primary)';
                      }}
                    >
                      Explore Event Items →
                    </Link>
                  </div>
                </div>

                {/* Associated Event Products Showcase */}
                {currentEvent.products && currentEvent.products.length > 0 && (
                  <div className="lg:col-span-5 space-y-2.5 lg:max-w-[280px] lg:ml-auto w-full">
                    <h4 className="text-[9px] font-black text-secondary-text uppercase tracking-widest">Featured Promo items</h4>
                    <div className="flex flex-col gap-3">
                      {currentEvent.products.slice(0, 2).map((prod: any) => {
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
          </AnimatePresence>

          {/* Navigation Arrows */}
          {activeEvents.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 hover:bg-background border border-border/40 hover:border-primary/50 text-primary-text smooth-transition opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shadow"
                aria-label="Previous event"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 hover:bg-background border border-border/40 hover:border-primary/50 text-primary-text smooth-transition opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shadow"
                aria-label="Next event"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Pagination Indicators / Dots */}
          {activeEvents.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
              {activeEvents.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDotClick(idx)}
                  className={`w-2 h-2 rounded-full smooth-transition cursor-pointer ${
                    idx === currentIndex 
                      ? 'bg-primary w-4' 
                      : 'bg-primary-text/30 hover:bg-primary-text/60'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

