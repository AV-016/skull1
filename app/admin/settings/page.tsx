'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Save, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

export default function AdminSettings() {
  const [businessName, setBusinessName] = useState('Skulture')
  const [codCharge, setCodCharge] = useState<number>(50)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    api.get('/admin/settings')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setBusinessName(res.data.data.businessName || 'Skulture')
          setCodCharge(res.data.data.codCharge ?? 50)
        }
      })
      .catch(err => {
        console.error('Failed to fetch settings:', err)
        setErrorMsg('Failed to load settings from server.')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      await api.patch('/admin/settings', {
        businessName,
        codCharge: Number(codCharge)
      })
      setSuccessMsg('Settings updated successfully!')
      // Clear message after 3 seconds
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      console.error('Failed to save settings:', err)
      setErrorMsg(err.response?.data?.message || 'Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
        <div>
          <h1 className="heading-2">Settings</h1>
          <p className="text-muted">Configure platform settings</p>
        </div>

        {isLoading ? (
          <div className="glass-card p-6 flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white/50" />
          </div>
        ) : (
          <div className="glass-card p-6 space-y-6">
            {successMsg && (
              <div className="p-3 bg-green-500/15 border border-green-500/30 text-green-400 rounded-lg text-sm">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg text-sm">
                {errorMsg}
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-4">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Platform Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Skulture"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-white/40 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Settings */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-semibold mb-4">Payment Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cash on Delivery (COD) Handling Charge (INR)</label>
                  <input
                    type="number"
                    value={codCharge}
                    onChange={(e) => setCodCharge(Number(e.target.value))}
                    placeholder="50"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:border-white/40 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="border-t border-white/10 pt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  )
}

