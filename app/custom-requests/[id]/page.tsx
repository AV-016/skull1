'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CustomRequestStatusTimeline } from '@/components/custom-requests/CustomRequestStatusTimeline'
import { QuotationCard } from '@/components/custom-requests/QuotationCard'
import { formatDate } from '@/lib/utils'
import { CustomRequestStatus, Quotation } from '@/lib/types'

// Mock data
const mockRequest = {
  id: '1',
  title: 'Custom Bracket Design',
  description: 'Need a precision aluminum bracket with specific tolerances for mechanical assembly.',
  status: 'QUOTED' as CustomRequestStatus,
  files: ['bracket_design.stl', 'specifications.pdf'],
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  quotation: {
    id: '1',
    amount: 5000,
    validityDate: new Date(Date.now() + 604800000).toISOString(), // 7 days
    specifications: 'Material: Aluminum 6061-T6\nDimensions: 150x100x50mm\nTolerance: ±0.5mm\nFinish: Anodized',
    timeline: '5-7 business days',
    status: 'PENDING' as any,
  } as Quotation,
}

export default function CustomRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const request = mockRequest // TODO: Replace with actual API data

  return (
    <main className="min-h-screen bg-background text-primary-text transition-colors duration-300">
      <Navbar />

      {/* Breadcrumb */}
      <div className="pt-32 pb-6 border-b border-border">
        <div className="container mx-auto px-4 md:px-6">
          <Link href="/custom-requests" className="text-secondary-text hover:text-primary text-sm smooth-transition">
            ← Back to Requests
          </Link>
        </div>
      </div>

      {/* Detail Section */}
      <div className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Left Column - Request Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <h1 className="heading-2 text-primary-text mb-2">{request.title}</h1>
                <p className="text-secondary-text">
                  Submitted on {formatDate(request.createdAt)}
                </p>
              </div>

              {/* Description */}
              <div>
                <h2 className="heading-3 text-lg text-primary-text mb-3">Project Description</h2>
                <p className="text-secondary-text leading-relaxed">{request.description}</p>
              </div>

              {/* Files */}
              <div>
                <h2 className="heading-3 text-lg text-primary-text mb-3">Uploaded Files</h2>
                <div className="space-y-2">
                  {request.files.map((file) => (
                    <div
                      key={file}
                      className="p-3 bg-secondary border border-border rounded-lg flex items-center"
                    >
                      <span className="w-8 h-8 bg-card border border-border rounded flex items-center justify-center mr-3">
                        📄
                      </span>
                      <span className="text-primary-text text-sm">{file}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Timeline */}
              <div className="pt-4 border-t border-border">
                <CustomRequestStatusTimeline currentStatus={request.status} />
              </div>
            </div>

            {/* Right Column - Quotation (PROMINENT) */}
            <div className="lg:col-span-1">
              <motion.div
                className="sticky top-32"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <QuotationCard
                  quotation={request.quotation}
                  onAccept={() => console.log('Accept')}
                  onReject={() => console.log('Reject')}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
