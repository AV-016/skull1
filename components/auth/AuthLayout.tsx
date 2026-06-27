'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ShieldCheck, Sparkles, Truck, Sun, Moon, Monitor, Check } from 'lucide-react'
import { useSettings, AppearanceMode } from '@/context/SettingsContext'
import { api } from '@/lib/api'
import { sanitizeProducts } from '@/lib/mockProducts'
import { useRouter } from 'next/navigation'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

const DEFAULT_GALLERY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    title: 'Cyber-Oni Figurine',
    category: 'Anime Figure',
    slug: '',
  },
  {
    url: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=800&auto=format&fit=crop&q=80',
    title: 'Ancient Red Dragon',
    category: 'Miniature',
    slug: '',
  },
  {
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    title: 'Minimalist Desk Organizer',
    category: 'Desk Accessory',
    slug: '',
  },
  {
    url: 'https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?w=800&auto=format&fit=crop&q=80',
    title: 'Mechanical Art Skull',
    category: 'Collectible',
    slug: '',
  },
]

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  const router = useRouter()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const { appearance, setAppearance } = useSettings()
  
  const [stats, setStats] = useState({ rating: 4.9, reviewsCount: 100 })
  const [galleryImages, setGalleryImages] = useState<any[]>(DEFAULT_GALLERY_IMAGES)
  const [floating1, setFloating1] = useState<any>({
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=100&auto=format&fit=crop&q=80',
    name: 'High-Detail Mini',
    category: 'Custom Print',
    slug: ''
  })
  const [floating2, setFloating2] = useState<any>({
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=100&auto=format&fit=crop&q=80',
    name: 'Premium Collectible',
    category: 'Figurine',
    slug: ''
  })

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

    // Fetch products
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
            const gallery = withImages.map(p => ({
              url: p.image,
              title: p.name,
              category: p.category || 'Product',
              slug: p.slug
            }))
            setGalleryImages(gallery)

            // Set floating products (using different products if available)
            if (withImages.length > 0) {
              const p1 = withImages[withImages.length > 1 ? 1 : 0]
              setFloating1({
                image: p1.image,
                name: p1.name,
                category: p1.category || 'Product',
                slug: p1.slug
              })
            }
            if (withImages.length > 0) {
              const p2 = withImages[withImages.length > 2 ? 2 : 0]
              setFloating2({
                image: p2.image,
                name: p2.name,
                category: p2.category || 'Product',
                slug: p2.slug
              })
            }
          }
        }
      })
      .catch(err => console.error('Error fetching products for AuthLayout:', err))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % galleryImages.length)
    }, 4500)
    return () => clearInterval(timer)
  }, [galleryImages])

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background text-primary-text smooth-transition overflow-hidden">
      
      {/* FLOATING THEME SELECTOR - Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3 py-2 bg-card/80 border border-border/80 backdrop-blur-md rounded-xl hover:bg-secondary smooth-transition shadow-lg text-xs font-semibold cursor-pointer text-primary-text"
          >
            {appearance === 'light' ? (
              <Sun className="w-4 h-4 text-primary" />
            ) : appearance === 'dark' ? (
              <Moon className="w-4 h-4 text-primary" />
            ) : (
              <Monitor className="w-4 h-4 text-primary" />
            )}
            <span className="capitalize">{appearance} Theme</span>
          </button>

          <AnimatePresence>
            {showSettings && (
              <>
                {/* Backdrop overlay to close */}
                <div className="fixed inset-0 z-10" onClick={() => setShowSettings(false)} />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-36 bg-popover border border-border rounded-xl p-2 shadow-2xl z-20 space-y-1"
                >
                  {(['dark', 'light', 'system'] as AppearanceMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setAppearance(mode)
                        setShowSettings(false)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-left text-xs font-medium rounded-lg hover:bg-secondary smooth-transition cursor-pointer text-primary-text"
                    >
                      <span className="capitalize">{mode}</span>
                      {appearance === mode && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* LEFT SIDE: Brand Experience / rotating product showcase (60%) */}
      <div className="lg:col-span-7 relative flex-col justify-between p-8 lg:p-12 bg-secondary/30 border-r border-border hidden lg:flex min-h-screen overflow-hidden">
        
        {/* Technical Watermarks & Grid Marks */}
        <div className="absolute inset-0 pointer-events-none select-none -z-5 overflow-hidden">
          <div className="absolute top-6 left-6 font-mono text-[9px] text-muted-text/25 tracking-widest">
            SKULL_BUILD_SYSTEM v1.0
          </div>
          <div className="absolute bottom-6 left-6 font-mono text-[9px] text-muted-text/25 tracking-widest">
            MODEL_INDEX_RENDER: {currentIdx + 1} / {galleryImages.length}
          </div>
          <div className="absolute inset-4 border border-border/15 border-dashed" />
        </div>

        {/* Soft atmospheric background glow */}
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Logo / Header Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary-text hover:text-primary smooth-transition tracking-wider z-20">
          <img src="/logo.png" alt="Skulture Logo" className="w-8 h-8 dark:invert-0 invert" />
          SKULTURE
        </Link>

        {/* Visual Showcase Center */}
        <div className="relative w-full max-w-xl mx-auto my-auto py-12 flex flex-col items-center">
          
          {/* Rotating Image Container */}
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.7}
            dragTransition={{ bounceStiffness: 450, bounceDamping: 15 }}
            whileDrag={{ scale: 1.03, cursor: 'grabbing' }}
            onTap={() => galleryImages[currentIdx]?.slug && router.push(`/products/${galleryImages[currentIdx].slug}`)}
            className="relative w-[305px] h-[305px] sm:w-[365px] sm:h-[365px] rounded-none border border-border/40 overflow-hidden premium-shadow-lg bg-card cursor-pointer select-none z-20"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <img
                  src={galleryImages[currentIdx]?.url}
                  alt={galleryImages[currentIdx]?.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Image Overlay details - 3D Specs */}
                <div className="absolute bottom-5 left-5 right-5 bg-black/85 backdrop-blur-md px-3 py-2 border border-border text-left">
                  <div className="flex justify-between items-center text-[8px] font-mono text-primary">
                    <span>FILE: {galleryImages[currentIdx]?.title ? galleryImages[currentIdx].title.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 16) + '.STL' : 'MODEL.STL'}</span>
                    <span className="text-muted-text">3D_MODEL</span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate mt-0.5 tracking-wide">
                    {galleryImages[currentIdx]?.title}
                  </h4>
                  <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/10 text-[8px] font-mono text-muted-text">
                    <span>LAYER: 0.12MM</span>
                    <span>MATERIAL: PLA+</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Floating Miniature Product Card 1 */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-2 left-2 z-30"
          >
            <motion.div
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.7}
              dragTransition={{ bounceStiffness: 450, bounceDamping: 15 }}
              whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
              onTap={() => floating1.slug && router.push(`/products/${floating1.slug}`)}
              className="bg-card/90 backdrop-blur-md border border-border p-3.5 rounded-2xl premium-shadow flex items-center gap-3 w-48 cursor-pointer select-none"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-secondary pointer-events-none">
                <img
                  src={floating1.image}
                  alt={floating1.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 pointer-events-none">
                <p className="text-[10px] font-bold text-primary tracking-wider uppercase truncate">{floating1.category}</p>
                <p className="text-xs font-semibold text-primary-text truncate">{floating1.name}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Floating Miniature Product Card 2 */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
            className="absolute bottom-8 -right-16 z-30"
          >
            <motion.div
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.7}
              dragTransition={{ bounceStiffness: 450, bounceDamping: 15 }}
              whileDrag={{ scale: 1.08, cursor: 'grabbing' }}
              onTap={() => floating2.slug && router.push(`/products/${floating2.slug}`)}
              className="bg-card/90 backdrop-blur-md border border-border p-3.5 rounded-none premium-shadow flex items-center gap-3 w-48 cursor-pointer select-none"
            >
              <div className="w-10 h-10 rounded-none overflow-hidden flex-shrink-0 bg-secondary pointer-events-none">
                <img
                  src={floating2.image}
                  alt={floating2.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 pointer-events-none">
                <p className="text-[10px] font-bold text-primary tracking-wider uppercase truncate">{floating2.category}</p>
                <p className="text-xs font-semibold text-primary-text truncate">{floating2.name}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Playful warning note */}
          <div className="absolute -bottom-8 text-center select-none pointer-events-none w-full">
            <span className="text-[10px] font-bold text-muted-text/50 tracking-widest uppercase block">
              Don&apos;t drag the sketches too far, they might escape! 🏃‍♂️
            </span>
          </div>
        </div>

        {/* Brand Message and Trust indicators */}
        <div className="space-y-6 z-20 max-w-2xl mx-auto w-full">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold text-primary-text tracking-tight">
              Join The World Of Premium 3D Creations
            </h2>
            <p className="text-secondary-text text-sm md:text-base leading-relaxed max-w-xl">
              Discover unique collectibles, custom prints, personalized gifts and one-of-a-kind creations crafted for enthusiasts and collectors.
            </p>
          </div>

          {/* Trust Indicators Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-6 border-t border-border">
            <div className="flex flex-col items-center lg:items-start">
              <div className="flex items-center gap-1 font-bold text-primary-text text-sm">
                {stats.rating} <Star className="w-3.5 h-3.5 fill-primary text-primary" />
              </div>
              <span className="text-[10px] text-muted-text mt-0.5">Average Rating</span>
            </div>
            <div className="flex flex-col items-center lg:items-start">
              <span className="font-bold text-primary-text text-sm">500+</span>
              <span className="text-[10px] text-muted-text mt-0.5">Offline Orders</span>
            </div>
            <div className="flex flex-col items-center lg:items-start">
              <span className="font-bold text-primary-text text-sm">500+</span>
              <span className="text-[10px] text-muted-text mt-0.5">Happy Customers</span>
            </div>
            <div className="flex flex-col items-center lg:items-start">
              <div className="flex items-center gap-1 font-bold text-primary-text text-sm">
                <Truck className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-[10px] text-muted-text mt-0.5">India-wide Shipping</span>
            </div>
            <div className="flex flex-col items-center lg:items-start">
              <div className="flex items-center gap-1 font-bold text-primary-text text-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-[10px] text-muted-text mt-0.5">Premium Quality</span>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT SIDE: Auth Form (40% on desktop, full height on mobile) */}
      <div className="lg:col-span-5 flex flex-col justify-center items-center px-6 py-12 md:py-16 relative min-h-screen">
        
        {/* Soft background glow for mobile auth form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none lg:hidden" />

        {/* Mobile Header / Logo Link */}
        <div className="lg:hidden mb-8 text-center z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary-text tracking-wider justify-center">
            <img src="/logo.png" alt="Skulture Logo" className="w-8 h-8 dark:invert-0 invert" />
            SKULTURE
          </Link>
        </div>

        {/* Glassmorphic Form Card Wrapper */}
        <div className="w-full max-w-[420px] bg-card/60 backdrop-blur-xl border border-border p-6 md:p-8 rounded-none shadow-2xl z-10">
          
          {/* Header titles inside card */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-primary-text tracking-tight mb-2">{title}</h2>
            {subtitle && <p className="text-secondary-text text-sm">{subtitle}</p>}
          </div>

          {/* Children form */}
          {children}

        </div>

        {/* Mobile Trust indicator badge */}
        <div className="lg:hidden mt-8 text-center flex items-center gap-1 text-[11px] text-muted-text font-semibold bg-secondary/50 px-3.5 py-1.5 rounded-full border border-border">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Join The World Of Premium 3D Creations
        </div>

      </div>

    </div>
  )
}

