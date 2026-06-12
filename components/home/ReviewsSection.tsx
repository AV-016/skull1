'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { api } from '@/lib/api'

interface ReviewCard {
  id: string
  name: string
  location: string
  avatar: string
  rating: number
  text: string
}

export const ReviewsSection = () => {
  const [reviewsList, setReviewsList] = useState<any[]>([])
  
  const reviews: ReviewCard[] = [
    {
      id: 'rev_1',
      name: 'Rajesh Kumar',
      location: 'Mumbai',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      text: 'The detailing on the Shogun anime figurine is spectacular. The resin is extremely solid, and the layer lines are virtually invisible. Worth every rupee!'
    },
    {
      id: 'rev_2',
      name: 'Sneha Mehta',
      location: 'Bangalore',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      text: 'Super fast custom order turnaround! Uploaded my brackets, received the quote in 30 minutes, and the finished print was at my desk in 3 days.'
    },
    {
      id: 'rev_3',
      name: 'Amit Patel',
      location: 'Ahmedabad',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      text: 'Exceptional dimensional accuracy on the planetary gear reducer. The ABS material feels industrial strength and fits our custom robotic chassis perfectly.'
    },
    {
      id: 'rev_4',
      name: 'Priya Sharma',
      location: 'Delhi',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      text: 'The parametric vases look gorgeous in my studio. The silk gold filament has this beautiful premium sheen that catches the natural light.'
    },
    {
      id: 'rev_5',
      name: 'Karan Malhotra',
      location: 'Pune',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      rating: 4,
      text: 'Extremely professional support. They caught a wall thickness error in my STL design file and helped me correct it before moving to production.'
    },
    {
      id: 'rev_6',
      name: 'Neha Roy',
      location: 'Kolkata',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      rating: 5,
      text: 'Artisan keycaps are beautiful! The resin clarity is top-notch and they fit my keyboard switches with a very satisfying mechanical click.'
    }
  ]

  useEffect(() => {
    api.get('/reviews?limit=20')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setReviewsList(res.data.data)
        }
      })
      .catch(err => console.error('Error fetching reviews:', err))
  }, [])

  const reviewsToRender = reviewsList.length > 0
    ? reviewsList.map((rev) => ({
        id: rev.id,
        name: rev.user?.name || 'Anonymous User',
        location: 'Verified Buyer',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80',
        rating: rev.rating,
        text: rev.comment || 'No comment left.'
      }))
    : reviews

  // Double the list for infinite looping effect
  const doubledReviews = [...reviewsToRender, ...reviewsToRender]

  return (
    <section className="py-24 bg-secondary border-b border-border overflow-hidden relative">
      <div className="container mx-auto px-4 md:px-6 mb-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3">Trusted By Thousands Of Customers</h2>
          <h3 className="heading-2 text-primary-text">Built For Collectors, Creators & Dreamers</h3>
        </div>
      </div>

      {/* Infinite Scrolling Marquee Wrapper */}
      <div className="relative w-full flex items-center justify-start py-4">
        {/* Soft edge blur masks */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-secondary to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-secondary to-transparent z-10 pointer-events-none" />

        {/* Marquee Body */}
        <motion.div
          animate={{ x: [0, -1920] }}
          transition={{
            x: {
              duration: 35,
              repeat: Infinity,
              ease: 'linear'
            }
          }}
          className="flex gap-6 whitespace-nowrap"
          style={{ width: 'max-content' }}
        >
          {doubledReviews.map((review, index) => (
            <div
              key={`${review.id}-${index}`}
              className="inline-block w-80 bg-card border border-border rounded-2xl p-6 shadow-xl whitespace-normal hover:border-primary/30 transition-all duration-300 group"
            >
              {/* Stars & Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating ? 'text-primary fill-primary' : 'text-muted-text/30'
                    }`}
                  />
                ))}
              </div>

              {/* Review copy */}
              <p className="text-secondary-text text-sm leading-relaxed mb-6 italic">
                "{review.text}"
              </p>

              {/* User details */}
              <div className="flex items-center gap-3 border-t border-border pt-4">
                <img
                  src={review.avatar}
                  alt={review.name}
                  className="w-10 h-10 rounded-full object-cover border border-border"
                />
                <div>
                  <h4 className="text-sm font-bold text-primary-text group-hover:text-primary transition-colors duration-300">
                    {review.name}
                  </h4>
                  <p className="text-muted-text text-[11px]">{review.location}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
