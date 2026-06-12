'use client'

import { motion } from 'framer-motion'

const features = [
  {
    title: 'Engineering Excellence',
    description: 'Precision manufacturing with military-grade standards and quality control.',
  },
  {
    title: 'Product Quality',
    description: 'Premium materials and rigorous testing ensure exceptional durability.',
  },
  {
    title: 'Expert Team',
    description: 'Experienced engineers and technicians dedicated to your success.',
  },
  {
    title: '24/7 Support',
    description: 'Comprehensive customer support and technical assistance always available.',
  },
  {
    title: 'Fast Turnaround',
    description: 'Rapid prototyping and accelerated production timelines.',
  },
  {
    title: 'Competitive Pricing',
    description: 'Premium quality at competitive rates without compromising excellence.',
  },
]

export const WhyChooseSkulptureSection = () => {
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
            <h2 className="heading-2 text-primary-text mb-4">Why Choose Skulture</h2>
            <p className="body-text text-secondary-text">Premium craftsmanship meets cutting-edge technology</p>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="p-6 bg-card border border-border rounded-lg hover:border-primary/20 smooth-transition"
                variants={itemVariants}
                whileHover={{ y: -4 }}
              >
                <h3 className="text-lg font-semibold text-primary-text mb-3">{feature.title}</h3>
                <p className="text-secondary-text">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
