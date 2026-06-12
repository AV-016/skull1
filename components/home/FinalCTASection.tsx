'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

export const FinalCTASection = () => {
  return (
    <section className="py-32 bg-background border-t border-border relative overflow-hidden flex items-center justify-center">
      
      {/* Background radial accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Apple-style background products silhouetted at very low opacity */}
      <div className="absolute left-[-100px] top-1/2 -translate-y-1/2 w-72 h-72 opacity-[0.03] select-none pointer-events-none hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80"
          alt="Oni Figure Silhouette"
          className="w-full h-full object-contain filter grayscale contrast-200"
        />
      </div>
      <div className="absolute right-[-100px] top-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.03] select-none pointer-events-none hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&auto=format&fit=crop&q=80"
          alt="Origami Vase Silhouette"
          className="w-full h-full object-contain filter grayscale contrast-200"
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative text-center max-w-3xl space-y-8 z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >


          {/* Headline */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-primary-text leading-none tracking-tight">
            Ready To Bring Your <br />
            <span className="text-primary">
              Ideas To Life?
            </span>
          </h2>

          {/* Subtext */}
          <p className="text-secondary-text text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-medium">
            Explore our curated shop collections of high-end mini figures, keychains, and home decor, or begin your bespoke printing request now.
          </p>

          {/* Luxury Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center max-w-md mx-auto pt-4">
            <Link
              href="/products"
              className="px-8 py-4 bg-white text-black font-semibold rounded-xl hover:scale-105 hover:bg-gray-100 active:scale-95 transition-all duration-300 text-center shadow-xl tracking-wide uppercase text-xs font-bold"
            >
              Browse Products
            </Link>
            <Link
              href="/custom-request"
              className="px-8 py-4 border border-border bg-secondary/15 backdrop-blur-md text-primary-text font-semibold rounded-xl hover:scale-105 hover:bg-secondary/30 active:scale-95 transition-all duration-300 text-center tracking-wide uppercase text-xs font-bold"
            >
              Start Custom Order
            </Link>
          </div>
        </motion.div>
        
      </div>
    </section>
  )
}
