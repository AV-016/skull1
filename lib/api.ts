import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add authorization token and dynamic baseURL for local/mobile network testing
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      config.baseURL = '/api'
      
      const token = localStorage.getItem('authToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

import { mockProducts } from './mockProducts'

const mockCategories = [
  { id: 'cat_1', name: 'Anime Figures', slug: 'anime-figures', description: 'High-detail tabletop figures and models' },
  { id: 'cat_2', name: 'Desk Accessories', slug: 'desk-accessories', description: 'Useful tools, brackets, and household objects' },
  { id: 'cat_3', name: 'Custom Designs', slug: 'custom-designs', description: 'Artistic designs and beautiful display pieces' },
  { id: 'cat_4', name: 'Miniatures', slug: 'miniatures', description: 'High-detail tabletop figures and models' },
  { id: 'cat_5', name: 'Home Decor', slug: 'home-decor', description: 'Artistic designs and beautiful display pieces' },
  { id: 'cat_6', name: 'Keychains', slug: 'keychains', description: 'Real working planetary gears on your key ring' },
]

// Response interceptor - Handle errors & cache serving
api.interceptors.response.use(
  (response) => {
    // Cache successful GET requests for products and categories
    const config = response.config
    if (config && config.method === 'get' && typeof window !== 'undefined') {
      const url = config.url || ''
      if (
        url === '/products' ||
        url === '/products/featured' ||
        url === '/categories' ||
        url.includes('/products/slug/')
      ) {
        try {
          localStorage.setItem(`api-cache:${url}`, JSON.stringify(response.data))
        } catch (e) {
          console.warn('Error saving API response to localStorage cache:', e)
        }
      }
    }
    return response
  },
  (error: AxiosError) => {
    const config = error.config

    // If backend is not connected (network error or server error), attempt to serve from cache
    if (config && config.method === 'get' && typeof window !== 'undefined') {
      const url = config.url || ''
      if (
        url === '/products' ||
        url === '/products/featured' ||
        url === '/categories' ||
        url.includes('/products/slug/')
      ) {
        const cached = localStorage.getItem(`api-cache:${url}`)
        if (cached) {
          try {
            const cachedData = JSON.parse(cached)
            console.log(`[API Cache] Serving cached data for ${url}`)
            return Promise.resolve({
              data: cachedData,
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
            } as any)
          } catch (e) {
            console.warn(`Error parsing cached data for ${url}:`, e)
          }
        }

        // If no cache exists, construct a mock response from local mock data
        console.log(`[API Cache] No cache for ${url}, constructing mock fallback response`)
        let fallbackData: any = null
        if (url === '/products') {
          fallbackData = { success: true, data: mockProducts }
        } else if (url === '/products/featured') {
          fallbackData = { success: true, data: mockProducts.filter(p => p.featured) }
        } else if (url === '/categories') {
          fallbackData = { success: true, data: mockCategories }
        } else if (url.includes('/products/slug/')) {
          const slug = url.split('/').pop() || ''
          const product = mockProducts.find(p => p.slug === slug)
          fallbackData = { success: true, data: product || mockProducts[0] }
        }

        if (fallbackData) {
          return Promise.resolve({
            data: fallbackData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as any)
        }
      }
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
        if (window.location.pathname !== '/auth/login') {
          window.location.href = '/auth/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
export { api }

