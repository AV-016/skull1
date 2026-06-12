'use client'

import { motion } from 'framer-motion'
import { Quotation } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle2, Clock } from 'lucide-react'

interface QuotationCardProps {
  quotation: Quotation | undefined
  isLoading?: boolean
  onAccept?: () => void
  onReject?: () => void
}

export const QuotationCard = ({
  quotation,
  isLoading = false,
  onAccept,
  onReject,
}: QuotationCardProps) => {
  if (isLoading) {
    return (
      <motion.div
        className="p-8 bg-gradient-to-br from-card to-secondary border border-border rounded-xl space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="h-8 bg-secondary rounded animate-pulse w-1/3" />
        <div className="h-12 bg-secondary rounded animate-pulse w-1/2" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-4 bg-secondary rounded animate-pulse" />
          ))}
        </div>
      </motion.div>
    )
  }

  if (!quotation) {
    return (
      <motion.div
        className="p-8 bg-card border border-border rounded-xl text-center shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-secondary-text text-sm">Quotation pending. We&apos;ll review your files and provide a quote soon.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="p-8 bg-gradient-to-br from-card to-secondary border-2 border-border rounded-xl space-y-8 relative overflow-hidden shadow-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-transparent" />

      <div>
        <p className="text-secondary-text text-xs font-bold uppercase tracking-wider mb-2">Your Quotation</p>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl md:text-6xl font-extrabold text-primary-text tracking-tight">
            {formatCurrency(quotation.amount)}
          </span>
          <span className="text-secondary-text text-sm font-medium">for your project</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Validity */}
        <div className="p-4 bg-secondary/50 border border-border rounded-xl">
          <p className="text-secondary-text text-xs font-semibold mb-1">Valid Until</p>
          <p className="text-primary-text font-bold">
            {formatDate(quotation.validityDate)}
          </p>
        </div>

        {/* Timeline */}
        <div className="p-4 bg-secondary/50 border border-border rounded-xl flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary" />
          <div>
            <p className="text-secondary-text text-xs font-semibold">Timeline</p>
            <p className="text-primary-text font-bold">{quotation.timeline}</p>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {quotation.specifications && (
        <div className="p-4 bg-secondary/50 border border-border rounded-xl">
          <p className="text-secondary-text text-xs font-semibold mb-2">Specifications</p>
          <p className="text-primary-text whitespace-pre-wrap text-sm leading-relaxed">
            {quotation.specifications}
          </p>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <p className="text-green-500 text-sm font-semibold">
          {quotation.status === 'ACCEPTED' ? 'Accepted' : 'Ready for your decision'}
        </p>
      </div>

      {/* Action Buttons */}
      {quotation.status === 'PENDING' && (
        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-border">
          <button
            onClick={onAccept}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 smooth-transition cursor-pointer text-xs uppercase tracking-wider"
          >
            Accept Quote
          </button>
          <button
            onClick={onReject}
            className="px-6 py-3 border border-border text-primary-text font-semibold rounded-xl hover:bg-secondary smooth-transition cursor-pointer text-xs uppercase tracking-wider"
          >
            Reject
          </button>
        </div>
      )}
    </motion.div>
  )
}
