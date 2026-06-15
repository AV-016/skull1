'use client'

import { useOrderDetail, useCancelOrder } from '@/hooks/useOrders'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { LoadingSpinner } from '@/components/states/LoadingSpinner'
import { ErrorState } from '@/components/states/ErrorState'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Check, MessageSquare, X } from 'lucide-react'

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered']

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string
  const { data: order, isLoading, error, refetch } = useOrderDetail(orderId)
  const cancelMutation = useCancelOrder()
  const { user } = useAuth()
  
  const [reviewsState, setReviewsState] = useState<Record<string, { rating: number, comment: string, images?: string[], isUploading?: boolean, submitted: boolean, error: string | null, submitting: boolean }>>({})

  // Support Modal States
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [supportFormData, setSupportFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [isSupportSubmitting, setIsSupportSubmitting] = useState(false)
  const [supportSuccess, setSupportSuccess] = useState(false)

  // Initialize subject once order is loaded
  useEffect(() => {
    if (order) {
      setSupportFormData(prev => ({
        ...prev,
        subject: `Order Support: #${order.orderNumber || order.id}`
      }))
    }
  }, [order])

  // Prefill details
  useEffect(() => {
    if (user) {
      setSupportFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }))
    }
  }, [user])

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSupportSubmitting(true)
      await api.post('/inquiries', {
        name: supportFormData.name,
        email: supportFormData.email,
        subject: supportFormData.subject,
        message: supportFormData.message,
        orderId: orderId,
        userId: user?.id || undefined
      })
      setSupportSuccess(true)
      setTimeout(() => {
        setIsSupportModalOpen(false)
        setSupportSuccess(false)
        setSupportFormData(prev => ({ ...prev, message: '' }))
      }, 2000)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit support request')
    } finally {
      setIsSupportSubmitting(false)
    }
  }

  const handleReviewSubmit = async (productId: string) => {
    const state = reviewsState[productId] || { rating: 5, comment: '', images: [], submitted: false, error: null, submitting: false }
    
    setReviewsState(prev => ({
      ...prev,
      [productId]: { ...state, submitting: true, error: null }
    }))

    try {
      await api.post(`/products/${productId}/reviews`, {
        rating: state.rating,
        comment: state.comment,
        images: state.images || []
      })
      setReviewsState(prev => ({
        ...prev,
        [productId]: { ...state, submitting: false, submitted: true }
      }))
    } catch (err: any) {
      console.error('Review submit failed:', err)
      setReviewsState(prev => ({
        ...prev,
        [productId]: { 
          ...state, 
          submitting: false, 
          error: err.response?.data?.message || 'Failed to submit review' 
        }
      }))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-primary-text transition-colors duration-300">
        <Navbar />
        <LoadingSpinner text="Loading order details..." />
        <Footer />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background text-primary-text transition-colors duration-300">
        <Navbar />
        <ErrorState 
          title="Order Not Found"
          message="We couldn't find this order. Please check the order ID and try again."
          onRetry={() => refetch()}
        />
        <Footer />
      </div>
    )
  }

  const currentStatusIndex = ORDER_STATUSES.indexOf((order.status || 'pending').toLowerCase())

  const subtotal = order.totalAmount || 0
  const shipping = 0
  const total = subtotal + shipping

  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Link href="/orders" className="text-sm text-muted-text hover:text-primary mb-4 inline-block font-semibold">
            ← Back to Orders
          </Link>
          <h1 className="heading-2 text-primary-text mb-2">
            {order.items?.map((item: any) => item.name).join(', ') || 'Order'}
          </h1>
          <p className="text-sm text-muted-text mb-2">
            order id: #{order.orderNumber || order.id}
          </p>
          <p className="text-xs text-secondary-text">Placed on {formatDate(order.createdAt)}</p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3 mb-12">
          {/* Order Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 glass-card p-8"
          >
            <h2 className="text-xl font-bold text-primary-text mb-6">Order Items</h2>
            <div className="space-y-4">
              {order.items?.map((item: any, idx: number) => {
                const review = reviewsState[item.productId] || { rating: 5, comment: '', images: [] as string[], isUploading: false, submitted: false, error: null, submitting: false }
                
                return (
                  <div key={idx} className="py-6 border-b border-border last:border-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-primary-text">{item.name}</p>
                        <p className="text-sm text-muted-text">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-primary-text">{formatCurrency(item.price * item.quantity)}</p>
                    </div>

                    {/* Review Section */}
                    {order.status?.toUpperCase() === 'DELIVERED' && (
                      <div className="mt-4 p-4 bg-secondary/35 rounded-lg border border-border/50">
                        {review.submitted ? (
                          <p className="text-xs text-green-500 font-semibold flex items-center gap-1.5">
                            <Check className="w-4 h-4" /> Thank you! Your review has been submitted.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-primary-text uppercase tracking-wider">Write a Product Review</p>
                            
                            {/* Stars */}
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewsState(prev => ({
                                    ...prev,
                                    [item.productId]: { ...review, rating: star }
                                  }))}
                                  className="text-amber-400 hover:scale-110 transition-transform cursor-pointer text-lg"
                                >
                                  {star <= review.rating ? '★' : '☆'}
                                </button>
                              ))}
                            </div>

                            <textarea
                              placeholder="Share your thoughts about this product..."
                              value={review.comment}
                              onChange={(e) => setReviewsState(prev => ({
                                ...prev,
                                [item.productId]: { ...review, comment: e.target.value }
                              }))}
                              className="w-full min-h-[60px] p-2 bg-background border border-border rounded-lg text-primary-text text-xs focus:outline-none focus:border-primary"
                            />

                            {/* Attach Images */}
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">
                                Attach Images ({review.images?.length || 0}/4)
                              </label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  id={`review-upload-${item.productId}`}
                                  className="hidden"
                                  onChange={async (e) => {
                                    const files = e.target.files
                                    if (!files || files.length === 0) return
                                    const remaining = 4 - (review.images?.length || 0)
                                    if (remaining <= 0) {
                                      alert('Max 4 images allowed per review')
                                      return
                                    }
                                    
                                    const filesToUpload = Array.from(files).slice(0, remaining)
                                    
                                    setReviewsState(prev => ({
                                      ...prev,
                                      [item.productId]: { ...review, isUploading: true }
                                    }))

                                    const uploadedUrls = [...(review.images || [])]
                                    for (const file of filesToUpload) {
                                      if (!file.type.startsWith('image/')) continue
                                      try {
                                        const uploadFormData = new FormData()
                                        uploadFormData.append('file', file)
                                        const res = await api.post('/upload/review-image', uploadFormData, {
                                          headers: { 'Content-Type': 'multipart/form-data' }
                                        })
                                        if (res.data?.success && res.data?.data?.url) {
                                          uploadedUrls.push(res.data.data.url)
                                        }
                                      } catch (err) {
                                        console.error('Error uploading review image:', err)
                                      }
                                    }
                                    
                                    setReviewsState(prev => ({
                                      ...prev,
                                      [item.productId]: { ...review, images: uploadedUrls, isUploading: false }
                                    }))
                                  }}
                                />
                                <label
                                  htmlFor={`review-upload-${item.productId}`}
                                  className="cursor-pointer px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-dashed border-border hover:border-primary/50 text-[10px] text-primary-text font-bold rounded smooth-transition flex items-center gap-1.5"
                                >
                                  {review.isUploading ? 'Uploading...' : 'Upload Images'}
                                </label>
                              </div>

                              {/* Uploaded review images preview */}
                              {review.images && review.images.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {review.images.map((url: string, imgIdx: number) => (
                                    <div key={imgIdx} className="relative w-12 h-12 border border-border rounded overflow-hidden group">
                                      <img src={url} alt="" className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedUrls = (review.images || []).filter((_: string, i: number) => i !== imgIdx)
                                          setReviewsState(prev => ({
                                            ...prev,
                                            [item.productId]: { ...review, images: updatedUrls }
                                          }))
                                        }}
                                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 smooth-transition text-white cursor-pointer"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {review.error && (
                              <p className="text-[10px] text-red-500">{review.error}</p>
                            )}

                            <button
                              type="button"
                              disabled={review.submitting || review.isUploading}
                              onClick={() => handleReviewSubmit(item.productId)}
                              className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded smooth-transition cursor-pointer disabled:opacity-50"
                            >
                              {review.submitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-border space-y-4">
              <div className="flex justify-between">
                <span className="text-secondary-text">Subtotal</span>
                <span className="font-medium text-primary-text">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-text">Shipping</span>
                <span className="font-medium text-primary-text">{formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-4 border-t border-border text-primary-text">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </motion.div>

          {/* Order Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 bg-card"
          >
            <h3 className="font-bold text-primary-text mb-6">Status</h3>
            <div className="space-y-4">
              {ORDER_STATUSES.map((status, idx) => (
                <div key={status} className="flex items-center gap-4">
                  <div className={`h-3 w-3 rounded-full ${idx <= currentStatusIndex ? 'bg-primary ring-2 ring-primary/20' : 'bg-muted-text/30'}`} />
                  <span className={idx <= currentStatusIndex ? 'text-primary-text capitalize font-semibold' : 'text-muted-text capitalize'}>
                    {status}
                  </span>
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-6 bg-primary text-white hover:bg-primary/90 cursor-pointer font-bold flex items-center justify-center gap-2 border-primary"
              onClick={() => setIsSupportModalOpen(true)}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Get Support</span>
            </Button>

            {order.status !== 'delivered' && order.status !== 'CANCELLED' && (
              <Button
                variant="outline"
                className="w-full mt-3 border-border text-primary-text hover:bg-secondary cursor-pointer font-bold"
                onClick={() => cancelMutation.mutate(orderId)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            )}
          </motion.div>
        </div>

        {/* Shipping Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8 bg-card"
        >
          <h3 className="text-lg font-bold text-primary-text mb-6">Shipping Address</h3>
          {order.address ? (
            <div className="text-secondary-text space-y-1">
              <p className="font-semibold text-primary-text">{user?.name || 'Customer'}</p>
              <p>{order.address.street}</p>
              <p>{order.address.city}, {order.address.state} {order.address.postalCode}</p>
              <p>{order.address.country}</p>
            </div>
          ) : (
            <p className="text-muted-text text-sm">No address details available</p>
          )}
        </motion.div>
      </div>

      {/* Support Ticket Modal */}
      <AnimatePresence>
        {isSupportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSupportModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-popover border border-border p-6 shadow-2xl z-10 space-y-6 max-h-[95vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-sm uppercase tracking-widest text-primary-text">
                    Order Support Inquiry
                  </h3>
                </div>
                <button
                  onClick={() => setIsSupportModalOpen(false)}
                  className="text-muted-text hover:text-primary-text smooth-transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {supportSuccess ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                  <h4 className="font-bold text-sm text-green-400">Inquiry Created</h4>
                  <p className="text-xs text-muted-text">We have created a support ticket thread. You can check replies in your dashboard.</p>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="space-y-4 text-xs">
                  <div className="p-3 bg-secondary/40 border border-border/50 rounded-lg">
                    <p className="font-bold text-xs text-primary-text">Order Number: #{order.orderNumber || order.id}</p>
                    <p className="text-[10px] text-muted-text mt-1 uppercase tracking-widest">Total Amount: {formatCurrency(order.totalAmount || order.total)}</p>
                  </div>

                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Your Name</label>
                    <input
                      type="text"
                      required
                      value={supportFormData.name}
                      onChange={(e) => setSupportFormData({ ...supportFormData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50"
                      disabled={isSupportSubmitting}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Your Email</label>
                    <input
                      type="email"
                      required
                      value={supportFormData.email}
                      onChange={(e) => setSupportFormData({ ...supportFormData, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50"
                      disabled={isSupportSubmitting}
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Subject</label>
                    <input
                      type="text"
                      required
                      value={supportFormData.subject}
                      onChange={(e) => setSupportFormData({ ...supportFormData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50"
                      disabled={isSupportSubmitting}
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Describe your issue / question</label>
                    <textarea
                      required
                      rows={4}
                      value={supportFormData.message}
                      onChange={(e) => setSupportFormData({ ...supportFormData, message: e.target.value })}
                      className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 resize-none"
                      placeholder="Ask questions about shipping status, payment issues, transaction details..."
                      disabled={isSupportSubmitting}
                    />
                  </div>

                  {/* Submit */}
                  <div className="pt-3 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsSupportModalOpen(false)}
                      className="px-5 py-2.5 border border-border text-primary-text hover:bg-secondary smooth-transition uppercase tracking-widest text-[10px] font-bold cursor-pointer"
                      disabled={isSupportSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSupportSubmitting}
                      className="px-6 py-2.5 bg-primary text-white hover:bg-primary/95 smooth-transition uppercase tracking-widest text-[10px] font-bold flex items-center gap-2 cursor-pointer"
                    >
                      {isSupportSubmitting ? 'Sending...' : 'Send Inquiry'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  )
}
