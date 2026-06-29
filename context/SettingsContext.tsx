'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type AppearanceMode = 'dark' | 'light' | 'system'
export type ColorAccent = 'teal' | 'red' | 'blue' | 'purple'
export type CurrencyMode = 'INR' | 'USD'

interface SettingsContextType {
  appearance: AppearanceMode
  accent: ColorAccent
  reducedMotion: boolean
  compactLayout: boolean
  currency: CurrencyMode
  setAppearance: (mode: AppearanceMode) => void
  setAccent: (accent: ColorAccent) => void
  setReducedMotion: (active: boolean) => void
  setCompactLayout: (active: boolean) => void
  setCurrency: (currency: CurrencyMode) => void
  formatPrice: (priceInINR: number) => string
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const ACCENT_COLORS = {
  teal: {
    primary: '#14B8A6',
    primaryHover: '#2DD4BF',
  },
  red: {
    primary: '#DC2626',
    primaryHover: '#EF4444',
  },
  blue: {
    primary: '#3B82F6',
    primaryHover: '#60A5FA',
  },
  purple: {
    primary: '#8B5CF6',
    primaryHover: '#A78BFA',
  },
}

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [appearance, setAppearance] = useState<AppearanceMode>('dark')
  const [accent, setAccent] = useState<ColorAccent>('red')
  const [reducedMotion, setReducedMotion] = useState<boolean>(false)
  const [compactLayout, setCompactLayout] = useState<boolean>(false)
  const [currency, setCurrency] = useState<CurrencyMode>('INR')

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAppearance = localStorage.getItem('pref-appearance') as AppearanceMode
      const storedAccent = localStorage.getItem('pref-accent') as ColorAccent
      const storedMotion = localStorage.getItem('pref-motion') === 'true'
      const storedCompact = localStorage.getItem('pref-compact') === 'true'
      const storedCurrency = localStorage.getItem('pref-currency') as CurrencyMode

      if (storedAppearance) setAppearance(storedAppearance)
      if (storedAccent) setAccent(storedAccent)
      setReducedMotion(storedMotion)
      setCompactLayout(storedCompact)
      if (storedCurrency) setCurrency(storedCurrency)
    }
  }, [])

  // Apply changes to DOM
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Appearance
    const root = document.documentElement
    const applyMode = (mode: 'dark' | 'light') => {
      if (mode === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
        root.style.setProperty('--background', '#1C1F22') // Architect cutting mat dark slate
        root.style.setProperty('--foreground', '#FFFFFF')
        root.style.setProperty('--card', '#23272B')
        root.style.setProperty('--popover', '#23272B')
        root.style.setProperty('--secondary', '#15181A')
        root.style.setProperty('--border', 'rgba(250, 245, 215, 0.12)') // Faint pale yellow border
        root.style.setProperty('--text-primary', '#FFFFFF')
        root.style.setProperty('--text-secondary', '#CFCFCF')
        root.style.setProperty('--text-muted', '#9CA3AF')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
        root.style.setProperty('--background', '#FAF9F6') // Ivory sketch board paper
        root.style.setProperty('--foreground', '#1E2022') // Graphite charcoal
        root.style.setProperty('--card', '#FFFFFF')
        root.style.setProperty('--popover', '#FFFFFF')
        root.style.setProperty('--secondary', '#F0EEE9') // Warm draft sheet
        root.style.setProperty('--border', 'rgba(0, 0, 0, 0.12)') // Defined technical pen line
        root.style.setProperty('--text-primary', '#1E2022')
        root.style.setProperty('--text-secondary', '#53565A')
        root.style.setProperty('--text-muted', '#808285')
      }
    }

    if (appearance === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      applyMode(systemDark ? 'dark' : 'light')
    } else {
      applyMode(appearance as 'dark' | 'light')
    }

    localStorage.setItem('pref-appearance', appearance)
  }, [appearance])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Accent Colors
    const root = document.documentElement
    const colors = ACCENT_COLORS[accent]
    
    root.style.setProperty('--primary', colors.primary)
    root.style.setProperty('--ring', colors.primary)
    root.style.setProperty('--sidebar-primary', colors.primary)
    root.style.setProperty('--chart-1', colors.primary)
    root.style.setProperty('--chart-2', colors.primaryHover)
    root.style.setProperty('--accent', colors.primary)
    
    localStorage.setItem('pref-accent', accent)
  }, [accent])

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Accessibility classes on body
    const body = document.body
    if (reducedMotion) {
      body.classList.add('reduced-motion')
    } else {
      body.classList.remove('reduced-motion')
    }
    localStorage.setItem('pref-motion', String(reducedMotion))
  }, [reducedMotion])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const body = document.body
    if (compactLayout) {
      body.classList.add('compact-layout')
    } else {
      body.classList.remove('compact-layout')
    }
    localStorage.setItem('pref-compact', String(compactLayout))
  }, [compactLayout])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('pref-currency', currency)
  }, [currency])

  // Price conversion helper: $1 USD = ₹80 INR
  const formatPrice = (priceInINR: number): string => {
    if (currency === 'INR') {
      return `₹${Math.round(priceInINR).toLocaleString('en-IN')}`
    } else {
      const priceInUSD = Math.round(priceInINR / 80)
      return `$${priceInUSD.toLocaleString('en-US')}`
    }
  }

  return (
    <SettingsContext.Provider
      value={{
        appearance,
        accent,
        reducedMotion,
        compactLayout,
        currency,
        setAppearance,
        setAccent,
        setReducedMotion,
        setCompactLayout,
        setCurrency,
        formatPrice,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
