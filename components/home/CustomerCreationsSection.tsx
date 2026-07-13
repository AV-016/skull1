'use client'

import { motion } from 'framer-motion'
import { Sparkles, BadgeCheck } from 'lucide-react'

interface CreationProject {
  id: string
  title: string
  creator: string
  material: string
  precision: string
  conceptImg: string
  realityImg: string
  description: string
}

export const CustomerCreationsSection = () => {
  const projects: CreationProject[] = [
    {
      id: 'proj_1',
      title: 'Cosplay Oni Helmet',
      creator: 'Vikram S.',
      material: 'PETG Carbon Fiber',
      precision: '0.15mm',
      conceptImg: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=500&auto=format&fit=crop&q=80', // blue cyber aesthetic
      realityImg: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80', // Oni figure/helmet equivalent
      description: 'Cosplay helmet with integrated LED channels. Printed in carbon fiber PETG for maximum durability.'
    },
    {
      id: 'proj_2',
      title: 'Parametric Planter Set',
      creator: 'Ananya R.',
      material: 'Matte Terra PLA',
      precision: '0.20mm',
      conceptImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80', // geometric wave
      realityImg: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=500&auto=format&fit=crop&q=80', // organic vase
      description: 'Custom self-watering planters designed parametrically to allow natural soil aeration.'
    },
    {
      id: 'proj_3',
      title: 'Planetary Gear Reducer',
      creator: 'Devtech Labs',
      material: 'Industrial PA12 Nylon',
      precision: '0.05mm',
      conceptImg: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80', // gear CAD mock
      realityImg: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=500&auto=format&fit=crop&q=80', // final gears
      description: 'Functional 5:1 planetary gear speed reducer for custom robotics drive system assembly.'
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' as const }
    }
  }

  return (
    <section id="creations" className="py-24 bg-background bg-drafting-grid border-b border-border relative">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">

          <h2 className="heading-2 text-primary-text mb-4">Customer Creations</h2>
          <p className="text-secondary-text text-lg">
            See how custom ideas go from CAD models to high-grade physical components.
          </p>
        </div>

        {/* Gallery Grid */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {projects.map((project) => (
            <motion.div
              key={project.id}
              variants={cardVariants}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Visual before/after container */}
                <div className="grid grid-cols-2 gap-3 mb-6 relative">
                  
                  {/* Left Column: Concept */}
                  <div className="relative h-44 rounded-lg overflow-hidden border border-border bg-secondary">
                    <img
                      src={project.conceptImg}
                      alt="Concept illustration"
                      className="w-full h-full object-cover opacity-60 group-hover:scale-102 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-background/80 border border-border px-2 py-0.5 rounded text-[9px] font-mono tracking-wider text-muted-text uppercase">
                      CONCEPT
                    </div>
                  </div>

                  {/* Right Column: Reality */}
                  <div className="relative h-44 rounded-lg overflow-hidden border border-border bg-secondary">
                    <img
                      src={project.realityImg}
                      alt="Finished 3D Print"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-primary/90 px-2 py-0.5 rounded text-[9px] font-mono tracking-wider text-white uppercase flex items-center gap-1 font-semibold">
                      <BadgeCheck className="w-3 h-3" />
                      PRINTED
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <h3 className="text-lg font-bold text-primary-text mb-2 group-hover:text-primary transition-colors duration-300">
                  {project.title}
                </h3>
                <p className="text-secondary-text text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
              </div>

              {/* Specifications Footer */}
              <div className="border-t border-border pt-4 mt-2 flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-text">Designed by:</span>
                  <span className="text-primary-text font-medium">{project.creator}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-text">Material:</span>
                  <span className="text-primary-text font-medium">{project.material}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-text">Resolution:</span>
                  <span className="text-primary-text font-medium">{project.precision}</span>
                </div>
              </div>

            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
