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

  const getIsAdmin = () => {
    if (user?.role?.toLowerCase() === 'admin') return true
    if (typeof window !== 'undefined' && user?.email) {
      const savedUsersStr = localStorage.getItem('skulture_admin_users')
      if (savedUsersStr) {
        try {
          const savedUsers = JSON.parse(savedUsersStr)
          const matchedUser = savedUsers.find((u: any) => u.email.toLowerCase() === user.email.toLowerCase())
          if (matchedUser && matchedUser.roleId !== 'customer') {
            return true
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
    return false
  }

  const isAdmin = getIsAdmin()

  useEffect(() => {
    if (user) {
      const hasAdminAccess = getIsAdmin()
      if (hasAdminAccess) {
        setCookie('userRole', 'admin')
      } else {
        setCookie('userRole', user.role || 'customer')
      }
    }
  }, [user])

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
