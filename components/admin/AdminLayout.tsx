'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/auth/login')
    }
  }, [isAdmin, isLoading, router])

  useEffect(() => {
    const root = document.documentElement
    
    // Save current classes
    const hadDark = root.classList.contains('dark')
    const hadLight = root.classList.contains('light')
    
    // Save current style values
    const prevStyles = {
      background: root.style.getPropertyValue('--background'),
      foreground: root.style.getPropertyValue('--foreground'),
      card: root.style.getPropertyValue('--card'),
      popover: root.style.getPropertyValue('--popover'),
      secondary: root.style.getPropertyValue('--secondary'),
      border: root.style.getPropertyValue('--border'),
      textPrimary: root.style.getPropertyValue('--text-primary'),
      textSecondary: root.style.getPropertyValue('--text-secondary'),
      textMuted: root.style.getPropertyValue('--text-muted'),
      matAccent: root.style.getPropertyValue('--mat-accent'),
      gridLine: root.style.getPropertyValue('--grid-line'),
      borderDefault: root.style.getPropertyValue('--border-default'),
      borderHover: root.style.getPropertyValue('--border-hover'),
    }

    // Apply dark theme globally while in admin panel
    root.classList.add('dark')
    root.classList.remove('light')
    root.style.setProperty('--background', '#1C1F22')
    root.style.setProperty('--foreground', '#FFFFFF')
    root.style.setProperty('--card', '#23272B')
    root.style.setProperty('--popover', '#23272B')
    root.style.setProperty('--secondary', '#15181A')
    root.style.setProperty('--border', 'rgba(250, 245, 215, 0.12)')
    root.style.setProperty('--text-primary', '#FFFFFF')
    root.style.setProperty('--text-secondary', '#CFCFCF')
    root.style.setProperty('--text-muted', '#9CA3AF')
    root.style.setProperty('--mat-accent', 'rgba(250, 245, 215, 0.1)')
    root.style.setProperty('--grid-line', 'rgba(250, 245, 215, 0.045)')
    root.style.setProperty('--border-default', 'rgba(250, 245, 215, 0.12)')
    root.style.setProperty('--border-hover', 'rgba(250, 245, 215, 0.22)')

    return () => {
      // Restore on unmount
      if (hadDark) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else if (hadLight) {
        root.classList.add('light')
        root.classList.remove('dark')
      } else {
        root.classList.remove('dark', 'light')
      }
      
      const nameMapping: Record<string, string> = {
        background: '--background',
        foreground: '--foreground',
        card: '--card',
        popover: '--popover',
        secondary: '--secondary',
        border: '--border',
        textPrimary: '--text-primary',
        textSecondary: '--text-secondary',
        textMuted: '--text-muted',
        matAccent: '--mat-accent',
        gridLine: '--grid-line',
        borderDefault: '--border-default',
        borderHover: '--border-hover',
      }
      
      Object.entries(prevStyles).forEach(([key, val]) => {
        const cssKey = nameMapping[key]
        if (cssKey) {
          if (val) {
            root.style.setProperty(cssKey, val)
          } else {
            root.style.removeProperty(cssKey)
          }
        }
      })
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="dark bg-background min-h-screen text-foreground">
      <AdminSidebar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="ml-64 p-8"
      >
        {children}
      </motion.main>
    </div>
  )
}
