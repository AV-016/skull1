'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'

export const SearchBarSection = () => {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const suggestions = [
    'Anime Figures',
    'Keychains',
    'Miniatures',
    'Desk Decor',
    'Engineering Models'
  ]

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`)
    } else {
      router.push('/products')
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    router.push(`/products?search=${encodeURIComponent(suggestion)}`)
  }

  return (
    <section className="py-12 bg-background border-b border-border relative">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <form onSubmit={handleSearchSubmit} className="relative group">
            {/* Background Glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent-hover rounded-2xl opacity-10 group-focus-within:opacity-35 blur-xl transition duration-500" />
            
            {/* Search Input Box */}
            <div className="relative flex items-center bg-secondary/85 backdrop-blur-md border border-border group-focus-within:border-primary/50 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
              <Search className="w-6 h-6 text-muted-text ml-6 transition-colors duration-300 group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="Search products, collections, or categories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full py-5 px-6 bg-transparent text-primary-text placeholder-muted-text text-base focus:outline-none tracking-wide"
              />
              <button
                type="submit"
                className="mr-3 px-6 py-3 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Suggestions */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <span className="text-muted-text text-sm font-medium">Try searching:</span>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-1.5 bg-card hover:bg-primary hover:text-white border border-border rounded-full text-secondary-text text-xs font-semibold smooth-transition cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
