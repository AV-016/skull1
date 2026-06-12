'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export const CustomPrintingCTASection = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-[#111111] to-black border-t border-white/8">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="heading-2 text-white mb-6">Custom Printing Solutions</h2>
          <p className="body-text text-secondary mb-8 max-w-2xl mx-auto">
            Have a unique idea? Our custom printing service brings any design to life with precision and expertise.
            Get instant quotes and start your project today.
          </p>
          
          <Link 
            href="/custom-request"
            className="inline-block px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 smooth-transition"
          >
            Start Your Custom Project
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
