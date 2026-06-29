import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { Order } from '@/lib/types'

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: queryKeys.orders(),
    queryFn: async () => {
      const response = await api.get('/orders')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useOrderDetail(orderId: string) {
  return useQuery<Order>({
    queryKey: queryKeys.orderDetail(orderId),
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`)
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!orderId,
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await api.post(`/orders/${orderId}/cancel`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders() })
    },
  })
}

export function useReturnOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, reason, image, upiId }: { orderId: string; reason: string; image: string; upiId?: string }) => {
      const response = await api.post(`/orders/${orderId}/return`, { reason, image, upiId })
      return response.data.data
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders() })
      queryClient.invalidateQueries({ queryKey: queryKeys.orderDetail(orderId) })
    },
  })
}

export function useSubmitReturnTracking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, carrier, trackingId, trackingUrl }: { orderId: string; carrier: string; trackingId: string; trackingUrl?: string }) => {
      const response = await api.post(`/orders/${orderId}/return-tracking`, { carrier, trackingId, trackingUrl })
      return response.data.data
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders() })
      queryClient.invalidateQueries({ queryKey: queryKeys.orderDetail(orderId) })
    },
  })
}
