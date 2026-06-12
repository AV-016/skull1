'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { MapPin, Plus, Trash2, Edit3, Check, X, Loader2, Phone, ShieldCheck, User as UserIcon } from 'lucide-react'
import { useSendPhoneOtp, useVerifyPhoneOtp, useDeleteAccount } from '@/hooks/useAuth'

interface Address {
  id: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

export default function AccountPage() {
  const { user, logout, setUser } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddresses, setShowAddresses] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  // Phone Verification States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const sendOtpMutation = useSendPhoneOtp()
  const verifyOtpMutation = useVerifyPhoneOtp()
  const deleteAccountMutation = useDeleteAccount()

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      await sendOtpMutation.mutateAsync(phoneInput)
      setOtpSent(true)
      setCooldown(60)
      setSuccessMsg('Verification OTP has been sent via SMS.')
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      await verifyOtpMutation.mutateAsync({ phone: phoneInput, otp: otpInput })
      setSuccessMsg('Phone number verified successfully!')
      
      // Refresh profile data
      const res = await api.get('/auth/me')
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data)
      }
      
      setTimeout(() => {
        setIsModalOpen(false)
        setOtpSent(false)
        setPhoneInput('')
        setOtpInput('')
        setSuccessMsg(null)
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired OTP. Please try again.')
    }
  }

  
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: 'N/A',
    postalCode: '',
    country: 'India',
    phone: '',
    isDefault: false
  })
  const [formError, setFormError] = useState<string | null>(null)

  const fetchAddresses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/addresses')
      setAddresses(res.data.data || [])
    } catch (err) {
      console.error('Error fetching addresses:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showAddresses) {
      fetchAddresses()
    }
  }, [showAddresses, fetchAddresses])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setAddressForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const openAddForm = () => {
    setEditingAddress(null)
    setAddressForm({
      street: '',
      city: '',
      state: 'N/A',
      postalCode: '',
      country: 'India',
      phone: '',
      isDefault: false
    })
    setFormError(null)
    setIsFormOpen(true)
  }

  const openEditForm = (addr: Address) => {
    setEditingAddress(addr)
    setAddressForm({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: addr.country,
      phone: (addr as any).phone || '',
      isDefault: addr.isDefault
    })
    setFormError(null)
    setIsFormOpen(true)
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (addressForm.street.length < 5) {
      setFormError('Street address must be at least 5 characters long')
      return
    }
    if (addressForm.city.length < 2) {
      setFormError('City must be at least 2 characters long')
      return
    }
    if (addressForm.postalCode.length < 4) {
      setFormError('Postal code must be at least 4 characters long')
      return
    }

    try {
      if (editingAddress) {
        await api.patch(`/addresses/${editingAddress.id}`, addressForm)
      } else {
        await api.post('/addresses', addressForm)
      }
      setIsFormOpen(false)
      fetchAddresses()
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save address. Please try again.')
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      await api.delete(`/addresses/${id}`)
      fetchAddresses()
    } catch (err) {
      console.error('Error deleting address:', err)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/addresses/${id}/default`)
      fetchAddresses()
    } catch (err) {
      console.error('Error setting default address:', err)
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] dark:bg-[#0b0c10] text-[#1f2833] dark:text-[#c5c6c7] font-sans smooth-transition relative overflow-hidden">
      <Navbar />

      {/* Decorative Glow Mesh */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-red-600/10 via-orange-500/5 to-transparent rounded-full blur-3xl -z-10 animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-red-600/5 via-transparent to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Page Header */}
      <div className="pt-32 pb-16 relative overflow-hidden bg-gradient-to-b from-red-600/10 via-orange-500/5 to-transparent border-b border-border/60">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            <h1 className="text-3xl md:text-4xl font-extrabold text-black dark:text-white tracking-tight uppercase">
              Account Settings
            </h1>
            <p className="text-xs text-[#4f5d75] dark:text-[#9da8b6] max-w-md">
              Manage your profile details, secure contacts, and shipping configurations.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl space-y-8">
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Profile Info */}
            <div className="p-6 md:p-8 bg-white/70 dark:bg-[#12131a]/80 backdrop-blur-md border border-border/80 dark:border-[#1f2833]/30 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 pb-6 border-b border-border/60">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-red-500/20 select-none">
                  {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-extrabold text-black dark:text-white leading-tight">{user?.name || 'Explorer'}</h2>
                  <p className="text-xs text-[#d12626] font-bold uppercase tracking-wider mt-1">{user?.role || 'Customer'}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-[#4f5d75] dark:text-[#9da8b6] uppercase tracking-wider">Name</p>
                    <p className="text-[#1f2833] dark:text-[#c5c6c7] font-bold text-sm mt-1 capitalize">{user?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#4f5d75] dark:text-[#9da8b6] uppercase tracking-wider">Account Role</p>
                    <p className="text-[#d12626] font-bold text-sm mt-1 uppercase tracking-wider">{user?.role || 'Customer'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-secondary-text uppercase tracking-wider">Email Address</p>
                  <p className="text-primary-text font-bold text-sm mt-1">{user?.email || 'Not set'}</p>
                </div>

                <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-secondary-text uppercase tracking-wider">Phone Number</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {user?.isPhoneVerified ? (
                        <>
                          <span className="text-primary-text font-bold text-sm">{user.phone}</span>
                          <span className="flex items-center gap-1 text-[9px] bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-muted-text font-semibold text-xs italic">Not verified</span>
                          <span className="flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            ⚠️ Incomplete
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (user?.phone) {
                        setPhoneInput(user.phone)
                      }
                      setIsModalOpen(true)
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl tracking-wider uppercase transition shadow-md shadow-red-500/10 cursor-pointer"
                  >
                    {user?.isPhoneVerified ? 'Update Phone' : 'Verify Now'}
                  </button>
                </div>
              </div>
            </div>

            {/* Saved Addresses Section */}
            <div className="p-6 md:p-8 bg-white/70 dark:bg-[#12131a]/80 backdrop-blur-md border border-border/80 dark:border-[#1f2833]/30 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-black dark:text-white">Saved Addresses</h2>
                  <p className="text-xs text-[#4f5d75] dark:text-[#9da8b6]">Manage your default shipping details</p>
                </div>
                <button 
                  onClick={() => setShowAddresses(!showAddresses)} 
                  className="text-red-500 hover:text-red-600 hover:underline smooth-transition text-sm font-bold cursor-pointer"
                >
                  {showAddresses ? 'Hide Addresses ↑' : 'Manage Addresses →'}
                </button>
              </div>

              <AnimatePresence>
                {showAddresses && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 pt-4 border-t border-border/60 overflow-hidden"
                  >
                    {!isFormOpen && (
                      <div className="flex justify-end">
                        <button
                          onClick={openAddForm}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg smooth-transition cursor-pointer shadow-md shadow-red-500/10"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Address
                        </button>
                      </div>
                    )}

                    {/* Form to Add/Edit Address */}
                    {isFormOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-background border border-border rounded-xl"
                      >
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
                          <h3 className="font-bold text-xs text-primary-text">
                            {editingAddress ? 'Edit Address' : 'Add New Address'}
                          </h3>
                          <button 
                            onClick={() => setIsFormOpen(false)}
                            className="text-muted-text hover:text-primary-text cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <form onSubmit={handleSaveAddress} className="space-y-4">
                          {formError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg">
                              {formError}
                            </div>
                          )}
                          
                          <div>
                            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">Street Address</label>
                            <input
                              type="text"
                              name="street"
                              required
                              value={addressForm.street}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-primary-text focus:outline-none text-xs"
                              placeholder="e.g. 123 Main Road, Apt 4B"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">Phone Number</label>
                            <input
                              type="text"
                              name="phone"
                              required
                              value={addressForm.phone}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-primary-text focus:outline-none text-xs"
                              placeholder="e.g. +91 98765 43210"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">City</label>
                              <input
                                type="text"
                                name="city"
                                required
                                value={addressForm.city}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-primary-text focus:outline-none text-xs"
                                placeholder="e.g. Mumbai"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">Postal Code</label>
                              <input
                                type="text"
                                name="postalCode"
                                required
                                value={addressForm.postalCode}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-primary-text focus:outline-none text-xs"
                                placeholder="e.g. 400001"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">State</label>
                              <input
                                type="text"
                                name="state"
                                required
                                value={addressForm.state}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-primary-text focus:outline-none text-xs"
                                placeholder="e.g. Maharashtra"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-secondary-text uppercase tracking-wide block mb-1">Country</label>
                              <input
                                type="text"
                                name="country"
                                required
                                value={addressForm.country}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-primary-text focus:outline-none text-xs"
                                placeholder="e.g. India"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="checkbox"
                              id="isDefault"
                              name="isDefault"
                              checked={addressForm.isDefault}
                              onChange={handleInputChange}
                              className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="isDefault" className="text-xs font-semibold text-primary-text cursor-pointer select-none">
                              Set as default delivery address
                            </label>
                          </div>

                          <div className="flex justify-end gap-2 pt-4">
                            <button
                              type="button"
                              onClick={() => setIsFormOpen(false)}
                              className="px-4 py-2 border border-border text-primary-text text-xs font-bold rounded-lg hover:bg-secondary smooth-transition cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-lg smooth-transition cursor-pointer"
                            >
                              Save Address
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    {/* Loading indicator */}
                    {loading && (
                      <div className="flex items-center gap-2 text-muted-text py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-xs">Loading addresses...</span>
                      </div>
                    )}

                    {/* List of addresses */}
                    {!loading && addresses.length === 0 ? (
                      <div className="p-8 border border-dashed border-border rounded-xl text-center text-muted-text text-sm">
                        No saved addresses found. Add an address for future orders.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {addresses.map((addr) => (
                          <div 
                            key={addr.id} 
                            className={`p-4 bg-white/40 dark:bg-black/20 backdrop-blur-sm border rounded-xl flex flex-col justify-between gap-4 smooth-transition ${
                              addr.isDefault ? 'border-red-500 shadow-sm shadow-red-500/5' : 'border-border/60 hover:border-red-500/20'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between">
                                <span className="text-xs font-bold text-black dark:text-white capitalize">
                                  {user?.name || 'Customer Address'}
                                </span>
                                {addr.isDefault && (
                                  <span className="flex items-center gap-1 text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                    <Check className="w-3 h-3" /> Default
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-xs text-secondary-text mt-3 space-y-1">
                                <p>{addr.street}</p>
                                <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                                <p>{addr.country}</p>
                                {(addr as any).phone && <p className="text-muted-text font-medium mt-1">Phone: {(addr as any).phone}</p>}
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-2">
                              {!addr.isDefault ? (
                                <button
                                  onClick={() => handleSetDefault(addr.id)}
                                  className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer uppercase tracking-wider"
                                >
                                  Set as Default
                                </button>
                              ) : (
                                <span />
                              )}
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditForm(addr)}
                                  className="p-1.5 hover:bg-secondary text-muted-text hover:text-red-500 rounded smooth-transition cursor-pointer"
                                  title="Edit Address"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className="p-1.5 hover:bg-red-500/10 text-muted-text hover:text-red-500 rounded smooth-transition cursor-pointer"
                                  title="Delete Address"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Danger Zone */}
            <div className="p-6 md:p-8 border border-red-500/20 bg-red-500/5 dark:bg-red-950/10 backdrop-blur-md rounded-2xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
                <p className="text-xs text-[#4f5d75] dark:text-[#9da8b6]">
                  Manage critical security actions and session preferences.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-red-500/10">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-black dark:text-white mb-1">Sign Out</h3>
                  <p className="text-[11px] text-[#4f5d75] dark:text-[#9da8b6] mb-3">Terminate your active browser session.</p>
                  <button
                    onClick={logout}
                    className="px-5 py-2 border border-red-500 text-red-500 hover:text-white font-bold rounded-xl hover:bg-red-500 transition cursor-pointer text-[10px] uppercase tracking-wider"
                  >
                    Sign Out
                  </button>
                </div>

                <div className="flex-1 pt-4 sm:pt-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-red-500/10">
                  <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">Delete Account</h3>
                  <p className="text-[11px] text-[#4f5d75] dark:text-[#9da8b6] mb-3">Permanently delete your profile and all saved data.</p>
                  <button
                    onClick={async () => {
                      if (confirm('Are you absolutely sure you want to permanently delete your account? This action is irreversible and will erase all your orders, addresses, and data.')) {
                        try {
                          await deleteAccountMutation.mutateAsync()
                          alert('Your account has been deleted successfully.')
                        } catch (err: any) {
                          alert(err.response?.data?.message || 'Failed to delete account. Please try again.')
                        }
                      }
                    }}
                    disabled={deleteAccountMutation.isPending}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition cursor-pointer text-[10px] uppercase tracking-wider flex items-center gap-1.5"
                  >
                    {deleteAccountMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />

      {/* Phone Verification Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#12131a] border border-[#eaeaea] dark:border-[#1f2833]/60 rounded-2xl p-6 shadow-xl text-black dark:text-white"
            >
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setOtpSent(false)
                  setErrorMsg(null)
                  setSuccessMsg(null)
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-extrabold text-black dark:text-white mb-2">Verify Phone Number</h2>
              <p className="text-xs text-[#4f5d75] dark:text-[#9da8b6] mb-6">
                Enter your phone number in E.164 format (e.g. +919876543210) to verify your identity.
              </p>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl font-medium">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-xl font-medium">
                  {successMsg}
                </div>
              )}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+919876543210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0b0c10] border border-gray-200 dark:border-[#1f2833]/60 rounded-xl text-black dark:text-white focus:outline-none focus:border-red-500 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendOtpMutation.isPending}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md shadow-red-500/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {sendOtpMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : 'Send Verification OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      OTP sent to <span className="font-bold text-black dark:text-white">{phoneInput}</span>
                    </p>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">6-Digit OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#0b0c10] border border-gray-200 dark:border-[#1f2833]/60 rounded-xl text-black dark:text-white focus:outline-none focus:border-[#d12626] text-sm tracking-[0.2em] font-mono text-center"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifyOtpMutation.isPending}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md shadow-red-500/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {verifyOtpMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : 'Verify OTP'}
                  </button>

                  <div className="flex justify-between items-center text-xs mt-4">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-gray-500 hover:text-black dark:hover:text-white font-medium cursor-pointer"
                    >
                      ← Edit Number
                    </button>

                    <button
                      type="button"
                      disabled={cooldown > 0 || sendOtpMutation.isPending}
                      onClick={handleSendOtp}
                      className={`font-semibold cursor-pointer ${
                        cooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-600'
                      }`}
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}

