'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Save, Loader2, Plus, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react'
import { api } from '@/lib/api'

interface ShippingRate {
  id: string
  weightFrom: number
  weightTo: number
  localRate: number
  sameStateRate: number
  nationalRate: number
}

export default function AdminSettings() {
  const [businessName, setBusinessName] = useState('Skulture')
  const [codCharge, setCodCharge] = useState<number>(50)
  const [sellerPincode, setSellerPincode] = useState('400001')
  const [isGstEnabled, setIsGstEnabled] = useState(true)
  const [defaultGstRate, setDefaultGstRate] = useState(18.0)
  const [platformFeeType, setPlatformFeeType] = useState('FIXED')
  const [platformFeeValue, setPlatformFeeValue] = useState(0.0)
  const [volumetricDivisor, setVolumetricDivisor] = useState(5000.0)
  const [returnAddress, setReturnAddress] = useState('123 Maker Street, Print City, Filament State, 12345')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'support' | 'shipping'>('general')

  // Support Email OTP states & handlers
  const [supportEmail, setSupportEmail] = useState('sanchit7613@gmail.com')
  const [otpInput, setOtpInput] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null)
  const [emailErrorMsg, setEmailErrorMsg] = useState<string | null>(null)

  const handleSendEmailOtp = async () => {
    setIsSendingOtp(true)
    setEmailSuccessMsg(null)
    setEmailErrorMsg(null)
    try {
      await api.post('/admin/settings/send-otp')
      setOtpSent(true)
      setEmailSuccessMsg('Verification OTP has been sent to your admin email address.')
    } catch (err: any) {
      console.error('Failed to send OTP:', err)
      setEmailErrorMsg(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleUpdateSupportEmail = async () => {
    setIsUpdatingEmail(true)
    setEmailSuccessMsg(null)
    setEmailErrorMsg(null)
    try {
      await api.patch('/admin/settings/support-email', {
        supportEmail,
        otp: otpInput
      })
      setEmailSuccessMsg('Support email updated successfully!')
      setOtpSent(false)
      setOtpInput('')
    } catch (err: any) {
      console.error('Failed to update support email:', err)
      setEmailErrorMsg(err.response?.data?.message || 'Failed to update support email. Please verify the OTP code.')
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  // Shipping rates state
  const [rates, setRates] = useState<ShippingRate[]>([])
  const [isRatesLoading, setIsRatesLoading] = useState(true)
  const [editingRateId, setEditingRateId] = useState<string | null>(null)
  const [rateForm, setRateForm] = useState({
    weightFrom: '',
    weightTo: '',
    localRate: '',
    sameStateRate: '',
    nationalRate: '',
  })

  const fetchRates = () => {
    setIsRatesLoading(true)
    api.get('/shipping/rates')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setRates(res.data.data)
        }
      })
      .catch(err => console.error('Failed to fetch shipping rates:', err))
      .finally(() => setIsRatesLoading(false))
  }

  useEffect(() => {
    // Fetch Settings
    api.get('/admin/settings')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setBusinessName(res.data.data.businessName || 'Skulture')
          setCodCharge(res.data.data.codCharge ?? 50)
          setSellerPincode(res.data.data.sellerPincode || '400001')
          setIsGstEnabled(res.data.data.isGstEnabled ?? true)
          setDefaultGstRate(res.data.data.defaultGstRate ?? 18.0)
          setPlatformFeeType(res.data.data.platformFeeType || 'FIXED')
          setPlatformFeeValue(res.data.data.platformFeeValue ?? 0.0)
          setVolumetricDivisor(res.data.data.volumetricDivisor ?? 5000.0)
          setSupportEmail(res.data.data.supportEmail || 'sanchit7613@gmail.com')
          setReturnAddress(res.data.data.returnAddress || '123 Maker Street, Print City, Filament State, 12345')
        }
      })
      .catch(err => {
        console.error('Failed to fetch settings:', err)
        setErrorMsg('Failed to load settings from server.')
      })
      .finally(() => setIsLoading(false))

    // Fetch Shipping Rates
    fetchRates()
  }, [])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    setSuccessMsg(null)
    setErrorMsg(null)
    try {
      await api.patch('/admin/settings', {
        businessName,
        codCharge: Number(codCharge),
        sellerPincode,
        isGstEnabled,
        defaultGstRate: Number(defaultGstRate),
        platformFeeType,
        platformFeeValue: Number(platformFeeValue),
        volumetricDivisor: Number(volumetricDivisor),
        returnAddress
      })
      setSuccessMsg('Settings updated successfully!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      console.error('Failed to save settings:', err)
      setErrorMsg(err.response?.data?.message || 'Failed to save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        id: editingRateId || undefined,
        weightFrom: Number(rateForm.weightFrom),
        weightTo: Number(rateForm.weightTo),
        localRate: Number(rateForm.localRate),
        sameStateRate: Number(rateForm.sameStateRate),
        nationalRate: Number(rateForm.nationalRate)
      }

      await api.post('/shipping/rates', payload)
      
      // Reset form
      setRateForm({
        weightFrom: '',
        weightTo: '',
        localRate: '',
        sameStateRate: '',
        nationalRate: ''
      })
      setEditingRateId(null)
      fetchRates()
    } catch (err: any) {
      console.error('Failed to save rate:', err)
      alert(err.response?.data?.message || 'Failed to save shipping rate.')
    }
  }

  const handleEditRate = (rate: ShippingRate) => {
    setEditingRateId(rate.id)
    setRateForm({
      weightFrom: rate.weightFrom.toString(),
      weightTo: rate.weightTo.toString(),
      localRate: rate.localRate.toString(),
      sameStateRate: rate.sameStateRate.toString(),
      nationalRate: rate.nationalRate.toString(),
    })
  }

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shipping rate slab?')) return
    try {
      await api.delete(`/shipping/rates/${id}`)
      fetchRates()
    } catch (err: any) {
      console.error('Failed to delete rate:', err)
      alert(err.response?.data?.message || 'Failed to delete shipping rate.')
    }
  }

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-4xl pb-16">
        <div>
          <h1 className="heading-2 text-white">Settings</h1>
          <p className="text-white/60 text-sm mt-1">Configure platform settings, origin shipping, and postal charges</p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-px">
          {[
            { id: 'general', label: 'General Configuration' },
            { id: 'payment', label: 'Payment & Tax Settings' },
            { id: 'support', label: 'Support Contacts' },
            { id: 'shipping', label: 'Shipping Slabs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-300 focus:outline-none whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary-text'
                  : 'border-transparent text-muted-text hover:text-primary-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="glass-card p-6 flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-white/50" />
          </div>
        ) : (
          <div className="space-y-6">
            {successMsg && (
              <div className="p-3.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-xl text-sm font-semibold">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold">
                {errorMsg}
              </div>
            )}

            {/* TAB CONTENT: GENERAL SETTINGS */}
            {activeTab === 'general' && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">General Configuration</h3>
                  <p className="text-xs text-white/50 mb-6">Manage core platform attributes and return settings</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-white/70 uppercase tracking-wider mb-2">Platform Name</label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Skulture"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 text-white focus:outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-white/70 uppercase tracking-wider mb-2">Origin Pincode (Warehouse/Seller)</label>
                      <input
                        type="text"
                        value={sellerPincode}
                        onChange={(e) => setSellerPincode(e.target.value)}
                        placeholder="400001"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 text-white focus:outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-[10px] font-black text-white/70 uppercase tracking-wider mb-2">Default Return Address (For Customer Returns)</label>
                    <textarea
                      rows={3}
                      value={returnAddress}
                      onChange={(e) => setReturnAddress(e.target.value)}
                      placeholder="123 Maker Street, Print City, Filament State, 12345"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 text-white focus:outline-none text-sm transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="border-t border-white/10 pt-6 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer text-sm"
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

            {/* TAB CONTENT: PAYMENT & TAXES */}
            {activeTab === 'payment' && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Payment & Tax Configuration</h3>
                  <p className="text-xs text-white/50 mb-6">Manage taxes, cash handling charges, platform fees, and shipping metrics</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-white/70 uppercase tracking-wider mb-2">Cash on Delivery (COD) Handling Charge (INR)</label>
                      <input
                        type="number"
                        value={codCharge}
                        onChange={(e) => setCodCharge(Number(e.target.value))}
                        placeholder="50"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 text-white focus:outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-white/70 uppercase tracking-wider mb-2">Volumetric Divisor (for Shipping Rates)</label>
                      <input
                        type="number"
                        value={volumetricDivisor}
                        onChange={(e) => setVolumetricDivisor(Number(e.target.value))}
                        placeholder="5000"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 text-white focus:outline-none text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div className="flex flex-col justify-center">
                      <span className="block text-[10px] font-black text-white/70 uppercase tracking-wider mb-2">Goods & Services Tax (GST)</span>
                      <div className="flex items-center gap-2.5 mt-1.5">
                        <input
                          type="checkbox"
                          id="isGstEnabled"
                          checked={isGstEnabled}
                          onChange={(e) => setIsGstEnabled(e.target.checked)}
                          className="rounded border-neutral-700 bg-white/5 text-primary focus:ring-primary w-4 h-4 cursor-pointer accent-white"
                        />
                        <label htmlFor="isGstEnabled" className="text-xs font-bold text-white/70 uppercase select-none cursor-pointer">
                          Enable GST calculations
                        </label>
                      </div>
                    </div>
                    {isGstEnabled && (
                      <div>
                        <label className="block text-[10px] font-black text-white/70 uppercase tracking-wider mb-2">Default GST Rate (%)</label>
                        <input
                          type="number"
                          value={defaultGstRate}
                          onChange={(e) => setDefaultGstRate(Number(e.target.value))}
                          placeholder="18"
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 text-white focus:outline-none text-sm transition-all"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div>
                      <label className="block text-[10px] font-black text-white/70 uppercase tracking-wider mb-2">Platform Fee Value</label>
                      <input
                        type="number"
                        value={platformFeeValue}
                        onChange={(e) => setPlatformFeeValue(Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 text-white focus:outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-white/70 uppercase tracking-wider mb-2">Platform Fee Type</label>
                      <select
                        value={platformFeeType}
                        onChange={(e) => setPlatformFeeType(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#1C1F22] border border-white/10 rounded-lg focus:border-white/30 text-white focus:outline-none text-sm transition-all cursor-pointer"
                      >
                        <option value="FIXED">Fixed Amount (₹)</option>
                        <option value="PERCENTAGE">Percentage (%)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="border-t border-white/10 pt-6 flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50 transition-all cursor-pointer text-sm"
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

            {/* TAB CONTENT: SUPPORT EMAIL */}
            {activeTab === 'support' && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Support Email Settings</h3>
                  <p className="text-xs text-white/50 mb-6">Configure the recipient email address for support inquiries. Requires OTP verification.</p>
                </div>

                {emailSuccessMsg && (
                  <div className="p-3.5 bg-green-500/15 border border-green-500/30 text-green-400 rounded-xl text-sm font-semibold">
                    {emailSuccessMsg}
                  </div>
                )}
                {emailErrorMsg && (
                  <div className="p-3.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold">
                    {emailErrorMsg}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-white/70 uppercase tracking-wider mb-2">Support Destination Email Address</label>
                    <div className="flex gap-4">
                      <input
                        type="email"
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="sanchit7613@gmail.com"
                        disabled={otpSent}
                        className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 text-white focus:outline-none text-sm transition-all disabled:opacity-60"
                      />
                      {!otpSent && (
                        <button
                          onClick={handleSendEmailOtp}
                          disabled={isSendingOtp || !supportEmail}
                          className="px-5 py-2.5 bg-white hover:bg-gray-100 text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSendingOtp ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            'Request OTP'
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {otpSent && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 border-t border-white/5 pt-4"
                    >
                      <div>
                        <label className="block text-[10px] font-black text-white/70 uppercase tracking-wider mb-2">Enter Verification OTP</label>
                        <input
                          type="text"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          placeholder="6-digit OTP code"
                          maxLength={6}
                          className="w-full sm:w-48 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg focus:border-white/30 text-white focus:outline-none text-sm transition-all"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateSupportEmail}
                          disabled={isUpdatingEmail || otpInput.length < 6}
                          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
                        >
                          {isUpdatingEmail ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Confirm & Change Email
                        </button>
                        <button
                          onClick={() => {
                            setOtpSent(false)
                            setOtpInput('')
                            setEmailErrorMsg(null)
                            setEmailSuccessMsg(null)
                          }}
                          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg transition-all text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: SHIPPING RATES */}
            {activeTab === 'shipping' && (
              <div className="glass-card p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">India Post Shipping Slabs</h3>
                  <p className="text-xs text-white/50 mb-6">Configure domestic shipping rates based on weight slabs and delivery zones</p>
                  
                  {/* Slab Manager Form */}
                  <form onSubmit={handleSaveRate} className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-bold text-white/60 uppercase mb-1.5">Weight From (g)</label>
                      <input
                        type="number"
                        required
                        value={rateForm.weightFrom}
                        onChange={(e) => setRateForm(prev => ({ ...prev, weightFrom: e.target.value }))}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-md focus:border-white/30 text-white focus:outline-none text-xs"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-bold text-white/60 uppercase mb-1.5">Weight To (g)</label>
                      <input
                        type="number"
                        required
                        value={rateForm.weightTo}
                        onChange={(e) => setRateForm(prev => ({ ...prev, weightTo: e.target.value }))}
                        placeholder="500"
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-md focus:border-white/30 text-white focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-white/60 uppercase mb-1.5">Local Rate (₹)</label>
                      <input
                        type="number"
                        required
                        value={rateForm.localRate}
                        onChange={(e) => setRateForm(prev => ({ ...prev, localRate: e.target.value }))}
                        placeholder="45"
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-md focus:border-white/30 text-white focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-white/60 uppercase mb-1.5">Same State (₹)</label>
                      <input
                        type="number"
                        required
                        value={rateForm.sameStateRate}
                        onChange={(e) => setRateForm(prev => ({ ...prev, sameStateRate: e.target.value }))}
                        placeholder="55"
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-md focus:border-white/30 text-white focus:outline-none text-xs"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1 flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-white/60 uppercase mb-1.5">National (₹)</label>
                        <input
                          type="number"
                          required
                          value={rateForm.nationalRate}
                          onChange={(e) => setRateForm(prev => ({ ...prev, nationalRate: e.target.value }))}
                          placeholder="70"
                          className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-md focus:border-white/30 text-white focus:outline-none text-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        className="p-2 bg-white text-black rounded-md hover:bg-gray-150 flex items-center justify-center shrink-0 cursor-pointer shadow"
                        title={editingRateId ? 'Save Edit' : 'Add Slab'}
                      >
                        {editingRateId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </button>
                      {editingRateId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRateId(null)
                            setRateForm({ weightFrom: '', weightTo: '', localRate: '', sameStateRate: '', nationalRate: '' })
                          }}
                          className="p-2 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 flex items-center justify-center shrink-0 cursor-pointer"
                          title="Cancel Edit"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Slabs List */}
                  {isRatesLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                    </div>
                  ) : rates.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/5 text-white/40 text-xs">
                      No shipping rate slabs configured. Using fallback default rates.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/5 text-white/60 font-bold uppercase tracking-wider">
                            <th className="p-3">Weight Range</th>
                            <th className="p-3 text-right">Local (City)</th>
                            <th className="p-3 text-right">Same State</th>
                            <th className="p-3 text-right">National</th>
                            <th className="p-3 text-center w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10 text-white/80">
                          {rates.map(rate => (
                            <tr key={rate.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 font-semibold">{rate.weightFrom} g – {rate.weightTo} g</td>
                              <td className="p-3 text-right font-medium text-white">₹{rate.localRate}</td>
                              <td className="p-3 text-right font-medium text-white">₹{rate.sameStateRate}</td>
                              <td className="p-3 text-right font-medium text-white">₹{rate.nationalRate}</td>
                              <td className="p-3 text-center flex justify-center gap-1">
                                <button
                                  onClick={() => handleEditRate(rate)}
                                  className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-all cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRate(rate.id)}
                                  className="p-1.5 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  )
}
