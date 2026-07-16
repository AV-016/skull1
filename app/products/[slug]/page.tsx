'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useProductDetail, useProducts } from '@/hooks/useProducts'
import React, { useState, useEffect, useMemo } from 'react'
import { sanitizeProducts } from '@/lib/mockProducts'
import { useSettings } from '@/context/SettingsContext'
import { ShoppingCart, Star, Calendar, Heart, MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { ProductCard } from '@/components/products/ProductCard'
import { useAuth } from '@/context/AuthContext'
import { useOrders } from '@/hooks/useOrders'

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params)
  const slug = resolvedParams.slug

  const { data: product, isLoading, error } = useProductDetail(slug)
  const { formatPrice } = useSettings()

  const [quantity, setQuantity] = useState(1)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(3)
  const router = useRouter()
  const [isDescExpanded, setIsDescExpanded] = useState(false)
  const { user } = useAuth()

  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    transform: 'scale(1)',
    transformOrigin: 'center center'
  })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomStyle({
      transform: 'scale(2.2)',
      transformOrigin: `${x}% ${y}%`
    })
  }

  const handleMouseLeave = () => {
    setZoomStyle({
      transform: 'scale(1)',
      transformOrigin: 'center center'
    })
  }
  const sanitizedProduct = useMemo(() => {
    return product ? sanitizeProducts([product])[0] : null
  }, [product])

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)

  const { data: orders = [] } = useOrders({ enabled: !!user })

  const [pincode, setPincode] = useState('')
  const [pincodeResult, setPincodeResult] = useState<{
    success: boolean;
    estimatedDelivery?: string;
    shippingCharge?: number;
    error?: string;
  } | null>(null)
  const [checkingPincode, setCheckingPincode] = useState(false)

  const loggedInPincode = useMemo(() => {
    if (!user || !orders || orders.length === 0) return null;
    return orders[0]?.address?.postalCode || null;
  }, [user, orders]);

  const handleCheckPincode = async (pinToCheck: string) => {
    const pin = pinToCheck.trim();
    if (!/^\d{6}$/.test(pin)) {
      setPincodeResult({ success: false, error: 'Invalid pincode. Must be 6 digits.' })
      return
    }
    if (!sanitizedProduct?.id) return;
    try {
      setCheckingPincode(true);
      setPincodeResult(null);
      const res = await api.post('/shipping/calculate', {
        customerPincode: pin,
        items: [{ productId: sanitizedProduct.id, quantity: 1 }]
      });
      if (res.data?.success && res.data?.data) {
        const { estimatedDelivery, shipping } = res.data.data;
        setPincodeResult({
          success: true,
          estimatedDelivery,
          shippingCharge: shipping
        });
      } else {
        setPincodeResult({ success: false, error: 'Failed to retrieve delivery information.' });
      }
    } catch (err: any) {
      setPincodeResult({
        success: false,
        error: err.response?.data?.message || 'Delivery not available for this pincode.'
      });
    } finally {
      setCheckingPincode(false);
    }
  }

  useEffect(() => {
    if (loggedInPincode && sanitizedProduct?.id) {
      setPincode(loggedInPincode)
      handleCheckPincode(loggedInPincode)
    }
  }, [loggedInPincode, sanitizedProduct?.id])

  const currentOriginalPrice = useMemo(() => {
    if (!sanitizedProduct) return 0
    return selectedVariant && selectedVariant.price !== null
      ? selectedVariant.price
      : sanitizedProduct.price
  }, [sanitizedProduct, selectedVariant])

  const currentFinalPrice = useMemo(() => {
    if (!sanitizedProduct) return 0
    return sanitizedProduct.eventPromo
      ? Number((currentOriginalPrice * (1 - sanitizedProduct.eventPromo.discountPercentage / 100)).toFixed(2))
      : currentOriginalPrice
  }, [sanitizedProduct, currentOriginalPrice])



  useEffect(() => {
    if (sanitizedProduct?.variants && sanitizedProduct.variants.length > 0) {
      setSelectedVariant(sanitizedProduct.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setCurrentImageIndex(0);
  }, [sanitizedProduct]);

  // Derived list of display images
  const displayImages = (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0)
    ? selectedVariant.images
    : (sanitizedProduct?.images && sanitizedProduct.images.length > 0
      ? sanitizedProduct.images
      : [sanitizedProduct?.image || '/placeholder.jpg']);

  useEffect(() => {
    if (displayImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    }, 4000); // auto slide every 4 seconds

    return () => clearInterval(interval);
  }, [displayImages]);

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

  // Initialize subject once product is loaded
  useEffect(() => {
    if (product) {
      setSupportFormData(prev => ({
        ...prev,
        subject: `Product Support: ${product.name}`
      }))
    }
  }, [product])

  // Prefill user details
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
    if (!sanitizedProduct) return
    try {
      setIsSupportSubmitting(true)
      await api.post('/inquiries', {
        name: supportFormData.name,
        email: supportFormData.email,
        subject: supportFormData.subject,
        message: supportFormData.message,
        productId: sanitizedProduct.id,
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


  const [isInWishlist, setIsInWishlist] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sanitizedProduct?.id) {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setIsInWishlist(wishlist.some((item: any) => item.id === sanitizedProduct.id))
    }
  }, [sanitizedProduct?.id])

  const toggleWishlist = () => {
    if (!sanitizedProduct) return
    if (typeof window !== 'undefined') {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      let updatedWishlist = []

      if (isInWishlist) {
        updatedWishlist = wishlist.filter((item: any) => item.id !== sanitizedProduct.id)
        setIsInWishlist(false)
      } else {
        updatedWishlist = [...wishlist, sanitizedProduct]
        setIsInWishlist(true)
      }

      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist))
      window.dispatchEvent(new Event('wishlist-updated'))
    }
  }

  const { data: allProducts = [] } = useProducts()

  const recommendedProducts = (sanitizedProduct && allProducts.length > 0)
    ? (() => {
      const dbProducts = sanitizeProducts(allProducts)
      const otherProducts = dbProducts.filter(p => p.id !== sanitizedProduct.id)
      return [
        ...otherProducts.filter(p => {
          const pCat = typeof p.category === 'object' && p.category !== null ? (p.category as any).name : p.category
          const sCat = typeof sanitizedProduct.category === 'object' && sanitizedProduct.category !== null ? (sanitizedProduct.category as any).name : sanitizedProduct.category
          return pCat === sCat
        }),
        ...otherProducts.filter(p => {
          const pCat = typeof p.category === 'object' && p.category !== null ? (p.category as any).name : p.category
          const sCat = typeof sanitizedProduct.category === 'object' && sanitizedProduct.category !== null ? (sanitizedProduct.category as any).name : sanitizedProduct.category
          return pCat !== sCat
        })
      ].slice(0, 4)
    })()
    : []

  useEffect(() => {
    if (sanitizedProduct?.id) {
      setLoadingReviews(true)
      api.get(`/products/${sanitizedProduct.id}/reviews`)
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setReviews(res.data.data)
          }
        })
        .catch((err) => console.error('Error fetching product reviews:', err))
        .finally(() => setLoadingReviews(false))
    }
  }, [sanitizedProduct?.id])

  const handleAddToCart = () => {
    if (!sanitizedProduct) return

    const stock = selectedVariant ? (selectedVariant.stock ?? 0) : (sanitizedProduct.stock ?? 0)
    if (stock <= 0) {
      setToastMessage(`Sorry, "${sanitizedProduct.name}${selectedVariant ? ` (${selectedVariant.name})` : ''}" is out of stock!`)
      setTimeout(() => setToastMessage(null), 3000)
      return
    }

    if (typeof window !== 'undefined') {
      const currentCart = JSON.parse(localStorage.getItem('cart') || '[]')
      const cartItemId = selectedVariant ? `${sanitizedProduct.id}_${selectedVariant.id}` : sanitizedProduct.id
      const existing = currentCart.find((item: any) => item.id === cartItemId)

      const currentQty = existing ? existing.quantity : 0
      if (currentQty + quantity > stock) {
        const allowed = stock - currentQty
        if (allowed <= 0) {
          setToastMessage(`Cannot add more. You already have all ${stock} available items in your cart.`)
        } else {
          if (existing) {
            existing.quantity = stock
          } else {
            currentCart.push({
              id: cartItemId,
              productId: sanitizedProduct.id,
              variantId: selectedVariant?.id || null,
              name: selectedVariant ? `${sanitizedProduct.name} (${selectedVariant.name})` : sanitizedProduct.name,
              slug: sanitizedProduct.slug,
              price: currentFinalPrice,
              image: (selectedVariant?.images?.[0]) || sanitizedProduct.image || '/placeholder.jpg',
              category: sanitizedProduct.category,
              quantity: stock
            })
          }
          localStorage.setItem('cart', JSON.stringify(currentCart))
          window.dispatchEvent(new Event('cart-updated'))
          setToastMessage(`Only ${allowed} more items could be added. Cart now has max stock of ${stock}.`)
        }
        setTimeout(() => setToastMessage(null), 3000)
        return
      }

      if (existing) {
        existing.quantity += quantity
      } else {
        currentCart.push({
          id: cartItemId,
          productId: sanitizedProduct.id,
          variantId: selectedVariant?.id || null,
          name: selectedVariant ? `${sanitizedProduct.name} (${selectedVariant.name})` : sanitizedProduct.name,
          slug: sanitizedProduct.slug,
          price: currentFinalPrice,
          image: (selectedVariant?.images?.[0]) || sanitizedProduct.image || '/placeholder.jpg',
          category: sanitizedProduct.category,
          quantity: quantity
        })
      }
      localStorage.setItem('cart', JSON.stringify(currentCart))
      window.dispatchEvent(new Event('cart-updated'))
    }

    setToastMessage(`"${sanitizedProduct.name}${selectedVariant ? ` (${selectedVariant.name})` : ''}" (${quantity} ${quantity === 1 ? 'item' : 'items'}) added to cart!`)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const handleBuyNow = () => {
    if (!sanitizedProduct) return

    if (!user) {
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    const stock = selectedVariant ? (selectedVariant.stock ?? 0) : (sanitizedProduct.stock ?? 0)
    if (stock <= 0) {
      setToastMessage(`Sorry, "${sanitizedProduct.name}${selectedVariant ? ` (${selectedVariant.name})` : ''}" is out of stock!`)
      setTimeout(() => setToastMessage(null), 3000)
      return
    }

    if (typeof window !== 'undefined') {
      const cartItemId = selectedVariant ? `${sanitizedProduct.id}_${selectedVariant.id}` : sanitizedProduct.id
      const buyNowItem = {
        id: cartItemId,
        productId: sanitizedProduct.id,
        variantId: selectedVariant?.id || null,
        name: selectedVariant ? `${sanitizedProduct.name} (${selectedVariant.name})` : sanitizedProduct.name,
        slug: sanitizedProduct.slug,
        price: currentFinalPrice,
        image: (selectedVariant?.images?.[0]) || sanitizedProduct.image || '/placeholder.jpg',
        category: sanitizedProduct.category,
        quantity: quantity
      }
      localStorage.setItem('buyNowItem', JSON.stringify(buyNowItem))
      router.push('/checkout?buyNow=true')
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
        <Navbar />
        <div className="pt-32 pb-12 container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="aspect-square bg-secondary rounded-lg animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-secondary rounded animate-pulse w-3/4" />
              <div className="h-6 bg-secondary rounded animate-pulse w-1/2" />
              <div className="space-y-2 mt-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-secondary rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !sanitizedProduct) {
    return (
      <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
        <Navbar />
        <div className="pt-32 pb-12 container mx-auto px-4 md:px-6 text-center">
          <p className="text-destructive">Product not found</p>
          <Link href="/products" className="text-primary-text hover:text-primary mt-4 inline-block">
            Back to Products
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />

      {/* Product Detail */}
      <div className="pt-32 pb-12 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Image Slider */}
            <div className="space-y-4">
              <div
                className="relative aspect-square rounded-lg overflow-hidden bg-secondary border border-border group cursor-zoom-in"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={displayImages[currentImageIndex]}
                    alt={sanitizedProduct.name}
                    style={zoomStyle}
                    className="w-full h-full object-cover transition-transform duration-100 ease-out"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </AnimatePresence>

                {/* Left/Right Arrows */}
                {displayImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentImageIndex(
                          (prev) => (prev - 1 + displayImages.length) % displayImages.length
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-primary text-white opacity-0 group-hover:opacity-100 smooth-transition cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentImageIndex((prev) => (prev + 1) % displayImages.length)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-primary text-white opacity-0 group-hover:opacity-100 smooth-transition cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Dot Indicators */}
                {displayImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {displayImages.map((_: any, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-2 h-2 rounded-full smooth-transition ${idx === currentImageIndex ? 'bg-primary w-4' : 'bg-white/40 hover:bg-white/70'
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails list */}
              {displayImages.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {displayImages.map((url: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative w-20 aspect-square rounded overflow-hidden border smooth-transition bg-secondary flex-shrink-0 ${idx === currentImageIndex ? 'border-primary shadow-md' : 'border-border opacity-70 hover:opacity-100'
                        }`}
                    >
                      <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Breadcrumb */}
                <Link href="/products" className="text-secondary-text hover:text-primary text-sm smooth-transition">
                  ← Products
                </Link>

                {/* Title & Wishlist */}
                <div className="flex items-center justify-between gap-4 mt-4 mb-2">
                  <h1 className="heading-2 text-primary-text">{sanitizedProduct.name}</h1>
                  <button
                    type="button"
                    onClick={toggleWishlist}
                    className="p-2.5 border border-border text-primary-text rounded-full hover:bg-secondary smooth-transition cursor-pointer flex items-center justify-center"
                    title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-secondary-text'
                        }`}
                    />
                  </button>
                </div>

                {/* Rating below title */}
                {sanitizedProduct.reviewsCount > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex text-primary">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(sanitizedProduct.rating)
                            ? 'fill-primary text-primary'
                            : 'text-white/10'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-secondary-text font-medium">
                      {sanitizedProduct.rating} / 5 ({sanitizedProduct.reviewsCount} {sanitizedProduct.reviewsCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}

                {/* Category */}
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs bg-secondary text-primary border border-border px-3 py-1 rounded-full font-semibold">
                    {sanitizedProduct.category}
                  </span>
                </div>

                {/* Variant Selector */}
                {sanitizedProduct.variants && sanitizedProduct.variants.length > 0 && (
                  <div className="mb-6 space-y-2">
                    <span className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">
                      Select Option
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sanitizedProduct.variants.map((v: any) => {
                        const isSelected = selectedVariant?.id === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setSelectedVariant(v);
                              setCurrentImageIndex(0);
                            }}
                            className={`px-4 py-2 border text-xs font-semibold rounded-lg smooth-transition cursor-pointer ${isSelected
                              ? 'bg-primary text-white border-primary shadow-sm font-bold'
                              : 'border-border bg-secondary/35 text-secondary-text hover:border-primary/50 hover:text-primary-text'
                              }`}
                          >
                            {v.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="text-secondary-text leading-relaxed mb-8">
                  {sanitizedProduct.description.length > 250 ? (
                    <p className="whitespace-pre-line">
                      {isDescExpanded
                        ? sanitizedProduct.description
                        : `${sanitizedProduct.description.slice(0, 250)}...`}
                      <button
                        type="button"
                        onClick={() => setIsDescExpanded(!isDescExpanded)}
                        className="text-primary hover:underline font-bold ml-2 focus:outline-none inline-block cursor-pointer"
                      >
                        {isDescExpanded ? 'Read Less' : 'Read More'}
                      </button>
                    </p>
                  ) : (
                    <p className="whitespace-pre-line">{sanitizedProduct.description}</p>
                  )}
                </div>

                {/* Specifications */}
                {sanitizedProduct.specifications && Object.keys(sanitizedProduct.specifications).length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-primary-text mb-4">Specifications</h3>
                    <div className="space-y-3">
                      {Object.entries(sanitizedProduct.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between border-b border-border pb-2">
                          <span className="text-secondary-text capitalize">{key}</span>
                          <span className="text-primary-text font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pincode Checker */}
              <div className="mb-6 border-t border-border/60 pt-6 space-y-2">
                <span className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">
                  Delivery Availability
                </span>
                <div className="flex gap-2 max-w-sm">
                  <input
                    type="text"
                    placeholder="Enter 6-digit Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1 px-3 py-2 bg-secondary border border-border text-xs text-primary-text focus:outline-none focus:border-primary/55 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleCheckPincode(pincode)}
                    disabled={checkingPincode || pincode.length !== 6}
                    className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {checkingPincode ? 'Checking...' : 'Check'}
                  </button>
                </div>
                {pincodeResult && (
                  <div className="mt-2 text-xs max-w-sm">
                    {pincodeResult.success ? (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <span>✓ Deliverable</span>
                        </p>
                        <p className="text-secondary-text">
                          Estimated Delivery: <span className="text-primary-text font-semibold">{pincodeResult.estimatedDelivery}</span>
                        </p>
                        <p className="text-secondary-text">
                          Shipping Charge: <span className="text-primary-text font-semibold">{pincodeResult.shippingCharge === 0 ? 'Free' : formatPrice(pincodeResult.shippingCharge ?? 0)}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                        <p className="font-bold">✗ Not Deliverable</p>
                        <p className="text-secondary-text mt-0.5">{pincodeResult.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Purchase Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 items-center border-t border-border/60">
                {/* Left Side: Pricing & Quantity */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      {sanitizedProduct.eventPromo ? (
                        <>
                          <span className="text-4xl font-bold text-primary">
                            {formatPrice(currentFinalPrice)}
                          </span>
                          <span className="text-xl text-muted-text line-through font-semibold">
                            {formatPrice(currentOriginalPrice)}
                          </span>
                        </>
                      ) : sanitizedProduct.compareAtPrice && sanitizedProduct.compareAtPrice > currentOriginalPrice ? (
                        <>
                          <span className="text-4xl font-bold text-primary-text">
                            {formatPrice(currentOriginalPrice)}
                          </span>
                          <span className="text-xl text-muted-text line-through font-semibold">
                            {formatPrice(sanitizedProduct.compareAtPrice)}
                          </span>
                        </>
                      ) : (
                        <span className="text-4xl font-bold text-primary-text">
                          {formatPrice(currentOriginalPrice)}
                        </span>
                      )}
                      <span className="text-secondary-text text-sm">per unit</span>
                    </div>
                    {sanitizedProduct.eventPromo ? (
                      <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider w-max mt-1">
                        {sanitizedProduct.eventPromo.discountPercentage}% OFF — Under {sanitizedProduct.eventPromo.eventTitle}
                      </span>
                    ) : sanitizedProduct.compareAtPrice && sanitizedProduct.compareAtPrice > currentOriginalPrice ? (
                      <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider w-max mt-1">
                        ↓{Math.round(((sanitizedProduct.compareAtPrice - currentOriginalPrice) / sanitizedProduct.compareAtPrice) * 100)}% OFF
                      </span>
                    ) : null}
                    {sanitizedProduct.bestSellerOrder && sanitizedProduct.bestSellerOrder > 0 ? (
                      <span className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider w-max mt-1.5 flex items-center gap-1.5 shadow-sm">
                        🔥 #{sanitizedProduct.bestSellerOrder} Best Seller
                      </span>
                    ) : null}
                  </div>

                  {/* Stock Info */}
                  <div className="text-sm">
                    {(() => {
                      const stock = selectedVariant ? (selectedVariant.stock ?? 0) : (sanitizedProduct.stock ?? 0);
                      if (stock <= 0) {
                        return <span className="text-red-500 font-semibold">Out of Stock</span>;
                      }
                      if (stock < 5) {
                        return <span className="text-orange-500 font-semibold">Few stock left!!</span>;
                      }
                      return <span className="text-green-500 font-semibold">In Stock</span>;
                    })()}
                  </div>

                  {/* Quantity */}
                  {(selectedVariant ? (selectedVariant.stock ?? 0) : (sanitizedProduct.stock ?? 0)) > 0 && (
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-primary-text">Quantity:</label>
                      <div className="flex items-center border border-border rounded-lg bg-secondary/35">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-3 py-2 text-secondary-text hover:text-primary smooth-transition"
                        >
                          −
                        </button>
                        <span className="px-6 py-2 text-primary-text border-l border-r border-border">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(
                              Math.min(
                                selectedVariant ? (selectedVariant.stock ?? 0) : (sanitizedProduct.stock ?? 0),
                                quantity + 1
                              )
                            )
                          }
                          className="px-3 py-2 text-secondary-text hover:text-primary smooth-transition"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Stacked Add to Cart and Buy Now Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={sanitizedProduct.stock <= 0}
                    className="w-full px-6 py-3.5 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 disabled:bg-gray-100/50 disabled:text-black/40 disabled:cursor-not-allowed smooth-transition cursor-pointer text-center text-xs sm:text-sm uppercase tracking-wider font-bold"
                  >
                    {sanitizedProduct.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={sanitizedProduct.stock <= 0}
                    className="w-full px-6 py-3.5 border border-border text-primary-text font-semibold rounded-lg hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed smooth-transition cursor-pointer text-center text-xs sm:text-sm uppercase tracking-wider font-bold"
                  >
                    Buy Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSupportModalOpen(true)}
                    className="w-full px-6 py-3.5 border border-border/80 text-secondary-text hover:text-primary-text font-semibold rounded-lg hover:bg-secondary/60 smooth-transition cursor-pointer text-center text-xs sm:text-sm uppercase tracking-wider font-bold mt-1.5 flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Support for Product</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Ratings & Reviews Section */}
      <div className="border-t border-border mt-16 py-16 bg-secondary/5">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="heading-3 mb-8">Ratings & Reviews</h2>

          {loadingReviews ? (
            <p className="text-secondary-text">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-secondary-text italic bg-secondary/10 p-6 rounded-lg border border-border">No reviews yet for this product. Be the first to leave one!</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Reviews List */}
              <div className="lg:col-span-7 space-y-6">
                {reviews.slice(0, visibleReviewsCount).map((review: any) => (
                  <div key={review.id} className="bg-card border border-border p-6 rounded-xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-primary">
                          {review.user?.name ? review.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-primary-text">{review.user?.name || 'Anonymous User'}</h4>
                          <p className="text-xs text-muted-text flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex text-primary gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-white/10'
                              }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-secondary-text text-sm leading-relaxed whitespace-pre-wrap pl-1">
                      {review.comment || 'No comment provided.'}
                    </p>

                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2.5 pt-3 pl-1">
                        {review.images.map((img: any) => (
                          <a
                            key={img.id}
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-16 h-16 border border-border/80 hover:border-primary rounded-lg overflow-hidden bg-secondary smooth-transition block cursor-zoom-in"
                          >
                            <img src={img.url} alt="Review attachment" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {reviews.length > visibleReviewsCount && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={() => setVisibleReviewsCount(prev => prev + 5)}
                      className="px-6 py-2.5 border border-border hover:bg-secondary text-primary-text font-bold uppercase tracking-wider text-[10px] smooth-transition rounded-xl cursor-pointer"
                    >
                      View More Reviews
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Rating Distribution Breakdown */}
              <div className="lg:col-span-5 bg-card border border-border p-6 rounded-xl shadow-sm space-y-6">
                <h3 className="font-bold text-xs uppercase tracking-widest text-primary-text">
                  Product Ratings & Reviews
                </h3>
                
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="text-center sm:border-r sm:border-border/80 sm:pr-8 py-2">
                    <div className="text-5xl font-black text-primary flex items-center justify-center gap-1">
                      {(() => {
                        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
                        return (totalRating / reviews.length).toFixed(1);
                      })()}
                      <span className="text-3xl text-primary">★</span>
                    </div>
                    <p className="text-[10px] text-muted-text uppercase tracking-wider mt-2 font-semibold whitespace-nowrap">
                      {reviews.length} Ratings, {reviews.length} Reviews
                    </p>
                  </div>

                  <div className="flex-1 w-full space-y-2.5">
                    {(() => {
                      const total = reviews.length;
                      const counts = [
                        { label: 'Excellent', stars: 5, color: 'bg-green-500' },
                        { label: 'Very Good', stars: 4, color: 'bg-green-500' },
                        { label: 'Good', stars: 3, color: 'bg-yellow-500' },
                        { label: 'Average', stars: 2, color: 'bg-orange-500' },
                        { label: 'Poor', stars: 1, color: 'bg-red-500' }
                      ].map(item => {
                        const count = reviews.filter(r => r.rating === item.stars).length;
                        const percentage = total > 0 ? (count / total) * 100 : 0;
                        return { ...item, count, percentage };
                      });

                      return counts.map((item) => (
                        <div key={item.stars} className="flex items-center justify-between gap-3 text-[10px]">
                          <span className="w-16 font-semibold text-secondary-text">{item.label}</span>
                          <div className="flex-1 h-2 bg-secondary/60 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.color} rounded-full`} 
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-right font-bold text-primary-text">{item.count}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Products Section */}
      {recommendedProducts.length > 0 && (
        <div className="border-t border-border py-16 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="heading-3 mb-8">Recommended Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {recommendedProducts.map((prod: any) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Add To Cart Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-50 bg-popover border border-border rounded-xl px-5 py-4 shadow-2xl flex items-center gap-3 accent-glow"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-primary-text text-sm font-bold">Product Added</p>
              <p className="text-muted-text text-xs mt-0.5">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    Ask about this Product
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
                  <h4 className="font-bold text-sm text-green-400">Inquiry Sent Successfully</h4>
                  <p className="text-xs text-muted-text">We have created a support thread. You can check replies in your dashboard.</p>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="space-y-4 text-xs">
                  <div className="p-3 bg-secondary/40 border border-border/50 rounded-lg flex items-center gap-3">
                    <img
                      src={sanitizedProduct.image}
                      alt={sanitizedProduct.name}
                      className="w-12 h-12 object-cover rounded-md border border-border/60"
                    />
                    <div>
                      <p className="font-bold text-xs text-primary-text truncate max-w-[250px]">{sanitizedProduct.name}</p>
                      <p className="text-[10px] text-muted-text uppercase tracking-widest">ID: {sanitizedProduct.id}</p>
                    </div>
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
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">How can we help you?</label>
                    <textarea
                      required
                      rows={4}
                      value={supportFormData.message}
                      onChange={(e) => setSupportFormData({ ...supportFormData, message: e.target.value })}
                      className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 resize-none"
                      placeholder="Ask questions about specifications, availability, printing process..."
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
