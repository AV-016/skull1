'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingCart, Settings, Search, LayoutDashboard, Package, LogOut, Shield, Heart, Gift, MessageSquare, Layers, Bell, SlidersHorizontal } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import api from '@/lib/api'
import { useProducts, useCategories } from '@/hooks/useProducts'
import { sanitizeProducts } from '@/lib/mockProducts'

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Search filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilterSort, setSelectedFilterSort] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('');
  const router = useRouter();
  const { appearance, accent, setAppearance, setAccent } = useSettings();
  const { user, logout, isAdmin } = useAuth()

  // Notification States
  const [notifications, setNotifications] = useState<any[]>([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Fetch unread support replies, order updates, and project updates
  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }
    
    const fetchNotifications = async () => {
      try {
        // 1. Fetch Inquiries (Support)
        let unreadInquiries: any[] = []
        try {
          const res = await api.get('/inquiries/my')
          if (res.data?.success && res.data?.data) {
            unreadInquiries = res.data.data
              .filter((inq: any) => !inq.isReadByCustomer)
              .map((inq: any) => ({
                id: `inquiry_${inq.id}`,
                type: 'support',
                title: 'Support Reply',
                message: inq.messages?.[inq.messages.length - 1]?.message || `Update on: ${inq.subject}`,
                link: '/dashboard',
                color: 'text-red-500',
                updatedAt: inq.updatedAt,
                markRead: () => {
                  api.get(`/inquiries/${inq.id}`).catch((err) => console.error('Failed to mark inquiry read:', err))
                }
              }))
          }
        } catch (e) {
          console.error('Error fetching inquiries notifications:', e)
        }

        // 2. Fetch Orders
        let orderNotifications: any[] = []
        try {
          const res = await api.get('/orders')
          if (res.data?.success && res.data?.data) {
            const orders = res.data.data
            const cachedStatuses = JSON.parse(localStorage.getItem('notification_orders') || '{}')
            const newStatuses: Record<string, string> = { ...cachedStatuses }
            
            orders.forEach((order: any) => {
              const prevStatus = cachedStatuses[order.id]
              if (prevStatus && prevStatus !== order.status) {
                orderNotifications.push({
                  id: `order_${order.id}_${order.status}`,
                  type: 'order',
                  title: `Order #${order.orderNumber.slice(-6)} Updated`,
                  message: `Status changed from ${prevStatus.toLowerCase()} to ${order.status.toLowerCase()}.`,
                  link: `/orders`,
                  color: 'text-teal-500',
                  updatedAt: order.updatedAt,
                  markRead: () => {
                    const currentCache = JSON.parse(localStorage.getItem('notification_orders') || '{}')
                    currentCache[order.id] = order.status
                    localStorage.setItem('notification_orders', JSON.stringify(currentCache))
                  }
                })
              }
              newStatuses[order.id] = order.status
            })
            localStorage.setItem('notification_orders', JSON.stringify(newStatuses))
          }
        } catch (e) {
          console.error('Error fetching orders notifications:', e)
        }

        // 3. Fetch Custom Requests
        let requestNotifications: any[] = []
        try {
          const res = await api.get('/custom-requests')
          if (res.data?.success && res.data?.data) {
            const requests = res.data.data
            const cachedStatuses = JSON.parse(localStorage.getItem('notification_requests') || '{}')
            const newStatuses: Record<string, string> = { ...cachedStatuses }

            requests.forEach((req: any) => {
              const prevStatus = cachedStatuses[req.id]
              const reqTitle = req.requirements ? (req.requirements.match(/Project Title:\s*([^\n]+)/)?.[1]?.trim() || 'Custom Project') : 'Custom Project'
              
              if (prevStatus && prevStatus !== req.status) {
                requestNotifications.push({
                  id: `request_${req.id}_${req.status}`,
                  type: 'custom_request',
                  title: 'Project Updated',
                  message: `"${reqTitle}" is now ${req.status.toLowerCase()}.`,
                  link: `/custom-requests/${req.id}`,
                  color: 'text-orange-500',
                  updatedAt: req.updatedAt,
                  markRead: () => {
                    const currentCache = JSON.parse(localStorage.getItem('notification_requests') || '{}')
                    currentCache[req.id] = req.status
                    localStorage.setItem('notification_requests', JSON.stringify(currentCache))
                  }
                })
              }
              newStatuses[req.id] = req.status
            })
            localStorage.setItem('notification_requests', JSON.stringify(newStatuses))
          }
        } catch (e) {
          console.error('Error fetching custom requests notifications:', e)
        }

        // Combine and sort by updatedAt descending
        const combined = [...unreadInquiries, ...orderNotifications, ...requestNotifications]
        combined.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        setNotifications(combined)

      } catch (err) {
        console.error('Error in notification aggregation:', err)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 12000)

    window.addEventListener('notifications-updated', fetchNotifications)
    return () => {
      clearInterval(interval)
      window.removeEventListener('notifications-updated', fetchNotifications)
    }
  }, [user])

  const handleNotificationClick = (notif: any) => {
    if (notif.markRead) {
      notif.markRead()
    }
    setIsNotificationsOpen(false)
    window.dispatchEvent(new Event('notifications-updated'))
    router.push(notif.link)
  }

  const handleMarkAllRead = async () => {
    try {
      // 1. Mark support replies as read
      for (const notif of notifications) {
        if (notif.type === 'support') {
          const inqId = notif.id.replace('inquiry_', '')
          await api.get(`/inquiries/${inqId}`) // fetching marks it read
        }
      }
      
      // 2. Fetch fresh lists to sync cache
      const [resOrders, resReqs] = await Promise.all([
        api.get('/orders'),
        api.get('/custom-requests')
      ])

      if (resOrders.data?.success && resOrders.data?.data) {
        const orderStatuses: Record<string, string> = {}
        resOrders.data.data.forEach((o: any) => {
          orderStatuses[o.id] = o.status
        })
        localStorage.setItem('notification_orders', JSON.stringify(orderStatuses))
      }

      if (resReqs.data?.success && resReqs.data?.data) {
        const reqStatuses: Record<string, string> = {}
        resReqs.data.data.forEach((r: any) => {
          reqStatuses[r.id] = r.status
        })
        localStorage.setItem('notification_requests', JSON.stringify(reqStatuses))
      }

      window.dispatchEvent(new Event('notifications-updated'))
    } catch (e) {
      console.error('Error marking all as read:', e)
    }
  }

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!isProfileOpen && !isNotificationsOpen && !isFilterOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      const clickedProfileButton = target.closest('[data-profile-btn]');
      const clickedProfileMenu = target.closest('[data-profile-menu]');
      
      const clickedNotifButton = target.closest('[data-notif-btn]');
      const clickedNotifMenu = target.closest('[data-notif-menu]');

      const clickedFilterButton = target.closest('[data-filter-btn]');
      const clickedFilterMenu = target.closest('[data-filter-menu]');

      if (!clickedProfileButton && !clickedProfileMenu) {
        setIsProfileOpen(false);
      }
      
      if (!clickedNotifButton && !clickedNotifMenu) {
        setIsNotificationsOpen(false);
      }

      if (!clickedFilterButton && !clickedFilterMenu) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isProfileOpen, isNotificationsOpen, isFilterOpen]);
  const { data: categories = [] } = useCategories();
  const suggestions = categories.length > 0
    ? categories.map((cat: any) => cat.name).slice(0, 5)
    : [
        'Anime Figures',
        'Keychains',
        'Miniatures',
        'Desk Decor',
        'Engineering Models',
      ];

  const { data: rawProducts = [] } = useProducts({ limit: 100 });
  const allProducts = sanitizeProducts(rawProducts);

  const filteredSuggestions = query.trim()
    ? allProducts
        .filter((p: any) => p.name.toLowerCase().includes(query.toLowerCase()))
        .map((p: any) => ({
          name: p.name,
          image: p.image || '/placeholder.jpg'
        }))
        .filter((val, idx, self) => self.findIndex((t) => t.name === val.name) === idx)
    : suggestions.map((s) => ({
        name: s,
        image: null
      }));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = `/products?`;
    const params = [];
    if (query.trim()) params.push(`search=${encodeURIComponent(query.trim())}`);
    if (selectedFilterSort) params.push(`filter=${selectedFilterSort}`);
    if (selectedFilterCategory) params.push(`category=${selectedFilterCategory}`);
    
    url += params.join('&');
    router.push(url);
    setIsSearchFocused(false);
    setIsFilterOpen(false);
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
          <Link href="/" className="text-2xl font-bold text-primary-text hover:text-primary smooth-transition flex items-center gap-2.5 tracking-wider select-none">
            <img src="/logo_light.png" alt="Skulture Logo" className="h-[46px] w-auto object-contain dark:hidden ml-[-25px]" />
            <img src="/logo_dark.png" alt="Skulture Logo" className="h-8 w-auto object-contain hidden dark:block ml-[-25px]" />
            SKULTURE
          </Link>

          {/* Search Bar Wrapper (hidden on mobile, visible on desktop) */}
          <div className="relative flex-1 max-w-lg mx-6 hidden md:block">
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
                type="button"
                data-filter-btn
                onClick={() => {
                  setIsFilterOpen(!isFilterOpen);
                  setIsSearchFocused(false);
                }}
                className={`p-2 rounded-xl text-muted-text hover:text-primary-text smooth-transition shrink-0 mr-1 cursor-pointer hover:bg-white/5 ${
                  isFilterOpen ? 'text-primary' : ''
                }`}
                title="Search Filter Options"
              >
                <SlidersHorizontal className="w-4.5 h-4.5" />
              </button>
              <button
                type="submit"
                onClick={handleSearchSubmit}
                className="mr-2 px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-xl transition-all duration-300 shadow-lg"
              >
                Search
              </button>
            </div>

            {/* Filter Options Panel */}
            {isFilterOpen && (
              <div data-filter-menu className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-2xl p-4.5 shadow-2xl z-50 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-primary-text text-xs font-black uppercase tracking-wider">Search Filters</span>
                  <button
                    onClick={() => {
                      setSelectedFilterSort('');
                      setSelectedFilterCategory('');
                    }}
                    className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                </div>
                
                {/* Sort Section */}
                <div>
                  <span className="text-[10px] text-muted-text font-black uppercase tracking-widest block mb-2">Sort By</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'price_asc', label: 'Price: Low to High' },
                      { id: 'price_desc', label: 'Price: High to Low' },
                      { id: 'bestsellers', label: 'Best Sellers' },
                      { id: 'newest', label: 'Newest Arrivals' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedFilterSort(opt.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border text-center transition-all cursor-pointer ${
                          selectedFilterSort === opt.id
                            ? 'bg-primary border-primary text-white font-extrabold'
                            : 'bg-secondary/40 border-border text-secondary-text hover:border-muted-text'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                 {/* Category Section */}
                <div>
                  <span className="text-[10px] text-muted-text font-black uppercase tracking-widest block mb-2">Category</span>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {categories.length > 0 ? (
                      categories
                        .filter((cat: any) => cat.slug !== 'custom-orders')
                        .map((cat: any) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedFilterCategory(selectedFilterCategory === cat.slug ? '' : cat.slug)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border text-center transition-all cursor-pointer truncate ${
                              selectedFilterCategory === cat.slug
                                ? 'bg-primary border-primary text-white font-extrabold'
                                : 'bg-secondary/40 border-border text-secondary-text hover:border-muted-text'
                            }`}
                            title={cat.name}
                          >
                            {cat.name}
                          </button>
                        ))
                    ) : (
                      <span className="text-[10px] text-muted-text italic col-span-2">Loading categories...</span>
                    )}
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg cursor-pointer"
                  >
                    Apply Filters & Search
                  </button>
                </div>
              </div>
            )}

            {/* Dropdown Suggestions */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-2xl p-4 shadow-2xl z-50">
                <span className="text-muted-text text-[10px] font-bold uppercase tracking-wider block mb-2 px-2">
                  {filteredSuggestions.length > 0 ? 'Try searching:' : 'No Product found'}
                </span>
                <div className="grid grid-cols-1 gap-1">
                  {filteredSuggestions.length > 0 ? (
                    filteredSuggestions.map((item) => (
                      <button
                        key={item.name}
                        onMouseDown={() => handleSuggestionClick(item.name)}
                        className="w-full text-left px-3 py-2 hover:bg-secondary hover:text-primary rounded-lg text-primary-text text-sm font-semibold smooth-transition cursor-pointer flex items-center gap-3"
                      >
                        {item.image && (
                          <div className="w-8 h-8 rounded border border-border overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.jpg'
                              }}
                            />
                          </div>
                        )}
                        <span>{item.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-muted-text text-sm italic">
                      No matching products found in suggestions
                    </div>
                  )}
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
                  data-notif-btn
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
                      data-notif-menu
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-popover border border-border p-3 shadow-2xl z-50 flex flex-col rounded-xl"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-border mb-2">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-primary-text">Notifications ({notifications.length})</h4>
                        {notifications.length > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wide cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <p className="text-[11px] text-muted-text py-4 text-center italic">No new messages or replies.</p>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                          {notifications.map((notif: any) => (
                            <button
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className="text-left p-2.5 hover:bg-secondary rounded-lg border border-border/60 transition-colors flex flex-col gap-1 w-full"
                            >
                              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
                                <span className={notif.color}>{notif.title}</span>
                                <span className="text-muted-text">{new Date(notif.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-xs text-primary-text font-semibold line-clamp-2 leading-relaxed">{notif.message}</p>
                            </button>
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
                  data-profile-btn
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
                      data-profile-menu
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
                      {isAdmin && (
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
                      <Link
                        href="/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center justify-between px-3 py-2 text-[11px] font-bold text-secondary-text hover:text-primary hover:bg-secondary smooth-transition uppercase tracking-wider cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Gift className="w-4 h-4 text-muted-text" />
                          <span>Loyalty Stamps</span>
                        </div>
                        <span className="text-[9px] bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded font-black">
                          {user.loyaltyStamps || 0}/8
                        </span>
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
