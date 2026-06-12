'use client'

import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Check, X, Eye } from 'lucide-react'

export default function AdminCustomRequests() {
  const requests = [
    { id: 1, customer: 'John Doe', status: 'QUOTED', amount: '$1,299', date: '2024-01-15' },
    { id: 2, customer: 'Jane Smith', status: 'UNDER_REVIEW', amount: '-', date: '2024-01-18' },
    { id: 3, customer: 'Mike Johnson', status: 'ACCEPTED', amount: '$899', date: '2024-01-20' },
  ]

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="heading-2">Custom Requests</h1>
          <p className="text-muted">Manage custom printing quotations</p>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Request</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Quotation</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="px-6 py-4 font-medium">#{req.id}</td>
                  <td className="px-6 py-4">{req.customer}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300">
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{req.amount}</td>
                  <td className="px-6 py-4 text-muted">{req.date}</td>
                  <td className="px-6 py-4"><Eye className="w-4 h-4" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AdminLayout>
  )
}
