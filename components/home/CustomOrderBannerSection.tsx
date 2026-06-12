'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react'

interface CustomCaseStudy {
  title: string
  conceptLabel: string
  conceptDesc: string
  realityLabel: string
  realityDesc: string
  conceptImage: string
  realityImage: string
}

export const CustomOrderBannerSection = () => {
  const caseStudies: CustomCaseStudy[] = [
    {
      title: 'Collectible Cosplay Helm',
      conceptLabel: 'Customer Sketch',
      conceptDesc: 'Rough digital sketch idea',
      realityLabel: 'Finished Print',
      realityDesc: 'Full carbon fiber PETG helmet',
      conceptImage: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&auto=format&fit=crop&q=80',
      realityImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80'
    },
    {
      title: 'Artisan Mech Keycap',
      conceptLabel: 'Basic 3D Mesh',
      conceptDesc: 'Simple raw geometry file',
      realityLabel: 'Polished Resin',
      realityDesc: 'Translucent glowing visors',
      conceptImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
      realityImage: 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=400&auto=format&fit=crop&q=80'
    }
  ]

  return (
    <section className="py-24 bg-secondary border-b border-border relative overflow-hidden">
      {/* Visual background accents */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Side: Editorial copywriting & CTAs */}
          <div className="lg:col-span-5 space-y-6">

            
            <h2 className="heading-2 text-primary-text leading-tight">
              You Imagine It. <br />
              <span className="text-primary">
                We Print It.
              </span>
            </h2>
            
            <p className="text-secondary-text text-base md:text-lg leading-relaxed max-w-xl">
              Can’t find exactly what you are looking for in our shop? Use our on-demand custom printing service. Whether it is a hand-drawn sketch, a digital blueprint, or a raw 3D mesh model, we optimize your file and build it in high-fidelity materials.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/custom-request"
                className="px-6 py-3.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all duration-300 shadow-lg flex items-center gap-2"
              >
                Start Custom Order
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#faq"
                className="px-6 py-3.5 border border-border text-secondary-text hover:text-primary-text hover:bg-background font-semibold rounded-xl transition-all duration-300"
              >
                How It Works
              </Link>
            </div>

            <div className="space-y-3 pt-6 border-t border-border max-w-md">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  ✓
                </div>
                <span className="text-xs text-secondary-text">Complimentary structural file checks by our engineers</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  ✓
                </div>
                <span className="text-xs text-secondary-text">Premium polymer materials (Tough Resin, Carbon Fiber, Silk)</span>
              </div>
            </div>
          </div>

          {/* Right Side: Before-After Case Studies */}
          <div className="lg:col-span-7 space-y-6">
            <div className="text-xs font-bold text-muted-text uppercase tracking-widest mb-2 block">
              Recent Case Studies: Concept to Reality
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {caseStudies.map((study) => (
                <div
                  key={study.title}
                  className="bg-card border border-border rounded-2xl p-5 hover:border-primary/20 smooth-transition shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-primary-text mb-4 tracking-wide border-b border-border pb-2">
                      {study.title}
                    </h4>

                    {/* Split View Container */}
                    <div className="grid grid-cols-2 gap-3 relative mb-4">
                      {/* Concept image */}
                      <div className="relative h-28 rounded-lg overflow-hidden border border-border bg-secondary">
                        <img
                          src={study.conceptImage}
                          alt="Concept sketch"
                          className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute top-2 left-2 bg-background/90 text-[8px] font-mono tracking-widest text-muted-text px-1.5 py-0.5 rounded border border-border uppercase">
                          Concept
                        </div>
                      </div>
                      
                      {/* Reality image */}
                      <div className="relative h-28 rounded-lg overflow-hidden border border-border bg-secondary">
                        <img
                          src={study.realityImage}
                          alt="Finished custom 3D print"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-primary text-white text-[8px] font-mono tracking-widest px-1.5 py-0.5 rounded uppercase font-semibold">
                          Reality
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Labels descriptions */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] text-muted-text">
                    <div>
                      <span className="text-secondary-text font-bold block">{study.conceptLabel}</span>
                      <span className="block truncate mt-0.5">{study.conceptDesc}</span>
                    </div>
                    <div>
                      <span className="text-primary font-bold block">{study.realityLabel}</span>
                      <span className="block truncate mt-0.5 text-primary-text">{study.realityDesc}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Minimal file upload link widget */}
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-secondary-text font-semibold text-center sm:text-left">
                Already have STL, OBJ, or STEP files? Drop them directly in our custom upload portal.
              </span>
              <Link
                href="/custom-request"
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-xs font-bold text-primary-text smooth-transition shrink-0 text-center w-full sm:w-auto"
              >
                Go To Upload Panel
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
