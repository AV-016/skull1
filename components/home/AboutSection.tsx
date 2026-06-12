'use client'

import { motion } from 'framer-motion'

const stats = [
  { label: '500+ Projects Completed', value: '500+' },
  { label: '100+ Happy Clients', value: '100+' },
  { label: '50+ Products', value: '50+' },
  { label: '98% Customer Satisfaction', value: '98%' },
]

export const AboutSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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
          className="max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Heading */}
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h2 className="heading-2 text-primary-text mb-4">About Skulture</h2>
            <p className="body-text text-secondary-text max-w-2xl mx-auto">
              We are dedicated to bringing precision manufacturing to creators and engineers worldwide. 
              Our commitment to quality, innovation, and customer satisfaction drives everything we do.
            </p>
          </motion.div>

          {/* Statistics Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={containerVariants}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="p-6 bg-card border border-border rounded-lg hover:border-primary/20 smooth-transition group cursor-default"
                variants={itemVariants}
                whileHover={{ y: -4 }}
              >
                <div className="text-4xl md:text-5xl font-bold text-primary-text mb-2 group-hover:text-primary smooth-transition">
                  {stat.value}
                </div>
                <p className="text-secondary-text text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
