'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useCategories } from '@/hooks/useProducts'
import { Category } from '@/lib/types'

interface CategoryCard {
  title: string
  image: string
  href: string
  count: string
}

const categoryImages: Record<string, string> = {
  'miniatures': 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=80',
  'keychains': 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
  'desk-accessories': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
  'home-decor': 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80',
  'anime-figures': 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
  'custom-designs': 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=600&auto=format&fit=crop&q=80',
  'functional-prints': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
  'sculptures-art': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
}

const fallbackImage = 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80'

const defaultCategoryCards: CategoryCard[] = [
  {
    title: 'Anime Figures',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    href: '/products?category=Anime+Figures',
    count: '12 Items'
  },
  {
    title: 'Keychains',
    image: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80',
    href: '/products?category=Keychains',
    count: '8 Items'
  },
  {
    title: 'Desk Accessories',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    href: '/products?category=Desk+Accessories',
    count: '15 Items'
  },
  {
    title: 'Miniatures',
    image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600&auto=format&fit=crop&q=80',
    href: '/products?category=Miniatures',
    count: '24 Items'
  },
  {
    title: 'Home Decor',
    image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&auto=format&fit=crop&q=80',
    href: '/products?category=Home+Decor',
    count: '10 Items'
  },
  {
    title: 'Custom Designs',
    image: 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=600&auto=format&fit=crop&q=80',
    href: '/products?category=Custom+Designs',
    count: 'Bespoke'
  }
]

export const ShopByCategorySection = () => {
  const { data: serverCategories = [] } = useCategories()

  const categories: CategoryCard[] = serverCategories.length > 0
    ? serverCategories.map((cat: Category) => {
        const slug = cat.slug.toLowerCase()
        const image = cat.imageUrl || categoryImages[slug] || fallbackImage
        return {
          title: cat.name,
          image,
          href: `/products?category=${encodeURIComponent(cat.slug)}`,
          count: 'Explore'
        }
      })
    : defaultCategoryCards

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' as const }
    }
  }

  return (
    <section className="py-24 bg-background border-b border-border">
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-4">
          <div>
            <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3">Featured Collections</h2>
            <h3 className="heading-2 text-primary-text">Shop by Category</h3>
          </div>
          <p className="text-secondary-text max-w-md">
            Explore curated design collections printed in high-precision polymer resins and composite filaments.
          </p>
        </div>

        {/* Categories Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {categories.map((category) => (
            <motion.div
              key={category.title}
              variants={itemVariants}
              whileHover={{ y: -6 }}
              className="group relative h-80 rounded-2xl overflow-hidden border border-border hover:border-primary/40 transition-all duration-300"
            >
              <Link href={category.href} className="block w-full h-full relative">
                {/* Background Image */}
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300" />

                {/* Card Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col justify-end">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-xs bg-white/10 backdrop-blur-md text-primary px-3 py-1 rounded-full font-semibold border border-white/10 mb-3 inline-block">
                        {category.count}
                      </span>
                      <h4 className="text-xl font-bold text-white tracking-wide group-hover:text-primary transition-colors duration-300">
                        {category.title}
                      </h4>
                    </div>
                    
                    {/* Hover arrow indicator */}
                    <div className="w-10 h-10 bg-white/5 border border-white/15 rounded-full flex items-center justify-center text-white group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-300 transform group-hover:translate-x-1">
                      →
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
