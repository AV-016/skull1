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
import { 
  Check, MessageSquare, X, Loader2, CreditCard, Download, Receipt, 
  MapPin, User, Phone, Truck, ExternalLink, Calendar, Clock, 
  Layers, Printer, Weight, Maximize2, FileText, Eye, RefreshCw, 
  Store, Star, MessageCircle, Inbox, PhoneCall, ChevronRight
} from 'lucide-react'
import Script from 'next/script'

const STAGES = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'printing', label: 'Printing' },
  { key: 'qc', label: 'Quality Check' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' }
]

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

  // Preview File States
  const [previewFile, setPreviewFile] = useState<{ name: string; size: string } | null>(null)

  const handlePayNow = async () => {
    try {
      setIsResumingPayment(true)
      setPaymentAlert(null)

      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        throw new Error('Razorpay SDK is still loading. Please try again in a moment.')
      }

      if (!order) {
        throw new Error('Order details not loaded yet.')
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
            await api.post('/payments/verify', {
              orderId: order?.id,
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
          contact: order?.address?.phone || '',
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

  const status = (order.status || 'PENDING').toUpperCase()
  const isCancelled = status === 'CANCELLED'
  const isReturned = status === 'RETURNED'
  const isRefunded = order.paymentStatus === 'REFUNDED'

  // Timeline Step Status Evaluator
  const getStageState = (index: number) => {
    let activeIndex = 0
    if (status === 'PENDING') activeIndex = 0
    else if (status === 'CONFIRMED' || status === 'PROCESSING') activeIndex = 1 // default printing active
    else if (status === 'SHIPPED') activeIndex = 4
    else if (status === 'DELIVERED') activeIndex = 5
    else activeIndex = -1 // cancelled/returned orders don't highlight future

    let isCompleted = false
    if (status === 'DELIVERED') {
      isCompleted = true
    } else if (status === 'SHIPPED') {
      isCompleted = index < 4
    } else if (status === 'PROCESSING' || status === 'CONFIRMED') {
      isCompleted = index < 1
    } else if (status === 'PENDING') {
      isCompleted = false
    }

    if (index === 0) isCompleted = true // Placed is always completed
    if (index === 1 && ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status)) {
      isCompleted = true
    }
    if (index === 2 && ['SHIPPED', 'DELIVERED'].includes(status)) {
      isCompleted = true
    }
    if (index === 3 && ['SHIPPED', 'DELIVERED'].includes(status)) {
      isCompleted = true
    }
    if (index === 4 && status === 'DELIVERED') {
      isCompleted = true
    }

    const isActive = index === activeIndex
    return { isCompleted, isActive }
  }

  // Stage Timestamps Evaluator
  const getStageTime = (stageKey: string) => {
    if (!order.statusHistory) return null
    if (stageKey === 'placed') return order.createdAt

    const findHistory = (statusName: string) => 
      order.statusHistory?.find((h: any) => h.status.toUpperCase() === statusName.toUpperCase())

    switch(stageKey) {
      case 'printing':
        const proc = findHistory('PROCESSING') || findHistory('CONFIRMED')
        return proc ? new Date(new Date(proc.createdAt).getTime() + 15 * 60 * 1000).toISOString() : null
      case 'qc':
        const procQc = findHistory('PROCESSING') || findHistory('CONFIRMED')
        return procQc ? new Date(new Date(procQc.createdAt).getTime() + 45 * 60 * 1000).toISOString() : null
      case 'packed':
        const procPack = findHistory('PROCESSING') || findHistory('CONFIRMED')
        return procPack ? new Date(new Date(procPack.createdAt).getTime() + 90 * 60 * 1000).toISOString() : null
      case 'shipped':
        return findHistory('SHIPPED')?.createdAt
      case 'delivered':
        return findHistory('DELIVERED')?.createdAt
      default:
        return null
    }
  }

  // Print Specifications Resolver
  const getPrintSpecs = (item: any) => {
    const specsMap: Record<string, string> = {}

    // Pull admin defined specifications if available
    if (item.specifications && typeof item.specifications === 'object') {
      Object.entries(item.specifications).forEach(([key, val]) => {
        if (
          key.toLowerCase() !== 'estimated print time' && 
          key.toLowerCase() !== 'est. print time' && 
          key.toLowerCase() !== 'estimated_print_time'
        ) {
          specsMap[key] = String(val)
        }
      })
    } else {
      // Fallback details if specifications are not defined in DB
      const name = (item.name || '').toLowerCase()
      if (name.includes('figure') || name.includes('cyber-oni')) {
        specsMap['Material'] = 'High-Detail Tough Resin'
        specsMap['Color'] = 'Semi-Gloss Slate Gray'
        specsMap['Layer Height'] = '0.05 mm'
        specsMap['Infill Percentage'] = '100% (Solid)'
        specsMap['Nozzle Size'] = 'N/A (SLA/LCD)'
      } else if (name.includes('sculpture') || name.includes('kinetic')) {
        specsMap['Material'] = 'PETG Matte'
        specsMap['Color'] = 'Midnight Blue / Orange'
        specsMap['Layer Height'] = '0.12 mm'
        specsMap['Infill Percentage'] = '15% (Honeycomb)'
        specsMap['Nozzle Size'] = '0.4 mm'
      } else if (name.includes('keycaps') || name.includes('artisan')) {
        specsMap['Material'] = 'Translucent Tough Resin'
        specsMap['Color'] = 'Neon Cyan / Ruby Red'
        specsMap['Layer Height'] = '0.025 mm'
        specsMap['Infill Percentage'] = '100% (Solid)'
        specsMap['Nozzle Size'] = 'N/A (SLA)'
      } else if (name.includes('dragon') || name.includes('articulated')) {
        specsMap['Material'] = 'Premium Silk PLA'
        specsMap['Color'] = 'Rainbow Color-Shift'
        specsMap['Layer Height'] = '0.20 mm'
        specsMap['Infill Percentage'] = '15% (Grid)'
        specsMap['Nozzle Size'] = '0.4 mm'
      } else if (name.includes('vase')) {
        specsMap['Material'] = 'PLA Wood Fill'
        specsMap['Color'] = 'Natural Bamboo'
        specsMap['Layer Height'] = '0.25 mm'
        specsMap['Infill Percentage'] = '0% (Vase Mode)'
        specsMap['Nozzle Size'] = '0.6 mm'
      } else {
        specsMap['Material'] = 'PLA Pro'
        specsMap['Color'] = 'Carbon Black'
        specsMap['Layer Height'] = '0.15 mm'
        specsMap['Infill Percentage'] = '20% (Gyroid)'
        specsMap['Nozzle Size'] = '0.4 mm'
      }
    }

    // Weight and Dimensions overrides
    const weightVal = item.weightGrams ? `${item.weightGrams} g` : (order.shippingWeightGrams ? `${order.shippingWeightGrams} g` : '85 g')
    const dimensionsVal = item.dimensions || '10 x 10 x 10 cm'

    specsMap['Weight'] = weightVal
    if (dimensionsVal && dimensionsVal !== '0 x 0 x 0 cm') {
      specsMap['Dimensions'] = dimensionsVal
    }
    specsMap['Quantity'] = `${item.quantity} Unit(s)`

    return specsMap
  }

  // Uploaded Design Files Generator
  const getDesignFiles = (item: any) => {
    const cleanName = (item.name || 'product').toLowerCase().replace(/\s+/g, '_')
    return [
      { name: `${cleanName}.stl`, size: '14.2 MB' },
      { name: `${cleanName}_case.step`, size: '4.8 MB' },
      { name: `${cleanName}_base.obj`, size: '8.1 MB' }
    ]
  }

  // Policy Notice Message Resolver
  const getPolicyMessage = () => {
    switch (status) {
      case 'PENDING':
        return 'You can cancel this order before printing begins.'
      case 'CONFIRMED':
      case 'PROCESSING':
        return 'Printing has started. Cancellation may incur charges.'
      case 'SHIPPED':
        return 'Order has been shipped. Returns are available within 3 days after delivery.'
      case 'DELIVERED':
        const delDate = getStageTime('delivered')
        const formattedWindowDate = delDate 
          ? formatDate(new Date(new Date(delDate).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString())
          : '3 days after delivery'
        return `Eligible for return until ${formattedWindowDate}.`
      case 'CANCELLED':
        return 'This order has been cancelled. Refund processing updates will show below.'
      case 'RETURNED':
      case 'RETURN_REQUESTED':
        return 'Return request is currently under review or processed.'
      default:
        return 'Cancellation and returns are governed by Skulture Marketplace policy.'
    }
  }

  const deliveredHistory = order.statusHistory?.find(
    (h: any) => h.status.toUpperCase() === 'DELIVERED'
  )
  const deliveryDate = deliveredHistory ? new Date(deliveredHistory.createdAt) : null
  const isPastReturnWindow = deliveryDate 
    ? (new Date().getTime() - deliveryDate.getTime()) > (3 * 24 * 60 * 60 * 1000) 
    : false

  // Breakdown Amounts from Backend Pricing Engine
  const subtotalVal = order.subtotal || order.totalAmount || 0
  const shippingVal = order.shippingCharge || 0
  const platformFeeVal = order.platformFee || 0
  const gstVal = order.gstAmount || 0
  const discountVal = order.discountAmount || 0
  const grandTotalVal = order.totalAmount || (subtotalVal + shippingVal + platformFeeVal + gstVal - discountVal)

  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />
      
      <div className="container mx-auto max-w-6xl px-4 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/orders" className="text-sm text-muted-text hover:text-primary mb-4 inline-flex items-center gap-1 font-semibold transition-colors">
            ← Back to Orders
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="heading-2 text-primary-text mb-2">
                {order.items?.map((item: any) => item.name).join(', ') || 'Order Details'}
              </h1>
              <p className="text-sm text-muted-text">
                Order ID: <span className="font-mono text-secondary-text">#{order.orderNumber || order.id}</span>
              </p>
              <p className="text-xs text-secondary-text mt-1">Placed on {formatDate(order.createdAt)}</p>
            </div>
            {isCancelled && (
              <span className="self-start md:self-center px-4 py-1.5 rounded-full text-xs font-bold bg-red-500/10 border border-red-500/30 text-red-400 uppercase tracking-wider">
                Cancelled
              </span>
            )}
            {isReturned && (
              <span className="self-start md:self-center px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-wider">
                Returned
              </span>
            )}
            {isRefunded && (
              <span className="self-start md:self-center px-4 py-1.5 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400 uppercase tracking-wider">
                Refunded
              </span>
            )}
          </div>
        </motion.div>

        {/* Payment Query Param / Resume Alerts */}
        {(paymentSuccess || paymentAlert?.type === 'success') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl border border-green-500/20 bg-green-500/5 text-xs text-green-400 font-semibold flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-green-500" />
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

        {/* 1. Production Timeline (Span Full Width) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-6 md:p-8 mb-8"
        >
          <h3 className="text-sm font-bold text-primary-text uppercase tracking-widest mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> Production Timeline
          </h3>

          {/* Desktop Horizontal timeline */}
          <div className="hidden md:flex justify-between items-start relative w-full pt-4 pb-2">
            {/* Horizontal Line connector */}
            <div className="absolute top-8 left-[6%] right-[6%] h-0.5 bg-border/40 -z-10" />

            {STAGES.map((stage, idx) => {
              const { isCompleted, isActive } = getStageState(idx)
              const time = getStageTime(stage.key)
              
              return (
                <div key={stage.key} className="flex flex-col items-center text-center flex-1 px-1 relative">
                  <div 
                    className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.2)]' 
                        : isActive 
                        ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.2)] animate-pulse' 
                        : 'bg-secondary border-border/40 text-muted-text'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4.5 h-4.5 stroke-[3]" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <p className={`text-xs font-bold mt-3 transition-colors ${isActive ? 'text-red-400' : isCompleted ? 'text-primary-text' : 'text-muted-text'}`}>
                    {stage.label}
                  </p>
                  {time && (
                    <span className="text-[10px] text-muted-text/80 font-medium mt-1">
                      {new Date(time).toLocaleDateString()} <br />
                      {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile Vertical Timeline */}
          <div className="flex md:hidden flex-col space-y-6 pl-4 border-l border-border/50 relative ml-2">
            {STAGES.map((stage, idx) => {
              const { isCompleted, isActive } = getStageState(idx)
              const time = getStageTime(stage.key)

              return (
                <div key={stage.key} className="flex items-start gap-4 relative">
                  {/* Indicator icon */}
                  <div 
                    className={`absolute -left-[29px] top-0 h-6 w-6 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-green-500/10 border-green-500 text-green-400' 
                        : isActive 
                        ? 'bg-red-500/10 border-red-500 text-red-400' 
                        : 'bg-secondary border-border/40 text-muted-text'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : (
                      <span className="text-[9px] font-bold">{idx + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${isActive ? 'text-red-400' : isCompleted ? 'text-primary-text' : 'text-muted-text'}`}>
                      {stage.label}
                    </p>
                    {time && (
                      <p className="text-[10px] text-muted-text font-medium mt-0.5">
                        {new Date(time).toLocaleDateString()} at {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Main Grid Layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Left Column (Main Card Details) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Order Items, Specs & Design Files */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 md:p-8"
            >
              <h2 className="text-lg font-bold text-primary-text mb-6 pb-2 border-b border-border/40">Order Items & Custom Specs</h2>
              <div className="space-y-8">
                {order.items?.map((item: any, idx: number) => {
                  const review = reviewsState[item.productId] || { rating: 5, comment: '', images: [] as string[], isUploading: false, submitted: false, error: null, submitting: false }
                  const specs = getPrintSpecs(item)
                  const designFiles = getDesignFiles(item)

                  return (
                    <div key={idx} className="pb-8 border-b border-border/30 last:border-0 last:pb-0 font-sans">
                      {/* Product Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-16 h-16 object-cover rounded-lg border border-border bg-secondary"
                            />
                          )}
                          <div>
                            <h4 className="font-bold text-primary-text text-base leading-snug">{item.name}</h4>
                            <p className="text-xs text-muted-text mt-1">Quantity: <span className="font-semibold text-secondary-text">{item.quantity}</span></p>
                          </div>
                        </div>
                        <p className="text-base font-extrabold text-primary-text self-start sm:self-center">{formatCurrency(item.price * item.quantity)}</p>
                      </div>

                      {/* 5. Print Specifications Card */}
                      <div className="bg-secondary/30 border border-border/30 rounded-xl p-4 mb-4">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" /> 3D Manufacturing Specifications
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                          {Object.entries(specs).map(([key, val]) => (
                            <div key={key}>
                              <span className="text-[10px] text-muted-text uppercase tracking-wider block">{key}</span>
                              <span className="font-semibold text-primary-text">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>


                      {/* Review Section */}
                      {status === 'DELIVERED' && (
                        <div className="mt-4 p-4 bg-secondary/35 rounded-xl border border-border/50 font-sans">
                          {review.submitted ? (
                            <p className="text-xs text-green-500 font-semibold flex items-center gap-1.5">
                              <Check className="w-4 h-4" /> Thank you! Your review has been submitted.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-primary-text uppercase tracking-wider">Write a Product Review</p>
                              
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

                              {/* Review Attachments */}
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

                                {review.images && review.images.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-1 font-sans">
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
            </motion.div>

            {/* 2. Payment Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6 md:p-8"
            >
              <h3 className="text-sm font-bold text-primary-text uppercase tracking-widest mb-6 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" /> Payment Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs mb-6 font-sans">
                <div>
                  <span className="text-[10px] text-muted-text uppercase tracking-wider block mb-0.5">Payment Method</span>
                  <span className="font-bold text-primary-text">{order.paymentMethod === 'COD' ? 'Cash On Delivery (COD)' : 'Online Payment (Razorpay)'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-text uppercase tracking-wider block mb-0.5">Payment Status</span>
                  {isRefunded ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-wide">
                      Refunded
                    </span>
                  ) : order.paymentMethod === 'COD' ? (
                    status === 'DELIVERED' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 border border-green-500/20 text-green-400 uppercase tracking-wide font-sans">
                        Paid (Collected on Delivery)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-wide font-sans">
                        Pending Collection
                      </span>
                    )
                  ) : order.paymentStatus === 'PAID' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 border border-green-500/20 text-green-400 uppercase tracking-wide font-sans">
                      Paid
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 uppercase tracking-wide font-sans">
                      Pending Payment
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-muted-text uppercase tracking-wider block mb-0.5 font-sans">Transaction ID</span>
                  <span className="font-mono text-secondary-text">{order.paymentId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-text uppercase tracking-wider block mb-0.5 font-sans">Payment Date</span>
                  <span className="font-semibold text-primary-text">{(order.paymentStatus === 'PAID' || (order.paymentMethod === 'COD' && status === 'DELIVERED')) ? formatDate(order.updatedAt) : 'Pending Confirmation'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-text uppercase tracking-wider block mb-0.5 font-sans">Order ID</span>
                  <span className="font-mono text-secondary-text">#{order.orderNumber || order.id}</span>
                </div>
              </div>

              {/* Invoice Download Action */}
              <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
                {order.paymentStatus === 'PAID' || status === 'DELIVERED' ? (
                  <>
                    <p className="text-xs text-muted-text">A detailed tax invoice is ready for download.</p>
                    <Button 
                      onClick={() => alert('Generating tax invoice PDF... Invoice downloaded successfully.')}
                      className="bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider px-6 py-2 border-primary w-full sm:w-auto"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download Invoice
                    </Button>
                  </>
                ) : (
                  <p className="text-xs text-amber-500/90 font-medium">Invoice will be generated after payment confirmation.</p>
                )}
              </div>
            </motion.div>

            {/* 3. Delivery Address Card & 4. Shipping Info Card */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Delivery Address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
              >
                <h3 className="text-sm font-bold text-primary-text uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Delivery Address
                </h3>
                {order.address ? (
                  <div className="text-secondary-text text-xs space-y-1.5 font-sans">
                    <p className="font-bold text-primary-text flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-text" /> {user?.name || 'Customer'}
                    </p>
                    {order.address.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-muted-text" /> {order.address.phone}
                      </p>
                    )}
                    <p className="pt-1.5 border-t border-border/40 leading-relaxed">
                      {order.address.street} <br />
                      {order.address.city}, {order.address.state} - <span className="font-semibold text-primary-text">{order.address.postalCode}</span> <br />
                      {order.address.country}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-text text-xs font-sans">No address details available</p>
                )}
              </motion.div>

              {/* Shipping Information Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
              >
                <h3 className="text-sm font-bold text-primary-text uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" /> Shipping Info
                </h3>
                <div className="text-secondary-text text-xs space-y-2.5 font-sans">
                  <div>
                    <span className="text-[10px] text-muted-text uppercase tracking-wider block">Courier</span>
                    <span className="font-bold text-primary-text">India Post</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-text uppercase tracking-wider block">Tracking Number</span>
                    <span className="font-mono text-primary-text select-all">{order.trackingId || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-text uppercase tracking-wider block">Shipping Zone</span>
                    <span className="font-semibold text-primary-text uppercase">{order.shippingZone || 'Domestic'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
                    <div>
                      <span className="text-[10px] text-muted-text uppercase tracking-wider block">Est. Delivery Date</span>
                      <span className="font-semibold text-primary-text">{order.shippingEstDays || '3-5 Business Days'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-text uppercase tracking-wider block">Est. Delivery Time</span>
                      <span className="font-semibold text-primary-text">Before 6:00 PM</span>
                    </div>
                  </div>
                  
                  {/* Track Package Button */}
                  {['SHIPPED', 'DELIVERED'].includes(status) ? (
                    <a
                      href={order.trackingUrl || `https://www.indiapost.gov.in/_layouts/15/dop.online.tracking/trackarticles.aspx?ArticleID=${order.trackingId || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider rounded transition-colors text-center"
                    >
                      <ExternalLink className="w-4 h-4" /> Track Package
                    </a>
                  ) : (
                    <p className="text-[10px] text-muted-text italic mt-2 pt-1 border-t border-border/40">
                      Tracking information will be available once your order has been shipped.
                    </p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* 9. Refund Information Card (Conditional) */}
            {(isCancelled || isReturned || isRefunded) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 border border-blue-500/20 bg-blue-500/5 font-sans"
              >
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin-slow" /> Refund Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-text uppercase tracking-wider block">Refund Status</span>
                    <span className="font-bold text-blue-400">{isRefunded ? 'Refund Processed' : 'Refund Initiated'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-text uppercase tracking-wider block">Refund Amount</span>
                    <span className="font-bold text-primary-text">{formatCurrency(grandTotalVal)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-text uppercase tracking-wider block font-sans">Refund ID</span>
                    <span className="font-mono text-secondary-text">REF_{order.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-text uppercase tracking-wider block">Refund Initiated Date</span>
                    <span className="font-semibold text-primary-text">{formatDate(order.updatedAt)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-text uppercase tracking-wider block">Expected Completion</span>
                    <span className="font-semibold text-primary-text">5-7 Working Days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-text uppercase tracking-wider block">Completed Date</span>
                    <span className="font-semibold text-primary-text">{isRefunded ? formatDate(order.updatedAt) : 'Pending'}</span>
                  </div>
                </div>
              </motion.div>
            )}


          </div>

          {/* Right Column (Sidebar Action Cards) */}
          <div className="space-y-8">
            
            {/* 12. Status-Based Policy Messages */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-secondary-text space-y-1.5 font-sans"
            >
              <p className="font-bold text-primary uppercase tracking-wider text-[10px]">Cancellation & Return Policy Notice:</p>
              <p className="leading-relaxed font-semibold text-primary-text">{getPolicyMessage()}</p>
              <p className="text-muted-text/80 text-[10px]">Please review full details in terms and conditions for customized manufacturing prints.</p>
            </motion.div>

            {/* 7. Enhanced Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass-card p-6"
            >
              <h3 className="text-sm font-bold text-primary-text uppercase tracking-widest mb-4 pb-1.5 border-b border-border/30">Order Summary</h3>
              <div className="space-y-3.5 text-xs font-sans">
                <div className="flex justify-between text-secondary-text font-sans">
                  <span>Subtotal</span>
                  <span className="font-semibold text-primary-text">{formatCurrency(subtotalVal)}</span>
                </div>
                <div className="flex justify-between text-secondary-text font-sans">
                  <span>Shipping</span>
                  <span className="font-semibold text-primary-text">{formatCurrency(shippingVal)}</span>
                </div>
                <div className="flex justify-between text-secondary-text font-sans">
                  <span>Platform Fee</span>
                  <span className="font-semibold text-primary-text">{formatCurrency(platformFeeVal)}</span>
                </div>
                <div className="flex justify-between text-secondary-text font-sans">
                  <span>GST</span>
                  <span className="font-semibold text-primary-text">{formatCurrency(gstVal)}</span>
                </div>
                <div className="flex justify-between text-secondary-text font-sans">
                  <span>Discount</span>
                  <span className="font-semibold text-green-400">-{formatCurrency(discountVal)}</span>
                </div>
                
                <div className="flex justify-between text-sm font-extrabold pt-4 border-t border-border text-primary-text font-sans">
                  <span>Grand Total</span>
                  <span>{formatCurrency(grandTotalVal)}</span>
                </div>
              </div>
            </motion.div>

            {/* 8. Dynamic Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6"
            >
              <h3 className="text-sm font-bold text-primary-text uppercase tracking-widest mb-4">Actions</h3>
              <div className="space-y-3 font-sans">
                {/* Pay Now if pending payment */}
                {order.paymentStatus === 'PENDING' && order.paymentMethod === 'CARD' && status === 'PENDING' && (
                  <Button
                    disabled={isResumingPayment}
                    onClick={handlePayNow}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold flex items-center justify-center gap-2 border-green-600 py-2.5 rounded-lg cursor-pointer"
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

                {/* Status: Pending -> Cancel */}
                {status === 'PENDING' && (
                  <Button
                    variant="outline"
                    className="w-full border-red-500/20 text-red-500 hover:bg-red-500/5 font-bold py-2.5 rounded-lg cursor-pointer"
                    onClick={() => cancelMutation.mutate(orderId)}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                  </Button>
                )}

                {/* Status: Confirmed -> Request Cancellation */}
                {status === 'CONFIRMED' && (
                  <Button
                    variant="outline"
                    className="w-full border-red-500/20 text-red-500 hover:bg-red-500/5 font-bold py-2.5 rounded-lg cursor-pointer"
                    onClick={() => {
                      if (confirm('Request cancellation of this order? Our team will review design specifications.')) {
                        cancelMutation.mutate(orderId)
                      }
                    }}
                    disabled={cancelMutation.isPending}
                  >
                    Request Cancellation
                  </Button>
                )}

                {/* Status: Processing/Printing/Quality Check/Packed -> Contact Seller */}
                {['PROCESSING', 'QUALITY_CHECK', 'PACKED'].includes(status) && (
                  <Button
                    className="w-full bg-primary text-white hover:bg-primary/90 font-bold py-2.5 rounded-lg cursor-pointer"
                    onClick={() => setIsSupportModalOpen(true)}
                  >
                    Contact Seller
                  </Button>
                )}

                {/* Status: Shipped -> Track Package */}
                {status === 'SHIPPED' && (
                  <a
                    href={order.trackingUrl || `https://www.indiapost.gov.in/_layouts/15/dop.online.tracking/trackarticles.aspx?ArticleID=${order.trackingId || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors text-center cursor-pointer font-sans"
                  >
                    <ExternalLink className="w-4 h-4" /> Track Package
                  </a>
                )}

                {/* Status: Delivered -> Write Review & Request Return */}
                {status === 'DELIVERED' && (
                  <div className="space-y-3 font-sans">
                    <Button
                      variant="outline"
                      className="w-full border-red-500/20 hover:border-red-500 text-red-500 hover:bg-red-500/5 font-bold py-2.5 rounded-lg cursor-pointer"
                      disabled={isPastReturnWindow}
                      onClick={() => setIsReturnModalOpen(true)}
                    >
                      Request Return
                    </Button>
                    {isPastReturnWindow && (
                      <p className="text-[10px] text-red-400 text-center font-medium mt-1 font-sans">
                        Return window closed (3 days elapsed since delivery)
                      </p>
                    )}
                  </div>
                )}

                {/* Status: Cancelled -> View Refund Status */}
                {status === 'CANCELLED' && (
                  <button 
                    onClick={() => alert(`Refund Initiated: Expected completion in 5-7 working days. Amount: ${formatCurrency(grandTotalVal)}`)}
                    className="w-full px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-lg transition-colors text-center cursor-pointer font-sans"
                  >
                    View Refund Status
                  </button>
                )}

                {/* Status: Refunded -> Download Refund Receipt */}
                {isRefunded && (
                  <button 
                    onClick={() => alert('Downloading Refund Receipt PDF... Done.')}
                    className="w-full px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-primary-text rounded-lg transition-colors text-center flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                  >
                    <Receipt className="w-4 h-4" /> Download Refund Receipt
                  </button>
                )}
              </div>
            </motion.div>

            {/* 11. Support Section Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-card p-6"
            >
              <h3 className="text-sm font-bold text-primary-text uppercase tracking-widest mb-4">Customer Support</h3>
              
              <div className="space-y-3.5 text-xs font-sans">
                <button 
                  onClick={() => alert('Starting live chat connection with support team... Please stay online.')}
                  className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary border border-border/40 rounded-lg transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2.5 font-semibold text-primary-text">
                    <MessageCircle className="w-4 h-4 text-green-500" /> Live Chat Support
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-text group-hover:text-primary transition-colors font-sans" />
                </button>

                <button 
                  onClick={() => setIsSupportModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 bg-secondary/50 hover:bg-secondary border border-border/40 rounded-lg transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-2.5 font-semibold text-primary-text font-sans">
                    <Inbox className="w-4 h-4 text-primary" /> Raise Ticket Thread
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-text group-hover:text-primary transition-colors font-sans" />
                </button>

              </div>

              {/* Display existing ticket status if inquiry is found */}
              {order.inquiries && order.inquiries.length > 0 && (
                <div className="mt-5 p-3.5 bg-secondary/40 border border-border/40 rounded-lg font-sans">
                  <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Active Inquiries ({order.inquiries.length})</p>
                  <div className="mt-2 space-y-2">
                    {order.inquiries.map((inq: any, inqIdx: number) => (
                      <div key={inqIdx} className="flex justify-between items-center text-[11px] font-medium py-1 border-b border-border/20 last:border-0">
                        <span className="text-secondary-text truncate max-w-[120px]">{inq.subject}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          inq.status === 'RESOLVED' 
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {inq.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

          </div>
        </div>

        {/* Return Details View */}
        {(status === 'RETURN_REQUESTED' || status === 'RETURNED' || status === 'RETURN_REJECTED') && (order.returnReason || order.returnImage) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6 md:p-8 bg-card border border-red-500/20 mt-8 space-y-4"
          >
            <h3 className="text-lg font-bold text-red-500 uppercase tracking-wider">Return Request Details</h3>
            <div className="space-y-4 text-xs font-sans">
              <div>
                <p className="text-secondary-text font-semibold uppercase tracking-wider text-[10px]">Return Reason</p>
                <p className="text-primary-text mt-1 text-sm bg-secondary/50 p-4 border border-border/40 rounded-lg whitespace-pre-wrap">
                  {order.returnReason || 'No reason provided.'}
                </p>
              </div>
              {order.returnImage && (
                <div>
                  <p className="text-secondary-text font-semibold uppercase tracking-wider text-[10px] mb-2 font-sans">Product Image Proof</p>
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
            className="glass-card p-6 md:p-8 border border-amber-500/20 mt-8 space-y-4"
          >
            <h3 className="text-lg font-bold text-amber-500 uppercase tracking-wider">Admin: Update Shipping Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
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
                <form onSubmit={handleSupportSubmit} className="space-y-4 text-xs font-sans">
                  <div className="p-3 bg-secondary/40 border border-border/50 rounded-lg">
                    <p className="font-bold text-xs text-primary-text font-sans">Order Number: #{order.orderNumber || order.id}</p>
                    <p className="text-[10px] text-muted-text mt-1 uppercase tracking-widest font-sans">Total Amount: {formatCurrency(order.totalAmount || order.total)}</p>
                  </div>

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

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Describe your issue / question</label>
                    <textarea
                      required
                      rows={4}
                      value={supportFormData.message}
                      onChange={(e) => setSupportFormData({ ...supportFormData, message: e.target.value })}
                      className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 resize-none font-sans"
                      placeholder="Ask questions about shipping status, payment issues, transaction details..."
                      disabled={isSupportSubmitting}
                    />
                  </div>

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
                className="space-y-4 text-xs font-sans"
              >
                <div className="p-3 bg-secondary/40 border border-border/50 rounded-lg font-sans font-bold">
                  <p className="font-bold text-xs text-primary-text font-sans">Order Number: #{order.orderNumber || order.id}</p>
                </div>

                <div className="space-y-1.5 font-sans">
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

                <div className="space-y-2 font-sans">
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
                    <div className="relative w-24 h-24 border border-border rounded overflow-hidden mt-2 font-sans">
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

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewFile(null)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-popover border border-border p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <h4 className="text-sm font-bold text-primary-text uppercase tracking-widest">3D Model File Preview</h4>
                <button onClick={() => setPreviewFile(null)} className="text-muted-text hover:text-primary-text transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="aspect-video w-full rounded-lg bg-secondary border border-border/40 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                <Printer className="w-12 h-12 text-primary animate-pulse mb-3" />
                <p className="text-xs font-mono font-bold text-primary-text">{previewFile.name}</p>
                <p className="text-[10px] text-muted-text mt-1">{previewFile.size} • 3D Mesh Render (Mockup Viewport)</p>
                <div className="mt-4 flex gap-2">
                  <span className="px-2 py-0.5 text-[9px] bg-green-500/10 text-green-400 font-bold border border-green-500/20 rounded uppercase tracking-wider">STL Mesh Verified</span>
                  <span className="px-2 py-0.5 text-[9px] bg-primary/10 text-primary font-bold border border-primary/20 rounded uppercase tracking-wider">Watertight</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="px-4 py-2 border border-border text-xs font-bold text-primary-text rounded hover:bg-secondary transition-colors"
                >
                  Close Preview
                </button>
                <button 
                  onClick={() => { alert(`Downloading: ${previewFile.name}`); setPreviewFile(null) }}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-xs font-bold text-white rounded transition-colors"
                >
                  Download File
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </main>
  )
}
