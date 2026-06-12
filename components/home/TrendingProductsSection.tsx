'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Eye, X } from 'lucide-react'
import api from '@/lib/api'
import { Product } from '@/lib/types'
import { queryKeys } from '@/lib/queryKeys'
import { ENDPOINTS } from '@/lib/constants'
import { mockProducts, ExtendedProduct, sanitizeProducts } from '@/lib/mockProducts'
import { useSettings } from '@/context/SettingsContext'

export const TrendingProductsSection = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null)
  const { formatPrice } = useSettings()

  // Fetch featured products from API
  const { data: serverProducts = [], isLoading } = useQuery({
    queryKey: queryKeys.featured(),
    queryFn: async () => {
      const response = await api.get<{ data: Product[] }>(ENDPOINTS.FEATURED_PRODUCTS)
      return response.data.data || []
    },
    retry: false
  })

  // Map server products or fallback to mock products (filtered by featured)
  const featuredMockProducts = mockProducts.filter((p) => p.featured)
  
  // Combine or prioritize. Sanitized to remove backpacks / generic factory imagery.
  const products: ExtendedProduct[] = serverProducts.length > 0 
    ? sanitizeProducts(serverProducts).filter((p) => p.featured)
    : featuredMockProducts

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const handleAddToCart = (product: ExtendedProduct, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (typeof window !== 'undefined') {
      const currentCart = JSON.parse(localStorage.getItem('cart') || '[]')
      const existing = currentCart.find((item: any) => item.id === product.id)
      if (existing) {
        existing.quantity += 1
      } else {
        currentCart.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image || '/placeholder.jpg',
          category: product.category,
          quantity: 1
        })
      }
      localStorage.setItem('cart', JSON.stringify(currentCart))
      window.dispatchEvent(new Event('cart-updated'))
    }

    setToastMessage(`"${product.name}" added to cart!`)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  const handleQuickView = (product: ExtendedProduct, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedProduct(product)
  }

  return (
    <section id="trending" className="py-24 bg-background border-b border-border relative">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Section Heading with Carousel Buttons */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3">Trending Now</h2>
            <h3 className="heading-2 text-primary-text">Featured Products</h3>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => scroll('left')}
              className="w-12 h-12 rounded-xl border border-border bg-card hover:border-primary hover:text-primary text-primary-text flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-12 h-12 rounded-xl border border-border bg-card hover:border-primary hover:text-primary text-primary-text flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-6 pb-8 scroll-smooth scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {isLoading ? (
            // Skeleton Loader
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-[280px] sm:w-[320px] shrink-0 bg-secondary rounded-2xl h-[450px] animate-pulse border border-border"
              />
            ))
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="w-[280px] sm:w-[320px] shrink-0 snap-start bg-card border border-border hover:border-primary/20 rounded-2xl overflow-hidden shadow-lg group transition-all duration-300 flex flex-col justify-between"
              >
                <Link href={`/products/${product.slug}`} className="block relative">
                  {/* Image Container with Actions overlay on hover */}
                  <div className="h-64 sm:h-72 w-full relative bg-secondary overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* New Badge */}
                    {product.isNew && (
                      <span className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                        NEW
                      </span>
                    )}

                    {/* Hover actions menu */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      <button
                        onClick={(e) => handleQuickView(product, e)}
                        className="p-3 bg-white hover:bg-primary hover:text-white text-black rounded-xl shadow-lg transition-all duration-300 scale-90 group-hover:scale-100 cursor-pointer"
                        title="Quick View"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        className="p-3 bg-white hover:bg-primary hover:text-white text-black rounded-xl shadow-lg transition-all duration-300 scale-90 group-hover:scale-100 cursor-pointer"
                        title="Add to Cart"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-6">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex text-primary">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < Math.floor(product.rating)
                                ? 'fill-primary text-primary'
                                : 'text-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-muted-text font-medium">
                        ({product.reviewsCount})
                      </span>
                    </div>

                    <h4 className="text-primary-text font-bold text-lg group-hover:text-primary transition-colors duration-300 line-clamp-1">
                      {product.name}
                    </h4>
                    
                    <p className="text-muted-text text-xs mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </Link>

                {/* Footer price & cart row */}
                <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-border">
                  <span className="text-primary-text font-extrabold text-xl">
                    {formatPrice(product.price)}
                  </span>
                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    className="px-4 py-2 border border-border hover:border-primary hover:bg-primary hover:text-white text-primary-text rounded-lg text-xs font-semibold transition-all duration-300 cursor-pointer flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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

      {/* Quick View Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-popover border border-border rounded-2xl overflow-hidden shadow-2xl z-10 grid grid-cols-1 md:grid-cols-2"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors duration-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Product Image */}
              <div className="h-64 md:h-full relative bg-black">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Specs */}
              <div className="p-8 flex flex-col justify-between h-full">
                <div>
                  <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                    {selectedProduct.category}
                  </span>
                  
                  <h3 className="text-2xl font-bold text-primary-text mt-4">{selectedProduct.name}</h3>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1.5 mt-2 mb-4">
                    <div className="flex text-primary">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(selectedProduct.rating)
                              ? 'fill-primary text-primary'
                              : 'text-muted-text/30'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-text">
                      {selectedProduct.rating} / 5 ({selectedProduct.reviewsCount} reviews)
                    </span>
                  </div>

                  <p className="text-secondary-text text-sm leading-relaxed mb-6">
                    {selectedProduct.description}
                  </p>

                  {/* Specifications */}
                  <div className="space-y-2 mb-6">
                    <h5 className="text-xs text-primary-text font-bold uppercase tracking-wider">Specifications</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(selectedProduct.specifications || {}).map(([key, val]) => (
                        <div key={key} className="bg-secondary p-2 rounded border border-border">
                          <span className="text-muted-text block text-[10px]">{key}</span>
                          <span className="text-primary-text font-medium">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
                  <span className="text-2xl font-extrabold text-primary-text">
                    {formatPrice(selectedProduct.price)}
                  </span>
                  <button
                    onClick={(e) => {
                      handleAddToCart(selectedProduct, e)
                      setSelectedProduct(null)
                    }}
                    className="px-6 py-3 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl transition-all duration-300 accent-glow flex items-center gap-2 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add To Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
