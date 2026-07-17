'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminPendingLoyalty, useApproveLoyaltyDiscount } from '@/hooks/useAdmin'
import { Loader2, Check, Sparkles, Award } from 'lucide-react'

export default function AdminLoyaltyPage() {
  const { data: pendingUsers, isLoading, error } = useAdminPendingLoyalty()
  const approveMutation = useApproveLoyaltyDiscount()

  // State to track custom discount values per user input
  const [discountInputs, setDiscountInputs] = useState<Record<string, number>>({})

  const handleInputChange = (userId: string, val: string) => {
    const num = Number(val)
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setDiscountInputs((prev) => ({
        ...prev,
        [userId]: num,
      }))
    }
  }

  const handleApprove = async (userId: string, defaultValue: number) => {
    const value = discountInputs[userId] ?? defaultValue ?? 20 // Default to 20%
    try {
      await approveMutation.mutateAsync({ userId, discountValue: value })
      alert('Discount successfully approved and assigned to user!')
    } catch (err) {
      console.error(err)
      alert('Failed to approve discount.')
    }
  }

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="heading-2 mb-2 uppercase tracking-wide flex items-center gap-2">
              <Award className="w-7 h-7 text-yellow-500" />
              Loyalty Stamps Manager
            </h1>
            <p className="text-xs text-muted-text uppercase tracking-widest">
              Set custom next-order discounts for users who filled their stamp card (8 stamps).
            </p>
          </div>
        </div>

        {/* Pending Approval List */}
        <div className="glass-card p-6 border border-border bg-card/25">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary-text">
              Pending Next-Order Discounts
            </h2>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-muted-text uppercase tracking-wider">Loading eligible users...</p>
            </div>
          ) : error ? (
            <p className="text-xs text-red-500 py-4 text-center">Failed to load pending loyalty records.</p>
          ) : pendingUsers && pendingUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-muted-text text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4 text-center">Stamps</th>
                    <th className="py-3 px-4">Discount % Off</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border/40 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="py-4 px-4 font-semibold text-sm text-primary-text">{user.name}</td>
                      <td className="py-4 px-4 text-xs text-secondary-text">{user.email}</td>
                      <td className="py-4 px-4 text-xs text-secondary-text">{user.phone || 'N/A'}</td>
                      <td className="py-4 px-4 text-xs text-center font-bold text-yellow-500">{user.loyaltyStamps}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="20"
                            value={discountInputs[user.id] !== undefined ? discountInputs[user.id] : (user.loyaltyDiscountValue || 20)}
                            onChange={(e) => handleInputChange(user.id, e.target.value)}
                            className="w-16 px-2 py-1 bg-secondary/60 border border-border focus:outline-none focus:border-primary/50 text-xs font-semibold rounded text-center text-primary-text"
                          />
                          <span className="text-xs text-muted-text">%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleApprove(user.id, user.loyaltyDiscountValue)}
                          disabled={approveMutation.isPending}
                          className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-lg transition shadow-md shadow-yellow-600/10 cursor-pointer flex items-center gap-1.5 ml-auto"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-text text-xs uppercase tracking-wider">
              No users are currently pending discount approval. Keep earning stamps!
            </div>
          )}
        </div>
      </motion.div>
    </AdminLayout>
  )
}
