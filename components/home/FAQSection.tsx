'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs: FAQItem[] = [
    {
      question: 'What file formats do you support?',
      answer: 'We support standard 3D files including STL, OBJ, and STEP for direct printing. If you do not have a 3D model yet, we also accept standard image formats (PNG, JPG, JPEG) or blueprint drawings, and our engineering team will model them for you.'
    },
    {
      question: 'How long does printing take?',
      answer: 'Standard products from our shop are printed and shipped within 2-3 business days. Custom orders and complex mechanical parts depend on print volume and layer specifications, typically taking 5-7 business days. We provide accurate time estimates during your quotation.'
    },
    {
      question: 'Do you ship across India?',
      answer: 'Yes! We ship to all pin codes across India through premium courier services (BlueDart, Delhivery, and DTDC). Every package is securely wrapped in high-density foam and protective boxes to ensure your collectibles arrive in flawless condition.'
    },
    {
      question: 'Can I customize products?',
      answer: 'Absolutely. Every item in our store can be custom-scaled, printed in custom colors, or manufactured with high-strength composite filaments. Simply hit the "Custom Order" button on any product page to request custom variations.'
    },
    {
      question: 'How does custom ordering work?',
      answer: 'It is a simple 4-step process: 1) Upload your model file or drawing using our Custom Order portal. 2) Specify your choice of material, size, and quantity. 3) Our engineers analyze the design and email you a verified quotation within 12 hours. 4) Make the secure payment online, and we start printing immediately!'
    }
  ]

  return (
    <section id="faq" className="py-24 bg-background border-b border-border relative">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">

          <h2 className="heading-2 text-primary-text mb-4">Frequently Asked Questions</h2>
          <p className="text-secondary-text text-base">
            Everything you need to know about our 3D printing services and custom requests.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className="border border-border rounded-2xl overflow-hidden hover:border-primary/20 bg-card transition-all duration-300 shadow-md"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-secondary/50 transition-colors duration-300 cursor-pointer"
                >
                  <span className="font-bold text-primary-text text-base pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-text transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 text-sm text-secondary-text leading-relaxed border-t border-border pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
