'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminPendingLoyalty, useApproveLoyaltyDiscount } from '@/hooks/useAdmin'
import { Loader2, Check, Sparkles, Award, Settings, Trash2 } from 'lucide-react'
import api from '@/lib/api'

export default function AdminLoyaltyPage() {
  const { data: pendingUsers, isLoading, error, refetch } = useAdminPendingLoyalty()
  const approveMutation = useApproveLoyaltyDiscount()

  // Slab settings state
  const [minSlab, setMinSlab] = useState<number>(15)
  const [maxSlab, setMaxSlab] = useState<number>(25)
  const [isSavingSlab, setIsSavingSlab] = useState(false)

  // State to track custom discount values per user input
  const [discountInputs, setDiscountInputs] = useState<Record<string, number>>({})

  // Fetch settings on mount
  useEffect(() => {
    api.get('/admin/settings')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setMinSlab(res.data.data.loyaltyMinDiscount ?? 15)
          setMaxSlab(res.data.data.loyaltyMaxDiscount ?? 25)
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])

  const handleSaveSlab = async () => {
    if (minSlab < 0 || maxSlab < 0 || minSlab > 100 || maxSlab > 100) {
      alert('Discounts must be between 0% and 100%')
      return
    }
    if (minSlab > maxSlab) {
      alert('Minimum discount cannot be greater than Maximum discount')
      return
    }
    
    setIsSavingSlab(true)
    try {
      await api.patch('/admin/settings', {
        loyaltyMinDiscount: Number(minSlab),
        loyaltyMaxDiscount: Number(maxSlab)
      })
      alert('Loyalty discount slab updated successfully!')
    } catch (err) {
      console.error(err)
      alert('Failed to save settings slab.')
    } finally {
      setIsSavingSlab(false)
    }
  }

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
    const value = discountInputs[userId] ?? defaultValue ?? 20
    try {
      await approveMutation.mutateAsync({ userId, discountValue: value })
      alert(value > 0 ? 'Discount successfully updated!' : 'Discount successfully revoked!')
      refetch()
    } catch (err) {
      console.error(err)
      alert('Failed to update discount.')
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
              Manage dynamic next-order discounts for users who filled their stamp card (8 stamps).
            </p>
          </div>
        </div>

        {/* Slab Settings Card */}
        <div className="glass-card p-6 border border-border bg-card/25 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-yellow-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary-text">
              Loyalty Discount Slab Settings
            </h2>
          </div>
          <p className="text-xs text-muted-text mb-6">
            Configure the minimum and maximum range of next-order discount percentages. When a user fills their stamp card, a discount in this range will be automatically awarded.
          </p>
          <div className="flex flex-col sm:flex-row items-end gap-6">
            <div className="flex-1 space-y-2 w-full">
              <label className="block text-[10px] font-bold text-muted-text uppercase tracking-wider">Min Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={minSlab}
                onChange={(e) => setMinSlab(Number(e.target.value))}
                className="w-full px-3 py-2 bg-secondary border border-border focus:outline-none focus:border-primary/50 text-xs font-semibold rounded-xl text-primary-text"
              />
            </div>
            <div className="flex-1 space-y-2 w-full">
              <label className="block text-[10px] font-bold text-muted-text uppercase tracking-wider">Max Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={maxSlab}
                onChange={(e) => setMaxSlab(Number(e.target.value))}
                className="w-full px-3 py-2 bg-secondary border border-border focus:outline-none focus:border-primary/50 text-xs font-semibold rounded-xl text-primary-text"
              />
            </div>
            <button
              onClick={handleSaveSlab}
              disabled={isSavingSlab}
              className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-xl transition shadow-lg cursor-pointer h-[38px] shrink-0"
            >
              {isSavingSlab ? 'Saving...' : 'Save Slab'}
            </button>
          </div>
        </div>

        {/* Pending Approval List */}
        <div className="glass-card p-6 border border-border bg-card/25">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary-text">
              Active & Pending Loyalty Discounts
            </h2>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-muted-text uppercase tracking-wider">Loading eligible users...</p>
            </div>
          ) : error ? (
            <p className="text-xs text-red-500 py-4 text-center">Failed to load loyalty records.</p>
          ) : pendingUsers && pendingUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 text-muted-text text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4 text-center">Stamps</th>
                    <th className="py-3 px-4">Status</th>
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          user.loyaltyDiscountSet
                            ? 'bg-green-500/10 text-green-500 border border-green-500/25'
                            : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/25'
                        }`}>
                          {user.loyaltyDiscountSet ? 'Active' : 'Pending'}
                        </span>
                      </td>
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(user.id, user.loyaltyDiscountValue)}
                            disabled={approveMutation.isPending}
                            className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white text-[10px] font-bold uppercase rounded-lg transition shadow-md cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            {user.loyaltyDiscountSet ? 'Update' : 'Approve'}
                          </button>
                          {user.loyaltyDiscountSet && (
                            <button
                              onClick={() => handleApprove(user.id, 0)}
                              disabled={approveMutation.isPending}
                              className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-500 hover:text-white disabled:opacity-50 text-[10px] font-bold uppercase rounded-lg transition cursor-pointer flex items-center gap-1"
                              title="Revoke Discount"
                            >
                              <Trash2 className="w-3 h-3" />
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-text text-xs uppercase tracking-wider">
              No users currently have active or pending loyalty discounts.
            </div>
          )}
        </div>
      </motion.div>
    </AdminLayout>
  )
}
