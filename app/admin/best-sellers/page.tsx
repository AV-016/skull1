'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAdminProducts, useUpdateProduct } from '@/hooks/useAdmin'
import { Loader2, Save, Trash2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function BestSellersManager() {
  const { data: products, isLoading, error, refetch } = useAdminProducts()
  const updateMutation = useUpdateProduct()
  
  // Local state for the 10 slots (key: 1 to 10, value: product ID or "")
  const [slots, setSlots] = useState<Record<number, string>>({
    1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: ''
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Initialize slots when products are loaded
  useEffect(() => {
    if (products) {
      const loadedSlots: Record<number, string> = {
        1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: ''
      }
      products.forEach((prod: any) => {
        const order = prod.bestSellerOrder
        if (order && order >= 1 && order <= 10) {
          loadedSlots[order] = prod.id
        }
      })
      setSlots(loadedSlots)
    }
  }, [products])

  const handleSlotChange = (slotNum: number, productId: string) => {
    setSlots(prev => {
      const next = { ...prev }
      
      // If this product was already selected in another slot, clear that slot
      Object.keys(next).forEach((k) => {
        const key = Number(k)
        if (key !== slotNum && next[key] === productId && productId !== '') {
          next[key] = ''
        }
      })
      
      next[slotNum] = productId
      return next
    })
    setSaveSuccess(false)
  }

  const handleClearSlot = (slotNum: number) => {
    setSlots(prev => ({
      ...prev,
      [slotNum]: ''
    }))
    setSaveSuccess(false)
  }

  const handleSaveLayout = async () => {
    if (!products) return
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const promises: Promise<any>[] = []

      // Go through each product and determine if its bestSellerOrder needs to be updated
      products.forEach((prod: any) => {
        let targetOrder = 0 // default to unset
        
        // Check if this product is assigned to any of our 10 slots
        const assignedSlot = Object.keys(slots).find(
          (k) => slots[Number(k)] === prod.id
        )
        
        if (assignedSlot) {
          targetOrder = Number(assignedSlot)
        }

        // Only trigger update if the value has changed
        const currentOrder = prod.bestSellerOrder ?? 0
        if (currentOrder !== targetOrder) {
          // Prepare the payload (replicating fields standard in edit mutations)
          const payload = {
            bestSellerOrder: targetOrder
          }
          promises.push(
            updateMutation.mutateAsync({
              id: prod.id,
              data: payload
            })
          )
        }
      })

      if (promises.length > 0) {
        await Promise.all(promises)
      }
      
      setSaveSuccess(true)
      refetch()
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save best sellers layout')
    } finally {
      setIsSaving(false)
    }
  }

  // Filter products that can be selected (active, non-placeholder images)
  const activeProducts = products?.filter((p: any) => p.isActive) || []

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="heading-2 uppercase tracking-wide">Best Sellers Manager</h1>
            <p className="text-xs text-muted-text uppercase tracking-widest">
              Assign and arrange products in slots 1 to 10 to control the storefront showcase
            </p>
          </div>
          <button
            onClick={handleSaveLayout}
            disabled={isSaving || isLoading}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg smooth-transition flex items-center justify-center gap-2 text-xs tracking-wider uppercase disabled:opacity-50 cursor-pointer w-full md:w-auto shadow-lg shadow-primary/10"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Layout
          </button>
        </div>

        {/* Notifications */}
        {saveSuccess && (
          <div className="p-4 border border-green-500/20 bg-green-500/5 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-xs text-green-400 font-bold uppercase tracking-wider">
              Layout saved successfully! The storefront has been updated.
            </p>
          </div>
        )}

        {saveError && (
          <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-400 font-bold uppercase tracking-wider">{saveError}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">Loading layout...</p>
          </div>
        ) : error ? (
          <div className="p-6 border border-red-500/20 bg-red-500/5 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-red-500 text-sm">Failed to Load Products</h4>
              <p className="text-xs text-muted-text">Please verify your database connection and refresh.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, idx) => {
              const slotNum = idx + 1
              const assignedProductId = slots[slotNum]
              const assignedProduct = products?.find((p: any) => p.id === assignedProductId) as any
              const primaryImg = assignedProduct?.images?.find((img: any) => img.isPrimary)?.url || assignedProduct?.image || '/placeholder.jpg'

              return (
                <div 
                  key={slotNum} 
                  className={`glass-card border rounded-xl overflow-hidden flex flex-col justify-between smooth-transition ${
                    slotNum === 1 
                      ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20 md:col-span-2 lg:col-span-2' 
                      : 'border-border bg-secondary/20 hover:border-border-hover'
                  }`}
                >
                  {/* Slot Banner */}
                  <div className={`px-4 py-2 border-b flex items-center justify-between text-[10px] font-black uppercase tracking-wider ${
                    slotNum === 1 
                      ? 'bg-primary/25 border-primary/25 text-primary-text' 
                      : 'bg-secondary/40 border-border text-secondary-text'
                  }`}>
                    <span>Slot {slotNum} {slotNum === 1 ? '★ Main Hero' : ''}</span>
                    {assignedProduct && (
                      <button
                        onClick={() => handleClearSlot(slotNum)}
                        className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 smooth-transition cursor-pointer"
                        title="Clear Slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Slot Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                    {assignedProduct ? (
                      <div className="flex gap-3 items-center">
                        <div className="w-12 h-12 rounded border border-border overflow-hidden bg-secondary flex-shrink-0">
                          <img 
                            src={primaryImg} 
                            alt={assignedProduct.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="overflow-hidden flex-1 text-left">
                          <p className="font-bold text-[11px] text-primary-text truncate leading-tight">{assignedProduct.name}</p>
                          <p className="text-[9px] text-muted-text capitalize mt-0.5">{assignedProduct.category?.name || 'Product'}</p>
                          <p className="text-xs font-bold text-primary mt-1">{formatCurrency(assignedProduct.price)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-border/80 rounded-lg bg-secondary/10">
                        <p className="text-[10px] text-muted-text uppercase tracking-widest font-semibold">Empty Slot</p>
                        <p className="text-[9px] text-neutral-500 mt-1">Select a product below</p>
                      </div>
                    )}

                    {/* Product Selector */}
                    <div className="space-y-1">
                      <select
                        value={assignedProductId}
                        onChange={(e) => handleSlotChange(slotNum, e.target.value)}
                        className="w-full px-2 py-1.5 bg-secondary border border-border text-primary-text text-[11px] focus:outline-none focus:border-primary/50 cursor-pointer rounded-md font-semibold"
                      >
                        <option value="">-- Choose Product --</option>
                        {activeProducts.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.price})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </AdminLayout>
  )
}
