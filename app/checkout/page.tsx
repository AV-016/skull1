'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import Script from 'next/script'
import { useSettings } from '@/context/SettingsContext'
import { CreditCard, ShoppingBag, CheckCircle, ArrowRight, Loader2, MapPin, Phone, Plus, Minus, Trash2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'
import { useRouter, useSearchParams } from 'next/navigation'

interface CartItem {
  id: string
  productId?: string
  variantId?: string | null
  name: string
  slug: string
  price: number
  image: string
  category: string
  quantity: number
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

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isBuyNow = searchParams.get('buyNow') === 'true'
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [orderedItems, setOrderedItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isOrdered, setIsOrdered] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'COD'>('CARD')
  const [codChargeVal, setCodChargeVal] = useState<number>(50)
  const [platformFeeVal, setPlatformFeeVal] = useState<number>(0)
  const [platformFeeType, setPlatformFeeType] = useState<string>('FIXED')
  const [isGstEnabled, setIsGstEnabled] = useState<boolean>(true)
  const [gstRateVal, setGstRateVal] = useState<number>(18.0)
  const [shippingCost, setShippingCost] = useState<number | null>(null)
  const [shippingDetails, setShippingDetails] = useState<any | null>(null)
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new')
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true)
  const [showAllAddresses, setShowAllAddresses] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    streetNo: '',
    locality: '',
    landmark: '',
    city: '',
    postalCode: '',
    phone: '+91',
    alternatePhone: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    address: '',
  })

  const handleSelectSavedAddress = (addr: any) => {
    setSelectedAddressId(addr.id)
    const parsedStr = parseStreet(addr.street || '')
    const parsedPh = parsePhone(addr.phone || '')
    setFormData(prev => ({
      ...prev,
      streetNo: parsedStr.streetNo,
      locality: parsedStr.locality,
      landmark: parsedStr.landmark,
      city: addr.city || '',
      postalCode: addr.postalCode || '',
      phone: parsedPh.phone,
      alternatePhone: parsedPh.alternatePhone,
    }))
    setShowAllAddresses(false)
  }

  const handleAddNewAddressClick = () => {
    setSelectedAddressId('new')
    setFormData(prev => ({
      ...prev,
      streetNo: '',
      locality: '',
      landmark: '',
      city: '',
      postalCode: '',
      phone: '+91',
      alternatePhone: '',
    }))
    setShowAllAddresses(false)
  }
  
  const { formatPrice } = useSettings()
  const { user, setUser } = useAuth()
  const { data: allProducts = [] } = useProducts()

  const getErrorMessage = (err: any, fallbackMessage: string = 'An error occurred. Please try again.') => {
    if (err.response?.data) {
      const data = err.response.data
      if (data.errors) {
        const fieldErrors = Object.entries(data.errors)
          .map(([field, msgs]: any) => `${field.replace('body.', '')}: ${msgs.join(', ')}`)
          .join(' | ')
        return `${data.message} (${fieldErrors})`
      }
      return data.message || fallbackMessage
    }
    return err.message || fallbackMessage
  }

  const saveCart = (newItems: CartItem[]) => {
    setCartItems(newItems)
    if (typeof window !== 'undefined') {
      if (isBuyNow) {
        if (newItems.length === 0) {
          localStorage.removeItem('buyNowItem')
        } else {
          localStorage.setItem('buyNowItem', JSON.stringify(newItems[0]))
        }
      } else {
        localStorage.setItem('cart', JSON.stringify(newItems))
        window.dispatchEvent(new Event('cart-updated'))
      }
    }
  }

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty < 1) return
    
    const baseId = id.includes('_') ? id.split('_')[0] : id
    const dbProd = allProducts?.find((p: any) => p.id === baseId)
    if (dbProd && newQty > dbProd.stock) {
      alert(`Sorry, only ${dbProd.stock} items of "${dbProd.name}" are currently in stock.`)
      return
    }

    const newItems = cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQty } : item
    )
    saveCart(newItems)
  }

  const removeItem = (id: string) => {
    const newItems = cartItems.filter(item => item.id !== id)
    saveCart(newItems)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const buyNow = localStorage.getItem('buyNowItem')
      if (isBuyNow && buyNow) {
        setCartItems([JSON.parse(buyNow)])
      } else {
        const items = JSON.parse(localStorage.getItem('cart') || '[]')
        setCartItems(items)
      }
      setIsLoaded(true)
      const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setIdempotencyKey(uuid);
    }

    // Fetch dynamic settings
    api.get('/settings')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          const s = res.data.data
          setCodChargeVal(s.codCharge ?? 50)
          setPlatformFeeVal(s.platformFeeValue ?? 0)
          setPlatformFeeType(s.platformFeeType ?? 'FIXED')
          setIsGstEnabled(s.isGstEnabled ?? true)
          setGstRateVal(s.defaultGstRate ?? 18.0)
        }
      })
      .catch(err => console.error('Error fetching settings:', err))
  }, [isBuyNow])

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
      }))

      // Fetch saved addresses and prefill the default one
      api.get('/addresses')
        .then(res => {
          const addresses = res.data.data
          if (addresses && addresses.length > 0) {
            setSavedAddresses(addresses)
            const defAddr = addresses.find((a: any) => a.isDefault) || addresses[0]
            setSelectedAddressId(defAddr.id)
            setFormData(prev => ({
              ...prev,
              address: defAddr.street || '',
              city: defAddr.city || '',
              postalCode: defAddr.postalCode || '',
              phone: defAddr.phone || '',
            }))
          }
        })
        .catch(err => console.error('Error fetching addresses:', err))
    }
  }, [user])

  // Pincode auto-lookup
  useEffect(() => {
    const pincode = formData.postalCode.trim()
    if (/^\d{6}$/.test(pincode)) {
      fetch(`https://api.postalpincode.in/pincode/${pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data && data[0] && data[0].Status === 'Success') {
            const postOffice = data[0].PostOffice[0]
            if (postOffice) {
              const city = postOffice.District || postOffice.Name || ''
              setFormData(prev => ({
                ...prev,
                city: city,
              }))
            }
          }
        })
        .catch(err => console.error('Error looking up pincode:', err))
    }
  }, [formData.postalCode])

  // Dynamic shipping calculation
  const activePincode = selectedAddressId === 'new'
    ? formData.postalCode.trim()
    : savedAddresses.find(a => a.id === selectedAddressId)?.postalCode?.trim() || '';

  useEffect(() => {
    if (/^\d{6}$/.test(activePincode) && cartItems.length > 0) {
      setIsCalculatingShipping(true);
      api.post('/shipping/calculate', {
        customerPincode: activePincode,
        items: cartItems.map(item => ({
          productId: item.productId || item.id,
          quantity: item.quantity
        }))
      })
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setShippingCost(res.data.data.shipping);
          setShippingDetails(res.data.data);
        }
      })
      .catch(err => {
        console.error('Error calculating shipping:', err);
      })
      .finally(() => {
        setIsCalculatingShipping(false);
      });
    } else {
      setShippingCost(null);
      setShippingDetails(null);
    }
  }, [activePincode, cartItems]);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'Skulture-ECommerce-App'
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.address) {
              const addr = data.address
              const streetParts = [
                addr.road,
                addr.suburb,
                addr.neighbourhood,
                addr.city_district
              ].filter(Boolean)
              const street = streetParts.join(', ') || data.display_name || ''
              const city = addr.city || addr.town || addr.village || addr.municipality || ''
              const postalCode = addr.postcode || ''
              
              setFormData(prev => ({
                ...prev,
                streetNo: '',
                locality: street,
                city: city || prev.city,
                postalCode: postalCode || prev.postalCode
              }))
            }
          })
          .catch(err => console.error('Error in reverse geocoding:', err))
          .finally(() => setIsLocating(false))
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Unable to retrieve your location')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'phone' || name === 'alternatePhone') {
      let val = value;
      if (val) {
        if (!val.startsWith('+91')) {
          val = '+91' + val.replace(/^\+?91?/, '').replace(/\D/g, '');
        }
        const prefix = '+91';
        const rest = val.substring(3).replace(/\D/g, '').substring(0, 10);
        setFormData(prev => ({
          ...prev,
          [name]: prefix + rest
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: name === 'phone' ? '+91' : ''
        }));
      }
      setSelectedAddressId('new')
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (['streetNo', 'locality', 'landmark', 'city', 'postalCode'].includes(name)) {
      setSelectedAddressId('new')
    }
  }

  const handlePaymentFailure = async (orderId: string, errorType: string, description: string = '', itemsToRestore: CartItem[]) => {
    try {
      // 1. Cancel the order in the backend
      await api.post(`/orders/${orderId}/cancel`)
      
      // 2. Restore the cart in database and local storage
      if (itemsToRestore.length > 0) {
        if (typeof window !== 'undefined') {
          if (isBuyNow) {
            localStorage.setItem('buyNowItem', JSON.stringify(itemsToRestore[0]))
          } else {
            localStorage.setItem('cart', JSON.stringify(itemsToRestore))
            window.dispatchEvent(new Event('cart-updated'))
          }
        }

        // Sync back to database cart
        await api.delete('/cart/clear').catch(() => {})
        await Promise.all(
          itemsToRestore.map((item) =>
            api.post('/cart/items', {
              productId: item.productId || item.id,
              variantId: item.variantId || null,
              quantity: item.quantity
            }).catch(() => {})
          )
        )
      }
    } catch (err) {
      console.error('Error handling payment failure:', err)
    } finally {
      setIsSubmitting(false)
      const descParam = description ? `&description=${encodeURIComponent(description)}` : ''
      router.push(`/orders/${orderId}?payment_error=${errorType}${descParam}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)
    setOrderedItems([...cartItems])

    const phoneDigits = formData.phone.replace(/^\+91/, '').replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      setSubmitError('Phone number must be exactly 10 digits (excluding +91)')
      setIsSubmitting(false)
      return
    }

    const altPhoneDigits = formData.alternatePhone.replace(/^\+91/, '').replace(/\D/g, '')
    if (formData.alternatePhone && altPhoneDigits.length !== 10) {
      setSubmitError('Alternate phone number must be exactly 10 digits (excluding +91)')
      setIsSubmitting(false)
      return
    }

    try {
      // 1. Sync local cart items to the database cart in parallel
      await api.delete('/cart/clear')
      await Promise.all(
        cartItems.map((item) =>
          api.post('/cart/items', {
            productId: item.productId || item.id,
            variantId: item.variantId || null,
            quantity: item.quantity
          })
        )
      )

      // 2. Resolve address ID
      let addressId = selectedAddressId
      if (selectedAddressId === 'new') {
        const combinedStreet = `Street/House No: ${formData.streetNo.trim()} | Locality: ${formData.locality.trim()}${formData.landmark.trim() ? ` | Landmark: ${formData.landmark.trim()}` : ''}`
        const combinedPhone = `${formData.phone.trim()}${formData.alternatePhone.trim() ? ` / Alt: ${formData.alternatePhone.trim()}` : ''}`

        const addressRes = await api.post('/addresses', {
          street: combinedStreet,
          city: formData.city,
          state: 'N/A',
          postalCode: formData.postalCode,
          country: 'India',
          phone: combinedPhone,
          isDefault: false,
          isActive: saveAddressToProfile // If user wants to save to profile, it's active. Otherwise false (temporary/hidden).
        })
        addressId = addressRes.data.data.id
      }

      // 3. Create the order
      const orderRes = await api.post('/orders', {
        addressId,
        paymentMethod,
        idempotencyKey
      })
      const order = orderRes.data.data

      // 4. Immediately clear local storage cart to prevent duplicate orders or stuck carts on page refresh
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart')
        window.dispatchEvent(new Event('cart-updated'))
      }

      // =========================================================
      // 5. Payment Gateway Handling (Razorpay / Cash-On-Delivery)
      // =========================================================
      
      // If online card payment, trigger Razorpay checkout flow
      if (paymentMethod === 'CARD') {
        // Ensure Razorpay SDK script is loaded in window
        if (typeof window === 'undefined' || !(window as any).Razorpay) {
          throw new Error('Razorpay SDK failed to load. Please refresh the page and try again.')
        }

        // Call backend API endpoint to initialize/get Razorpay Order Session ID
        const paymentRes = await api.post('/payments/create-order', {
          orderId: order.id
        })
        const rzpOrder = paymentRes.data.data

        // Configure Razorpay Checkout overlay options
        const options = {
          key: rzpOrder.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'Skulture',
          description: `Order #${rzpOrder.orderNumber}`,
          order_id: rzpOrder.razorpayOrderId,
          // Callback handler executed when payment succeeds on Razorpay popup
          handler: async function (response: any) {
            try {
              setIsSubmitting(true)
              setSubmitError(null)
              
              // Verify the payment signature securely on the backend server
              await api.post('/payments/verify', {
                orderId: order.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })

              // Refresh user profile details in application context to update stamps/discounts
              try {
                const userRes = await api.get('/auth/me')
                if (userRes.data?.success && userRes.data?.data) {
                  setUser(userRes.data.data)
                }
              } catch (e) {
                console.error('Error refreshing profile:', e)
              }

              // Clear matching shopping items from local storage
              if (typeof window !== 'undefined') {
                if (isBuyNow) {
                  localStorage.removeItem('buyNowItem')
                } else {
                  localStorage.removeItem('cart')
                  window.dispatchEvent(new Event('cart-updated'))
                }
              }
              // Redirect user to the order confirmation page
              router.push(`/orders/${order.id}?payment_success=true`)
            } catch (verifyErr: any) {
              console.error('Payment verification error:', verifyErr)
              router.push(`/orders/${order.id}?payment_error=verification_failed`)
            } finally {
              setIsSubmitting(false)
            }
          },
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: '#000000',
          },
          modal: {
            // Callback when user cancels payment by closing Razorpay checkout popup
            ondismiss: function () {
              handlePaymentFailure(order.id, 'cancelled', '', cartItems)
            }
          }
        }

        // Initialize and open Razorpay Checkout UI Modal
        const rzp = new (window as any).Razorpay(options)
        rzp.on('payment.failed', function (response: any) {
          console.error('Razorpay payment failed:', response.error)
          handlePaymentFailure(order.id, 'failed', response.error.description || '', cartItems)
        })
        rzp.open()
      } else {
        // Cash on delivery: complete order directly without starting Razorpay gateway flow
        
        // Refresh user profile details in application context to update stamps/discounts
        try {
          const userRes = await api.get('/auth/me')
          if (userRes.data?.success && userRes.data?.data) {
            setUser(userRes.data.data)
          }
        } catch (e) {
          console.error('Error refreshing profile:', e)
        }

        // Clear matching shopping items from local storage
        if (typeof window !== 'undefined') {
          if (isBuyNow) {
            localStorage.removeItem('buyNowItem')
          } else {
            localStorage.removeItem('cart')
            window.dispatchEvent(new Event('cart-updated'))
          }
        }
        router.push(`/orders/${order.id}?payment_success=true`)
      }
    } catch (err: any) {
      console.error('Checkout error:', err)
      setSubmitError(getErrorMessage(err, 'An error occurred while placing your order. Please try again.'))
      setIsSubmitting(false)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const hasDiscount = !!(user?.loyaltyDiscountSet && user?.loyaltyDiscountValue && user.loyaltyDiscountValue > 0)
  const discountRate = hasDiscount ? (user?.loyaltyDiscountValue || 0) : 0
  const discountAmount = hasDiscount ? (subtotal * (discountRate / 100)) : 0
  const discountedSubtotal = subtotal - discountAmount
  const tax = isGstEnabled ? (discountedSubtotal * (gstRateVal / 100)) : 0
  const platformFee = platformFeeType === 'PERCENTAGE' ? (discountedSubtotal * (platformFeeVal / 100)) : platformFeeVal
  const codCharge = 0
  const shippingCharge = shippingCost ?? 0
  const total = discountedSubtotal + tax + platformFee + shippingCharge

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
        <Navbar />
        <div className="pt-32 pb-12 container mx-auto px-4 md:px-6 flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-8 bg-secondary rounded w-48" />
            <div className="h-4 bg-secondary rounded w-32" />
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  if (isOrdered) {
    const orderedSubtotal = orderedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const orderedDiscountAmount = hasDiscount ? (orderedSubtotal * (discountRate / 100)) : 0
    const orderedDiscountedSubtotal = orderedSubtotal - orderedDiscountAmount
    const orderedTax = isGstEnabled ? (orderedDiscountedSubtotal * (gstRateVal / 100)) : 0
    const orderedPlatformFee = platformFeeType === 'PERCENTAGE' ? (orderedDiscountedSubtotal * (platformFeeVal / 100)) : platformFeeVal
    const orderedTotal = orderedDiscountedSubtotal + orderedTax + orderedPlatformFee + (shippingCost ?? 0)
    const recommendedProducts = allProducts.filter((p: any) => p.isActive && p.stock > 0).slice(0, 4)

    return (
      <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
        <Navbar />
        <div className="pt-32 pb-12 md:pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Success Message & Product Details & Recommendations */}
              <div className="lg:col-span-2 space-y-8">
                {/* Success Card */}
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center gap-6 shadow-xl"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="heading-3 text-primary-text font-bold">Order Confirmed!</h2>
                    <p className="text-secondary-text text-sm mt-2">
                      Thank you for your purchase. We have sent an email confirmation to <span className="text-primary font-medium">{formData.email}</span>.
                    </p>
                  </div>
                </motion.div>

                {/* Ordered Product Details */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="font-bold text-base text-primary-text uppercase tracking-wide pb-3 border-b border-border">Items Ordered</h3>
                  <div className="divide-y divide-border/60">
                    {orderedItems.map((item) => (
                      <div key={item.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-4">
                          <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg bg-secondary border border-border shrink-0" />
                          <div>
                            <h4 className="font-bold text-sm text-primary-text">{item.name}</h4>
                            <p className="text-xs text-muted-text mt-0.5">{item.category}</p>
                            <p className="text-xs text-secondary-text mt-1">Quantity: <span className="font-semibold text-primary-text">{item.quantity}</span></p>
                          </div>
                        </div>
                        <span className="font-bold text-primary-text text-sm">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Address Details */}
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="font-bold text-base text-primary-text uppercase tracking-wide pb-3 border-b border-border">Shipping Address</h3>
                  <div className="text-xs text-secondary-text space-y-1 leading-relaxed capitalize">
                    <p className="font-bold text-primary-text">{formData.fullName}</p>
                    <p>{formData.address}</p>
                    <p>{formData.city} - {formData.postalCode}</p>
                    <p className="normal-case">Phone: {formData.phone || 'N/A'}</p>
                  </div>
                </div>

                {/* Recommended Products */}
                {recommendedProducts.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="font-bold text-lg text-primary-text uppercase tracking-wider">Recommended for You</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {recommendedProducts.slice(0, 4).map((prod: any) => (
                        <ProductCard key={prod.id} product={prod} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Order Summary & Shop More Panel */}
              <div>
                <div className="bg-card border border-border rounded-xl p-6 sticky top-28 space-y-6 shadow-xl text-center">
                  <h3 className="font-bold text-lg text-primary-text border-b border-border pb-4 uppercase tracking-wide">
                    Order Summary
                  </h3>
                  
                  {/* Miniature list */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {orderedItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <span className="text-secondary-text truncate max-w-[180px] text-left">{item.name} x {item.quantity}</span>
                        <span className="font-semibold text-primary-text">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-xs text-secondary-text">
                      <span>Subtotal</span>
                      <span>{formatPrice(orderedSubtotal)}</span>
                    </div>
                    {hasDiscount && (
                      <div className="flex justify-between text-xs text-green-500 font-bold">
                        <span>Discount</span>
                        <span>-{formatPrice(orderedDiscountAmount)}</span>
                      </div>
                    )}
                    {isGstEnabled && (
                      <div className="flex justify-between text-xs text-secondary-text">
                        <span>GST ({gstRateVal}%)</span>
                        <span>{formatPrice(orderedTax)}</span>
                      </div>
                    )}
                    {platformFeeVal > 0 && (
                      <div className="flex justify-between text-xs text-secondary-text">
                        <span>Platform Fee</span>
                        <span>{formatPrice(orderedPlatformFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs text-secondary-text">
                      <span>Shipping</span>
                      <span>{shippingCost !== null ? formatPrice(shippingCost) : 'Free'}</span>
                    </div>

                    <div className="border-t border-border pt-3 flex justify-between font-bold text-sm text-primary-text">
                      <span>Total Paid</span>
                      <span className="text-primary">{formatPrice(orderedTotal)}</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3 border-t border-border/60">
                    <p className="text-xs text-muted-text italic">Want to explore more unique designs?</p>
                    <Link
                      href="/products"
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg smooth-transition uppercase text-xs tracking-wider cursor-pointer shadow"
                    >
                      Shop More Products <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />

      <div className="pt-32 pb-12 border-b border-border">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="heading-2 text-primary-text">Checkout</h1>
        </div>
      </div>

      <div className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          {cartItems.length === 0 ? (
            <motion.div
              className="text-center py-16 max-w-md mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-secondary-text mb-8 text-lg">Your cart is empty. Please add items before checking out.</p>
              <Link
                href="/products"
                className="inline-block px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 smooth-transition uppercase text-xs tracking-wider font-bold cursor-pointer"
              >
                Continue Shopping
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Shipping Info */}
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-lg text-primary-text border-b border-border pb-3">Shipping Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block mb-1">Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          required
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-secondary border border-border focus:border-primary rounded-lg text-primary-text focus:outline-none text-sm transition-all"
                          placeholder="Aarav Sharma"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block mb-1">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 bg-secondary border border-border focus:border-primary rounded-lg text-primary-text focus:outline-none text-sm transition-all"
                          placeholder="johndoe@example.com"
                        />
                      </div>
                      {savedAddresses.length > 0 && (
                        <div className="sm:col-span-2 space-y-3 mb-2">
                          <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block">Deliver to Saved Address</label>
                          <div className="grid grid-cols-1 gap-3">
                            {showAllAddresses ? (
                              <>
                                {savedAddresses.map((addr) => (
                                  <div
                                    key={addr.id}
                                    onClick={() => handleSelectSavedAddress(addr)}
                                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                                      selectedAddressId === addr.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border bg-secondary hover:border-border/80'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          name="selectedAddress"
                                          checked={selectedAddressId === addr.id}
                                          onChange={() => handleSelectSavedAddress(addr)}
                                          className="accent-primary"
                                        />
                                        <span className="text-xs font-bold text-primary-text capitalize">{formData.fullName}</span>
                                        {addr.isDefault && (
                                          <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">Default</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-xs text-secondary-text mt-2 pl-5 space-y-1">
                                      <p>{addr.street}</p>
                                      <p>{addr.city}, {addr.postalCode}</p>
                                      <p className="flex items-center gap-1 mt-1 text-[11px]"><Phone className="w-3 h-3" /> {addr.phone || 'N/A'}</p>
                                    </div>
                                  </div>
                                ))}
                                <div
                                  onClick={handleAddNewAddressClick}
                                  className={`p-4 border rounded-xl cursor-pointer transition-all ${
                                    selectedAddressId === 'new'
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border bg-secondary hover:border-border/80'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name="selectedAddress"
                                      checked={selectedAddressId === 'new'}
                                      onChange={handleAddNewAddressClick}
                                      className="accent-primary"
                                    />
                                    <span className="text-xs font-bold text-primary-text">Add / Deliver to a new address</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowAllAddresses(false)}
                                  className="w-full mt-1.5 py-2.5 bg-neutral-900 border border-border/40 hover:bg-neutral-850 hover:text-white text-secondary-text rounded-xl text-[10px] font-black uppercase tracking-wider smooth-transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                >
                                  <span>Collapse Address List</span>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Show only the selected address */}
                                {selectedAddressId !== 'new' ? (() => {
                                  const addr = savedAddresses.find(a => a.id === selectedAddressId) || savedAddresses[0];
                                  if (!addr) return null;
                                  return (
                                    <div
                                      onClick={() => setShowAllAddresses(true)}
                                      className="p-4 border-2 border-primary bg-primary/5 rounded-xl cursor-pointer hover:bg-primary/10 transition-all border-dashed text-left"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="radio"
                                            name="selectedAddress"
                                            checked={true}
                                            readOnly
                                            className="accent-primary"
                                          />
                                          <span className="text-xs font-bold text-primary-text capitalize">{formData.fullName}</span>
                                          {addr.isDefault && (
                                            <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">Default</span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-xs text-secondary-text mt-2 pl-5 space-y-1">
                                        <p>{addr.street}</p>
                                        <p>{addr.city}, {addr.postalCode}</p>
                                        <p className="flex items-center gap-1 mt-1 text-[11px]"><Phone className="w-3 h-3" /> {addr.phone || 'N/A'}</p>
                                      </div>
                                    </div>
                                  );
                                })() : (
                                  <div
                                    onClick={() => setShowAllAddresses(true)}
                                    className="p-4 border-2 border-primary bg-primary/5 rounded-xl cursor-pointer hover:bg-primary/10 transition-all border-dashed text-left"
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name="selectedAddress"
                                        checked={true}
                                        readOnly
                                        className="accent-primary"
                                      />
                                      <span className="text-xs font-bold text-primary-text">Add / Deliver to a new address</span>
                                    </div>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setShowAllAddresses(true)}
                                  className="w-full mt-1.5 py-2.5 bg-neutral-900 border border-border/40 hover:bg-neutral-850 hover:text-white text-primary rounded-xl text-[10px] font-black uppercase tracking-wider smooth-transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                                >
                                  <span>Change Address / Show Other Addresses</span>
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                       {selectedAddressId === 'new' && (
                        <>
                          <div className="sm:col-span-2 space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block">Street / House No.</label>
                                <button
                                  type="button"
                                  onClick={handleGeolocation}
                                  disabled={isLocating}
                                  className="flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold cursor-pointer disabled:opacity-50"
                                >
                                  {isLocating ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" /> Locating...
                                    </>
                                  ) : (
                                    <>
                                      <MapPin className="w-3.5 h-3.5" /> Locate Me
                                    </>
                                  )}
                                </button>
                              </div>
                              <input
                                type="text"
                                name="streetNo"
                                required
                                minLength={2}
                                value={formData.streetNo}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-secondary border border-border focus:border-primary rounded-lg text-primary-text focus:outline-none text-sm transition-all"
                                placeholder="e.g. Flat 102, Building A, Street No 4"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block mb-1">Locality / Area</label>
                              <input
                                type="text"
                                name="locality"
                                required
                                minLength={3}
                                value={formData.locality}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-secondary border border-border focus:border-primary rounded-lg text-primary-text focus:outline-none text-sm transition-all"
                                placeholder="e.g. Sector 15, Rohini"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block mb-1">Landmark <span className="text-[10px] text-muted-text font-normal lowercase">(optional)</span></label>
                              <input
                                type="text"
                                name="landmark"
                                value={formData.landmark}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-secondary border border-border focus:border-primary rounded-lg text-primary-text focus:outline-none text-sm transition-all"
                                placeholder="e.g. Near Hanuman Temple"
                              />
                              <span className="text-[10px] text-amber-500 font-bold mt-1.5 block">
                                ⚠️ Please provide a detailed address with complete house/flat details so your order does not get swapped or misplaced.
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:col-span-2">
                            <div>
                              <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block mb-1">Primary Phone Number</label>
                              <input
                                type="tel"
                                name="phone"
                                required
                                minLength={10}
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-secondary border border-border focus:border-primary rounded-lg text-primary-text focus:outline-none text-sm transition-all"
                                placeholder="e.g. +91 98765 43210"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block mb-1">Alternate Phone Number <span className="text-[10px] text-muted-text font-normal lowercase">(optional)</span></label>
                              <input
                                type="tel"
                                name="alternatePhone"
                                value={formData.alternatePhone}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 bg-secondary border border-border focus:border-primary rounded-lg text-primary-text focus:outline-none text-sm transition-all"
                                placeholder="e.g. +91 98765 43210"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block mb-1">City</label>
                            <input
                              type="text"
                              name="city"
                              required
                              minLength={2}
                              value={formData.city}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 bg-secondary border border-border focus:border-primary rounded-lg text-primary-text focus:outline-none text-sm transition-all"
                              placeholder="Mumbai"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-secondary-text uppercase tracking-wider block mb-1">Postal Code (Pincode)</label>
                            <input
                              type="text"
                              name="postalCode"
                              required
                              minLength={4}
                              value={formData.postalCode}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 bg-secondary border border-border focus:border-primary rounded-lg text-primary-text focus:outline-none text-sm transition-all"
                              placeholder="400001"
                            />
                            <span className="text-[10px] text-amber-500 font-bold mt-1.5 block">
                              ℹ️ Please verify your pincode once to ensure correct delivery.
                            </span>
                          </div>
                          <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                            <input
                              type="checkbox"
                              id="saveAddressToProfile"
                              checked={saveAddressToProfile}
                              onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                              className="rounded border-gray-300 dark:border-gray-750 text-primary focus:ring-primary w-4 h-4 cursor-pointer accent-primary"
                            />
                            <label htmlFor="saveAddressToProfile" className="text-xs font-bold text-secondary-text cursor-pointer select-none uppercase tracking-wider">
                              Save address to my profile for future orders
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                    <h3 className="font-bold text-lg text-primary-text border-b border-border pb-3 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" /> Payment Method
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                      <div
                        onClick={() => setPaymentMethod('CARD')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentMethod === 'CARD'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-secondary hover:border-border/80'
                        }`}
                      >
                        <CreditCard className="w-6 h-6 mb-2 text-primary" />
                        <span className="text-sm font-semibold text-primary-text font-bold">Pay Online</span>
                      </div>
                      <div
                        onClick={() => setPaymentMethod('COD')}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentMethod === 'COD'
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-secondary hover:border-border/80'
                        }`}
                      >
                        <ShoppingBag className="w-6 h-6 mb-2 text-primary" />
                        <span className="text-sm font-semibold text-primary-text font-bold">Cash on Delivery</span>
                      </div>
                    </div>

                    {paymentMethod === 'CARD' ? (
                      <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg text-sm text-secondary-text">
                        Pay securely online using <span className="font-bold text-primary-text">Razorpay</span> (supports UPI, Cards, Netbanking, and Wallets).
                      </div>
                    ) : (
                      <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg text-sm text-secondary-text">
                        You will pay for your order in cash upon delivery.
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-secondary-text space-y-2 text-left">
                    <p className="font-bold text-amber-500 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Important Shipping & Return Notice:
                    </p>
                    <ul className="space-y-1 list-none pl-0">
                      <li className="leading-relaxed flex items-start gap-1.5">
                        <span className="text-amber-500 shrink-0 font-bold">•</span>
                        <span>Orders <strong className="text-primary-text font-black">cannot be canceled</strong> once they have been shipped.</span>
                      </li>
                      <li className="leading-relaxed flex items-start gap-1.5">
                        <span className="text-amber-500 shrink-0 font-bold">•</span>
                        <span>Returns are only accepted within <strong className="text-primary-text font-black">3 days</strong> of order delivery. Returns requested after 3 days of delivery will not be approved.</span>
                      </li>
                    </ul>
                  </div>

                  {submitError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg">
                      {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-lg smooth-transition uppercase text-xs tracking-wider font-bold cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Placing Order...
                      </>
                    ) : (
                      <>
                        Place Order ({formatPrice(total)}) <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Order Summary Panel */}
              <div>
                <div className="bg-card border border-border rounded-xl p-6 sticky top-28 space-y-6">
                  <h3 className="font-bold text-lg text-primary-text pb-4 border-b border-border flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-primary" /> Order Summary
                  </h3>

                  <div className="max-h-60 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 justify-between py-2 border-b border-border/40 last:border-b-0">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded bg-secondary border border-border shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-primary-text truncate">{item.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {/* Quantity selector */}
                              <div className="flex items-center border border-border rounded bg-secondary text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="px-1.5 py-0.5 text-secondary-text hover:text-primary smooth-transition cursor-pointer"
                                >
                                  −
                                </button>
                                <span className="px-1.5 text-primary-text font-bold">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="px-1.5 py-0.5 text-secondary-text hover:text-primary smooth-transition cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-muted-text hover:text-red-500 p-0.5 smooth-transition cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-primary-text shrink-0">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 space-y-3">
                    <div className="flex justify-between text-secondary-text text-xs">
                      <span>Subtotal</span>
                      <span className="font-medium text-primary-text">{formatPrice(subtotal)}</span>
                    </div>
                    {hasDiscount && (
                      <div className="flex justify-between text-green-500 text-xs font-bold">
                        <span>Loyalty Discount ({discountRate}%)</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    {isGstEnabled && (
                      <div className="flex justify-between text-secondary-text text-xs">
                        <span>GST ({gstRateVal}%)</span>
                        <span className="font-medium text-primary-text">{formatPrice(tax)}</span>
                      </div>
                    )}
                    {platformFeeVal > 0 && (
                      <div className="flex justify-between text-secondary-text text-xs">
                        <span>Platform Fee</span>
                        <span className="font-medium text-primary-text">{formatPrice(platformFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-secondary-text text-xs">
                      <span>Shipping</span>
                      {isCalculatingShipping ? (
                        <span className="text-muted-text italic">Calculating...</span>
                      ) : shippingCost !== null ? (
                        <span className="font-medium text-primary-text">{formatPrice(shippingCost)}</span>
                      ) : (
                        <span className="text-red-500 font-medium">Enter PIN Code</span>
                      )}
                    </div>
                    {shippingDetails && (
                      <div className="flex justify-between text-[10px] text-muted-text -mt-2.5">
                        <span>Zone: {shippingDetails.zone}</span>
                        <span>Est: {shippingDetails.estimatedDelivery}</span>
                      </div>
                    )}

                    <div className="border-t border-border pt-4 flex justify-between font-bold text-sm text-primary-text">
                      <span>Grand Total</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

