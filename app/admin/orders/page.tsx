'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminOrders, useUpdateOrderStatus } from '@/hooks/useAdmin'
import { Eye, Loader2, AlertTriangle, Search } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { api } from '@/lib/api'

export default function AdminOrders() {
  const [currentPage, setCurrentPage] = useState(1)
  const [currentLimit, setCurrentLimit] = useState(10)

  const { data: ordersData, isLoading, error, refetch } = useAdminOrders({ limit: 1000 })
  const updateStatusMutation = useUpdateOrderStatus()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const orders = ordersData?.orders || []

  const handleMarkPaid = async (orderId: string) => {
    setActionLoadingId(orderId)
    try {
      await api.post(`/admin/orders/${orderId}/mark-paid`)
      refetch()
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to mark order as paid')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to refund this order? This will cancel the order and restock items.')) return
    setActionLoadingId(orderId)
    try {
      await api.post(`/admin/orders/${orderId}/refund`)
      refetch()
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to process refund')
    } finally {
      setActionLoadingId(null)
    }
  }

  // Compute metrics dynamically from the fetched orders
  const totalOrders = orders.length
  const pendingCount = orders.filter((o: any) => o.status === 'PENDING').length
  const processingCount = orders.filter((o: any) => o.status === 'PROCESSING').length
  const deliveredCount = orders.filter((o: any) => o.status === 'DELIVERED').length

  const filteredOrders = orders.filter((order: any) => {
    const orderNo = (order.orderNumber || '').toLowerCase()
    const shortId = (order.id || '').slice(-6).toLowerCase()
    const email = (order.user?.email || '').toLowerCase()
    
    // Normalize query (remove leading '#' if present)
    const query = searchQuery.toLowerCase().trim().replace(/^#/, '')
    
    const matchesSearch = !query || 
      orderNo.includes(query) || 
      shortId.includes(query) || 
      email.includes(query) || 
      (order.paymentId && order.paymentId.toLowerCase().includes(query)) ||
      order.id.toLowerCase().includes(query)
      
    const matchesStatus = statusFilter === 'ALL' || order.status.toUpperCase() === statusFilter.toUpperCase()
    
    return matchesSearch && matchesStatus
  })

  const totalItems = filteredOrders.length
  const totalPages = Math.ceil(totalItems / currentLimit)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * currentLimit, currentPage * currentLimit)

  const handleStatusChange = async (id: string, status: string) => {
    let trackingId = ''
    let carrier = ''
    let trackingUrl = ''

    if (status.toUpperCase() === 'SHIPPED') {
      const trackingInput = prompt('Enter Tracking ID (required for SHIPPED status):')
      if (trackingInput === null) return // User cancelled
      if (!trackingInput.trim()) {
        alert('Tracking ID is required to mark order as SHIPPED.')
        return
      }
      trackingId = trackingInput.trim()
      
      const carrierInput = prompt('Enter Carrier (e.g. India Post, Blue Dart) [Optional, default: India Post]:')
      carrier = (carrierInput && carrierInput.trim()) || 'India Post'
      
      const urlInput = prompt('Enter Tracking URL [Optional]:')
      trackingUrl = (urlInput && urlInput.trim()) || ''
    }

    try {
      setActionLoadingId(id)
      
      // Update status
      await updateStatusMutation.mutateAsync({
        id,
        status,
        notes: `Status updated by Admin to ${status}`
      })

      // If status is SHIPPED, update shipping details
      if (status.toUpperCase() === 'SHIPPED') {
        await api.patch(`/admin/orders/${id}/shipping`, {
          trackingId,
          carrier,
          trackingUrl: trackingUrl || undefined
        })
      }
      
      refetch()
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to update order status')
    } finally {
      setActionLoadingId(null)
    }
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
      case 'RETURN_REQUESTED':
        return 'bg-blue-500/5 text-blue-300 border-blue-500/20'
      case 'RETURN_APPROVED':
        return 'bg-emerald-500/5 text-emerald-300 border-emerald-500/20'
      case 'RETURNED':
        return 'bg-green-500/10 text-green-300 border-green-500/20'
      case 'RETURN_REJECTED':
        return 'bg-red-500/5 text-red-300 border-red-500/20'
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

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-secondary/20 border border-border p-4 rounded-xl">
          <div className="relative w-full sm:max-w-xs flex items-center bg-secondary border border-border focus-within:border-primary/50 rounded-lg overflow-hidden transition-all duration-300">
            <Search className="w-4 h-4 text-muted-text ml-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by Order ID, Email, or Payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 px-3 bg-transparent text-primary-text placeholder:text-muted-text text-xs focus:outline-none tracking-wide"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest whitespace-nowrap">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-secondary border border-border rounded-lg text-[10px] text-primary-text focus:outline-none focus:border-primary/50 cursor-pointer uppercase font-bold tracking-wider"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
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
          <>
            <div className="glass-card overflow-x-auto border border-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/40 text-[10px] font-bold text-muted-text uppercase tracking-widest">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer Email</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {paginatedOrders.map((order: any) => (
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
                      {order.orderNumber?.startsWith('CR-') && (
                        <div className="text-[9px] text-amber-500 font-medium mt-0.5">
                          20% Adv: {formatCurrency(order.totalAmount * 0.20)} Paid
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center">
                          <span className="text-[10px] uppercase font-bold tracking-wider">{order.paymentMethod}</span>
                          <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            order.paymentStatus === 'PAID' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            order.paymentStatus === 'REFUNDED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            order.paymentStatus === 'PENDING' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            order.paymentStatus === 'FAILED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-secondary text-muted-text'
                          }`}>{order.paymentStatus}</span>
                        </div>
                        {order.paymentId && (
                          <div className="text-[9px] font-mono text-muted-text mt-0.5 select-all">
                            ID: {order.paymentId}
                          </div>
                        )}
                      </div>
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
                        <option value="RETURN_REQUESTED">Return Requested</option>
                        <option value="RETURN_APPROVED">Return Approved</option>
                        <option value="RETURNED">Returned</option>
                        <option value="RETURN_REJECTED">Return Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => window.location.href = `/orders/${order.id}`}
                          className="p-2 border border-border hover:border-primary/50 text-secondary-text hover:text-primary smooth-transition cursor-pointer inline-flex items-center gap-1.5"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase font-bold tracking-wider">Details</span>
                        </button>
                        
                        {(order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED') && order.paymentMethod === 'CARD' && (
                          <button
                            onClick={() => handleMarkPaid(order.id)}
                            disabled={actionLoadingId === order.id}
                            className="p-2 bg-green-500/10 border border-green-500/20 hover:border-green-500/50 text-green-400 disabled:opacity-50 smooth-transition cursor-pointer inline-flex items-center text-[10px] uppercase font-bold tracking-wider"
                            title="Manually Confirm Payment"
                          >
                            {actionLoadingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Mark Paid'}
                          </button>
                        )}

                        {order.paymentStatus === 'PAID' && (
                          <button
                            onClick={() => handleRefund(order.id)}
                            disabled={actionLoadingId === order.id}
                            className="p-2 bg-red-500/10 border border-red-500/20 hover:border-red-500/50 text-red-400 disabled:opacity-50 smooth-transition cursor-pointer inline-flex items-center text-[10px] uppercase font-bold tracking-wider"
                            title="Refund & Cancel Order"
                          >
                            {actionLoadingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Refund'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted-text uppercase tracking-widest text-[10px]">
                      No orders matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-secondary/10 border border-border p-4 rounded-xl mt-6 font-sans text-xs">
              <div className="flex items-center gap-4 text-muted-text font-bold uppercase tracking-wider">
                <span>
                  Showing {Math.min(totalItems, (currentPage - 1) * currentLimit + 1)} - {Math.min(totalItems, currentPage * currentLimit)} of {totalItems} orders
                </span>
                <div className="flex items-center gap-1.5">
                  <span>Show:</span>
                  <select
                    value={currentLimit}
                    onChange={(e) => {
                      setCurrentLimit(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="bg-secondary border border-border rounded px-2 py-1 text-[10px] font-bold text-primary-text focus:outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 bg-secondary border border-border rounded text-[10px] uppercase font-bold tracking-wider hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed smooth-transition animate-none"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded border font-bold text-[10px] smooth-transition ${
                        currentPage === pageNum
                          ? 'bg-primary border-primary text-white'
                          : 'bg-secondary border-border text-primary-text hover:bg-secondary/80'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 bg-secondary border border-border rounded text-[10px] uppercase font-bold tracking-wider hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed smooth-transition animate-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </motion.div>
    </AdminLayout>
  )
}
