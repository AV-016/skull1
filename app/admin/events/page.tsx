'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Plus, X, Loader2, Info, Edit2, Trash2, Upload, Calendar } from 'lucide-react'
import api from '@/lib/api'

export default function AdminEvents() {
  const [events, setEvents] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bannerUrl: '',
    startDate: '',
    endDate: '',
    isActive: true,
    discountPercentage: 0,
    themeColor: '#EF4444',
    productIds: [] as string[]
  })

  const [isUploading, setIsUploading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchEventsAndProducts = async () => {
    setIsLoading(true)
    try {
      const [eventsRes, productsRes] = await Promise.all([
        api.get('/admin/events'),
        api.get('/products')
      ])
      setEvents(eventsRes.data?.data || [])
      setProducts(productsRes.data?.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEventsAndProducts()
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true)
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      
      const res = await api.post('/upload/product-image', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      if (res.data?.success && res.data?.data?.url) {
        setFormData(prev => ({ ...prev, bannerUrl: res.data.data.url }))
      } else {
        alert('Upload failed')
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error uploading file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed')
      return
    }
    
    await uploadFile(file)
  }

  const openAddModal = () => {
    setSelectedEvent(null)
    setFormData({
      title: '',
      description: '',
      bannerUrl: '',
      startDate: '',
      endDate: '',
      isActive: true,
      discountPercentage: 0,
      themeColor: '#EF4444',
      productIds: []
    })
    setIsModalOpen(true)
  }

  const openEditModal = (event: any) => {
    setSelectedEvent(event)
    
    // Format dates for input datetime-local format (YYYY-MM-DDTHH:MM)
    const formatDateTime = (dateStr: string) => {
      const d = new Date(dateStr)
      const pad = (num: number) => String(num).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    setFormData({
      title: event.title,
      description: event.description || '',
      bannerUrl: event.bannerUrl || '',
      startDate: formatDateTime(event.startDate),
      endDate: formatDateTime(event.endDate),
      isActive: event.isActive ?? true,
      discountPercentage: event.discountPercentage || 0,
      themeColor: event.themeColor || '#EF4444',
      productIds: event.products?.map((p: any) => p.id) || []
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/events/${id}`)
        fetchEventsAndProducts()
      } catch (error) {
        alert('Failed to delete event')
      }
    }
  }

  const handleProductToggle = (prodId: string) => {
    setFormData(prev => {
      const exists = prev.productIds.includes(prodId)
      if (exists) {
        return { ...prev, productIds: prev.productIds.filter(id => id !== prodId) }
      } else {
        return { ...prev, productIds: [...prev.productIds, prodId] }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (selectedEvent) {
        await api.patch(`/admin/events/${selectedEvent.id}`, formData)
      } else {
        await api.post('/admin/events', formData)
      }
      setIsModalOpen(false)
      fetchEventsAndProducts()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save event.')
    } finally {
      setSubmitting(false)
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-2 uppercase tracking-wide">Events & Offers</h1>
            <p className="text-xs text-muted-text uppercase tracking-widest">Manage promo events, banners, duration, and event categories</p>
          </div>
          <button 
            onClick={openAddModal}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 smooth-transition flex items-center gap-2 text-xs tracking-wider uppercase cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">Loading events...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event: any) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden border border-border bg-card/25 hover:border-primary/45 smooth-transition flex flex-col justify-between"
              >
                {/* Event Image Cover */}
                <div className="relative h-40 w-full bg-secondary/50 overflow-hidden group">
                  {event.bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={event.bannerUrl} 
                      alt={event.title} 
                      className="w-full h-full object-cover group-hover:scale-105 smooth-transition" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-text/30 p-4 border-b border-border/40">
                      <Upload className="w-8 h-8 mb-2" />
                      <span className="text-[10px] uppercase font-bold tracking-widest">No Banner Image</span>
                    </div>
                  )}
                  
                  {/* Floating Action Buttons */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => openEditModal(event)}
                      className="p-2 bg-background/85 hover:bg-primary hover:text-white text-primary-text rounded-md smooth-transition cursor-pointer shadow-lg"
                      title="Edit Event"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 bg-background/85 hover:bg-red-600 hover:text-white text-primary-text rounded-md smooth-transition cursor-pointer shadow-lg"
                      title="Delete Event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-sm text-primary-text uppercase tracking-wide">{event.title}</h3>
                      <span className={`px-2 py-0.5 border text-[9px] uppercase font-bold tracking-wider rounded ${
                        event.isActive 
                          ? 'bg-green-500/5 text-green-400 border-green-500/20' 
                          : 'bg-red-500/5 text-red-400 border-red-500/20'
                      }`}>
                        {event.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-text leading-relaxed line-clamp-3">
                      {event.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div className="space-y-1.5 text-[10px] uppercase tracking-wider text-secondary-text font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>Start: {new Date(event.startDate).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>End: {new Date(event.endDate).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/40 flex justify-between items-center text-[10px] text-muted-text uppercase font-bold tracking-widest">
                    <span>Discount: {event.discountPercentage || 0}% OFF</span>
                    <span>Products: {event.products?.length || 0}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            {events.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-text uppercase tracking-widest text-[10px] border border-dashed border-border p-6">
                No events or offers created yet. Add one above.
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-popover border border-border p-6 shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <h3 className="font-bold text-sm uppercase tracking-widest text-primary-text">
                  {selectedEvent ? 'Edit Event' : 'Add New Event'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-text hover:text-primary-text smooth-transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Event Title */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Event Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50"
                  />
                </div>

                {/* Discount Percentage */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Discount Percentage (% Off)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50"
                  />
                </div>

                {/* Theme Color Picker */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Theme Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={formData.themeColor}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                      className="w-10 h-10 border border-border bg-secondary cursor-pointer rounded"
                    />
                    <input
                      type="text"
                      required
                      value={formData.themeColor}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                      className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 font-mono text-xs uppercase"
                      placeholder="#EF4444"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 resize-y"
                  />
                </div>

                {/* Duration / Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">End Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Banner Upload Zone */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Event Banner Image</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive 
                        ? 'border-primary bg-primary/5' 
                        : formData.bannerUrl 
                          ? 'border-border/60 bg-secondary/20' 
                          : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {formData.bannerUrl ? (
                      <div className="space-y-3">
                        <div className="relative w-full h-32 mx-auto overflow-hidden rounded-md">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData.bannerUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, bannerUrl: '' }))
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full smooth-transition z-10"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-text">Drag & drop or click to replace</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {isUploading ? (
                          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                        ) : (
                          <Upload className="w-8 h-8 text-muted-text mx-auto" />
                        )}
                        <p className="text-[11px] font-medium text-primary-text">
                          {isUploading ? 'Uploading to Cloudinary...' : 'Drag & drop banner here or click to select'}
                        </p>
                        <p className="text-[9px] text-muted-text uppercase tracking-wider">Supports PNG, JPG, JPEG, WEBP</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="event-banner-file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadFile(file);
                      }}
                    />
                    <label
                      htmlFor="event-banner-file"
                      className="absolute inset-0 cursor-pointer z-0"
                    />
                  </div>
                </div>

                {/* Categorize Associated Products */}
                <div className="space-y-2 border-t border-border/40 pt-4">
                  <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Categorize Products under Event</label>
                  <p className="text-[9px] text-muted-text italic">Select which products will be showcased as part of this event/promotion</p>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-secondary/10 border border-border rounded-lg">
                    {products.map((prod: any) => {
                      const isChecked = formData.productIds.includes(prod.id)
                      return (
                        <label 
                          key={prod.id} 
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-secondary/40 rounded cursor-pointer smooth-transition select-none text-[10px] text-primary-text font-semibold"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleProductToggle(prod.id)}
                            className="w-3.5 h-3.5 rounded border-border bg-secondary text-primary accent-primary cursor-pointer"
                          />
                          <span className="truncate">{prod.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2 pt-2 select-none">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-secondary-text">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-0 accent-primary"
                    />
                    <span>Active & Visible</span>
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-border text-primary-text hover:bg-secondary smooth-transition uppercase tracking-widest text-[10px] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || isUploading}
                    className="px-6 py-2.5 bg-primary text-white hover:bg-primary/95 smooth-transition uppercase tracking-widest text-[10px] font-bold flex items-center gap-2 cursor-pointer"
                  >
                    {submitting && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    {selectedEvent ? 'Save Changes' : 'Create Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
