'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Product } from '@/lib/types'
import { useSettings } from '@/context/SettingsContext'
import { Heart } from 'lucide-react'

interface ProductCardProps {
  product: Product
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { formatPrice } = useSettings()
  const [isInWishlist, setIsInWishlist] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setIsInWishlist(wishlist.some((item: any) => item.id === product.id))
    }
  }, [product.id])

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (typeof window !== 'undefined') {
      const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      let updatedWishlist = []
      
      if (isInWishlist) {
        updatedWishlist = wishlist.filter((item: any) => item.id !== product.id)
        setIsInWishlist(false)
      } else {
        updatedWishlist = [...wishlist, product]
        setIsInWishlist(true)
      }
      
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist))
      window.dispatchEvent(new Event('wishlist-updated'))
    }
  }

  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="group"
    >
      <Link href={`/products/${product.slug}`}>
        <div className="relative overflow-hidden rounded-lg bg-card border border-border hover:border-primary/20 smooth-transition h-80 mb-4">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={toggleWishlist}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md border border-border shadow-sm smooth-transition hover:scale-110 cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isInWishlist
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-600 dark:text-gray-300 hover:text-red-500'
              }`}
            />
          </button>

          {/* Product Image */}
          <img
            src={
              product.image || 
              (product.images as any)?.find((img: any) => img.isPrimary)?.url || 
              (product.images as any)?.[0]?.url || 
              '/placeholder.jpg'
            }
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 smooth-transition"
          />
          
          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 smooth-transition flex items-center justify-center">
            <button className="px-6 py-2 bg-white text-black font-semibold rounded-lg smooth-transition">
              View Details
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h3 className="text-lg font-semibold text-primary-text group-hover:text-primary smooth-transition line-clamp-2">
            {product.name}
          </h3>
          <p className="text-muted-text text-sm mt-1 line-clamp-2">
            {product.description}
          </p>
          <div className="mt-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                {product.eventPromo ? (
                  <>
                    <span className="text-xs text-muted-text line-through font-medium leading-none">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-lg font-bold text-primary mt-1 leading-none">
                      {formatPrice(product.eventPromo.discountedPrice)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-primary-text leading-none">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
              <span className="text-xs bg-secondary text-secondary-text px-3 py-1 rounded-full">
                {typeof product.category === 'object' && product.category !== null
                  ? (product.category as any).name
                  : product.category}
              </span>
            </div>
            {product.eventPromo && (
              <div className="text-[9px] text-green-500 font-bold uppercase tracking-wider mt-0.5">
                {product.eventPromo.discountPercentage}% OFF — Under {product.eventPromo.eventTitle}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

