'use client'

import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Alex Kumar',
    company: 'TechStart Inc',
    text: 'Skulture transformed our rapid prototyping process. The quality and speed are unmatched.',
    rating: 5,
  },
  {
    name: 'Sarah Chen',
    company: 'Innovation Labs',
    text: 'Professional, reliable, and exactly what we needed. Highly recommended for any manufacturing.',
    rating: 5,
  },
  {
    name: 'Rajesh Patel',
    company: 'Design Studio',
    text: 'The attention to detail and customer service are exceptional. Worth every penny.',
    rating: 5,
  },
]

export const TestimonialsSection = () => {
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
            <h2 className="heading-2 text-primary-text mb-4">Customer Testimonials</h2>
            <p className="body-text text-secondary-text">Trusted by creators and engineers worldwide</p>
          </motion.div>

          {/* Testimonials Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="p-8 bg-card border border-border rounded-lg hover:border-primary/20 smooth-transition flex flex-col"
                variants={itemVariants}
                whileHover={{ y: -4 }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-secondary-text mb-6 flex-grow italic">"{testimonial.text}"</p>

                {/* Author */}
                <div>
                  <p className="font-semibold text-primary-text">{testimonial.name}</p>
                  <p className="text-muted-text text-sm">{testimonial.company}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
