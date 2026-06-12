'use client'

import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminOrders, useUpdateOrderStatus } from '@/hooks/useAdmin'
import { Eye, Loader2, AlertTriangle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function AdminOrders() {
  const { data: orders, isLoading, error, refetch } = useAdminOrders()
  const updateStatusMutation = useUpdateOrderStatus()

  // Compute metrics dynamically from the fetched orders
  const totalOrders = orders?.length || 0
  const pendingCount = orders?.filter((o: any) => o.status === 'PENDING').length || 0
  const processingCount = orders?.filter((o: any) => o.status === 'PROCESSING').length || 0
  const deliveredCount = orders?.filter((o: any) => o.status === 'DELIVERED').length || 0

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate(
      { id, status, notes: `Status updated by Admin to ${status}` },
      {
        onSuccess: () => refetch()
      }
    )
  }

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-green-500/5 text-green-400 border-green-500/20'
      case 'SHIPPED':
        return 'bg-blue-500/5 text-blue-400 border-blue-500/20'
      case 'PROCESSING':
        return 'bg-purple-500/5 text-purple-400 border-purple-500/20'
      case 'PENDING':
        return 'bg-orange-500/5 text-orange-400 border-orange-500/20'
      case 'CANCELLED':
        return 'bg-red-500/5 text-red-400 border-red-500/20'
      default:
        return 'bg-secondary text-secondary-text border-border'
    }
  }

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="heading-2 uppercase tracking-wide">Orders</h1>
          <p className="text-xs text-muted-text uppercase tracking-widest">Track and manage customer orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Orders', value: totalOrders, color: 'border-blue-500/10 bg-blue-500/5' },
            { label: 'Pending', value: pendingCount, color: 'border-orange-500/10 bg-orange-500/5' },
            { label: 'Processing', value: processingCount, color: 'border-purple-500/10 bg-purple-500/5' },
            { label: 'Delivered', value: deliveredCount, color: 'border-green-500/10 bg-green-500/5' },
          ].map((stat) => (
            <div key={stat.label} className={`glass-card p-6 border smooth-transition ${stat.color}`}>
              <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-2xl font-extrabold text-primary-text">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="p-6 border border-red-500/20 bg-red-500/5 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-red-500 text-sm">Failed to Load Orders</h4>
              <p className="text-xs text-muted-text">Verify connection to your backend server and database.</p>
            </div>
          </div>
        ) : (
          <div className="glass-card overflow-x-auto border border-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/40 text-[10px] font-bold text-muted-text uppercase tracking-widest">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer Email</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {orders?.map((order: any) => (
                  <tr key={order.id} className="hover:bg-secondary/25 smooth-transition">
                    <td className="px-6 py-4 font-bold text-primary-text">
                      #{order.orderNumber || order.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 font-medium text-secondary-text">
                      {order.user?.email || 'Guest User'}
                    </td>
                    <td className="px-6 py-4 text-muted-text">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 font-bold text-primary-text">
                      {formatCurrency(order.totalAmount || order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updateStatusMutation.isPending}
                        className={`px-3 py-1.5 border rounded uppercase font-bold tracking-wide text-[10px] cursor-pointer smooth-transition focus:outline-none ${getStatusStyle(order.status)}`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => window.location.href = `/orders/${order.id}`}
                        className="p-2 border border-border hover:border-primary/50 text-secondary-text hover:text-primary smooth-transition cursor-pointer inline-flex items-center gap-1.5"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {orders?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-muted-text uppercase tracking-widest text-[10px]">
                      No orders found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  )
}
