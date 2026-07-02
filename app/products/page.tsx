'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useProducts, useCategories } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'
import { sanitizeProducts } from '@/lib/mockProducts'
import { useSearchParams } from 'next/navigation'

function ProductsContent() {
  const searchParams = useSearchParams()
  const urlCategory = searchParams.get('category')
  const urlFilter = searchParams.get('filter')
  const urlSearch = searchParams.get('search') || searchParams.get('q')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: serverCategories = [] } = useCategories()

  // Sync category from URL query parameter
  useEffect(() => {
    if (urlCategory) {
      const matched = serverCategories.find(
        (cat: any) =>
          cat.slug.toLowerCase() === urlCategory.toLowerCase() ||
          cat.name.toLowerCase() === urlCategory.toLowerCase() ||
          cat.slug.toLowerCase() === urlCategory.toLowerCase().replace(/\+/g, '-').replace(/\s+/g, '-')
      )
      setSelectedCategory(matched ? matched.slug : urlCategory)
    } else {
      setSelectedCategory(null)
    }
  }, [urlCategory, serverCategories])

  useEffect(() => {
    if (urlSearch) {
      setSearchQuery(urlSearch)
    } else {
      setSearchQuery('')
    }
  }, [urlSearch])

  const { data: products = [], isLoading, error } = useProducts({
    category: selectedCategory || undefined,
    search: searchQuery || undefined,
    sort: urlFilter || undefined,
  })

  const sanitizedProducts = sanitizeProducts(products)

  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />

      {/* Page Header */}
      <div className="pt-32 pb-12 md:pb-16 border-b border-border">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="heading-2 text-primary-text mb-4">Our Products</h1>
            <p className="text-secondary-text max-w-2xl">
              Discover our premium 3D printing products and custom manufacturing solutions
            </p>
          </motion.div>
        </div>
      </div>

      {/* Products Section */}
      <div className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                className="sticky top-32 space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Search */}
                <div>
                  <label className="block text-sm font-semibold text-primary-text mb-3">Search</label>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/40 smooth-transition"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-semibold text-primary-text mb-3">Category</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-3 py-2 rounded-lg smooth-transition text-sm cursor-pointer ${
                        !selectedCategory
                          ? 'bg-primary text-white font-semibold'
                          : 'bg-secondary text-secondary-text hover:bg-card hover:text-primary-text'
                      }`}
                    >
                      All
                    </button>
                     {serverCategories
                      .filter((cat: any) => cat.slug !== 'custom-orders')
                      .map((cat: any) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.slug)}
                          className={`w-full text-left px-3 py-2 rounded-lg smooth-transition text-sm cursor-pointer ${
                            selectedCategory === cat.slug
                              ? 'bg-primary text-white font-semibold'
                              : 'bg-secondary text-secondary-text hover:bg-card hover:text-primary-text'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-4">
                      <div className="aspect-square bg-secondary rounded-lg animate-pulse" />
                      <div className="h-6 bg-secondary rounded animate-pulse" />
                      <div className="h-4 bg-secondary rounded animate-pulse w-3/4" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-destructive">Failed to load products</p>
                </div>
              ) : sanitizedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-secondary-text">No products found</p>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  {sanitizedProducts.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
