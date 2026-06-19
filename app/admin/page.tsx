'use client'

import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminDashboardStats, useAdminOrders, useAdminMonitoringStats } from '@/hooks/useAdmin'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, TrendingUp, ShoppingBag, Users, HelpCircle, Activity, Server, AlertTriangle, ShieldCheck, Database, Mail, CreditCard, AlertCircle } from 'lucide-react'

export default function AdminDashboard() {
  const { data: stats, isLoading: isStatsLoading, error: statsError } = useAdminDashboardStats()
  const { data: orders, isLoading: isOrdersLoading } = useAdminOrders({ limit: 5 })
  const { data: healthStats, isLoading: isHealthLoading } = useAdminMonitoringStats()

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

        {/* Monitoring & Recent Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 glass-card p-6 border border-border bg-card/25"
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

          {/* System Health status Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card p-6 border border-border bg-card/25 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary-text flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> System Health
                </h2>
                {healthStats ? (
                  <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 ${
                    healthStats.status === 'healthy' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : healthStats.status === 'warning'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {healthStats.status}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-text animate-pulse">loading...</span>
                )}
              </div>

              {healthStats ? (
                <div className="space-y-3.5 text-xs">
                  {/* 500 errors */}
                  <div className="flex items-center justify-between p-3 bg-secondary/35 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <Server className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-secondary-text">500 Server Errors</span>
                    </div>
                    <span className={`font-bold text-sm ${healthStats.counts.errors500 > 0 ? 'text-red-400' : 'text-primary-text'}`}>
                      {healthStats.counts.errors500}
                    </span>
                  </div>

                  {/* Payment failures */}
                  <div className="flex items-center justify-between p-3 bg-secondary/35 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-teal-400" />
                      <span className="font-semibold text-secondary-text">Payment Failures</span>
                    </div>
                    <span className={`font-bold text-sm ${healthStats.counts.paymentFailures > 0 ? 'text-amber-400' : 'text-primary-text'}`}>
                      {healthStats.counts.paymentFailures}
                    </span>
                  </div>

                  {/* Webhook failures */}
                  <div className="flex items-center justify-between p-3 bg-secondary/35 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-secondary-text">Webhook Failures</span>
                    </div>
                    <span className={`font-bold text-sm ${healthStats.counts.webhookFailures > 0 ? 'text-red-400' : 'text-primary-text'}`}>
                      {healthStats.counts.webhookFailures}
                    </span>
                  </div>

                  {/* SMTP failures */}
                  <div className="flex items-center justify-between p-3 bg-secondary/35 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-purple-400" />
                      <span className="font-semibold text-secondary-text">SMTP Email Failures</span>
                    </div>
                    <span className={`font-bold text-sm ${healthStats.counts.smtpFailures > 0 ? 'text-amber-400' : 'text-primary-text'}`}>
                      {healthStats.counts.smtpFailures}
                    </span>
                  </div>

                  {/* DB failures */}
                  <div className="flex items-center justify-between p-3 bg-secondary/35 border border-border/50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-secondary-text">Database / Timeouts</span>
                    </div>
                    <span className={`font-bold text-sm ${healthStats.counts.dbFailures > 0 ? 'text-red-400' : 'text-primary-text'}`}>
                      {healthStats.counts.dbFailures}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-text">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  Loading stats...
                </div>
              )}
            </div>

            {/* Recent alerts log list */}
            {healthStats && healthStats.recentAlerts.length > 0 && (
              <div className="mt-5 pt-5 border-t border-border/40">
                <p className="text-[10px] font-bold text-muted-text uppercase tracking-widest mb-3">Recent Alerts Log</p>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {healthStats.recentAlerts.map((alert: any, index: number) => (
                    <div key={index} className="p-2.5 bg-red-500/5 border border-red-500/10 rounded text-[10px] text-secondary-text leading-normal">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-red-400 capitalize">{alert.category}</span>
                        <span className="text-[8px] text-muted-text">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="line-clamp-2 select-all font-mono text-[9px] bg-secondary/40 p-1 rounded mt-0.5">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AdminLayout>
  )
}
