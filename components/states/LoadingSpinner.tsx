'use client'

import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  text?: string
  fullPage?: boolean
}

export function LoadingSpinner({ text = 'Loading...', fullPage = true }: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-2 border-border border-t-primary rounded-full"
      />
      {text && <p className="text-muted">{text}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        {content}
      </div>
    )
  }

  return <div className="flex items-center justify-center py-12">{content}</div>
}
