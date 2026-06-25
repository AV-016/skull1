'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, ShieldCheck, Check, Upload, HelpCircle } from 'lucide-react'

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
      title: 'Cosplay Helmet',
      conceptLabel: 'Your idea',
      conceptDesc: 'Rough digital sketch idea',
      realityLabel: 'Final print',
      realityDesc: 'Full carbon fiber PETG helmet',
      conceptImage: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=400&auto=format&fit=crop&q=80',
      realityImage: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80'
    },
    {
      title: 'Custom Keycap',
      conceptLabel: 'Your idea',
      conceptDesc: 'Simple raw geometry file',
      realityLabel: 'Final print',
      realityDesc: 'Translucent glowing visors',
      conceptImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
      realityImage: 'https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=400&auto=format&fit=crop&q=80'
    }
  ]

  return (
    <section className="py-24 bg-[#111315] border-b border-white/5 relative overflow-hidden text-white">
      {/* Visual background glow accents */}
      <div className="absolute top-1/3 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-[#E53935]/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Side: Editorial copy & CTAs */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none uppercase">
                You dream it. <br />
                <span className="text-[#E53935]">
                  We print it.
                </span>
              </h2>
              
              <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-lg">
                Tell us what you want—a sketch, an idea, or even a photo. We'll turn it into a real, high-quality 3D print.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/custom-request"
                className="px-6 py-3.5 bg-[#E53935] hover:bg-[#E53935]/95 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#E53935]/15 hover:shadow-[#E53935]/25 flex items-center gap-2 text-xs uppercase tracking-wider"
              >
                Start Your Order
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="#faq"
                className="px-6 py-3.5 border border-white/10 hover:border-white/20 text-white hover:bg-white/5 font-bold rounded-xl transition-all duration-300 text-xs uppercase tracking-wider"
              >
                How It Works
              </Link>
            </div>

            <div className="space-y-3.5 pt-8 border-t border-white/5 max-w-md">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-gray-300">Checked by our experts</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-gray-300">Strong, high-quality materials</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-gray-300">Carefully packed & shipped</span>
              </div>
            </div>
          </div>

          {/* Right Side: Before-After Case Studies */}
          <div className="lg:col-span-7 space-y-6">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
              See what we can make for you
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {caseStudies.map((study) => (
                <div
                  key={study.title}
                  className="bg-[#181a1d] border border-white/5 hover:border-white/10 rounded-2xl p-5 smooth-transition shadow-2xl flex flex-col justify-between backdrop-blur-md bg-opacity-70 group"
                >
                  <div>
                    <h4 className="text-xs font-black text-white mb-4 tracking-wider uppercase border-b border-white/5 pb-2.5">
                      {study.title}
                    </h4>

                    {/* Split View Container */}
                    <div className="grid grid-cols-2 gap-3 relative mb-4">
                      {/* Concept image */}
                      <div className="relative h-28 rounded-lg overflow-hidden border border-white/5 bg-black/40">
                        <img
                          src={study.conceptImage}
                          alt="Concept sketch"
                          className="w-full h-full object-cover opacity-45 group-hover:scale-102 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 bg-[#111315]/90 text-[8px] font-mono tracking-widest text-gray-400 px-1.5 py-0.5 rounded border border-white/5 uppercase">
                          Your idea
                        </div>
                      </div>
                      
                      {/* Reality image */}
                      <div className="relative h-28 rounded-lg overflow-hidden border border-white/5 bg-black/40">
                        <img
                          src={study.realityImage}
                          alt="Finished custom 3D print"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 bg-[#E53935] text-white text-[8px] font-mono tracking-widest px-1.5 py-0.5 rounded uppercase font-semibold shadow-md">
                          Final print
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Labels descriptions */}
                  <div className="grid grid-cols-2 gap-3 text-[10px] text-gray-400">
                    <div>
                      <span className="text-gray-300 font-bold block">{study.conceptLabel}</span>
                      <span className="block truncate mt-0.5 text-gray-500">{study.conceptDesc}</span>
                    </div>
                    <div>
                      <span className="text-[#E53935] font-bold block">{study.realityLabel}</span>
                      <span className="block truncate mt-0.5 text-white font-medium">{study.realityDesc}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bottom Upload Banner */}
            <div className="bg-[#181a1d] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-2xl backdrop-blur-md bg-opacity-70">
              <div className="flex gap-4 items-start text-left">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 shrink-0 mt-0.5">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Already have a file?</h4>
                  <p className="text-xs text-gray-400">Upload it here and we'll take care of the rest.</p>
                  <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Supports STL, OBJ, STEP and more.</p>
                </div>
              </div>
              
              <Link
                href="/custom-request"
                className="px-5 py-3 bg-[#E53935] hover:bg-[#E53935]/95 rounded-xl text-xs font-bold text-white uppercase tracking-wider smooth-transition shrink-0 text-center w-full sm:w-auto shadow-lg shadow-[#E53935]/10"
              >
                Upload File
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

