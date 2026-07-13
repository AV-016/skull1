'use client'

import { useState, useEffect, Fragment } from 'react'
import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminOrders, useUpdateOrderStatus } from '@/hooks/useAdmin'
import { Eye, Loader2, AlertTriangle, Search, Printer, ChevronDown, ChevronUp, Calendar, DollarSign, User, Mail, Phone, MapPin, Box } from 'lucide-react'
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

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [openStatusMenuOrderId, setOpenStatusMenuOrderId] = useState<string | null>(null)
  const [revertAlert, setRevertAlert] = useState<{ orderId: string, status: string, secondsLeft: number } | null>(null)

  const [sortField, setSortField] = useState<string>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ChevronDown className="w-3 h-3 text-muted-text/40 shrink-0" />
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-primary shrink-0" />
    ) : (
      <ChevronDown className="w-3 h-3 text-primary shrink-0" />
    )
  }

  // Countdown timer for status revert warning
  useEffect(() => {
    if (!revertAlert) return

    if (revertAlert.secondsLeft <= 0) {
      handleStatusChangeRaw(revertAlert.orderId, revertAlert.status)
      setRevertAlert(null)
      return
    }

    const timer = setTimeout(() => {
      setRevertAlert(prev => prev ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : null)
    }, 1000)

    return () => clearTimeout(timer)
  }, [revertAlert])

  const isPreviousStage = (current: string, target: string) => {
    const currentUpper = current.toUpperCase()
    const targetUpper = target.toUpperCase()
    
    // Linear order flow
    const orderFlow = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']
    const currentIndex = orderFlow.indexOf(currentUpper)
    const targetIndex = orderFlow.indexOf(targetUpper)
    
    if (currentIndex !== -1 && targetIndex !== -1) {
      return targetIndex < currentIndex
    }
    
    // For return flow
    const returnFlow = ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNED']
    const currentReturnIndex = returnFlow.indexOf(currentUpper)
    const targetReturnIndex = returnFlow.indexOf(targetUpper)
    
    if (currentReturnIndex !== -1 && targetReturnIndex !== -1) {
      return targetReturnIndex < currentReturnIndex
    }
    
    return false
  }

  const handleStatusChange = (id: string, status: string) => {
    const orderObj = orders.find((o: any) => o.id === id)
    const currentStatus = orderObj ? orderObj.status : 'PENDING'

    if (isPreviousStage(currentStatus, status)) {
      setRevertAlert({ orderId: id, status, secondsLeft: 5 })
    } else {
      handleStatusChangeRaw(id, status)
    }
  }

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenStatusMenuOrderId(null)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

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

  const sortedOrders = [...filteredOrders].sort((a: any, b: any) => {
    let comparison = 0
    if (sortField === 'id') {
      const aVal = a.orderNumber || a.id
      const bVal = b.orderNumber || b.id
      comparison = aVal.localeCompare(bVal)
    } else if (sortField === 'createdAt') {
      const aVal = new Date(a.createdAt).getTime()
      const bVal = new Date(b.createdAt).getTime()
      comparison = aVal - bVal
    } else if (sortField === 'totalAmount') {
      const aVal = a.totalAmount || a.total || 0
      const bVal = b.totalAmount || b.total || 0
      comparison = aVal - bVal
    }
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const totalItems = sortedOrders.length
  const totalPages = Math.ceil(totalItems / currentLimit)
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * currentLimit, currentPage * currentLimit)

  const handleStatusChangeRaw = async (id: string, status: string) => {
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
                  <th className="px-6 py-4">
                    <button
                      onClick={() => handleSort('id')}
                      className="flex items-center gap-1 hover:text-primary-text smooth-transition uppercase font-bold tracking-widest focus:outline-none"
                    >
                      <span>Order ID</span>
                      {renderSortIcon('id')}
                    </button>
                  </th>
                  <th className="px-6 py-4">Customer Email</th>
                  <th className="px-6 py-4">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center gap-1 hover:text-primary-text smooth-transition uppercase font-bold tracking-widest focus:outline-none"
                    >
                      <span>Date</span>
                      {renderSortIcon('createdAt')}
                    </button>
                  </th>
                  <th className="px-6 py-4">
                    <button
                      onClick={() => handleSort('totalAmount')}
                      className="flex items-center gap-1 hover:text-primary-text smooth-transition uppercase font-bold tracking-widest focus:outline-none"
                    >
                      <span>Total Amount</span>
                      {renderSortIcon('totalAmount')}
                    </button>
                  </th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {paginatedOrders.map((order: any) => {
                  const isExpanded = expandedOrderId === order.id
                  const isStatusMenuOpen = openStatusMenuOrderId === order.id
                  
                  const addressInfo = order.address || {}
                  const parseStreetParts = (streetStr: string) => {
                    const parts = { streetNo: '', locality: '', landmark: '' }
                    if (!streetStr) return parts
                    if (streetStr.includes('Street/House No:') && streetStr.includes('Locality:')) {
                      const bits = streetStr.split('|')
                      bits.forEach(bit => {
                        const trimmed = bit.trim()
                        if (trimmed.startsWith('Street/House No:')) {
                          parts.streetNo = trimmed.replace('Street/House No:', '').trim()
                        } else if (trimmed.startsWith('Locality:')) {
                          parts.locality = trimmed.replace('Locality:', '').trim()
                        } else if (trimmed.startsWith('Landmark:')) {
                          parts.landmark = trimmed.replace('Landmark:', '').trim()
                        }
                      })
                    } else {
                      parts.streetNo = streetStr
                    }
                    return parts
                  }
                  const streetParts = parseStreetParts(addressInfo.street || '')

                  return (
                    <Fragment key={order.id}>
                      <tr className={`hover:bg-secondary/25 smooth-transition ${isExpanded ? 'bg-secondary/10 border-l-2 border-primary' : ''}`}>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="font-bold text-primary-text flex items-center gap-1.5 hover:text-primary smooth-transition cursor-pointer text-left focus:outline-none"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-primary shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-text shrink-0" />}
                            <span>#{order.orderNumber || order.id.slice(-6).toUpperCase()}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 font-medium text-secondary-text">
                          {order.user?.email || 'Guest User'}
                        </td>
                        <td className="px-6 py-4 text-muted-text">{formatDate(order.createdAt)}</td>
                        <td className="px-6 py-4 font-bold text-primary-text">
                          {formatCurrency(order.totalAmount || order.total)}
                          {order.orderNumber?.startsWith('CR-') && (
                            <div className="text-[9px] text-amber-500 font-medium mt-0.5">
                              20% Adv: {formatCurrency((order.totalAmount || order.total) * 0.20)} Paid
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
                        <td className="px-6 py-4 relative">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenStatusMenuOrderId(isStatusMenuOpen ? null : order.id);
                              }}
                              disabled={updateStatusMutation.isPending}
                              className={`px-2.5 py-1.5 border rounded-md uppercase font-black tracking-wider text-[9px] cursor-pointer smooth-transition flex items-center gap-1.5 hover:bg-neutral-800 focus:outline-none ${getStatusStyle(order.status)}`}
                            >
                              <span>{order.status.replace('_', ' ')}</span>
                              <ChevronDown className="w-3 h-3 text-current opacity-70" />
                            </button>

                            {isStatusMenuOpen && (
                              <div 
                                className="absolute left-0 mt-2 w-52 bg-neutral-900 border border-border/40 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] py-2.5 z-50 animate-fade-in font-sans text-left"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="px-3.5 pb-1.5 mb-1.5 border-b border-border/20 text-[9px] font-black uppercase tracking-wider text-muted-text">
                                  Change Status
                                </div>
                                {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNED', 'RETURN_REJECTED'].map((st) => {
                                  const isPrev = isPreviousStage(order.status, st);
                                  return (
                                    <button
                                      key={st}
                                      onClick={() => {
                                        handleStatusChange(order.id, st);
                                        setOpenStatusMenuOrderId(null);
                                      }}
                                      className={`w-full text-left px-3.5 py-2 text-[10px] uppercase font-bold tracking-wider smooth-transition flex items-center justify-between ${
                                        order.status.toUpperCase() === st
                                          ? 'bg-primary text-white font-black'
                                          : isPrev
                                          ? 'text-secondary-text/30 line-through hover:text-secondary-text/80 hover:bg-neutral-800/40'
                                          : 'text-secondary-text hover:bg-neutral-800 hover:text-white'
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5">
                                        <span>{st.replace('_', ' ')}</span>
                                        {isPrev && <span className="text-[7px] text-amber-500/80 tracking-normal normal-case border border-amber-500/20 px-1 rounded-sm bg-amber-500/5 font-mono">↩ Revert</span>}
                                      </span>
                                      {order.status.toUpperCase() === st && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
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
                            
                            <button 
                              onClick={() => window.open(`/orders/${order.id}/invoice`, '_blank')}
                              className="p-2 border border-border hover:border-primary/50 text-secondary-text hover:text-primary smooth-transition cursor-pointer inline-flex items-center gap-1.5"
                              title="Print Packing Slip / Label"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="text-[10px] uppercase font-bold tracking-wider">Print</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Section */}
                      {isExpanded && (
                        <tr className="bg-secondary/5 border-b border-border/40 font-sans">
                          <td colSpan={7} className="px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs animate-fade-in text-left">
                              
                              {/* Column 1: Order Metadata */}
                              <div className="space-y-4 border border-border/40 p-5 rounded-xl bg-neutral-900/30">
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5 border-b border-border/20 pb-2 mb-3">
                                  <Calendar className="w-3.5 h-3.5 text-primary" /> Order Overview
                                </h4>
                                
                                <div className="space-y-2.5">
                                  <div className="flex justify-between items-center text-secondary-text">
                                    <span>Full ID:</span>
                                    <span className="font-mono text-[10px] select-all font-bold text-primary-text">{order.id}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-secondary-text">
                                    <span>Placing Date:</span>
                                    <span className="font-bold text-primary-text">{formatDate(order.createdAt)} at {new Date(order.createdAt).toLocaleTimeString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-secondary-text">
                                    <span>Payment Status:</span>
                                    <span className="font-bold uppercase text-primary-text">{order.paymentStatus}</span>
                                  </div>
                                  {order.carrier && (
                                    <div className="flex justify-between items-center text-secondary-text">
                                      <span>Shipment Carrier:</span>
                                      <span className="font-bold text-primary-text">{order.carrier}</span>
                                    </div>
                                  )}
                                  {order.trackingId && (
                                    <div className="flex justify-between items-center text-secondary-text">
                                      <span>Tracking Code:</span>
                                      <span className="font-mono text-primary-text">{order.trackingId}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Manual Confirm & Refunds in Expander */}
                                <div className="pt-3 border-t border-border/20 flex flex-wrap gap-2">
                                  {(order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED') && order.paymentMethod === 'CARD' && (
                                    <button
                                      onClick={() => handleMarkPaid(order.id)}
                                      disabled={actionLoadingId === order.id}
                                      className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 hover:border-green-500/50 text-green-400 disabled:opacity-50 smooth-transition cursor-pointer text-[10px] uppercase font-black tracking-wider rounded-md"
                                    >
                                      {actionLoadingId === order.id ? 'Loading...' : 'Mark as Paid'}
                                    </button>
                                  )}

                                  {order.paymentStatus === 'PAID' && (
                                    <button
                                      onClick={() => handleRefund(order.id)}
                                      disabled={actionLoadingId === order.id}
                                      className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 hover:border-red-500/50 text-red-400 disabled:opacity-50 smooth-transition cursor-pointer text-[10px] uppercase font-black tracking-wider rounded-md"
                                    >
                                      {actionLoadingId === order.id ? 'Refunding...' : 'Refund Order'}
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Column 2: Customer Address Card */}
                              <div className="space-y-4 border border-border/40 p-5 rounded-xl bg-neutral-900/30">
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5 border-b border-border/20 pb-2 mb-3">
                                  <User className="w-3.5 h-3.5 text-primary" /> Delivery & Customer Details
                                </h4>
                                
                                <div className="space-y-2.5 leading-relaxed">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-primary-text">{order.user?.name || 'Customer'}</span>
                                    <span className="text-[9px] bg-secondary text-secondary-text px-1.5 py-0.5 rounded font-mono uppercase font-bold">Buyer</span>
                                  </div>

                                  <div className="space-y-1.5 text-secondary-text font-mono text-[11px]">
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-3.5 h-3.5 text-muted-text shrink-0" />
                                      <span className="normal-case select-all font-bold">{order.user?.email || 'N/A'}</span>
                                    </div>
                                    {addressInfo.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5 text-muted-text shrink-0" />
                                        <span className="select-all font-bold">{addressInfo.phone}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="pt-2 border-t border-border/20 text-secondary-text space-y-1">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-text flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-muted-text" /> Shipping Address:
                                    </p>
                                    <p className="capitalize text-primary-text leading-normal">
                                      {streetParts.streetNo && `${streetParts.streetNo}, `}
                                      {streetParts.locality && `${streetParts.locality}, `}
                                      {streetParts.landmark && `(Landmark: ${streetParts.landmark}), `}
                                      {addressInfo.city && `${addressInfo.city}, `}
                                      {addressInfo.state && `${addressInfo.state}`}
                                      {addressInfo.postalCode && ` - ${addressInfo.postalCode}`}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Column 3: Order Items Grid */}
                              <div className="space-y-4 border border-border/40 p-5 rounded-xl bg-neutral-900/30">
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-text flex items-center gap-1.5 border-b border-border/20 pb-2 mb-3">
                                  <Box className="w-3.5 h-3.5 text-primary" /> Products Ordered ({order.items?.length || 0})
                                </h4>
                                
                                <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                                  {order.items?.map((item: any, idx: number) => {
                                    const material = item.specifications?.Material || 'PLA'
                                    const color = item.specifications?.Color || 'Default'
                                    const wt = item.specifications?.Weight || ''
                                    
                                    return (
                                      <div key={idx} className="flex justify-between items-start gap-4 pb-3 border-b border-border/10 last:border-0 last:pb-0">
                                        <div className="flex gap-3 items-start">
                                          {/* Product Image Thumbnail */}
                                          <div className="w-12 h-12 rounded-lg border border-border/20 overflow-hidden shrink-0 bg-neutral-800 flex items-center justify-center cursor-pointer" onClick={() => window.open(`/products/${item.productId || ''}`, '_blank')}>
                                            <img 
                                              src={item.image || '/placeholder.jpg'} 
                                              alt={item.name || 'Product'} 
                                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder.jpg'
                                              }}
                                            />
                                          </div>
                                          
                                          <div className="space-y-1">
                                            <p className="font-bold text-primary-text uppercase leading-tight hover:text-primary cursor-pointer" onClick={() => window.open(`/products/${item.productId || ''}`, '_blank')}>
                                              {item.name || 'Product'}
                                            </p>
                                            <p className="text-[9px] text-muted-text font-mono">
                                              SKU: {item.sku || `SKT-${idx + 1}`}
                                            </p>
                                            <div className="flex gap-2 flex-wrap pt-0.5 text-[8px] font-bold font-mono">
                                              <span className="bg-secondary text-secondary-text px-1 rounded uppercase">{material}</span>
                                              <span className="bg-secondary text-secondary-text px-1 rounded uppercase">{color}</span>
                                              {wt && <span className="bg-secondary text-secondary-text px-1 rounded">{wt}</span>}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right whitespace-nowrap">
                                          <p className="font-black text-primary-text">Qty {item.quantity || 1}</p>
                                          <p className="text-[10px] text-muted-text font-mono mt-0.5">{formatCurrency(item.price || 0)}</p>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
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

      {/* Floating Revert Timer Alert */}
      {revertAlert && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border-2 border-amber-500/50 rounded-xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.7)] max-w-sm animate-fade-in font-sans">
          <div className="flex items-start gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h4 className="font-bold text-amber-500 text-xs uppercase tracking-wider">Reverting Order Status</h4>
              <p className="text-[11px] text-secondary-text leading-relaxed">
                Accidental rollback detected. Updating order status to <span className="font-mono text-primary-text font-black uppercase bg-neutral-800 px-1 rounded">{revertAlert.status.replace('_', ' ')}</span> in <span className="font-black text-amber-400 text-sm font-mono">{revertAlert.secondsLeft}s</span>...
              </p>
              <div className="pt-1 flex gap-2">
                <button
                  onClick={() => setRevertAlert(null)}
                  className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10px] font-bold uppercase tracking-wider rounded border border-border/40 smooth-transition cursor-pointer"
                >
                  Cancel Reversal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
