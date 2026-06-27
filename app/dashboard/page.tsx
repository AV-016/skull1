'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Loader2, 
  ShoppingBag, 
  Layers, 
  Settings, 
  User as UserIcon, 
  Sparkles, 
  ChevronRight,
  MessageSquare,
  Send,
  ArrowLeft,
  ShieldCheck,
  Mail
} from 'lucide-react'

import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'
import { useVerifyPhoneOtp } from '@/hooks/useAuth'
import { auth } from '@/lib/firebase'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'

interface Address {
  id: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

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
    <span className="font-bold bg-primary/20 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs uppercase tracking-wider animate-pulse">
      {timeLeft}
    </span>
  )
}

const parseStreet = (street: string) => {
  const result = { streetNo: '', locality: '', landmark: '' };
  if (!street) return result;
  if (street.includes('Street/House No:') && street.includes('Locality:')) {
    const parts = street.split('|');
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.startsWith('Street/House No:')) {
        result.streetNo = trimmed.replace('Street/House No:', '').trim();
      } else if (trimmed.startsWith('Locality:')) {
        result.locality = trimmed.replace('Locality:', '').trim();
      } else if (trimmed.startsWith('Landmark:')) {
        result.landmark = trimmed.replace('Landmark:', '').trim();
      }
    });
  } else {
    result.streetNo = street;
  }
  return result;
};

const parsePhone = (phoneStr: string) => {
  const result = { phone: '+91', alternatePhone: '' };
  if (!phoneStr) return result;
  if (phoneStr.includes('/ Alt:')) {
    const parts = phoneStr.split('/ Alt:');
    result.phone = parts[0].trim();
    result.alternatePhone = parts[1].trim();
  } else {
    result.phone = phoneStr;
  }
  return result;
};

