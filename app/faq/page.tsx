'use client'

import { Navbar } from '@/components/layout/Navbar'
import { FAQSection } from '@/components/home/FAQSection'
import { Footer } from '@/components/layout/Footer'
import { motion } from 'framer-motion'

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />
      
      <div className="pt-24 pb-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FAQSection />
        </motion.div>
      </div>

      <Footer />
    </main>
  )
}
