'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { useProducts } from '@/hooks/useProducts'
import { ProductCard } from '@/components/products/ProductCard'

interface CartItem {
  id: string
  name: string
  slug: string
  price: number
  image: string
  category: string
  quantity: number
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const { formatPrice } = useSettings()
  const { data: products } = useProducts()

  const displayProducts = products
    ?.filter((p: any) => p.isActive && p.stock > 0)
    ?.slice(0, 4) || []

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const items = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartItems(items)
      setIsLoaded(true)
    }
  }, [])

  const saveCart = (newItems: CartItem[]) => {
    setCartItems(newItems)
    localStorage.setItem('cart', JSON.stringify(newItems))
    window.dispatchEvent(new Event('cart-updated'))
  }

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty < 1) return
    
    const dbProd = products?.find(p => p.id === id)
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

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  // Simple tax calculation (e.g. 10%)
  const tax = subtotal * 0.1
  const total = subtotal + tax

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
            <ShoppingBag className="w-8 h-8 text-primary" /> Shopping Cart
          </h1>
        </div>
      </div>

      <div className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          {cartItems.length === 0 ? (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-secondary-text mb-8 text-lg">Your cart is currently empty</p>
              <Link
                href="/products"
                className="inline-block px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 smooth-transition uppercase text-xs tracking-wider font-bold cursor-pointer"
              >
                Browse Products
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items List */}
              <div className="lg:col-span-2 space-y-4">
                <AnimatePresence>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card border border-border rounded-xl gap-4 hover:border-primary/20 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        {/* Image */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary border border-border shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Details */}
                        <div>
                          <Link href={`/products/${item.slug}`} className="hover:text-primary transition-colors">
                            <h3 className="font-bold text-primary-text">{item.name}</h3>
                          </Link>
                          <p className="text-xs text-muted-text mt-1">{item.category}</p>
                          <p className="text-sm font-semibold text-primary mt-1">{formatPrice(item.price)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-4 sm:pt-0">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-border rounded-lg bg-secondary">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 text-secondary-text hover:text-primary smooth-transition cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-4 text-sm font-semibold text-primary-text">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 text-secondary-text hover:text-primary smooth-transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Subtotal & Delete */}
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-primary-text text-right min-w-[80px]">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-muted-text hover:text-red-500 hover:bg-red-500/10 rounded-lg smooth-transition cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Order Summary */}
              <div>
                <div className="bg-card border border-border rounded-xl p-6 sticky top-28 space-y-6">
                  <h3 className="font-bold text-lg text-primary-text pb-4 border-b border-border">Order Summary</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between text-secondary-text text-sm">
                      <span>Subtotal</span>
                      <span className="font-medium text-primary-text">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-secondary-text text-sm">
                      <span>Estimated Tax (10%)</span>
                      <span className="font-medium text-primary-text">{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between text-secondary-text text-sm">
                      <span>Shipping</span>
                      <span className="text-green-500 font-medium">Free</span>
                    </div>
                    <div className="border-t border-border pt-4 mt-2 flex justify-between font-bold text-lg text-primary-text">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Link
                    href="/checkout"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/95 text-white font-semibold rounded-lg smooth-transition uppercase text-xs tracking-wider font-bold cursor-pointer"
                  >
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="text-center pt-2">
                    <Link href="/products" className="text-xs text-muted-text hover:text-primary smooth-transition">
                      ← Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {displayProducts.length > 0 && (
            <div className="mt-16 pt-12 border-t border-border">
              <h2 className="text-xl font-bold text-primary-text mb-6 uppercase tracking-wider">Continue Shopping: Recommended for You</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {displayProducts.map((prod: any) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
