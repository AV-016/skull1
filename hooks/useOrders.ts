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
