import { X, User, ChevronRight, LogOut, LogIn, Search } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useProducts';
import { useRouter } from 'next/navigation';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const { data: categories = [] } = useCategories();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  // Prevent scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] cursor-pointer"
          />

          {/* Sidebar Drawer Container */}
          <motion.aside
            className="fixed inset-y-0 left-0 w-full max-w-[340px] bg-background text-primary-text shadow-2xl z-[100] flex flex-col"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
          >
            {/* 1. Header Area (Amazon Style Blue/Slate Profile Banner) */}
            <div className="bg-slate-900 dark:bg-[#151922] text-white px-6 py-5 flex items-center justify-between border-b border-border/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  {user?.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-4.5 h-4.5 text-white" />
                  )}
                </div>
                <span className="font-bold text-base tracking-wide select-none">
                  Hello, {user?.name ? user.name : 'Sign In'}
                </span>
              </div>
              
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-white/80 hover:text-white"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Scrollable Navigation Content Area */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-border/40 text-sm">
              
              {/* MOBILE SEARCH BAR */}
              <div className="px-6 py-4">
                <form onSubmit={handleSearchSubmit} className="flex items-center bg-secondary border border-border focus-within:border-primary/50 rounded-xl overflow-hidden shadow-md">
                  <Search className="w-4.5 h-4.5 text-muted-text ml-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2 px-3 bg-transparent text-primary-text placeholder-muted-text text-xs focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="mr-1.5 px-3 py-1 bg-primary hover:bg-primary/95 text-white text-[10px] font-bold rounded-lg transition-colors"
                  >
                    Go
                  </button>
                </form>
              </div>

              {/* SECTION: Trending */}
              <div className="py-4">
                <h3 className="px-6 pb-2 text-[11px] font-bold text-muted-text uppercase tracking-wider">
                  Trending
                </h3>
                <div className="flex flex-col">
                  <Link
                    href="/products?filter=bestsellers"
                    onClick={onClose}
                    className="px-6 py-2.5 hover:bg-secondary/60 text-secondary-text hover:text-primary transition-colors font-medium"
                  >
                    Bestsellers
                  </Link>
                  <Link
                    href="/products?filter=new"
                    onClick={onClose}
                    className="px-6 py-2.5 hover:bg-secondary/60 text-secondary-text hover:text-primary transition-colors font-medium"
                  >
                    New Releases
                  </Link>
                </div>
              </div>

              {/* SECTION: Digital Content & Devices */}
              <div className="py-4">
                <h3 className="px-6 pb-2 text-[11px] font-bold text-muted-text uppercase tracking-wider">
                  Featured Collections
                </h3>
                <div className="flex flex-col">
                  <Link
                    href="/products?category=Anime+Figures"
                    onClick={onClose}
                    className="px-6 py-2.5 hover:bg-secondary/60 text-secondary-text hover:text-primary transition-colors font-medium flex justify-between items-center"
                  >
                    <span>Anime Figures</span>
                    <ChevronRight className="w-4 h-4 text-muted-text/60" />
                  </Link>
                  <Link
                    href="/products?category=Keychains"
                    onClick={onClose}
                    className="px-6 py-2.5 hover:bg-secondary/60 text-secondary-text hover:text-primary transition-colors font-medium flex justify-between items-center"
                  >
                    <span>Keychains</span>
                    <ChevronRight className="w-4 h-4 text-muted-text/60" />
                  </Link>
                  <Link
                    href="/products?category=Desk+Accessories"
                    onClick={onClose}
                    className="px-6 py-2.5 hover:bg-secondary/60 text-secondary-text hover:text-primary transition-colors font-medium flex justify-between items-center"
                  >
                    <span>Desk Accessories</span>
                    <ChevronRight className="w-4 h-4 text-muted-text/60" />
                  </Link>
                </div>
              </div>

              {/* SECTION: Shop by Category (Dynamic from DB) */}
              <div className="py-4">
                <h3 className="px-6 pb-2 text-[11px] font-bold text-muted-text uppercase tracking-wider">
                  Shop by Category
                </h3>
                <div className="flex flex-col max-h-56 overflow-y-auto">
                  {categories.map((cat: any) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${encodeURIComponent(cat.slug)}`}
                      onClick={onClose}
                      className="px-6 py-2.5 hover:bg-secondary/60 text-secondary-text hover:text-primary transition-colors font-medium flex justify-between items-center"
                    >
                      <span>{cat.name}</span>
                      <ChevronRight className="w-4 h-4 text-muted-text/60" />
                    </Link>
                  ))}
                  {categories.length === 0 && (
                    <span className="px-6 py-2 text-xs text-muted-text italic">No categories loaded.</span>
                  )}
                </div>
              </div>

              {/* SECTION: Programs & Features */}
              <div className="py-4">
                <h3 className="px-6 pb-2 text-[11px] font-bold text-muted-text uppercase tracking-wider">
                  Programs & Features
                </h3>
                <div className="flex flex-col">
                  <Link
                    href="/custom-request"
                    onClick={onClose}
                    className="px-6 py-2.5 hover:bg-secondary/60 text-secondary-text hover:text-primary transition-colors font-medium"
                  >
                    Custom Order
                  </Link>
                  <Link
                    href="#creations"
                    onClick={onClose}
                    className="px-6 py-2.5 hover:bg-secondary/60 text-secondary-text hover:text-primary transition-colors font-medium"
                  >
                    Creations
                  </Link>
                  <Link
                    href="#faq"
                    onClick={onClose}
                    className="px-6 py-2.5 hover:bg-secondary/60 text-secondary-text hover:text-primary transition-colors font-medium"
                  >
                    FAQ
                  </Link>
                </div>
              </div>

              {/* SECTION: Help & Settings */}
              <div className="py-4">
                <h3 className="px-6 pb-2 text-[11px] font-bold text-muted-text uppercase tracking-wider">
                  Help & Settings
                </h3>
                <div className="flex flex-col">
                  <Link
                    href="/account"
                    onClick={onClose}
                    className="px-6 py-2.5 hover:bg-secondary/60 text-secondary-text hover:text-primary transition-colors font-medium"
                  >
                    Your Account
                  </Link>
                  <Link
                    href="/contact"
                    onClick={onClose}
                    className="px-6 py-2.5 hover:bg-secondary/60 text-secondary-text hover:text-primary transition-colors font-medium"
                  >
                    Customer Service
                  </Link>
                  
                  {user ? (
                    <button
                      onClick={() => {
                        onClose();
                        logout();
                      }}
                      className="px-6 py-2.5 w-full text-left hover:bg-secondary/60 text-red-500 transition-colors font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <Link
                      href="/auth/login"
                      onClick={onClose}
                      className="px-6 py-2.5 hover:bg-secondary/60 text-secondary-text hover:text-primary transition-colors font-medium flex items-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </Link>
                  )}
                </div>
              </div>

            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
