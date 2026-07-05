'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Product } from '@/lib/types'
import { queryKeys } from '@/lib/queryKeys'
import { ENDPOINTS } from '@/lib/constants'

export const useProducts = (filters?: Record<string, any>) => {
  return useQuery({
    queryKey: queryKeys.productList(filters),
    queryFn: async () => {
      const response = await api.get<{ data: Product[] }>(ENDPOINTS.PRODUCTS, {
        params: filters,
      })
      return response.data.data || []
    },
  })
}

export const useProductDetail = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.productDetail(slug),
    queryFn: async () => {
      const response = await api.get<{ data: Product }>(ENDPOINTS.PRODUCT_DETAIL(slug))
      return response.data.data
    },
    enabled: !!slug,
  })
}

export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: async () => {
      const response = await api.get<any>(ENDPOINTS.CATEGORIES)
      return response.data.data || []
    },
  })
}

export const useSearch = (query: string) => {
  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: async () => {
      const response = await api.get<{ data: Product[] }>(ENDPOINTS.PRODUCTS, {
        params: { search: query },
      })
      return response.data.data || []
    },
    enabled: !!query && query.length > 2,
  })
}

export const useTags = () => {
  return useQuery({
    queryKey: queryKeys.tags(),
    queryFn: async () => {
      const response = await api.get<any>('/tags')
      return response.data.data || []
    },
  })
}
