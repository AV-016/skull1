'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminDashboardStats, useAdminOrders, useAdminMonitoringStats, useAdminActivityLogs } from '@/hooks/useAdmin'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Loader2, TrendingUp, ShoppingBag, Users, HelpCircle, Activity, Server, AlertTriangle, ShieldCheck, Database, Mail, CreditCard, AlertCircle, Star } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function AdminDashboard() {
  const { data: stats, isLoading: isStatsLoading, error: statsError } = useAdminDashboardStats()
  const { data: ordersData, isLoading: isOrdersLoading } = useAdminOrders({ limit: 50 })
  const { data: healthStats, isLoading: isHealthLoading } = useAdminMonitoringStats()
  const { data: activityData } = useAdminActivityLogs(1, 5)

  const logs = activityData || []
  
  const orders = ordersData?.orders || []
  const returnStatuses = ['RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURNED', 'RETURN_REJECTED']
  const normalOrders = orders.filter((o: any) => !returnStatuses.includes(o.status)).slice(0, 5)
  const returnOrders = orders.filter((o: any) => returnStatuses.includes(o.status)).slice(0, 5)
  const [toastMessage, setToastMessage] = useState<{ action: string; details: string } | null>(null)
  const [lastActivityId, setLastActivityId] = useState<string | null>(null)

  useEffect(() => {
    if (logs.length > 0) {
      const latestLog = logs[0]
      if (lastActivityId && latestLog.id !== lastActivityId) {
        setToastMessage({ action: latestLog.action, details: latestLog.details || '' })
        const timer = setTimeout(() => setToastMessage(null), 5000)
        return () => clearTimeout(timer)
      }
      setLastActivityId(latestLog.id)
    }
  }, [logs, lastActivityId])

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
          {/* Left Stack (Recent Orders & Notifications Center) */}
          <div className="lg:col-span-2 space-y-8 flex flex-col">
            {/* Recent Orders Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 border border-border bg-card/25 flex-1"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary-text">Recent Orders</h2>
                <a href="/admin/orders" className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
                  View All Orders →
                </a>
              </div>
              
              <div className="space-y-4">
                {normalOrders && normalOrders.length > 0 ? (
                  normalOrders.map((order) => (
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
                  <p className="text-xs text-muted-text py-4 text-center">No recent orders placed yet.</p>
                )}
              </div>
            </motion.div>

            {/* Special Section: Returned Products & Return Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.31 }}
              className="glass-card p-6 border border-red-500/20 bg-red-950/5 flex-1"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-red-400 flex items-center gap-2">
                  <span>🔄</span> Returned Products & Return Requests
                </h2>
                <a href="/admin/orders" className="text-xs font-bold text-red-400 hover:underline uppercase tracking-wider">
                  Manage Returns →
                </a>
              </div>
              
              <div className="space-y-4">
                {returnOrders && returnOrders.length > 0 ? (
                  returnOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="flex items-center justify-between py-3 border-b border-border/40 last:border-0 last:pb-0 hover:bg-secondary/20 px-2 rounded-lg smooth-transition cursor-pointer"
                      onClick={() => window.location.href = `/orders/${order.id}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-primary-text">Order #{order.orderNumber || order.id.slice(-6).toUpperCase()}</p>
                          <span className="text-[9px] uppercase font-bold text-muted-text bg-secondary border border-border px-1.5 py-0.5 rounded">
                            {order.paymentMethod}
                          </span>
                        </div>
                        <p className="text-xs text-muted-text">
                          Customer: {order.user?.email || 'Guest'}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-sm text-primary-text">{formatCurrency(order.totalAmount || order.total)}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                          order.status === 'RETURN_REQUESTED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          order.status === 'RETURN_APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          order.status === 'RETURNED' ? 'bg-green-500/15 text-green-400 border border-green-500/30' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {order.status.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-text py-6 text-center italic">No returned products or requests at the moment.</p>
                )}
              </div>
            </motion.div>

            {/* Notification Center & Reminders Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="glass-card p-6 border border-border bg-card/25"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary-text flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary animate-pulse" /> Notification Center
                </h2>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                  Live Activity Feed
                </span>
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin divide-y divide-border/40">
                {logs && logs.length > 0 ? (
                  logs.map((log: any) => {
                    let iconColor = 'text-blue-400 bg-blue-500/5 border-blue-500/10'
                    let IconComponent = Activity
                    const actionType = log.action.toUpperCase()

                    if (actionType.includes('ORDER')) {
                      iconColor = 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
                      IconComponent = ShoppingBag
                    } else if (actionType.includes('LOGIN') || actionType.includes('REGISTER')) {
                      iconColor = 'text-blue-400 bg-blue-500/5 border-blue-500/10'
                      IconComponent = Users
                    } else if (actionType.includes('CUSTOM')) {
                      iconColor = 'text-amber-400 bg-amber-500/5 border-amber-500/10'
                      IconComponent = HelpCircle
                    } else if (actionType.includes('INQUIRY')) {
                      iconColor = 'text-purple-400 bg-purple-500/5 border-purple-500/10'
                      IconComponent = Mail
                    } else if (actionType.includes('REVIEW')) {
                      iconColor = 'text-teal-400 bg-teal-500/5 border-teal-500/10'
                      IconComponent = Star
                    }

                    return (
                      <div key={log.id} className="flex gap-4 pt-3.5 first:pt-0 border-t border-border/20 first:border-t-0 items-start">
                        <div className={`p-2 rounded-xl border ${iconColor} mt-0.5`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-text block mb-0.5">
                              {log.action.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[9px] text-muted-text">
                              {formatDate(log.createdAt)} at {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-secondary-text leading-relaxed font-semibold">
                            {log.details}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-xs text-muted-text py-8 text-center italic">No new activities or reminders found.</p>
                )}
              </div>
            </motion.div>
          </div>

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

      {/* Activity Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-[9999] max-w-sm w-full bg-[#23272B] border-2 border-primary/40 rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 backdrop-blur-md"
          >
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <p className="text-xs font-black uppercase tracking-wider text-primary-text">
                  New Admin Activity
                </p>
                <button
                  onClick={() => setToastMessage(null)}
                  className="text-muted-text hover:text-primary-text text-[10px] uppercase font-bold ml-2 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-[11px] font-bold text-secondary-text mt-1 uppercase tracking-wide">
                {toastMessage.action.replace(/_/g, ' ')}
              </p>
              {toastMessage.details && (
                <p className="text-[10px] text-muted-text mt-0.5 line-clamp-2 leading-relaxed bg-[#1A1D1F] p-1.5 rounded font-mono">
                  {toastMessage.details}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
