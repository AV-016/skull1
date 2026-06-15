'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingCart, Settings, Search, LayoutDashboard, Package, LogOut, Shield, Heart, Gift, MessageSquare, Layers, Bell } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import api from '@/lib/api'

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();
  const { appearance, accent, setAppearance, setAccent } = useSettings();
  const { user, logout } = useAuth()

  // Notification States
  const [notifications, setNotifications] = useState<any[]>([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Fetch unread support replies
  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }
    
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/inquiries/my')
        if (res.data?.success && res.data?.data) {
          const unread = res.data.data.filter((inq: any) => !inq.isReadByCustomer)
          setNotifications(unread)
        }
      } catch (err) {
        console.error('Error fetching notifications:', err)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000)

    window.addEventListener('notifications-updated', fetchNotifications)
    return () => {
      clearInterval(interval)
      window.removeEventListener('notifications-updated', fetchNotifications)
    }
  }, [user])

  useEffect(() => {
    const updateCartCount = () => {
      if (typeof window !== 'undefined') {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const count = cart.reduce((total: number, item: any) => total + (item.quantity || 1), 0);
        setCartCount(count);
      }
    };

    updateCartCount();

    window.addEventListener('cart-updated', updateCartCount);
    window.addEventListener('storage', updateCartCount);

    return () => {
      window.removeEventListener('cart-updated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);
  const suggestions = [
    'Anime Figures',
    'Keychains',
    'Miniatures',
    'Desk Decor',
    'Engineering Models',
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setIsSearchFocused(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    router.push(`/products?search=${encodeURIComponent(suggestion)}`);
    setQuery(suggestion);
    setIsSearchFocused(false);
  };


  return ( <>
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border premium-shadow smooth-transition">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <button
               onClick={() => setIsSidebarOpen(true)}
               className="p-2 hover:bg-secondary rounded-lg smooth-transition"
               aria-label="Open sidebar"
             >
               <Menu className="w-6 h-6 text-primary-text" />
             </button>
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-primary-text hover:text-primary smooth-transition flex items-center gap-2 tracking-wider">
            <img src="/logo.png" alt="Skulture Logo" className="w-8 h-8 dark:invert-0 invert" />
            SKULTURE
          </Link>

          {/* Search Bar Wrapper */}
          <div className="relative flex-1 max-w-lg mx-6">
            <div className="flex items-center bg-secondary/85 backdrop-blur-md border border-border focus-within:border-primary/50 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
              <Search className="w-5 h-5 text-muted-text ml-4 transition-colors duration-300" />
              <input
                type="text"
                placeholder="Search products, collections, or categories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit(e);
                  }
                }}
                className="w-full py-3 px-4 bg-transparent text-primary-text placeholder-muted-text text-sm focus:outline-none tracking-wide"
              />
              <button
                type="submit"
                onClick={handleSearchSubmit}
                className="mr-2 px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl transition-all duration-300 shadow-lg"
              >
                Search
              </button>
            </div>

            {/* Dropdown Suggestions */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-2xl p-4 shadow-2xl z-50">
                <span className="text-muted-text text-[10px] font-bold uppercase tracking-wider block mb-2 px-2">Try searching:</span>
                <div className="grid grid-cols-1 gap-1">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onMouseDown={() => handleSuggestionClick(s)}
                      className="w-full text-left px-3 py-2 hover:bg-secondary hover:text-primary rounded-lg text-primary-text text-sm font-semibold smooth-transition cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Cart & Settings & Auth */}
          <div className="flex items-center gap-4 relative">
            
            {/* Cart Icon */}
            <Link
              href="/cart"
              className="relative p-2 hover:bg-secondary rounded-lg smooth-transition text-primary-text"
            >
              <ShoppingCart className="w-5 h-5 text-primary-text hover:text-primary transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notification Bell Icon */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 hover:bg-secondary rounded-lg smooth-transition text-primary-text cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 hover:text-primary transition-colors" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-red-500 rounded-full w-2 h-2 animate-ping" />
                  )}
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-red-500 rounded-full w-2 h-2" />
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-72 bg-popover border border-border p-3 shadow-2xl z-50 flex flex-col rounded-xl"
                    >
                      <h4 className="font-bold text-xs uppercase tracking-wider text-primary-text pb-2 border-b border-border mb-2">Notifications ({notifications.length})</h4>
                      {notifications.length === 0 ? (
                        <p className="text-[11px] text-muted-text py-4 text-center italic">No new messages or replies.</p>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                          {notifications.map((inq: any) => (
                            <Link
                              key={inq.id}
                              href="/dashboard"
                              onClick={() => setIsNotificationsOpen(false)}
                              className="text-left p-2.5 hover:bg-secondary rounded-lg border border-border/60 transition-colors flex flex-col gap-1"
                            >
                              <div className="flex justify-between items-center text-[10px] font-bold text-red-500 uppercase tracking-wide">
                                <span>Support Reply</span>
                                <span>{new Date(inq.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-xs text-primary-text font-bold line-clamp-1">{inq.subject}</p>
                              <p className="text-[10px] text-secondary-text line-clamp-2 leading-normal">{inq.messages?.[0]?.message}</p>
                            </Link>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Auth Buttons */}
            {!user ? (
              <div className="hidden md:flex gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-secondary-text hover:text-primary smooth-transition text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 smooth-transition text-sm font-semibold accent-glow"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-0.5 bg-secondary border border-border hover:border-primary/50 smooth-transition cursor-pointer"
                  title={user.name}
                >
                  {/* Initials Avatar Box matching drafting-paper grid theme */}
                  <div className="w-8 h-8 flex items-center justify-center border-r border-border overflow-hidden">
                    {user.picture ? (
                      <img 
                        src={user.picture} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs tracking-wider">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-secondary-text pr-2.5 pl-0.5 max-w-[100px] truncate select-none">
                    {user.name || 'User'}
                  </span>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-popover border border-border p-2 shadow-2xl z-50 flex flex-col"
                    >
                      {/* User Profile Header */}
                      <div className="px-3 py-2.5 border-b border-border mb-1">
                        <p className="text-xs font-bold text-primary-text truncate">{user.name}</p>
                        <p className="text-[10px] text-muted-text truncate tracking-wide mt-0.5">{user.email}</p>
                      </div>
                      
                      {/* Dropdown Links */}
                      {user.role?.toLowerCase() === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-primary hover:bg-primary/5 border border-primary/25 smooth-transition uppercase tracking-wider mb-1"
                        >
                          <Shield className="w-4 h-4 text-primary" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      
                      {/* Section: Workspace */}
                      <div className="text-[9px] font-black text-muted-text uppercase tracking-widest px-3 py-1.5 mt-1">Workspace</div>
                      <Link
                        href="/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-secondary-text hover:text-primary hover:bg-secondary smooth-transition uppercase tracking-wider"
                      >
                        <LayoutDashboard className="w-4 h-4 text-muted-text" />
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-secondary-text hover:text-primary hover:bg-secondary smooth-transition uppercase tracking-wider"
                      >
                        <Package className="w-4 h-4 text-muted-text" />
                        <span>My Orders</span>
                      </Link>
                      <Link
                        href="/custom-requests"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-secondary-text hover:text-primary hover:bg-secondary smooth-transition uppercase tracking-wider"
                      >
                        <Layers className="w-4 h-4 text-muted-text" />
                        <span>Custom Projects</span>
                      </Link>
                      <Link
                        href="/wishlist"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-secondary-text hover:text-primary hover:bg-secondary smooth-transition uppercase tracking-wider"
                      >
                        <Heart className="w-4 h-4 text-muted-text" />
                        <span>Wishlist</span>
                      </Link>
                      
                      {/* Section: Rewards */}
                      <div className="text-[9px] font-black text-muted-text uppercase tracking-widest px-3 py-1.5 mt-2">Rewards & Benefits</div>
                      <div className="flex items-center justify-between px-3 py-2 text-[11px] font-bold text-secondary-text hover:text-primary hover:bg-secondary smooth-transition uppercase tracking-wider cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <Gift className="w-4 h-4 text-muted-text" />
                          <span>Loyalty Stamps</span>
                        </div>
                        <span className="text-[9px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded font-black">
                          {user.loyaltyStamps || 0}/8
                        </span>
                      </div>
                      <Link
                        href="/rewards"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-secondary-text hover:text-primary hover:bg-secondary smooth-transition uppercase tracking-wider"
                      >
                        <Gift className="w-4 h-4 text-muted-text" />
                        <span>Gift Cards</span>
                      </Link>

                      {/* Section: Support & Settings */}
                      <div className="text-[9px] font-black text-muted-text uppercase tracking-widest px-3 py-1.5 mt-2">Support & Settings</div>
                      <Link
                        href="/account"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-secondary-text hover:text-primary hover:bg-secondary smooth-transition uppercase tracking-wider"
                      >
                        <Settings className="w-4 h-4 text-muted-text" />
                        <span>Account</span>
                      </Link>
                      <Link
                        href="/contact"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-secondary-text hover:text-primary hover:bg-secondary smooth-transition uppercase tracking-wider"
                      >
                        <MessageSquare className="w-4 h-4 text-muted-text" />
                        <span>24x7 Customer Care</span>
                      </Link>
                      <div className="border-t border-border my-1" />
                      
                      {/* Theme and Preferences Section */}
                      <div className="px-3 py-2 space-y-3.5 border-b border-border pb-3 mb-1">
                        <div className="text-[9px] font-black text-muted-text uppercase tracking-widest">Theme</div>
                        <div className="flex gap-1.5">
                          {(['light', 'dark', 'system'] as const).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setAppearance(mode)}
                              className={`flex-1 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                                appearance === mode
                                  ? 'bg-primary text-white shadow-sm font-bold'
                                  : 'bg-secondary text-secondary-text hover:bg-border/40 font-medium'
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                        
                        <div className="text-[9px] font-black text-muted-text uppercase tracking-widest mt-1">Accent</div>
                        <div className="flex gap-2">
                          {(['teal', 'red', 'blue', 'purple'] as const).map((color) => {
                            const colors = {
                              teal: 'bg-[#14B8A6]',
                              red: 'bg-[#DC2626]',
                              blue: 'bg-[#3B82F6]',
                              purple: 'bg-[#8B5CF6]',
                            }
                            return (
                              <button
                                key={color}
                                onClick={() => setAccent(color)}
                                className={`w-5 h-5 rounded-full ${colors[color]} cursor-pointer flex items-center justify-center transition-all ${
                                  accent === color
                                    ? 'ring-2 ring-primary-text ring-offset-2 ring-offset-popover scale-110'
                                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                                }`}
                                title={color}
                              >
                                {accent === color && (
                                  <span className="block w-1.5 h-1.5 rounded-full bg-white" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-[11px] font-bold text-red-500 hover:bg-red-500/10 smooth-transition uppercase tracking-wider cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
    <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
  </> )
}
