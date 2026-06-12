'use client'

import { InboxIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface EmptyStateProps {
  title?: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  fullPage?: boolean
}

export function EmptyState({
  title = 'No items found',
  message = 'It looks like there is nothing here yet.',
  action,
  fullPage = true,
}: EmptyStateProps) {
  const content = (
    <div className="text-center space-y-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex justify-center"
      >
        <InboxIcon className="w-12 h-12 text-muted" />
      </motion.div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted text-sm max-w-md">{message}</p>
      </div>
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
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
