'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Star, ShieldAlert, BadgeInfo, ShoppingCart } from 'lucide-react'
import { mockProducts, sanitizeProducts } from '@/lib/mockProducts'
import { useProducts } from '@/hooks/useProducts'
import { useSettings } from '@/context/SettingsContext'

export function BestSellersSection() {
  const { formatPrice } = useSettings()

  // Fetch products from database
  const { data: serverProducts = [] } = useProducts()
  const sanitizedServer = sanitizeProducts(serverProducts)
    .filter(p => p.image && !p.image.includes('placeholder.jpg'))
    .sort((a, b) => {
      const orderA = a.bestSellerOrder && a.bestSellerOrder > 0 ? a.bestSellerOrder : 9999;
      const orderB = b.bestSellerOrder && b.bestSellerOrder > 0 ? b.bestSellerOrder : 9999;
      return orderA - orderB;
    })

  // Get products assigned in Best Sellers Manager slots (1 to 10), fallback to isFeatured products if none set
  let featuredDbProducts = sanitizedServer.filter((p) => p.isActive && p.bestSellerOrder && p.bestSellerOrder > 0)
  if (featuredDbProducts.length === 0) {
    featuredDbProducts = sanitizedServer.filter((p) => p.isActive && p.isFeatured)
  }

  // Select the large featured hero product
  const heroProduct = featuredDbProducts[0]
    || sanitizedServer.find((p) => p.slug === 'shogun-cyber-oni-figure') 
    || sanitizedServer[0] 
    || mockProducts.find((p) => p.slug === 'shogun-cyber-oni-figure') 
    || mockProducts[0]

  // Select supporting products (up to 4 items)
  const supportingProducts: any[] = []
  
  // 1. Add remaining featured products (after the hero)
  supportingProducts.push(...featuredDbProducts.slice(1))

  // 2. Add other active database products to fill up slots if needed
  if (supportingProducts.length < 4) {
    const otherDbProducts = sanitizedServer.filter(
      (p) => p.id !== heroProduct.id && !supportingProducts.some((sp) => sp.id === p.id) && p.isActive
    )
    supportingProducts.push(...otherDbProducts)
  }

  // 3. Fallback to mock popular products if we still have fewer than 4 items
  const defaultSupporting = [
    mockProducts.find((p) => p.slug === 'fractal-kinetic-sculpture') || mockProducts[1],
    mockProducts.find((p) => p.slug === 'parametric-origami-vase') || mockProducts[4],
    mockProducts.find((p) => p.slug === 'articulated-crystal-dragon') || mockProducts[3],
    mockProducts.find((p) => p.slug === 'cyberpunk-artisan-keycaps') || mockProducts[2]
  ]

  let fallbackIdx = 0
  while (supportingProducts.length < 4 && fallbackIdx < defaultSupporting.length) {
    const fallbackItem = defaultSupporting[fallbackIdx]
    if (
      fallbackItem.id !== heroProduct.id && 
      fallbackItem.slug !== heroProduct.slug &&
      !supportingProducts.some((sp) => sp.id === fallbackItem.id || sp.slug === fallbackItem.slug)
    ) {
      supportingProducts.push(fallbackItem)
    }
    fallbackIdx++
  }

  const finalSupporting = supportingProducts.slice(0, 4)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' as const }
    }
  }

  return (
    <section id="best-sellers" className="py-24 bg-secondary border-b border-border">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3">Popular Choice</h2>
          <h3 className="heading-2 text-primary-text mb-4">The Best Sellers</h3>
          <p className="text-secondary-text text-base">
            Explore our most popular customer favorites, engineered to perfection.
          </p>
        </div>

        {/* Apple-Style Grid Layout */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {/* Left Block: 1 Huge Featured Product */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-6 bg-card border border-border hover:border-primary/20 rounded-3xl overflow-hidden group flex flex-col justify-between shadow-2xl relative"
          >
            {/* Image Section */}
            <div className="h-72 sm:h-96 w-full relative bg-secondary overflow-hidden">
              <img
                src={heroProduct.image}
                alt={heroProduct.name}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              <span className="absolute top-6 left-6 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-lg">
                Best Seller
              </span>
            </div>

            {/* Description & Details */}
            <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-xs text-primary font-semibold tracking-wider uppercase">
                      {heroProduct.category}
                    </span>
                    <h4 className="text-2xl font-black text-primary-text mt-1 group-hover:text-primary transition-colors duration-300">
                      {heroProduct.name}
                    </h4>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    {heroProduct.eventPromo ? (
                      <>
                        <span className="text-sm text-muted-text line-through font-semibold leading-none">
                          {formatPrice(heroProduct.price)}
                        </span>
                        <span className="text-2xl font-black text-primary block mt-1 leading-none">
                          {formatPrice(heroProduct.eventPromo.discountedPrice)}
                        </span>
                        <span className="text-[8px] text-green-500 font-bold uppercase tracking-wider block mt-1">
                          {heroProduct.eventPromo.discountPercentage}% OFF — {heroProduct.eventPromo.eventTitle}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl font-black text-primary-text block leading-none">
                          {formatPrice(heroProduct.price)}
                        </span>
                        <span className="text-[9px] text-muted-text font-semibold uppercase block mt-1">Inclusive of Taxes</span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-secondary-text text-sm mt-4 leading-relaxed whitespace-pre-line">
                  {heroProduct.description}
                </p>

                {/* Tech specifications highlight */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {Object.entries(heroProduct.specifications || {}).slice(0, 3).map(([k, v]) => (
                    <div key={k} className="bg-secondary p-3 rounded-xl border border-border">
                      <span className="text-muted-text block text-[9px] uppercase tracking-wider font-semibold">{k}</span>
                      <span className="text-primary-text text-xs font-medium truncate block mt-0.5">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <span className="text-primary-text text-sm font-semibold">{heroProduct.rating}</span>
                  <span className="text-muted-text text-xs">({heroProduct.reviewsCount} reviews)</span>
                </div>
                <Link
                  href={`/products/${heroProduct.slug}`}
                  className="px-6 py-3 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl transition-all duration-300 shadow-md flex items-center gap-2"
                >
                  View Product
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Right Block: 4 Supporting Products */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
            {finalSupporting.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                className="bg-card border border-border hover:border-primary/20 rounded-2xl overflow-hidden group flex flex-col justify-between transition-all duration-300 shadow-lg"
              >
                <Link href={`/products/${product.slug}`} className="block flex-1 flex flex-col justify-between">
                  {/* Image container */}
                  <div className="h-44 w-full bg-secondary overflow-hidden relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-30" />
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 mb-1.5">
                        <Star className="w-3 h-3 text-primary fill-primary" />
                        <span className="text-[10px] text-primary-text font-bold">{product.rating}</span>
                      </div>
                      <h4 className="text-primary-text font-bold text-base group-hover:text-primary transition-colors duration-300 truncate">
                        {product.name}
                      </h4>
                      <p className="text-muted-text text-[11px] mt-1 line-clamp-2 leading-normal">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border flex flex-col gap-1">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                          {product.eventPromo ? (
                            <>
                              <span className="text-[10px] text-muted-text line-through font-medium leading-none">
                                {formatPrice(product.price)}
                              </span>
                              <span className="text-primary font-extrabold text-base mt-0.5 leading-none">
                                {formatPrice(product.eventPromo.discountedPrice)}
                              </span>
                            </>
                          ) : (
                            <span className="text-primary-text font-extrabold text-base leading-none">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                        <span className="text-primary text-xs font-semibold group-hover:translate-x-1 transition-transform duration-300">
                          View Details →
                        </span>
                      </div>
                      {product.eventPromo && (
                        <div className="text-[9px] text-green-500 font-bold uppercase tracking-wider mt-0.5">
                          {product.eventPromo.discountPercentage}% OFF — {product.eventPromo.eventTitle}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
