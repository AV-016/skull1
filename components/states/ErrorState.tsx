'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  fullPage?: boolean
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again or contact support if the problem persists.',
  onRetry,
  fullPage = true,
}: ErrorStateProps) {
  const content = (
    <div className="text-center space-y-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex justify-center"
      >
        <AlertTriangle className="w-12 h-12 text-destructive" />
      </motion.div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted text-sm max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} className="mt-4">
          Try Again
        </Button>
      )}
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
