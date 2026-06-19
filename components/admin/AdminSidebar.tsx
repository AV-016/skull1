'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { 
  ChevronDown, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  Package, 
  Tag, 
  ShoppingCart, 
  Sparkles, 
  Star, 
  MessageSquare, 
  Users, 
  Award,
  Globe,
  Calendar
} from 'lucide-react'

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(true)

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Categories', href: '/admin/categories', icon: Tag },
    { label: 'Events & Offers', href: '/admin/events', icon: Calendar },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { label: 'Custom Requests', href: '/admin/custom-requests', icon: Sparkles },
    { label: 'Reviews', href: '/admin/reviews', icon: Star },
    { label: 'Inquiries', href: '/admin/inquiries', icon: MessageSquare },
    { label: 'Users', href: '/admin/users', icon: Users },
    { label: 'Loyalty Stamps', href: '/admin/loyalty', icon: Award },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className={`fixed left-0 top-0 h-screen bg-[#0B0C0E] border-r border-neutral-800/60 z-40 smooth-transition ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="flex flex-col h-full text-white">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800/60 flex items-center justify-between">
          {isOpen && <h1 className="font-bold text-lg text-white">Skulture</h1>}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-white/5 rounded-lg smooth-transition text-neutral-400 hover:text-white"
          >
            <ChevronDown className={`w-5 h-5 smooth-transition ${isOpen ? '' : 'rotate-90'}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`px-4 py-2.5 rounded-lg flex items-center gap-3  smooth-transition cursor-pointer ${
                    isActive(item.href)
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  {isOpen && <span className="text-base font-semibold">{item.label}</span>}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800/60 space-y-2">
          {isOpen && (
            <div className="px-4 py-2 text-xs text-neutral-500 truncate">
              {user?.name}
            </div>
          )}
          <Link href="/">
            <div className="w-full px-4 py-2 rounded-lg flex items-center gap-3 text-primary hover:bg-white/5 smooth-transition text-base cursor-pointer font-semibold">
              <Globe className="w-5 h-5" />
              {isOpen && 'View Storefront'}
            </div>
          </Link>
          <button
            onClick={logout}
            className="w-full px-4 py-2 rounded-lg flex items-center gap-3 text-destructive hover:bg-white/5 smooth-transition text-base cursor-pointer font-semibold"
          >
            <LogOut className="w-5 h-5" />
            {isOpen && 'Logout'}
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
