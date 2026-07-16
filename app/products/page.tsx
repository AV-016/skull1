'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useProducts, useCategories, useTags } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'
import { sanitizeProducts } from '@/lib/mockProducts'
import { useSearchParams } from 'next/navigation'

function ProductsContent() {
  const searchParams = useSearchParams()
  const urlCategory = searchParams.get('category')
  const urlFilter = searchParams.get('filter')
  const urlSearch = searchParams.get('search') || searchParams.get('q')
  const urlTag = searchParams.get('tag')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Price, Deals, and Colour filter states
  const [minPrice, setMinPrice] = useState(68)
  const [maxPrice, setMaxPrice] = useState(85900)
  const [selectedDeal, setSelectedDeal] = useState('all')
  const [selectedColour, setSelectedColour] = useState<string | null>(null)

  const COLOURS = [
    { name: 'Black', value: '#000000' },
    { name: 'Grey', value: '#808080' },
    { name: 'White', value: '#ffffff' },
    { name: 'Brown', value: '#8B4513' },
    { name: 'Beige', value: '#F5F5DC' },
    { name: 'Red', value: '#FF0000' },
    { name: 'Pink', value: '#FFC0CB' },
    { name: 'Orange', value: '#FFA500' },
    { name: 'Yellow', value: '#FFFF00' },
    { name: 'Off-White', value: '#FAF9F6' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Teal', value: '#008080' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Gold', value: '#FFD700' },
    { name: 'Silver', value: '#C0C0C0' },
    { name: 'Multi', value: 'linear-gradient(to right, red, orange, yellow, green, blue, purple)' },
    { name: 'Transparent', value: 'rgba(255,255,255,0.1)' }
  ]

  const { data: serverCategories = [] } = useCategories()
  const { data: serverTags = [] } = useTags()

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

  // Sync tag from URL query parameter
  useEffect(() => {
    if (urlTag) {
      const matched = serverTags.find(
        (tag: any) =>
          tag.slug.toLowerCase() === urlTag.toLowerCase() ||
          tag.name.toLowerCase() === urlTag.toLowerCase()
      )
      setSelectedTag(matched ? matched.slug : urlTag)
    } else {
      setSelectedTag(null)
    }
  }, [urlTag, serverTags])

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
    tag: selectedTag || undefined,
  })

  const { data: allProductsForCategories = [] } = useProducts({ limit: 1000 })

  const availableCategorySlugs = useMemo(() => {
    const slugs = new Set<string>()
    const sanitized = sanitizeProducts(allProductsForCategories)
    sanitized.forEach((p: any) => {
      const slug = p.category?.slug || (typeof p.category === 'string' ? p.category.toLowerCase().replace(/\s+/g, '-') : '')
      if (slug) {
        slugs.add(slug.toLowerCase())
      }
    })
    return slugs
  }, [allProductsForCategories])

  const sanitizedProducts = sanitizeProducts(products).filter((p: any) => {
    const categorySlug = p.category?.slug || '';
    return categorySlug !== 'custom-orders';
  })

  const filteredProducts = useMemo(() => {
    let list = sanitizedProducts;
    
    // Price filter
    list = list.filter((p: any) => {
      const price = p.price || 0;
      return price >= minPrice && price <= maxPrice;
    });

    // Deals & Discounts Filter
    if (selectedDeal === 'buy_more') {
      list = list.filter((p: any) => p.isFeatured || p.stock > 10);
    } else if (selectedDeal === 'coupons') {
      list = list.filter((p: any) => p.compareAtPrice && p.compareAtPrice > p.price);
    } else if (selectedDeal === 'today') {
      list = list.filter((p: any) => p.bestSellerOrder > 0);
    }

    // Colour Filter
    if (selectedColour) {
      list = list.filter((p: any) => 
        (p.name && p.name.toLowerCase().includes(selectedColour.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(selectedColour.toLowerCase()))
      );
    }

    return list;
  }, [sanitizedProducts, minPrice, maxPrice, selectedDeal, selectedColour])

  return (
    <main className="min-h-screen bg-background bg-drafting-grid text-primary-text transition-colors duration-300">
      <Navbar />

      {/* Page Header */}
      <div className="pt-24 pb-4 border-b border-border">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="heading-2 text-primary-text mb-1">Our Products</h1>
            <p className="text-secondary-text max-w-2xl text-xs">
              Discover our premium 3D printing products and custom manufacturing solutions
            </p>
          </motion.div>
        </div>
      </div>

      {/* Products Section */}
      <div className="py-6 md:py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                className="sticky top-24 space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Search */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-primary-text mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-primary-text placeholder-muted-text focus:outline-none focus:border-primary/40 smooth-transition text-xs"
                  />
                </div>

                {/* Price Filter */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-primary-text">Price</label>
                  <div className="text-xs font-semibold text-secondary-text">
                    ₹{minPrice.toLocaleString()} – ₹{maxPrice.toLocaleString()}{maxPrice === 85900 ? '+' : ''}
                  </div>
                  <input
                    type="range"
                    min="68"
                    max="85900"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-primary bg-secondary h-1.5 rounded-lg cursor-pointer focus:outline-none"
                  />
                  <div className="flex flex-col gap-1.5 pt-1">
                    {[
                      { label: 'Up to ₹350', min: 68, max: 350 },
                      { label: '₹350 - ₹500', min: 350, max: 500 },
                      { label: '₹500 - ₹800', min: 500, max: 800 },
                      { label: '₹800 - ₹1,100', min: 800, max: 1100 },
                      { label: 'Over ₹1,100', min: 1100, max: 85900 }
                    ].map((bracket) => (
                      <button
                        key={bracket.label}
                        type="button"
                        onClick={() => {
                          setMinPrice(bracket.min)
                          setMaxPrice(bracket.max)
                        }}
                        className={`text-left text-xs smooth-transition cursor-pointer ${
                          minPrice === bracket.min && maxPrice === bracket.max
                            ? 'text-primary font-bold'
                            : 'text-secondary-text hover:text-primary-text'
                        }`}
                      >
                        {bracket.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deals & Discounts Filter */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-primary-text">Deals & Discounts</label>
                  <div className="flex flex-col gap-1.5">
                    {[
                      { id: 'all', label: 'All Discounts' },
                      { id: 'buy_more', label: 'Buy More, Save More' },
                      { id: 'coupons', label: 'Coupons' },
                      { id: 'today', label: 'Today\'s Deals' }
                    ].map((deal) => (
                      <button
                        key={deal.id}
                        type="button"
                        onClick={() => setSelectedDeal(deal.id)}
                        className={`text-left text-xs smooth-transition cursor-pointer ${
                          selectedDeal === deal.id
                            ? 'text-primary font-bold'
                            : 'text-secondary-text hover:text-primary-text'
                        }`}
                      >
                        {deal.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-primary-text mb-3">Category</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`w-full text-left px-3 py-2 rounded-lg smooth-transition text-xs cursor-pointer ${
                        !selectedCategory
                          ? 'bg-primary text-white font-semibold'
                          : 'bg-secondary text-secondary-text hover:bg-card hover:text-primary-text'
                      }`}
                    >
                      All
                    </button>
                     {serverCategories
                      .filter((cat: any) => {
                        if (cat.slug === 'custom-orders') return false
                        const slugLower = cat.slug.toLowerCase()
                        const nameSlug = cat.name.toLowerCase().replace(/\s+/g, '-')
                        return availableCategorySlugs.has(slugLower) || availableCategorySlugs.has(nameSlug)
                      })
                      .map((cat: any) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.slug)}
                          className={`w-full text-left px-3 py-2 rounded-lg smooth-transition text-xs cursor-pointer ${
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

                {/* Theme Filter */}
                {serverTags.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-primary-text mb-3">Themes / Franchise</label>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      <button
                        onClick={() => setSelectedTag(null)}
                        className={`w-full text-left px-3 py-2 rounded-lg smooth-transition text-xs cursor-pointer ${
                          !selectedTag
                            ? 'bg-primary text-white font-semibold'
                            : 'bg-secondary text-secondary-text hover:bg-card hover:text-primary-text'
                        }`}
                      >
                        All Themes
                      </button>
                      {serverTags
                        .filter((tag: any) => !['resin', 'tabletop', 'pla'].includes(tag.slug.toLowerCase()))
                        .map((tag: any) => (
                        <button
                          key={tag.id}
                          onClick={() => setSelectedTag(tag.slug)}
                          className={`w-full text-left px-3 py-2 rounded-lg smooth-transition text-xs cursor-pointer ${
                            selectedTag === tag.slug
                              ? 'bg-primary text-white font-semibold'
                              : 'bg-secondary text-secondary-text hover:bg-card hover:text-primary-text'
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-secondary-text font-medium text-lg">No Product found</p>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  {filteredProducts.map((product: any) => (
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
