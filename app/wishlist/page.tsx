'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ProductCard } from '@/components/products/ProductCard'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { Product } from '@/lib/types'
import { useProducts } from '@/hooks/useProducts'
import { sanitizeProducts } from '@/lib/mockProducts'

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const { data: allProducts = [] } = useProducts()
  
  const sanitizedProducts = allProducts.length > 0
    ? sanitizeProducts(allProducts)
    : []

  const continueShoppingProducts = sanitizedProducts
    .filter(p => !wishlistItems.some(w => w.id === p.id))
    .slice(0, 4)

  const displayProducts = continueShoppingProducts.length > 0
    ? continueShoppingProducts
    : sanitizedProducts.slice(0, 4)

  const loadWishlist = () => {
    if (typeof window !== 'undefined') {
      const items = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setWishlistItems(items)
      setIsLoaded(true)
    }
  }

  useEffect(() => {
    loadWishlist()
    window.addEventListener('wishlist-updated', loadWishlist)
    return () => {
      window.removeEventListener('wishlist-updated', loadWishlist)
    }
  }, [])

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

  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />

      <div className="pt-32 pb-12 border-b border-border">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="heading-2 text-primary-text flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" /> My Wishlist
          </h1>
        </div>
      </div>

      <div className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          {wishlistItems.length === 0 ? (
            <motion.div
              className="text-center py-16 max-w-md mx-auto space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                <Heart className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Your Wishlist is Empty</h2>
                <p className="text-secondary-text text-sm mt-1">Tap the heart icon on any product to save it here for later.</p>
              </div>
              <Link
                href="/products"
                className="inline-block px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 smooth-transition uppercase text-xs tracking-wider font-bold cursor-pointer"
              >
                Discover Products
              </Link>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
            >
              <AnimatePresence>
                {wishlistItems.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Continue Shopping Section */}
      {displayProducts.length > 0 && (
        <div className="border-t border-border bg-secondary/5 py-16 mt-8">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="heading-3">Continue Shopping</h2>
              <Link
                href="/products"
                className="text-sm text-primary hover:underline font-bold"
              >
                View All Products →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {displayProducts.map((prod: any) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}
