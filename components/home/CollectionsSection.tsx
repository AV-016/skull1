'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function CollectionsSection() {
  const collections = [
    {
      name: 'Prototypes',
      description: 'Rapid prototyping solutions for product development',
      href: '/products?category=prototypes',
    },
    {
      name: 'Manufacturing',
      description: 'Production-grade 3D printing services',
      href: '/products?category=manufacturing',
    },
    {
      name: 'Jewelry & Design',
      description: 'Precision printing for jewelry and decorative items',
      href: '/products?category=jewelry',
    },
    {
      name: 'Dental & Medical',
      description: 'Medical-grade 3D printing solutions',
      href: '/products?category=medical',
    },
  ]

  return (
    <section className="py-20 md:py-32 border-b border-white/8">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="heading-2 mb-4">Shop by Category</h2>
          <p className="text-secondary text-lg max-w-2xl">
            Find exactly what you need from our specialized collection categories
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <Link href={collection.href}>
                <div className="glass-card p-8 h-full flex flex-col justify-between hover:border-border-hover smooth-transition cursor-pointer group">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-primary smooth-transition">
                      {collection.name}
                    </h3>
                    <p className="text-muted text-sm">{collection.description}</p>
                  </div>
                  <div className="mt-6 text-primary opacity-0 group-hover:opacity-100 smooth-transition">
                    Explore →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
