'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Upload Your Design',
    description: 'Share your 3D model or specifications in any standard format',
  },
  {
    number: '02',
    title: 'Get Instant Quote',
    description: 'Receive pricing and timeline estimates within 24 hours',
  },
  {
    number: '03',
    title: 'Review & Approve',
    description: 'Review specifications and approve before production begins',
  },
  {
    number: '04',
    title: 'Manufacturing',
    description: 'Your project is manufactured with precision and care',
  },
]

export const HowItWorksSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  return (
    <section className="py-20 md:py-32 bg-background border-t border-border">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Heading */}
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h2 className="heading-2 text-primary-text mb-4">How It Works</h2>
            <p className="body-text text-secondary-text">A simple, streamlined process from idea to reality</p>
          </motion.div>

          {/* Steps Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
          >
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="p-6 bg-card border border-border rounded-lg hover:border-primary/20 smooth-transition"
                variants={itemVariants}
                whileHover={{ y: -4 }}
              >
                <div className="text-5xl font-bold text-primary-text/20 mb-4">{step.number}</div>
                <h3 className="heading-3 text-lg text-primary-text mb-3">{step.title}</h3>
                <p className="text-secondary-text">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
