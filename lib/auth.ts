// Token management helpers
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('authToken')
}

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('authToken', token)
  
  // Set cookie for Next.js middleware (only Secure on HTTPS)
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()
  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `sk_token=${token}; path=/; expires=${expires}; SameSite=Lax${secureFlag}`
  document.cookie = `authToken=${token}; path=/; expires=${expires}; SameSite=Lax${secureFlag}`
}

export const removeToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('authToken')
  
  // Clear cookies for Next.js middleware
  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `sk_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`
  document.cookie = `sk_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`
  document.cookie = `authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`
  document.cookie = `userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`
}

export const setCookie = (name: string, value: string): void => {
  if (typeof window === 'undefined') return
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()
  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Lax${secureFlag}`
  
  // If userRole is set, also set sk_role
  if (name === 'userRole') {
    document.cookie = `sk_role=${value}; path=/; expires=${expires}; SameSite=Lax${secureFlag}`
  }
}

export const removeCookie = (name: string): void => {
  if (typeof window === 'undefined') return
  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`
  
  if (name === 'userRole') {
    document.cookie = `sk_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secureFlag}`
  }
}

export const isAuthenticated = (): boolean => {
  return !!getToken()
}

// Decode JWT (basic - doesn't verify signature)
export const decodeToken = (token: string): Record<string, any> | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const decoded = JSON.parse(atob(parts[1]))
    return decoded
  } catch (error) {
    return null
  }
}

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return true
  
  return Date.now() >= decoded.exp * 1000
}
