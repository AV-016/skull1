'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { Product, Category, Order } from '@/lib/types'

// 1. Dashboard Metrics Hook
export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get<{ data: any }>('/admin/dashboard')
      return response.data.data
    },
    staleTime: 60 * 1000, // 1 minute stale time
  })
}

// 2. Product Management Hooks
export const useAdminProducts = () => {
  return useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      // Fetch products list from the public product list but with all items
      const response = await api.get<{ data: Product[] }>('/products')
      return response.data.data || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (productData: any) => {
      const response = await api.post<{ data: Product }>('/admin/products', productData)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch<{ data: Product }>(`/admin/products/${id}`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', 'detail', data.slug] })
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/products/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

// 3. Category Management Hooks
export const useAdminCategories = () => {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const response = await api.get<{ data: Category[] }>('/categories')
      return response.data.data || []
    },
    staleTime: 10 * 60 * 1000,
  })
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (categoryData: any) => {
      const response = await api.post<{ data: Category }>('/admin/categories', categoryData)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.patch<{ data: Category }>(`/admin/categories/${id}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/categories/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

// 4. Order Management Hooks
export const useAdminOrders = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: ['admin', 'orders', filters],
    queryFn: async () => {
      const response = await api.get<{ data: Order[] }>('/admin/orders', { params: filters })
      return {
        orders: response.data.data || [],
        meta: (response.data as any).meta || { total: 0, page: 1, limit: 10, totalPages: 1 }
      }
    },
    staleTime: 30 * 1000,
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const response = await api.patch<{ data: Order }>(`/admin/orders/${id}/status`, { status, notes })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', data.id] })
    },
  })
}

// 5. Inquiry Management Hooks
export interface Inquiry {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'PENDING' | 'RESPONDED' | 'RESOLVED'
  createdAt: string
  updatedAt: string
}

export const useAdminInquiries = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['admin', 'inquiries', page, limit],
    queryFn: async () => {
      const response = await api.get<{ data: Inquiry[] }>('/admin/inquiries', {
        params: { page, limit },
      })
      return response.data.data || []
    },
    staleTime: 60 * 1000,
  })
}

export const useUpdateInquiryStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch<{ data: Inquiry }>(`/admin/inquiries/${id}`, { status })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inquiries'] })
    },
  })
}

// 6. Loyalty Stamps Hooks
export const useAdminPendingLoyalty = () => {
  return useQuery({
    queryKey: ['admin', 'loyalty', 'pending'],
    queryFn: async () => {
      const response = await api.get<{ data: any[] }>('/admin/loyalty/pending')
      return response.data.data || []
    },
    staleTime: 10 * 1000,
  })
}

export const useApproveLoyaltyDiscount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, discountValue }: { userId: string; discountValue: number }) => {
      const response = await api.post<{ data: any }>('/admin/loyalty/approve', { userId, discountValue })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'loyalty', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'stats'] })
    },
  })
}

export const useAdminMonitoringStats = () => {
  return useQuery({
    queryKey: ['admin', 'monitoring', 'stats'],
    queryFn: async () => {
      const response = await api.get<{ data: any }>('/admin/monitoring/stats')
      return response.data.data
    },
    refetchInterval: 30 * 1000, // Poll every 30 seconds for real-time monitoring
  })
}

export const useAdminActivityLogs = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['admin', 'activity-logs', page, limit],
    queryFn: async () => {
      const response = await api.get<{ data: any }>('/admin/activity-logs', {
        params: { page, limit },
      })
      return response.data.data
    },
    refetchInterval: 10 * 1000, // Poll every 10 seconds for real-time new activity notifications
    staleTime: 5 * 1000,
  })
}

