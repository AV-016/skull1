import { Navbar } from '@/components/layout/Navbar'
import { HeroSection } from '@/components/home/HeroSection'
import { EventBannerSection } from '@/components/home/EventBannerSection'

import { TrendingProductsSection } from '@/components/home/TrendingProductsSection'
import { ShopByCategorySection } from '@/components/home/ShopByCategorySection'
import { BestSellersSection } from '@/components/home/BestSellersSection'
import { NewArrivalsSection } from '@/components/home/NewArrivalsSection'
import { CustomOrderBannerSection } from '@/components/home/CustomOrderBannerSection'
import { CustomerCreationsSection } from '@/components/home/CustomerCreationsSection'
import { ReviewsSection } from '@/components/home/ReviewsSection'
import { FinalCTASection } from '@/components/home/FinalCTASection'
import { Footer } from '@/components/layout/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />
      <HeroSection />
      <EventBannerSection />

      <TrendingProductsSection />
      <BestSellersSection />
      <ShopByCategorySection />
      <NewArrivalsSection />
      <CustomOrderBannerSection />
      <CustomerCreationsSection />
      <ReviewsSection />
      <FinalCTASection />
      <Footer />
    </main>
  )
}