export default function DashboardPage() {
  const { user, setUser } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const { data: recommendedProducts } = useProducts()
  
  // Active Events State
  const [activeEvents, setActiveEvents] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  const fetchActiveEvents = async () => {
    try {
      const res = await api.get('/events/active')
      setActiveEvents(res.data?.data || [])
    } catch (e) {
      console.error('Error fetching active events:', e)
    } finally {
      setLoadingEvents(false)
    }
  }

  useEffect(() => {
    fetchActiveEvents()
  }, [])
  
  const displayProducts = recommendedProducts
    ?.filter((p: any) => p.isActive && p.stock > 0)
    ?.slice(0, 4) || []

  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return

    let animationFrameId: number
    const scrollSpeed = 0.5 // pixels per frame

    const scroll = () => {
      if (el.scrollWidth - el.clientWidth <= 0) return
      el.scrollLeft += scrollSpeed

      // Loop smoothly back to start once we scroll past the first set of items
      if (el.scrollLeft >= (el.scrollWidth / 3)) {
        el.scrollLeft = 0
      }
      animationFrameId = requestAnimationFrame(scroll)
    }

    animationFrameId = requestAnimationFrame(scroll)
    return () => cancelAnimationFrame(animationFrameId)
  }, [displayProducts])

  const [loading, setLoading] = useState(false)
  const [showAddresses, setShowAddresses] = useState(false)
  
  // Support via Email States
  const [showSupport, setShowSupport] = useState(false)
  const [supportSubject, setSupportSubject] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const [sendingSupportMail, setSendingSupportMail] = useState(false)
  const [supportSuccess, setSupportSuccess] = useState(false)
  const [supportError, setSupportError] = useState<string | null>(null)

  const handleSendSupportEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setSupportError(null)
    setSupportSuccess(false)
    setSendingSupportMail(true)

    try {
      await api.post('/inquiries/email', {
        subject: supportSubject,
        message: supportMessage
      })
      setSupportSuccess(true)
      setSupportSubject('')
      setSupportMessage('')
    } catch (err: any) {
      setSupportError(err.response?.data?.message || 'Failed to send support email. Please try again.')
    } finally {
      setSendingSupportMail(false)
    }
  }

  useEffect(() => {
    if (showSupport) {
      setShowAddresses(false)
      setSupportSuccess(false)
      setSupportError(null)
    }
  }, [showSupport])

  useEffect(() => {
    if (showAddresses) {
      setShowSupport(false)
    }
  }, [showAddresses])

  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Phone Verification States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  const verifyOtpMutation = useVerifyPhoneOtp()

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setIsSendingOtp(true)
    const phoneDigits = phoneInput.replace(/^\+91/, '').replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      setErrorMsg('Phone number must be exactly 10 digits (excluding +91)')
      setIsSendingOtp(false)
      return
    }
    if (!auth) {
      setErrorMsg('Firebase is not configured on this website. Please add Firebase credentials to your environment variables.')
      setIsSendingOtp(false)
      return
    }
    try {
      if (typeof window !== 'undefined') {
        const wrapper = document.getElementById('recaptcha-container-wrapper')
        if (wrapper) {
          wrapper.innerHTML = '<div id="recaptcha-container"></div>'
        }
      }
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          setErrorMsg('reCAPTCHA expired. Please try again.')
        }
      })
      const confirmation = await signInWithPhoneNumber(auth, phoneInput, verifier)
      setConfirmationResult(confirmation)
      setOtpSent(true)
      setCooldown(60)
      setSuccessMsg('Verification OTP has been sent via SMS.')
    } catch (err: any) {
      console.error('Firebase send phone OTP error:', err)
      setErrorMsg(err.message || 'Failed to send OTP. Please check your phone number and try again.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    if (!confirmationResult) {
      setErrorMsg('No active verification session. Please request a new OTP.')
      return
    }
    setIsVerifyingOtp(true)
    try {
      const credential = await confirmationResult.confirm(otpInput)
      const token = await credential.user.getIdToken()

      await verifyOtpMutation.mutateAsync({ token })
      setSuccessMsg('Phone number verified successfully!')
      
      // Refresh profile data
      const res = await api.get('/auth/me')
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data)
      }
      
      setTimeout(() => {
        setIsModalOpen(false)
        setOtpSent(false)
        setPhoneInput('')
        setOtpInput('')
        setSuccessMsg(null)
        setConfirmationResult(null)
      }, 1500)
    } catch (err: any) {
      console.error('Firebase verify phone OTP error:', err)
      let msg = err.response?.data?.message || err.message || 'Invalid or expired OTP. Please try again.'
      if (err.code === 'auth/invalid-verification-code') {
        msg = 'The verification code you entered is invalid. Please check the code and try again.'
      } else if (err.code === 'auth/code-expired') {
        msg = 'The verification code has expired. Please send a new OTP and try again.'
      }
      setErrorMsg(msg)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  
  const [addressForm, setAddressForm] = useState({
    streetNo: '',
    locality: '',
    landmark: '',
    city: '',
    state: 'N/A',
    postalCode: '',
    country: 'India',
    phone: '+91',
    alternatePhone: '',
    isDefault: false
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [orderCount, setOrderCount] = useState(0)

  // Address Phone verification states
  const [isAddrPhoneVerified, setIsAddrPhoneVerified] = useState(false)
  const [addrOtpSent, setAddrOtpSent] = useState(false)
  const [addrOtpInput, setAddrOtpInput] = useState('')
  const [isSendingAddrOtp, setIsSendingAddrOtp] = useState(false)
  const [isVerifyingAddrOtp, setIsVerifyingAddrOtp] = useState(false)
  const [addrConfirmationResult, setAddrConfirmationResult] = useState<ConfirmationResult | null>(null)

  const fetchOrderCount = useCallback(async () => {
    try {
      const res = await api.get('/orders')
      setOrderCount(res.data.data?.length || 0)
    } catch (err) {
      console.error('Error fetching orders count:', err)
    }
  }, [])

  useEffect(() => {
    fetchOrderCount()
  }, [fetchOrderCount])

  const fetchAddresses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/addresses')
      setAddresses(res.data.data || [])
    } catch (err) {
      console.error('Error fetching addresses:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showAddresses) {
      fetchAddresses()
    }
  }, [showAddresses, fetchAddresses])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    if (name === 'phone' || name === 'alternatePhone') {
      setIsAddrPhoneVerified(false)
      setAddrOtpSent(false)
      let val = value;
      if (val) {
        if (!val.startsWith('+91')) {
          val = '+91' + val.replace(/^\+?91?/, '').replace(/\D/g, '');
        }
        const prefix = '+91';
        const rest = val.substring(3).replace(/\D/g, '').substring(0, 10);
        setAddressForm(prev => ({
          ...prev,
          [name]: prefix + rest
        }));
      } else {
        setAddressForm(prev => ({
          ...prev,
          [name]: name === 'phone' ? '+91' : ''
        }));
      }
      return;
    }
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSendAddrPhoneOtp = async (e: React.MouseEvent) => {
    e.preventDefault()
    setFormError(null)
    setIsSendingAddrOtp(true)
    const phoneDigits = addressForm.phone.replace(/^\+91/, '').replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      setFormError('Phone number must be exactly 10 digits (excluding +91).')
      setIsSendingAddrOtp(false)
      return
    }
    if (!auth) {
      setFormError('Firebase is not configured.')
      setIsSendingAddrOtp(false)
      return
    }
    try {
      if (typeof window !== 'undefined') {
        const wrapper = document.getElementById('recaptcha-container-wrapper')
        if (wrapper) {
          wrapper.innerHTML = '<div id="recaptcha-container"></div>'
        }
      }
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          setFormError('reCAPTCHA expired. Please try again.')
        }
      })
      const confirmation = await signInWithPhoneNumber(auth, addressForm.phone, verifier)
      setAddrConfirmationResult(confirmation)
      setAddrOtpSent(true)
    } catch (err: any) {
      console.error('Firebase send phone OTP error:', err)
      setFormError(err.message || 'Failed to send OTP. Please check your phone number and try again.')
    } finally {
      setIsSendingAddrOtp(false)
    }
  }

  const handleVerifyAddrPhoneOtp = async (e: React.MouseEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!addrConfirmationResult) {
      setFormError('No active verification session. Please request a new OTP.')
      return
    }
    setIsVerifyingAddrOtp(true)
    try {
      await addrConfirmationResult.confirm(addrOtpInput)
      setIsAddrPhoneVerified(true)
      setAddrOtpSent(false)
      setAddrOtpInput('')
    } catch (err: any) {
      console.error('Firebase verify phone OTP error:', err)
      setFormError(err.message || 'Invalid or expired OTP. Please try again.')
    } finally {
      setIsVerifyingAddrOtp(false)
    }
  }

  const openAddForm = () => {
    setEditingAddress(null)
    setAddressForm({
      streetNo: '',
      locality: '',
      landmark: '',
      city: '',
      state: 'N/A',
      postalCode: '',
      country: 'India',
      phone: '+91',
      alternatePhone: '',
      isDefault: false
    })
    setIsAddrPhoneVerified(false)
    setAddrOtpSent(false)
    setAddrOtpInput('')
    setFormError(null)
    setIsFormOpen(true)
  }

  const openEditForm = (addr: Address) => {
    setEditingAddress(addr)
    const parsedStr = parseStreet(addr.street || '')
    const parsedPh = parsePhone((addr as any).phone || '')
    setAddressForm({
      streetNo: parsedStr.streetNo,
      locality: parsedStr.locality,
      landmark: parsedStr.landmark,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      phone: parsedPh.phone,
      alternatePhone: parsedPh.alternatePhone,
      isDefault: addr.isDefault
    })
    setIsAddrPhoneVerified(true)
    setAddrOtpSent(false)
    setAddrOtpInput('')
    setFormError(null)
    setIsFormOpen(true)
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (addressForm.streetNo.length < 2) {
      setFormError('Street/House number must be at least 2 characters long')
      return
    }
    if (addressForm.locality.length < 3) {
      setFormError('Locality must be at least 3 characters long')
      return
    }
    if (addressForm.city.length < 2) {
      setFormError('City must be at least 2 characters long')
      return
    }
    if (addressForm.postalCode.length < 4) {
      setFormError('Postal code must be at least 4 characters long')
      return
    }

    const phoneDigits = addressForm.phone.replace(/^\+91/, '').replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      setFormError('Phone number must be exactly 10 digits (excluding +91)')
      return
    }

    const altPhoneDigits = addressForm.alternatePhone.replace(/^\+91/, '').replace(/\D/g, '')
    if (addressForm.alternatePhone && altPhoneDigits.length !== 10) {
      setFormError('Alternate phone number must be exactly 10 digits (excluding +91)')
      return
    }

    try {
      const combinedStreet = `Street/House No: ${addressForm.streetNo.trim()} | Locality: ${addressForm.locality.trim()}${addressForm.landmark.trim() ? ` | Landmark: ${addressForm.landmark.trim()}` : ''}`
      const combinedPhone = `${addressForm.phone.trim()}${addressForm.alternatePhone.trim() ? ` / Alt: ${addressForm.alternatePhone.trim()}` : ''}`

      const payload = {
        street: combinedStreet,
        city: addressForm.city,
        state: addressForm.state,
        postalCode: addressForm.postalCode,
        country: addressForm.country,
        phone: combinedPhone,
        isDefault: addressForm.isDefault
      }

      if (editingAddress) {
        await api.patch(`/addresses/${editingAddress.id}`, payload)
      } else {
        await api.post('/addresses', payload)
      }
      setIsFormOpen(false)
      fetchAddresses()
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save address. Please try again.')
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      await api.delete(`/addresses/${id}`)
      fetchAddresses()
    } catch (err) {
      console.error('Error deleting address:', err)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/addresses/${id}/default`)
      fetchAddresses()
    } catch (err) {
      console.error('Error setting default address:', err)
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#0b0c10] text-[#1f2833] dark:text-[#c5c6c7] font-sans smooth-transition">
      <Navbar />



      {/* Dynamic Flip Animation CSS */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* Hero Welcome Banner */}
      <div className="pt-32 pb-16 relative overflow-hidden bg-gradient-to-r from-red-600/10 via-orange-500/5 to-transparent border-b border-border/60">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            {/* Left Column: Welcome Details */}
            <div className="lg:col-span-7 space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold text-black dark:text-white tracking-tight leading-tight">
                Welcome back, <br />
                <span className="text-[#1f2833] dark:text-white">{user?.name || 'Explorer'}</span>
              </h1>
              <p className="text-[#4f5d75] dark:text-[#9da8b6] max-w-lg text-sm md:text-base leading-relaxed">
                Design, customize, and print your next physical model. Access your profile settings, check your custom inquiries, and keep track of orders here.
              </p>

              {/* Loyalty Stamp Advertisement Card */}
              <div className="mt-6 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 max-w-lg space-y-2">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span>Loyalty Rewards Program</span>
                </div>
                <p className="text-[11px] md:text-xs text-[#4f5d75] dark:text-[#9da8b6] leading-relaxed">
                  Earn 1 stamp for every order placed. Complete all <strong>8 stamps</strong> to unlock a special, custom discount from the Admin applied directly to your next checkout!
                </p>
                {user?.loyaltyDiscountSet && user?.loyaltyDiscountValue && user.loyaltyDiscountValue > 0 ? (
                  <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5 animate-pulse">
                    🎉 Special Offer: You have a {user.loyaltyDiscountValue}% discount waiting at checkout!
                  </div>
                ) : user?.loyaltyDiscountPending ? (
                  <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    ⏳ Stamp Card Complete! Admin is preparing your custom discount.
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-500 font-semibold">
                    Stamps collected: {user?.loyaltyStamps || 0} / 8
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Virtual Business / Loyalty Card */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
              {/* Card Container Placeholder to prevent layout shift */}
              <div className="w-[350px] h-[210px] relative flex items-center justify-center">
                {!isExpanded ? (
                  <motion.div
                    layoutId="virtual-card-container"
                    className="perspective-1000 w-[350px] h-[210px] cursor-pointer group"
                    onClick={() => {
                      setIsExpanded(true)
                      setIsFlipped(false)
                    }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Card Front inline */}
                    <div className="absolute inset-0 w-full h-full bg-white border border-[#eaeaea] rounded-2xl p-6 flex flex-col justify-between shadow-md">
                      <div className="flex items-center gap-4">
                        {/* Website Logo on Card Front */}
                        <div className="w-14 h-14 bg-red-500/5 rounded-xl flex items-center justify-center border border-red-500/10">
                          <img src="/logo.png" alt="Skulture Logo" className="w-10 h-10 object-contain invert" />
                        </div>
                        <div>
                          <h2 className="text-[#d12626] font-black tracking-wider text-xl leading-none">SKULTURE.ag</h2>
                          <p className="text-[#4f5d75] font-semibold text-[10px] tracking-widest uppercase mt-1">Ideation & Creation</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                        <div>
                          <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Active Member</p>
                          <p className="text-xs font-bold text-gray-800 capitalize">{user?.name || 'Customer'}</p>
                        </div>
                        <div className="text-[9px] font-bold bg-green-500/10 text-green-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> verified
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-[350px] h-[210px] bg-gray-100/10 border border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-[10px] text-gray-400 select-none">
                    Card Expanded
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-text mt-2 hover:text-primary-text smooth-transition tracking-wider uppercase select-none">
                Click card to view on main screen / Stamps earned: {user?.loyaltyStamps || 0}
              </p>
            </div>

            {/* Modal Overlay for Expanded Card */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md cursor-zoom-out p-4"
                  onClick={() => setIsExpanded(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="text-white/60 text-[10px] md:text-xs mb-6 uppercase tracking-widest text-center select-none"
                  >
                    Click card to flip • Click anywhere else to close
                  </motion.div>

                  <motion.div
                    layoutId="virtual-card-container"
                    className="perspective-1000 w-[340px] h-[204px] sm:w-[450px] sm:h-[270px] md:w-[500px] md:h-[300px] cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsFlipped(!isFlipped)
                    }}
                  >
                    <div className={`relative w-full h-full duration-700 transform-style-3d transition-transform ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}>
                      {/* Card Front - Expanded */}
                      <div className="absolute inset-0 w-full h-full bg-white border border-[#eaeaea] rounded-2xl p-6 sm:p-8 flex flex-col justify-between backface-hidden shadow-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-500/5 rounded-xl flex items-center justify-center border border-red-500/10">
                            <img src="/logo.png" alt="Skulture Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain invert" />
                          </div>
                          <div>
                            <h2 className="text-[#d12626] font-black tracking-wider text-2xl sm:text-3xl leading-none">SKULTURE.ag</h2>
                            <p className="text-[#4f5d75] font-semibold text-[10px] sm:text-xs tracking-widest uppercase mt-2">Ideation & Creation</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                          <div>
                            <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Member</p>
                            <p className="text-sm sm:text-base font-bold text-gray-800 capitalize mt-0.5">{user?.name || 'Customer'}</p>
                          </div>
                          <div className="text-[10px] sm:text-xs font-bold bg-green-500/10 text-green-600 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> verified
                          </div>
                        </div>
                      </div>

                      {/* Card Back - Expanded */}
                      <div className="absolute inset-0 w-full h-full bg-[#fbfbf9] border border-[#eaeaea] rounded-2xl p-6 sm:p-8 flex justify-between gap-4 backface-hidden rotate-y-180 shadow-2xl">
                        {/* Left Column: Details & QR code */}
                        <div className="flex flex-col justify-between w-[40%] text-left">
                          <div>
                            <h3 className="text-[#d12626] font-black tracking-wider text-base sm:text-lg leading-none">SKULTURE.ag</h3>
                            <div className="relative w-20 h-20 sm:w-28 sm:h-28 bg-white border border-gray-200 rounded-xl p-2 flex items-center justify-center mt-3 shadow-sm overflow-hidden group/qr">
                              <a 
                                href="https://www.instagram.com/skulture.ag/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="relative block w-full h-full"
                              >
                                <img 
                                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://www.instagram.com/skulture.ag/" 
                                  alt="Instagram QR Code" 
                                  className="w-full h-full object-contain" 
                                />
                                <div className="absolute inset-0 bg-black/85 backdrop-blur-[0.5px] opacity-0 group-hover/qr:opacity-100 flex items-center justify-center text-[10px] text-white font-black tracking-wider uppercase text-center p-1.5 transition-opacity duration-250">
                                  Go to Insta ↗
                                </div>
                              </a>
                            </div>
                          </div>
                          <p className="text-[#d12626] font-bold text-[10px] sm:text-xs select-none uppercase tracking-wider">Contact us</p>
                        </div>

                        {/* Right Column: Loyalty Stamps */}
                        <div className="w-[60%] flex flex-col justify-between items-end border-l border-gray-200/50 pl-4">
                          <div className="w-full text-right flex flex-col items-end gap-1">
                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Loyalty Stamps</p>
                            <div className="text-xs text-[#4f5d75] space-y-1 text-right mt-2">
                              <p className="font-bold text-gray-800 truncate max-w-[200px]">Name: {user?.name || 'Guest'}</p>
                              <p className="font-semibold truncate">Mob: {user?.phone || 'Not Provided'}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2.5 mt-auto">
                            {Array.from({ length: 8 }).map((_, idx) => {
                              const isStamped = (user?.loyaltyStamps || 0) > idx;
                              return (
                                <div 
                                  key={idx} 
                                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-all duration-350 ${
                                    isStamped 
                                      ? 'border-yellow-300 bg-gradient-to-tr from-[#bf953f] via-[#fcf6ba] to-[#b38728] shadow-md shadow-yellow-500/20 scale-105' 
                                      : 'border-dashed border-gray-300 bg-white'
                                  } smooth-transition`}
                                >
                                  {isStamped ? (
                                    null
                                  ) : (
                                    <span className="text-[10px] sm:text-xs text-gray-400 font-bold">{idx + 1}</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Active Events & Offers Banner */}
      {!loadingEvents && activeEvents.length > 0 && (
        <div className="pt-8 pb-2">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <div className="space-y-6">
              {activeEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl border border-primary/20 bg-white dark:bg-[#12131a] p-6 md:p-8 shadow-md flex flex-col gap-6"
                >
                  {/* Banner image background with premium gradient overlay */}
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
                        <h4 className="text-[9px] font-black text-secondary-text uppercase tracking-widest">Event Products</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {event.products.slice(0, 2).map((prod: any) => {
                            const primaryImg = prod.images?.find((img: any) => img.isPrimary)?.url || prod.image || '/placeholder.jpg'
                            return (
                              <Link 
                                href={`/products/${prod.slug}`} 
                                key={prod.id}
                                className="group p-2.5 bg-secondary/20 dark:bg-card/25 border border-border/80 hover:border-primary/45 rounded-xl smooth-transition flex items-center gap-3 cursor-pointer shadow-sm"
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
        </div>
      )}

      {/* Back to Storefront Homepage CTA Section */}
      <div className="pt-6 pb-2">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-red-600/15 via-red-600/5 to-transparent p-8 md:p-10 hover:border-red-500/40 transition-all duration-300 flex flex-col lg:flex-row items-center justify-between gap-8 min-h-[200px] lg:min-h-[240px]">
            
            {/* Left side: Sliding products section */}
            {displayProducts && displayProducts.length > 0 && (
              <div className="w-full lg:w-3/5 overflow-hidden relative">
                <div 
                  ref={carouselRef}
                  className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth py-2"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {[...displayProducts, ...displayProducts, ...displayProducts].map((prod: any, idx: number) => {
                    const primaryImg = prod.images?.find((img: any) => img.isPrimary)?.url || prod.image || '/placeholder.jpg'
                    return (
                      <Link 
                        href={`/products/${prod.slug}`} 
                        key={`${prod.id}-${idx}`}
                        className="flex-shrink-0 w-60 p-4 bg-secondary/35 dark:bg-card/35 border border-border/80 hover:border-primary/45 rounded-2xl smooth-transition flex items-center gap-4 cursor-pointer shadow-md hover:scale-105"
                      >
                        <div className="w-16 h-16 rounded-xl border border-border overflow-hidden bg-secondary flex-shrink-0">
                          <img 
                            src={primaryImg} 
                            alt={prod.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="overflow-hidden flex-1 text-xs text-left">
                          <p className="font-bold text-xs text-primary-text truncate leading-tight">{prod.name}</p>
                          <p className="text-[10px] text-muted-text capitalize mt-1 font-semibold">{prod.category?.name || 'Product'}</p>
                          <p className="text-sm font-black text-primary mt-2">₹{prod.price}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Right side: CTA Details */}
            <div className="w-full lg:w-2/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-left">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-primary-text uppercase tracking-wider group-hover:text-red-500 transition-colors duration-300">
                  CONTINUE SHOPPING
                </h3>
                <p className="text-xs sm:text-sm text-muted-text max-w-sm leading-relaxed">
                  Explore our full catalog, custom printing offers, and trending designs.
                </p>
              </div>
              <Link 
                href="/"
                className="flex items-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex-shrink-0 cursor-pointer shadow-md shadow-red-500/20"
              >
                Shop Storefront <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            
          </div>
        </div>
      </div>

      <div className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl space-y-12">
          
          {/* Main Action Grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {/* Orders Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              className="p-6 bg-white dark:bg-[#12131a] border border-border/80 dark:border-[#1f2833]/60 rounded-2xl smooth-transition shadow-sm flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-primary-text mb-1 smooth-transition">My Orders</h3>
                <p className="text-muted-text text-xs leading-relaxed mb-6">Review your order history, track live shipments, and access invoices.</p>
              </div>
              <Link href="/orders" className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 tracking-wider uppercase mt-auto">
                View Orders <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Custom Requests Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              className="p-6 bg-white dark:bg-[#12131a] border border-border/80 dark:border-[#1f2833]/60 rounded-2xl smooth-transition shadow-sm flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-primary-text mb-1 smooth-transition">Custom Projects</h3>
                <p className="text-muted-text text-xs leading-relaxed mb-6">Upload 3D STL designs, check print quotations, and monitor printing logs.</p>
              </div>
              <Link href="/custom-requests" className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600 tracking-wider uppercase mt-auto">
                View Projects <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Addresses Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              className="p-6 bg-white dark:bg-[#12131a] border border-border/80 dark:border-[#1f2833]/60 rounded-2xl smooth-transition shadow-sm flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-primary-text mb-1 smooth-transition">Saved Addresses</h3>
                <p className="text-muted-text text-xs leading-relaxed mb-6">Manage shipping addresses and billing information for faster checkouts.</p>
              </div>
              <button 
                onClick={() => setShowAddresses(!showAddresses)} 
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-500 hover:text-blue-600 tracking-wider uppercase mt-auto cursor-pointer bg-transparent border-none p-0 text-left"
              >
                {showAddresses ? 'Hide Addresses' : 'Manage Addresses'} <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Support Settings Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              className="p-6 bg-white dark:bg-[#12131a] border border-[#e0e0e0] dark:border-[#1f2833]/60 rounded-2xl smooth-transition shadow-sm flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-primary-text mb-1 smooth-transition">Support via Email</h3>
                <p className="text-muted-text text-xs leading-relaxed mb-6">Send an email directly to support for help with orders, custom projects, or payments.</p>
              </div>
              <button 
                onClick={() => setShowSupport(!showSupport)} 
                className="inline-flex items-center gap-1 text-xs font-bold text-green-500 hover:text-green-600 tracking-wider uppercase mt-auto cursor-pointer bg-transparent border-none p-0 text-left"
              >
                {showSupport ? 'Hide Support Form' : 'Contact Support'} <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* Account Settings Card */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              className="p-6 bg-white dark:bg-[#12131a] border border-[#e0e0e0] dark:border-[#1f2833]/60 rounded-2xl smooth-transition shadow-sm flex flex-col justify-between"
            >
              <div>
                <h3 className="text-lg font-bold text-primary-text mb-1 smooth-transition">Account Settings</h3>
                <p className="text-muted-text text-xs leading-relaxed mb-6">Update security credentials, configure dark mode, and modify contact cards.</p>
              </div>
              <Link href="/account" className="inline-flex items-center gap-1 text-xs font-bold text-purple-500 hover:text-purple-600 tracking-wider uppercase mt-auto">
                Go to Settings <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Support via Email Form Panel */}
          <AnimatePresence>
            {showSupport && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 pt-8 border-t border-border overflow-hidden"
              >
                <div>
                  <h2 className="text-2xl font-bold text-primary-text flex items-center gap-2">
                    <Mail className="w-6 h-6 text-red-500" /> Support via Email
                  </h2>
                  <p className="text-xs text-muted-text mt-0.5">Submit your query below, and our team will get back to you via email.</p>
                </div>

                <div className="max-w-2xl bg-white dark:bg-[#12131a] border border-border rounded-2xl p-6 shadow-sm">
                  <form onSubmit={handleSendSupportEmail} className="space-y-4">
                    {supportSuccess ? (
                      <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-xl font-medium">
                        ✨ Support request submitted successfully! We will get back to you shortly.
                      </div>
                    ) : (
                      <>
                        {supportError && (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-medium">
                            {supportError}
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block mb-1">Subject</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Issue with Order #12345"
                            value={supportSubject}
                            onChange={(e) => setSupportSubject(e.target.value)}
                            className="w-full px-4 py-2 bg-[#fafafa] dark:bg-[#0b0c10] border border-border focus:border-red-500 rounded-lg text-primary-text focus:outline-none text-xs transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block mb-1">Message</label>
                          <textarea
                            required
                            rows={5}
                            placeholder="Describe your issue in detail..."
                            value={supportMessage}
                            onChange={(e) => setSupportMessage(e.target.value)}
                            className="w-full px-4 py-2 bg-[#fafafa] dark:bg-[#0b0c10] border border-border focus:border-red-500 rounded-lg text-primary-text focus:outline-none text-xs transition-all resize-none"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={sendingSupportMail}
                          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:bg-gray-300"
                        >
                          {sendingSupportMail ? 'Sending...' : 'Send Support Request'}
                        </button>
                      </>
                    )}
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Address Management Section */}
          <AnimatePresence>
            {showAddresses && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 pt-8 border-t border-border overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-primary-text flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-red-500" /> Delivery Addresses
                    </h2>
                    <p className="text-xs text-muted-text mt-0.5">Add and manage addresses for faster checkout</p>
                  </div>
                  {!isFormOpen && (
                    <button
                      onClick={openAddForm}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl smooth-transition cursor-pointer shadow-md shadow-red-500/10"
                    >
                      <Plus className="w-4 h-4" /> Add Address
                    </button>
                  )}
                </div>

                {/* Form to Add/Edit Address */}
                {isFormOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-white dark:bg-[#12131a] border border-border rounded-2xl max-w-xl shadow-lg shadow-black/5"
                  >
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
                      <h3 className="font-bold text-base text-primary-text">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      <button 
                        onClick={() => setIsFormOpen(false)}
                        className="text-muted-text hover:text-primary-text cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveAddress} className="space-y-4">
                      {formError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg">
                          {formError}
                        </div>
                      )}
                      
                      <div>
                        <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">Street / House No.</label>
                        <input
                          type="text"
                          name="streetNo"
                          required
                          value={addressForm.streetNo}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-primary-text focus:outline-none focus:border-red-500/50 text-xs smooth-transition"
                          placeholder="e.g. Flat 102, Building A, Street No 4"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">Locality / Area</label>
                        <input
                          type="text"
                          name="locality"
                          required
                          value={addressForm.locality}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-primary-text focus:outline-none focus:border-red-500/50 text-xs smooth-transition"
                          placeholder="e.g. Sector 15, Rohini"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">Landmark <span className="text-[8px] text-muted-text font-normal lowercase">(optional)</span></label>
                        <input
                          type="text"
                          name="landmark"
                          value={addressForm.landmark}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-primary-text focus:outline-none focus:border-red-500/50 text-xs smooth-transition"
                          placeholder="e.g. Near Hanuman Temple"
                        />
                        <span className="text-[9px] text-amber-500 font-bold mt-1 block">
                          ⚠️ Please provide a detailed address with complete house/flat details so your order does not get swapped or misplaced.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">Primary Phone Number</label>
                          <input
                            type="tel"
                            name="phone"
                            required
                            value={addressForm.phone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-primary-text focus:outline-none focus:border-red-500/50 text-xs smooth-transition"
                            placeholder="e.g. +91 98765 43210"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">Alternate Phone Number <span className="text-[8px] text-muted-text font-normal lowercase">(optional)</span></label>
                          <input
                            type="tel"
                            name="alternatePhone"
                            value={addressForm.alternatePhone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-primary-text focus:outline-none focus:border-red-500/50 text-xs smooth-transition"
                            placeholder="e.g. +91 98765 43210"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">City</label>
                          <input
                            type="text"
                            name="city"
                            required
                            value={addressForm.city}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-primary-text focus:outline-none focus:border-red-500/50 text-xs smooth-transition"
                            placeholder="e.g. Mumbai"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">Postal Code (Pincode)</label>
                          <input
                            type="text"
                            name="postalCode"
                            required
                            value={addressForm.postalCode}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-primary-text focus:outline-none focus:border-red-500/50 text-xs smooth-transition"
                            placeholder="e.g. 400001"
                          />
                          <span className="text-[9px] text-amber-500 font-bold mt-1 block">
                            ℹ️ Please verify your pincode once to ensure correct delivery.
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">State</label>
                          <input
                            type="text"
                            name="state"
                            required
                            value={addressForm.state}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-primary-text focus:outline-none focus:border-red-500/50 text-xs smooth-transition"
                            placeholder="e.g. Maharashtra"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">Country</label>
                          <input
                            type="text"
                            name="country"
                            required
                            value={addressForm.country}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-primary-text focus:outline-none focus:border-red-500/50 text-xs smooth-transition"
                            placeholder="e.g. India"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          name="isDefault"
                          checked={addressForm.isDefault}
                          onChange={handleInputChange}
                          className="rounded border-border text-red-500 focus:ring-red-500 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="isDefault" className="text-xs font-semibold text-primary-text cursor-pointer select-none">
                          Set as default delivery address
                        </label>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsFormOpen(false)}
                          className="px-4 py-2 border border-border text-primary-text text-xs font-bold rounded-xl hover:bg-secondary smooth-transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl smooth-transition cursor-pointer shadow-md shadow-red-500/10"
                        >
                          Save Address
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex items-center gap-2 text-muted-text py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                    <span className="text-xs">Loading addresses...</span>
                  </div>
                )}

                {/* List of addresses */}
                {!loading && addresses.length === 0 ? (
                  <div className="p-8 border border-dashed border-border rounded-2xl text-center text-muted-text text-sm">
                    No saved addresses found. Add an address for future orders.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div 
                        key={addr.id} 
                        className={`p-5 bg-white dark:bg-[#12131a] border rounded-2xl flex flex-col justify-between gap-4 smooth-transition ${
                          addr.isDefault ? 'border-red-600 shadow-sm shadow-red-600/5' : 'border-border hover:border-red-600/20'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between">
                            <span className="text-xs font-bold text-primary-text capitalize">
                              {user?.name || 'Customer Address'}
                            </span>
                            {addr.isDefault && (
                              <span className="flex items-center gap-1 text-[9px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                <Check className="w-2.5 h-2.5" /> Default
                              </span>
                            )}
                          </div>
                          
                          <div className="text-xs text-secondary-text mt-3 space-y-1">
                            <p>{addr.street}</p>
                            <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                            <p>{addr.country}</p>
                            {(addr as any).phone && <p className="text-muted-text font-medium mt-1">Phone: {(addr as any).phone}</p>}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-2">
                          {!addr.isDefault ? (
                            <button
                              onClick={() => handleSetDefault(addr.id)}
                              className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer uppercase tracking-wider"
                            >
                              Set as Default
                            </button>
                          ) : (
                            <span />
                          )}
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditForm(addr)}
                              className="p-1.5 hover:bg-secondary text-muted-text hover:text-red-500 rounded smooth-transition cursor-pointer"
                              title="Edit Address"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="p-1.5 hover:bg-red-500/10 text-muted-text hover:text-red-500 rounded smooth-transition cursor-pointer"
                              title="Delete Address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recommended Products */}
          {displayProducts.length > 0 && (
            <div className="mt-16 pt-12 border-t border-border">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-primary-text tracking-tight uppercase">Recommended for You</h2>
                  <p className="text-xs text-muted-text mt-0.5">Based on popular designs and materials</p>
                </div>
                <Link href="/products" className="text-xs font-bold text-red-500 hover:underline tracking-wider uppercase">
                  Browse All Products →
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {displayProducts.map((prod: any) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {/* Phone Verification Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#12131a] border border-[#eaeaea] dark:border-[#1f2833]/60 rounded-2xl p-6 shadow-xl text-black dark:text-white"
            >
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setOtpSent(false)
                  setErrorMsg(null)
                  setSuccessMsg(null)
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-extrabold text-black dark:text-white mb-2">Verify Phone Number</h2>
              <p className="text-xs text-[#4f5d75] dark:text-[#9da8b6] mb-6">
                Enter your phone number in E.164 format (e.g. +919876543210) to verify your identity.
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-xl font-medium">
                  {successMsg}
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+919876543210"
                      value={phoneInput}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!val.startsWith('+91')) {
                          val = '+91' + val.replace(/^\+?91?/, '').replace(/\D/g, '');
                        }
                        const prefix = '+91';
                        const rest = val.substring(3).replace(/\D/g, '').substring(0, 10);
                        setPhoneInput(prefix + rest);
                      }}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0b0c10] border border-gray-200 dark:border-[#1f2833]/60 rounded-xl text-black dark:text-white focus:outline-none focus:border-red-500 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingOtp || phoneInput.replace(/^\+91/, '').replace(/\D/g, '').length !== 10}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md shadow-red-500/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSendingOtp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : 'Send Verification OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                       OTP sent to <span className="font-bold text-black dark:text-white">{phoneInput}</span>
                    </p>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">6-Digit OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0b0c10] border border-gray-200 dark:border-[#1f2833]/60 rounded-xl text-black dark:text-white focus:outline-none focus:border-[#d12626] text-sm tracking-[0.2em] font-mono text-center"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md shadow-red-500/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isVerifyingOtp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : 'Verify OTP'}
                  </button>

                  <div className="flex justify-between items-center text-xs mt-4">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-gray-500 hover:text-black dark:hover:text-white font-medium cursor-pointer"
                    >
                      ← Edit Number
                    </button>

                    <button
                      type="button"
                      disabled={cooldown > 0 || isSendingOtp}
                      onClick={handleSendOtp}
                      className={`font-semibold cursor-pointer ${
                        cooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-600'
                      }`}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div id="recaptcha-container-wrapper" style={{ display: 'none' }}></div>
    </main>
  )
}

