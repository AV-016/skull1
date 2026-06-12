'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Eye, EyeOff, Star, AlertCircle, RefreshCw } from 'lucide-react'
import api from '@/lib/api'

interface Review {
  id: string
  rating: number
  comment: string | null
  isHidden: boolean
  createdAt: string
  user: {
    id: string
    name: string | null
  }
  product?: {
    id: string
    name: string
    slug: string
  }
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/admin/reviews?limit=100')
      if (response.data?.success && response.data?.data) {
        setReviews(response.data.data)
      } else {
        setError('Failed to load reviews data.')
      }
    } catch (err: any) {
      console.error('Error fetching admin reviews:', err)
      setError(err.response?.data?.message || 'Error occurred while fetching reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleToggleVisibility = async (reviewId: string, currentHidden: boolean) => {
    try {
      setActioningId(reviewId)
      const action = currentHidden ? 'show' : 'hide'
      const response = await api.patch(`/admin/reviews/${reviewId}/${action}`)
      
      if (response.data?.success) {
        setReviews(prev =>
          prev.map(rev =>
            rev.id === reviewId ? { ...rev, isHidden: !currentHidden } : rev
          )
        )
      }
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${currentHidden ? 'show' : 'hide'} review`)
    } finally {
      setActioningId(null)
    }
  }

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-2">Reviews Moderation</h1>
            <p className="text-muted text-sm mt-1">Manage and moderate customer reviews across the platform</p>
          </div>
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="p-2 bg-secondary border border-border hover:border-primary/20 rounded-lg smooth-transition disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-secondary-text">Loading reviews...</p>
          </div>
        ) : error ? (
          <div className="glass-card p-6 border-red-500/20 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <p className="text-destructive font-medium">{error}</p>
            <button onClick={fetchReviews} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/95 text-sm font-semibold smooth-transition">
              Try Again
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="glass-card p-12 text-center text-secondary-text">
            No reviews have been submitted by users yet.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className={`glass-card p-6 border smooth-transition ${review.isHidden ? 'opacity-70 border-border bg-black/10' : 'border-border'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-primary-text text-base">
                      {review.product?.name || 'Unknown Product'}
                    </h3>
                    <p className="text-xs text-muted-text mt-0.5">
                      Submitted by <span className="font-semibold">{review.user?.name || 'Anonymous'}</span> on {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      review.isHidden ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' : 'bg-green-500/15 text-green-400 border border-green-500/20'
                    }`}>
                      {review.isHidden ? 'Hidden' : 'Visible'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1.5 mb-3 text-primary">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating ? 'fill-primary text-primary' : 'text-white/10'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-secondary-text ml-1.5 font-semibold">({review.rating} / 5)</span>
                </div>

                <p className="text-secondary-text text-sm italic leading-relaxed mb-5">
                  "{review.comment || 'No comment provided.'}"
                </p>

                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <button
                    disabled={actioningId === review.id}
                    onClick={() => handleToggleVisibility(review.id, review.isHidden)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 smooth-transition cursor-pointer disabled:opacity-50 ${
                      review.isHidden 
                        ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/25' 
                        : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/25'
                    }`}
                  >
                    {review.isHidden ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Show Review
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  )
}
