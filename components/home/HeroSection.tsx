'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { sanitizeProducts, mockProducts } from '@/lib/mockProducts'

export const HeroSection = () => {
  const router = useRouter()
  const [stats, setStats] = useState({ rating: 4.9, reviewsCount: 100 })
  const [products, setProducts] = useState<any[]>([])

  const shuffleArray = (array: any[]) => {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  useEffect(() => {
    // Fetch global review stats
    api.get('/reviews?limit=200')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          const reviews = res.data.data
          if (reviews.length > 0) {
            const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0)
            const avg = Number((sum / reviews.length).toFixed(1))
            setStats({ rating: avg, reviewsCount: reviews.length })
          }
        }
      })
      .catch(err => console.error('Error fetching global review stats:', err))

    // Fetch active products
    api.get('/products')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          const sanitized = sanitizeProducts(res.data.data)
          // Filter for products that have a valid image and are active
          const withImages = sanitized.filter(p => 
            p.image && 
            !p.image.includes('placeholder.jpg') && 
            p.isActive
          )
          if (withImages.length > 0) {
            setProducts(shuffleArray(withImages))
          } else {
            setProducts(shuffleArray(sanitized))
          }
        }
      })
      .catch(err => console.error('Error fetching hero products:', err))
  }, [])

  const getCadName = (name: string) => {
    return name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 16) + '.STL'
  }

  const PLACEHOLDER_PRODUCT = {
    id: 'placeholder',
    slug: 'no-product',
    name: 'Featured Model',
    description: 'Add products in your admin dashboard to feature them here.',
    price: 0,
    stock: 0,
    image: '/placeholder.jpg',
    images: ['/placeholder.jpg'],
    category: 'General',
    specifications: {
      'Material': 'PLA/Resin',
      'Scale': 'N/A',
      'Dimensions': 'N/A'
    },
    featured: false,
    rating: 0,
    reviewsCount: 0
  }

  // Helper to dynamically cycle through available products or placeholder fallback
  const getProduct = (index: number) => {
    const list = products.length > 0 ? products : []
    if (list.length === 0) return PLACEHOLDER_PRODUCT
    return list[index % list.length]
  }

  const product1 = getProduct(0)
  const product2 = getProduct(1)
  const product3 = getProduct(2)
  const product4 = getProduct(3)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: 'easeOut' as const },
    },
  }

  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-transparent bg-drafting-grid pt-28 pb-16">
      {/* Soft background glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl z-0 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl z-0 pointer-events-none" />

      {/* Technical Watermarks, Grid Marks & Abstract Drafting Backdrop */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <div className="absolute inset-6 border border-border/20 border-dashed" />

        {/* Concentric circles bottom-right */}
        <svg className="absolute -bottom-16 -right-16 w-96 h-96 text-[var(--mat-accent)] stroke-current" fill="none" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="30" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="20" strokeWidth="0.4" strokeDasharray="2,2" />
          <circle cx="50" cy="50" r="10" strokeWidth="0.4" />
        </svg>

        {/* Concentric circles top-left accent */}
        <svg className="absolute top-24 left-12 w-48 h-48 text-muted-text/10 stroke-current" fill="none" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="30" strokeWidth="0.4" strokeDasharray="1,2" />
          <circle cx="50" cy="50" r="15" strokeWidth="0.4" />
        </svg>

        {/* Tech grid of dots top-middle */}
        <svg className="absolute top-28 left-[45%] w-64 h-32 text-primary/15 fill-current" viewBox="0 0 200 100">
          <pattern id="dot-grid-hero" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" />
          </pattern>
          <rect width="200" height="100" fill="url(#dot-grid-hero)" />
        </svg>

        {/* Large wireframe triangle center-left */}
        <svg className="absolute top-[40%] left-8 w-44 h-44 text-[var(--mat-accent)] stroke-current" fill="none" viewBox="0 0 100 100">
          <polygon points="50,10 90,85 10,85" strokeWidth="0.4" />
        </svg>

        {/* Drafting hatch lines top-right */}
        <svg className="absolute top-28 right-24 w-32 h-32 text-muted-text/10 stroke-current" viewBox="0 0 100 100">
          <line x1="10" y1="90" x2="90" y2="10" strokeWidth="1.5" strokeDasharray="1,4" />
          <line x1="20" y1="90" x2="90" y2="20" strokeWidth="1.5" strokeDasharray="1,4" />
          <line x1="30" y1="90" x2="90" y2="30" strokeWidth="1.5" strokeDasharray="1,4" />
          <line x1="40" y1="90" x2="90" y2="40" strokeWidth="1.5" strokeDasharray="1,4" />
          <line x1="50" y1="90" x2="90" y2="50" strokeWidth="1.5" strokeDasharray="1,4" />
        </svg>

        {/* CAD Crosshairs (X) center-right */}
        <svg className="absolute top-[25%] right-[32%] w-24 h-24 text-[var(--mat-accent)] stroke-current" fill="none" viewBox="0 0 100 100">
          <line x1="50" y1="10" x2="50" y2="90" strokeWidth="0.4" strokeDasharray="4,4" />
          <line x1="10" y1="50" x2="90" y2="50" strokeWidth="0.4" strokeDasharray="4,4" />
          <circle cx="50" cy="50" r="12" strokeWidth="0.4" />
        </svg>

        {/* Wave Toolpath lines bottom-left */}
        <svg className="absolute bottom-24 left-[28%] w-72 h-16 text-primary/10 stroke-current" fill="none" viewBox="0 0 200 40">
          <path d="M 0 20 Q 25 5, 50 20 T 100 20 T 150 20 T 200 20" strokeWidth="0.6" />
          <path d="M 0 25 Q 25 10, 50 25 T 100 25 T 150 25 T 200 25" strokeWidth="0.6" strokeDasharray="1,3" />
        </svg>

        {/* Plus marks (++++) */}
        <div className="absolute top-[65%] left-[24%] flex gap-4 text-muted-text/20 font-mono text-xs select-none">
          <span>+</span>
          <span>+</span>
          <span>+</span>
          <span>+</span>
        </div>

        {/* Corner brackets */}
        <div className="absolute top-24 left-6 w-4 h-4 border-t-2 border-l-2 border-primary/30" />
        <div className="absolute top-24 right-6 w-4 h-4 border-t-2 border-r-2 border-primary/30" />
        <div className="absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-primary/30" />
        <div className="absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-primary/30" />
      </div>

      <div className="container mx-auto px-4 md:px-6 w-full relative z-10">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* LEFT SIDE CONTENT */}
          <div className="lg:col-span-7 space-y-8 text-left">
            {/* Headline */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-primary-text tracking-tight leading-none"
              variants={itemVariants}
            >
              Premium 3D Printed <br />
              <span className="text-primary">Creations</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p 
              className="text-secondary-text text-base sm:text-lg md:text-xl leading-relaxed max-w-xl"
              variants={itemVariants}
            >
              Discover unique collectibles, custom designs, engineering models, miniatures, desk accessories, home décor, and personalized creations.
            </motion.p>

            {/* Action Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-start items-stretch sm:items-center"
              variants={itemVariants}
            >
              <Link 
                href="/products"
                className="px-8 py-4 bg-white text-black font-semibold rounded-none border border-black hover:scale-105 active:scale-95 hover:bg-gray-100 transition-all duration-300 text-center shadow-2xl tracking-wide uppercase text-xs font-bold"
              >
                Shop Products
              </Link>
              <Link 
                href="/custom-request"
                className="px-8 py-4 border border-border bg-secondary/15 backdrop-blur-md text-primary-text font-semibold rounded-none hover:scale-105 hover:bg-secondary/30 active:scale-95 transition-all duration-300 text-center tracking-wide uppercase text-xs font-bold"
              >
                Custom Order
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              className="grid grid-cols-3 gap-4 md:gap-6 pt-6 border-t border-border max-w-lg"
              variants={itemVariants}
            >
              <div>
                <div className="text-2xl font-bold text-primary-text tracking-tight">500+</div>
                <div className="text-muted-text text-xs mt-1">Offline Orders</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary-text tracking-tight">
                  500+
                </div>
                <div className="text-muted-text text-xs mt-1">Happy Customers</div>
              </div>
              <div className="flex flex-col">
                <div className="text-2xl font-bold text-primary-text flex items-center gap-1 tracking-tight">
                  {stats.rating}<Star className="w-4 h-4 fill-primary text-primary" />
                </div>
                <div className="text-muted-text text-xs mt-1">Average Rating</div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT SIDE FLOATING SHOWCASE */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[400px] sm:min-h-[500px]">
            <motion.div
              variants={itemVariants}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Orbital rings */}
              <div className="absolute w-72 h-72 sm:w-80 sm:h-80 border border-border/30 rounded-none -z-10 animate-[spin_40s_linear_infinite]" />
              <div className="absolute w-[350px] h-[350px] sm:w-[400px] sm:h-[400px] border border-border/20 border-dashed rounded-none -z-10 animate-[spin_60s_linear_infinite]" />

              {/* Main Floating Product */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10"
              >
                <motion.div
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.7}
                  dragTransition={{ bounceStiffness: 450, bounceDamping: 15 }}
                  whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
                  onTap={() => router.push(`/products/${product1.slug}`)}
                  className="w-60 h-60 sm:w-72 sm:h-72 rounded-none overflow-hidden border-2 border-border premium-shadow-lg accent-glow flex items-center justify-center bg-card cursor-pointer select-none"
                >
                  <img
                    src={product1.image}
                    alt={product1.name}
                    className="w-full h-full object-cover scale-102 hover:scale-105 transition-transform duration-500 pointer-events-none"
                  />
                  <div className="absolute bottom-4 left-4 right-4 bg-black/85 backdrop-blur-md px-3 py-2 border border-border pointer-events-none text-white">
                    <div className="flex justify-between items-center text-[8px] font-mono text-primary">
                      <span>CAD: {getCadName(product1.name)}</span>
                      <span className="text-muted-text">{product1.specifications?.Scale || '1:10 SCALE'}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate mt-0.5 tracking-wide">{product1.name}</h4>
                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/10 text-[8px] font-mono text-muted-text">
                      <span>DIM: {product1.specifications?.Dimensions || product1.specifications?.Height || '150x150x220 mm'}</span>
                      <span>{product1.specifications?.Volume || 'VOL: 4.8 L'}</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating Product 2 (Top Left) */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute top-4 left-4 z-20"
              >
                <motion.div
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.7}
                  dragTransition={{ bounceStiffness: 450, bounceDamping: 15 }}
                  whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
                  onTap={() => router.push(`/products/${product2.slug}`)}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-none overflow-hidden border border-border bg-card premium-shadow cursor-pointer select-none"
                >
                  <img
                    src={product2.image}
                    alt={product2.name}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/85 border-t border-border py-1 px-1.5 text-left pointer-events-none">
                    <span className="text-[8px] font-mono text-primary block truncate">{getCadName(product2.name)}</span>
                    <span className="text-[8px] font-mono text-white block truncate">
                      {product2.specifications?.Diameter || product2.specifications?.Dimensions || 'DIA: 80mm'}
                    </span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating Product 3 (Bottom Right) */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                className="absolute bottom-6 right-2 sm:right-6 z-20"
              >
                <motion.div
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.7}
                  dragTransition={{ bounceStiffness: 450, bounceDamping: 15 }}
                  whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
                  onTap={() => router.push(`/products/${product3.slug}`)}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-none overflow-hidden border border-border bg-card premium-shadow cursor-pointer select-none"
                >
                  <img
                    src={product3.image}
                    alt={product3.name}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/85 border-t border-border py-1 px-1.5 text-left pointer-events-none">
                    <span className="text-[8px] font-mono text-primary block truncate">{getCadName(product3.name)}</span>
                    <span className="text-[8px] font-mono text-white block truncate">
                      H: {product3.specifications?.Height || product3.specifications?.Dimensions || '120mm'}
                    </span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating Product 4 (Bottom Left) */}
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                className="absolute bottom-12 left-2 z-20 hidden sm:block"
              >
                <motion.div
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.7}
                  dragTransition={{ bounceStiffness: 450, bounceDamping: 15 }}
                  whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
                  onTap={() => router.push(`/products/${product4.slug}`)}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-none overflow-hidden border border-border bg-card premium-shadow cursor-pointer select-none"
                >
                  <img
                    src={product4.image}
                    alt={product4.name}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/85 border-t border-border py-1 px-1.5 text-left pointer-events-none">
                    <span className="text-[8px] font-mono text-primary block truncate">{getCadName(product4.name)}</span>
                    <span className="text-[8px] font-mono text-white block truncate">
                      L: {product4.specifications?.Length || product4.specifications?.Height || '50mm'}
                    </span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Playful warning note */}
              <div className="absolute -bottom-6 text-center select-none pointer-events-none w-full">
                <span className="text-[10px] font-bold text-muted-text/50 tracking-widest uppercase block animate-pulse">
                  Psst... don&apos;t drag the sketches too far, they might run away! 🏃‍♂️
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade to blend with the rest of the dark sections */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-20">
        <span className="text-[8px] font-mono tracking-widest text-muted-text/50 uppercase">Scroll to explore</span>
        <motion.div 
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-1 h-3 bg-primary rounded-full"
        />
      </div>
    </section>
  )
}
