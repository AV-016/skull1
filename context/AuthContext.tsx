'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/lib/types'
import { getToken, removeToken, setToken, setCookie } from '@/lib/auth'
import api from '@/lib/api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (token: string, user: User) => void
  logout: () => void
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state on mount
  useEffect(() => {
    const token = getToken()
    if (token) {
      api.get('/auth/me')
        .then((response) => {
          if (response.data?.success && response.data?.data) {
            setUser(response.data.data)
            setCookie('userRole', response.data.data.role)
          } else {
            removeToken()
            setUser(null)
          }
        })
        .catch(() => {
          removeToken()
          setUser(null)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = (token: string, userData: User) => {
    setToken(token)
    setUser(userData)
    setCookie('userRole', userData.role)
  }

  const logout = () => {
    removeToken()
    setUser(null)
    router.push('/auth/login')
  }

  const isAdmin = user?.role?.toLowerCase() === 'admin'

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !!getToken(),
    isAdmin,
    login,
    logout,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
