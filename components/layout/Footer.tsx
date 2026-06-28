'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-secondary border-t border-border">
      {/* Main Footer */}
      <div className="py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {/* Shop Column */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="flex flex-col space-y-4"
            >
              <h4 className="text-sm font-semibold text-primary-text tracking-wider uppercase">Shop</h4>
              <ul className="space-y-2.5">
                <li><Link href="/products" className="text-secondary-text hover:text-primary text-sm smooth-transition">Shop Products</Link></li>
                <li><Link href="/#best-sellers" className="text-secondary-text hover:text-primary text-sm smooth-transition">Best Sellers</Link></li>
                <li><Link href="/#new-arrivals" className="text-secondary-text hover:text-primary text-sm smooth-transition">New Arrivals</Link></li>
                <li><Link href="/#trending" className="text-secondary-text hover:text-primary text-sm smooth-transition">Featured Collections</Link></li>
              </ul>
            </motion.div>

            {/* Categories Column */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col space-y-4"
            >
              <h4 className="text-sm font-semibold text-primary-text tracking-wider uppercase">Categories</h4>
              <ul className="space-y-2.5">
                <li><Link href="/products?category=Anime+Figures" className="text-secondary-text hover:text-primary text-sm smooth-transition">Anime Figures</Link></li>
                <li><Link href="/products?category=Keychains" className="text-secondary-text hover:text-primary text-sm smooth-transition">Keychains</Link></li>
                <li><Link href="/products?category=Desk+Accessories" className="text-secondary-text hover:text-primary text-sm smooth-transition">Desk Accessories</Link></li>
                <li><Link href="/products?category=Miniatures" className="text-secondary-text hover:text-primary text-sm smooth-transition">Miniatures</Link></li>
                <li><Link href="/products?category=Home+Decor" className="text-secondary-text hover:text-primary text-sm smooth-transition">Home Decor</Link></li>
                <li><Link href="/products?category=Custom+Designs" className="text-secondary-text hover:text-primary text-sm smooth-transition">Custom Designs</Link></li>
              </ul>
            </motion.div>

            {/* Custom Orders Column */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col space-y-4"
            >
              <h4 className="text-sm font-semibold text-primary-text tracking-wider uppercase">Custom Projects</h4>
              <ul className="space-y-2.5">
                <li><Link href="/custom-request" className="text-secondary-text hover:text-primary text-sm smooth-transition">Start Custom Order</Link></li>
                <li><Link href="/custom-request" className="text-secondary-text hover:text-primary text-sm smooth-transition">Upload STL Files</Link></li>
                <li><Link href="/custom-requests" className="text-secondary-text hover:text-primary text-sm smooth-transition">My Custom Projects</Link></li>
              </ul>
            </motion.div>

            {/* Support Column */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col space-y-4"
            >
              <h4 className="text-sm font-semibold text-primary-text tracking-wider uppercase">Support & Account</h4>
              <ul className="space-y-2.5">
                <li><Link href="/contact" className="text-secondary-text hover:text-primary text-sm smooth-transition">Contact Us</Link></li>
                <li><Link href="/faq" className="text-secondary-text hover:text-primary text-sm smooth-transition">FAQs</Link></li>
                <li><Link href="/dashboard" className="text-secondary-text hover:text-primary text-sm smooth-transition">Member Dashboard</Link></li>
                <li><Link href="/account" className="text-secondary-text hover:text-primary text-sm smooth-transition">My Account</Link></li>
                <li><Link href="/terms" className="text-secondary-text hover:text-primary text-sm smooth-transition">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="text-secondary-text hover:text-primary text-sm smooth-transition">Privacy Policy</Link></li>
              </ul>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Skulture Logo" className="w-7 h-7 dark:invert-0 invert" />
                <span className="text-primary-text font-bold tracking-wider text-lg">SKULTURE</span>
              </div>
              <p className="text-muted-text text-xs mt-1">
                Premium 3D printed products & custom prototyping solutions.
              </p>
            </div>
            <div className="text-muted-text text-sm order-last md:order-none text-center md:text-left flex flex-col gap-1.5">
              <span>© {currentYear} Skulture. All rights reserved.</span>
              <span className="text-[10px] text-muted-text/80 uppercase tracking-widest font-black block">Created by Team Orion</span>
            </div>
            <div className="flex gap-6">
              <a href="https://www.instagram.com/skulture.ag/" target="_blank" rel="noopener noreferrer" className="text-secondary-text hover:text-primary smooth-transition text-sm">Instagram</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
