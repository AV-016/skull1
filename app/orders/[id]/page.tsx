'use client'

import { useOrderDetail, useCancelOrder, useReturnOrder } from '@/hooks/useOrders'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { LoadingSpinner } from '@/components/states/LoadingSpinner'
import { ErrorState } from '@/components/states/ErrorState'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Check, MessageSquare, X, Loader2 } from 'lucide-react'
import Script from 'next/script'

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered']

export default function OrderDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  const { data: order, isLoading, error, refetch } = useOrderDetail(orderId)
  const cancelMutation = useCancelOrder()
  const returnMutation = useReturnOrder()
  const { user, isAdmin } = useAuth()
  
  // Payment States
  const [isResumingPayment, setIsResumingPayment] = useState(false)
  const [paymentAlert, setPaymentAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const paymentSuccess = searchParams.get('payment_success') === 'true'
  const paymentError = searchParams.get('payment_error')
  const errorDesc = searchParams.get('description')

  const handlePayNow = async () => {
    try {
      setIsResumingPayment(true)
      setPaymentAlert(null)

      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        throw new Error('Razorpay SDK is still loading. Please try again in a moment.')
      }

      const paymentRes = await api.post('/payments/create-order', {
        orderId: order.id
      })
      const rzpOrder = paymentRes.data.data

      const options = {
        key: rzpOrder.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'Skulture',
        description: `Order #${rzpOrder.orderNumber}`,
        order_id: rzpOrder.razorpayOrderId,
        handler: async function (response: any) {
          try {
            setIsResumingPayment(true)
            // Verify payment signature on backend
            await api.post('/payments/verify', {
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })

            setPaymentAlert({
              type: 'success',
              message: 'Payment completed successfully! Your order is now confirmed.'
            })
            refetch()
          } catch (verifyErr: any) {
            console.error('Payment verification error:', verifyErr)
            setPaymentAlert({
              type: 'error',
              message: 'Payment verification failed. Please contact support.'
            })
          } finally {
            setIsResumingPayment(false)
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: order.address?.phone || '',
        },
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: function () {
            setIsResumingPayment(false)
            setPaymentAlert({
              type: 'error',
              message: 'Payment was cancelled.'
            })
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        console.error('Razorpay payment failed:', response.error)
        setPaymentAlert({
          type: 'error',
          message: response.error.description || 'Payment transaction failed.'
        })
        setIsResumingPayment(false)
      })
      rzp.open()
    } catch (err: any) {
      console.error('Pay Now error:', err)
      setPaymentAlert({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to initiate payment. Please try again.'
      })
      setIsResumingPayment(false)
    }
  }

  const [reviewsState, setReviewsState] = useState<Record<string, { rating: number, comment: string, images?: string[], isUploading?: boolean, submitted: boolean, error: string | null, submitting: boolean }>>({})

  // Shipping States for Admin
  const [adminCarrier, setAdminCarrier] = useState('')
  const [adminTrackingId, setAdminTrackingId] = useState('')
  const [adminTrackingUrl, setAdminTrackingUrl] = useState('')
  const [isUpdatingShipping, setIsUpdatingShipping] = useState(false)

  // Return Modal States
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [userReturnReason, setUserReturnReason] = useState('')
  const [userReturnImage, setUserReturnImage] = useState('')
  const [isReturnUploading, setIsReturnUploading] = useState(false)

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
      setAdminCarrier(order.carrier || '')
      setAdminTrackingId(order.trackingId || '')
      setAdminTrackingUrl(order.trackingUrl || '')
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

  const handleUpdateShipping = async () => {
    try {
      setIsUpdatingShipping(true)
      await api.patch(`/admin/orders/${orderId}/shipping`, {
        carrier: adminCarrier || null,
        trackingId: adminTrackingId || null,
        trackingUrl: adminTrackingUrl || null
      })
      alert('Shipping details updated successfully')
      refetch()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update shipping details')
    } finally {
      setIsUpdatingShipping(false)
    }
  }

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

  const deliveredHistory = order.statusHistory?.find(
    (h: any) => h.status.toUpperCase() === 'DELIVERED'
  )
  const deliveryDate = deliveredHistory ? new Date(deliveredHistory.createdAt) : null
  const isPastReturnWindow = deliveryDate 
    ? (new Date().getTime() - deliveryDate.getTime()) > (3 * 24 * 60 * 60 * 1000) 
    : false

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

        {/* Payment Query Param / Resume Alerts */}
        {(paymentSuccess || paymentAlert?.type === 'success') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-xs text-green-400 font-semibold flex items-center gap-2"
          >
            <span>✓</span>
            <p>{paymentAlert?.message || 'Payment completed successfully! Your order is now confirmed.'}</p>
          </motion.div>
        )}

        {(paymentError || paymentAlert?.type === 'error') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 font-semibold flex items-center gap-2"
          >
            <span>🚨</span>
            <p>
              {paymentAlert?.message || 
               (paymentError === 'cancelled' 
                 ? 'Payment was cancelled. Please complete payment now to process your order.' 
                 : `Payment failed: ${decodeURIComponent(errorDesc || 'Please try again.')}`)}
            </p>
          </motion.div>
        )}

        {/* Policy Notification Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-xs text-secondary-text space-y-1"
        >
          <p className="font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider text-[10px]">Cancellation & Return Policy:</p>
          <p>• Orders **cannot be canceled** after they have been shipped (Status: Shipped or Delivered).</p>
          <p>• Returns are only permitted within **3 days** of order delivery.</p>
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

            {order.paymentStatus === 'PENDING' && order.paymentMethod === 'CARD' && order.status === 'PENDING' && (
              <Button
                disabled={isResumingPayment}
                onClick={handlePayNow}
                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white cursor-pointer font-bold flex items-center justify-center gap-2 border-green-600"
              >
                {isResumingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Pay Now (Online)</span>
                )}
              </Button>
            )}

            {order.status?.toUpperCase() !== 'DELIVERED' && order.status?.toUpperCase() !== 'SHIPPED' && order.status?.toUpperCase() !== 'CANCELLED' && 
            order.status?.toUpperCase() !== 'RETURN_REQUESTED' && order.status?.toUpperCase() !== 'RETURNED' && 
            order.status?.toUpperCase() !== 'RETURN_REJECTED' && (
              <Button
                variant="outline"
                className="w-full mt-3 border-border text-primary-text hover:bg-secondary cursor-pointer font-bold"
                onClick={() => cancelMutation.mutate(orderId)}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
              </Button>
            )}

            {order.status?.toUpperCase() === 'DELIVERED' && (
              <div className="mt-3 space-y-2">
                <Button
                  variant="outline"
                  className="w-full border-red-500/20 hover:border-red-500 text-red-500 hover:bg-red-500/5 cursor-pointer font-bold"
                  disabled={isPastReturnWindow}
                  onClick={() => setIsReturnModalOpen(true)}
                >
                  Request Return
                </Button>
                {isPastReturnWindow && (
                  <p className="text-[10px] text-red-400 text-center font-medium mt-1">
                    Return window closed (3 days elapsed since delivery)
                  </p>
                )}
              </div>
            )}

            {order.status?.toUpperCase() === 'RETURN_REQUESTED' && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-bold text-center">
                Return Requested (Pending Review)
              </div>
            )}

            {order.status?.toUpperCase() === 'RETURNED' && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs font-bold text-center">
                Order Returned & Refunded
              </div>
            )}

            {order.status?.toUpperCase() === 'RETURN_REJECTED' && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold text-center">
                Return Request Rejected
              </div>
            )}
          </motion.div>
        </div>

        {/* Tracking Details */}
        {(order.trackingId || order.carrier || order.trackingUrl) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-8 bg-card border border-primary/20 mb-8"
          >
            <h3 className="text-lg font-bold text-primary-text mb-4">Tracking Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <p className="text-secondary-text font-semibold uppercase tracking-wider text-[10px]">Carrier</p>
                <p className="text-primary-text font-bold mt-1 text-sm">{order.carrier || 'Standard Shipping'}</p>
              </div>
              <div>
                <p className="text-secondary-text font-semibold uppercase tracking-wider text-[10px]">Tracking Number</p>
                <p className="text-primary-text font-bold mt-1 text-sm select-all">{order.trackingId || 'N/A'}</p>
              </div>
            </div>
            {(order.trackingUrl || order.trackingId) && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <a
                  href={
                    order.trackingUrl ||
                    (order.carrier?.toLowerCase().includes('fedex')
                      ? `https://www.fedex.com/apps/fedextrack/?tracknumbers=${order.trackingId}`
                      : order.carrier?.toLowerCase().includes('dhl')
                      ? `https://www.dhl.com/en/express/tracking.html?AWB=${order.trackingId}`
                      : order.carrier?.toLowerCase().includes('ups')
                      ? `https://www.ups.com/track?tracknum=${order.trackingId}`
                      : `https://track.delhivery.com/track/shipping-packages?filter_id=${order.trackingId}`)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                >
                  Track Order External Link →
                </a>
              </div>
            )}
          </motion.div>
        )}

        {/* Return Details View (Visible to Admin & Customer if status is return-related) */}
        {(order.status?.toUpperCase() === 'RETURN_REQUESTED' || order.status?.toUpperCase() === 'RETURNED' || order.status?.toUpperCase() === 'RETURN_REJECTED') && (order.returnReason || order.returnImage) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-8 bg-card border border-red-500/20 mb-8 space-y-4"
          >
            <h3 className="text-lg font-bold text-red-500 uppercase tracking-wider">Return Request Details</h3>
            <div className="space-y-4 text-xs">
              <div>
                <p className="text-secondary-text font-semibold uppercase tracking-wider text-[10px]">Return Reason</p>
                <p className="text-primary-text mt-1 text-sm bg-secondary/50 p-4 border border-border/40 rounded-lg whitespace-pre-wrap">
                  {order.returnReason || 'No reason provided.'}
                </p>
              </div>
              {order.returnImage && (
                <div>
                  <p className="text-secondary-text font-semibold uppercase tracking-wider text-[10px] mb-2">Product Image Proof</p>
                  <a href={order.returnImage} target="_blank" rel="noopener noreferrer" className="inline-block border border-border hover:border-primary/50 rounded-lg overflow-hidden group smooth-transition">
                    <img 
                      src={order.returnImage} 
                      alt="Return Proof" 
                      className="max-w-xs max-h-64 object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Admin Shipping Controls */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-8 bg-card border border-amber-500/20 mb-8 space-y-4"
          >
            <h3 className="text-lg font-bold text-amber-500 uppercase tracking-wider">Admin: Update Shipping Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Carrier Name</label>
                <input
                  type="text"
                  placeholder="e.g. FedEx, DHL, Delivery"
                  value={adminCarrier}
                  onChange={(e) => setAdminCarrier(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 text-xs rounded"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Tracking Number</label>
                <input
                  type="text"
                  placeholder="e.g. 1234567890"
                  value={adminTrackingId}
                  onChange={(e) => setAdminTrackingId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 text-xs rounded"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">External Tracking URL</label>
                <input
                  type="url"
                  placeholder="e.g. https://track.example.com"
                  value={adminTrackingUrl}
                  onChange={(e) => setAdminTrackingUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 text-xs rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                onClick={handleUpdateShipping}
                disabled={isUpdatingShipping}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 border-amber-600 cursor-pointer"
              >
                {isUpdatingShipping ? 'Saving...' : 'Save Shipping Info'}
              </Button>
            </div>
          </motion.div>
        )}

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

      {/* Return Request Modal */}
      <AnimatePresence>
        {isReturnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReturnModalOpen(false)}
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
                  <h3 className="font-bold text-sm uppercase tracking-widest text-primary-text">
                    Request Product Return
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="text-muted-text hover:text-primary-text smooth-transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!userReturnReason.trim()) {
                    alert('Please enter a return reason')
                    return
                  }
                  if (!userReturnImage) {
                    alert('Please upload a proof image of the product')
                    return
                  }
                  try {
                    await returnMutation.mutateAsync({
                      orderId,
                      reason: userReturnReason,
                      image: userReturnImage
                    })
                    alert('Return request submitted successfully')
                    setIsReturnModalOpen(false)
                    setUserReturnReason('')
                    setUserReturnImage('')
                  } catch (err: any) {
                    alert(err.response?.data?.message || 'Failed to submit return request')
                  }
                }}
                className="space-y-4 text-xs"
              >
                <div className="p-3 bg-secondary/40 border border-border/50 rounded-lg">
                  <p className="font-bold text-xs text-primary-text">Order Number: #{order.orderNumber || order.id}</p>
                </div>

                {/* Return Reason */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Reason for Return (Mandatory)</label>
                  <textarea
                    required
                    rows={4}
                    value={userReturnReason}
                    onChange={(e) => setUserReturnReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 resize-none rounded-lg"
                    placeholder="Describe the issue, defect, or reason for return in detail..."
                  />
                </div>

                {/* Return Proof Image Upload */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">
                    Upload Product Image Proof (Mandatory)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      id="return-image-upload"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          setIsReturnUploading(true)
                          const uploadFormData = new FormData()
                          uploadFormData.append('file', file)
                          const res = await api.post('/upload/image', uploadFormData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                          })
                          if (res.data?.success && res.data?.data?.url) {
                            setUserReturnImage(res.data.data.url)
                          } else {
                            alert('Failed to extract uploaded image URL')
                          }
                        } catch (err) {
                          console.error('Error uploading return image:', err)
                          alert('Error uploading image to server')
                        } finally {
                          setIsReturnUploading(false)
                        }
                      }}
                    />
                    <label
                      htmlFor="return-image-upload"
                      className="cursor-pointer px-4 py-2 bg-secondary hover:bg-secondary/80 border border-dashed border-border hover:border-primary/50 text-[10px] text-primary-text font-bold rounded smooth-transition flex items-center gap-1.5"
                    >
                      {isReturnUploading ? 'Uploading...' : 'Upload Image'}
                    </label>
                  </div>

                  {userReturnImage && (
                    <div className="relative w-24 h-24 border border-border rounded overflow-hidden mt-2">
                      <img src={userReturnImage} alt="Return Proof" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setUserReturnImage('')}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-1 text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit / Cancel */}
                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReturnModalOpen(false)}
                    className="px-5 py-2.5 border border-border text-primary-text hover:bg-secondary smooth-transition uppercase tracking-widest text-[10px] font-bold cursor-pointer"
                    disabled={returnMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={returnMutation.isPending || isReturnUploading}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white smooth-transition uppercase tracking-widest text-[10px] font-bold flex items-center gap-2 cursor-pointer rounded"
                  >
                    {returnMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </main>
  )
}
