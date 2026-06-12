'use client'

import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminDashboardStats, useAdminOrders } from '@/hooks/useAdmin'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, TrendingUp, ShoppingBag, Users, HelpCircle } from 'lucide-react'

export default function AdminDashboard() {
  const { data: stats, isLoading: isStatsLoading, error: statsError } = useAdminDashboardStats()
  const { data: orders, isLoading: isOrdersLoading } = useAdminOrders({ limit: 5 })

  if (isStatsLoading || isOrdersLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">Loading Dashboard...</p>
        </div>
      </AdminLayout>
    )
  }

  // KPI cards mapping with icons and dynamic data
  const kpis = [
    { 
      label: 'Total Revenue', 
      value: stats ? formatCurrency(stats.revenue) : '₹0.00', 
      icon: TrendingUp,
      color: 'text-emerald-400', 
      bgColor: 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30' 
    },
    { 
      label: 'Total Orders', 
      value: stats?.totalOrders ?? 0, 
      icon: ShoppingBag,
      color: 'text-teal-400', 
      bgColor: 'bg-teal-500/5 border-teal-500/10 hover:border-teal-500/30' 
    },
    { 
      label: 'Active Users', 
      value: stats?.totalUsers ?? 0, 
      icon: Users,
      color: 'text-blue-400', 
      bgColor: 'bg-blue-500/5 border-blue-500/10 hover:border-blue-500/30' 
    },
    { 
      label: 'Pending Requests', 
      value: stats?.pendingCustomRequests ?? 0, 
      icon: HelpCircle,
      color: 'text-amber-400', 
      bgColor: 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30' 
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="heading-2 mb-2 uppercase tracking-wide">Admin Dashboard</h1>
          <p className="text-xs text-muted-text uppercase tracking-widest">Welcome back! Here&apos;s your business overview.</p>
        </div>

        {/* KPI Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <motion.div
                key={kpi.label}
                variants={itemVariants}
                className={`glass-card p-6 border smooth-transition ${kpi.bgColor}`}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest">{kpi.label}</p>
                    <h3 className="text-3xl font-extrabold text-primary-text">{kpi.value}</h3>
                  </div>
                  <div className={`p-2 bg-secondary/85 border border-border ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Recent Orders Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 border border-border bg-card/25"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary-text">Recent Orders</h2>
            <a href="/admin/orders" className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
              View All Orders →
            </a>
          </div>
          
          <div className="space-y-4">
            {orders && orders.length > 0 ? (
              orders.slice(0, 5).map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between py-3 border-b border-border/40 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-primary-text">Order #{order.orderNumber || order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-muted-text">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-sm text-primary-text">{formatCurrency(order.totalAmount || order.total)}</p>
                    <span className="text-[10px] px-2 py-0.5 bg-secondary border border-border rounded capitalize font-semibold text-secondary-text">
                      {order.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-text py-4 text-center">No orders placed yet.</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AdminLayout>
  )
}
