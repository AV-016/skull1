'use client'

import { useState, useEffect } from 'react'
import { useOrderDetail } from '@/hooks/useOrders'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Printer, ArrowLeft, Receipt, FileText, Phone, Mail, MapPin, ShieldCheck, Truck } from 'lucide-react'
import { LoadingSpinner } from '@/components/states/LoadingSpinner'
import { ErrorState } from '@/components/states/ErrorState'

interface SettingsData {
  businessName: string
  upiId?: string
  supportEmail?: string
  supportPhone?: string
  sellerPincode: string
  returnAddress: string
  isGstEnabled: boolean
  defaultGstRate: number
}

export default function OrderInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  const autoPrint = searchParams.get('print') === 'true'

  const { data: order, isLoading, error, refetch } = useOrderDetail(orderId)
  const { user, isAdmin } = useAuth()
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [layoutMode, setLayoutMode] = useState<'invoice' | 'label' | 'delivery'>('label') // default to the redesigned label/slip

  useEffect(() => {
    api.get('/settings')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setSettings(res.data.data)
        }
      })
      .catch(err => console.error('Error fetching settings for invoice:', err))
  }, [])

  // Redirect customer if they try to access admin-only delivery label
  useEffect(() => {
    if (layoutMode === 'delivery' && !isAdmin) {
      setLayoutMode('label')
    }
  }, [layoutMode, isAdmin])

  // Auto trigger print dialog if query param is set and data is loaded
  useEffect(() => {
    if (autoPrint && order && settings) {
      setTimeout(() => {
        window.print()
      }, 800)
    }
  }, [autoPrint, order, settings])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <p className="text-sm font-semibold tracking-wider text-neutral-400">Loading billing invoice details...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
        <ErrorState
          title="Invoice Load Failure"
          message={error?.message || "Failed to load order invoice details. Please refresh or try again."}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const subtotalVal = order.subtotal || order.totalAmount || 0
  const shippingVal = order.shippingCharge || 0
  const platformFeeVal = order.platformFee || 0
  const gstVal = order.gstAmount || 0
  const discountVal = order.discountAmount || 0
  const grandTotalVal = order.totalAmount || (subtotalVal + shippingVal + platformFeeVal + gstVal - discountVal)

  // Split long street address for labels
  const parseStreetParts = (streetStr: string) => {
    const parts = { streetNo: '', locality: '', landmark: '' }
    if (!streetStr) return parts
    if (streetStr.includes('Street/House No:') && streetStr.includes('Locality:')) {
      const bits = streetStr.split('|')
      bits.forEach(bit => {
        const trimmed = bit.trim()
        if (trimmed.startsWith('Street/House No:')) {
          parts.streetNo = trimmed.replace('Street/House No:', '').trim()
        } else if (trimmed.startsWith('Locality:')) {
          parts.locality = trimmed.replace('Locality:', '').trim()
        } else if (trimmed.startsWith('Landmark:')) {
          parts.landmark = trimmed.replace('Landmark:', '').trim()
        }
      })
    } else {
      parts.streetNo = streetStr
    }
    return parts
  }

  const addressInfo = order.address || {}
  const streetParts = parseStreetParts(addressInfo.street || '')

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans print:bg-white print:text-black">
      
      {/* Control panel - hidden during print */}
      <div className="bg-neutral-900 text-white py-4 px-6 sticky top-0 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4 shadow-md print:hidden z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/orders/${orderId}`)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-750 px-3 py-1.5 rounded-lg smooth-transition font-bold cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase">Order Invoice Manager</h1>
            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">#{order.orderNumber || order.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Layout Mode Selector */}
          <div className="flex items-center gap-2 bg-neutral-850 p-1.5 rounded-lg border border-neutral-850">
            <button
              onClick={() => setLayoutMode('label')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                layoutMode === 'label' ? 'bg-primary text-white shadow-sm' : 'text-neutral-450 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Packing Slip (A4)
            </button>
            <button
              onClick={() => setLayoutMode('invoice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                layoutMode === 'invoice' ? 'bg-primary text-white shadow-sm' : 'text-neutral-450 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" /> Tax Invoice (A4)
            </button>
            {isAdmin && (
              <button
                onClick={() => setLayoutMode('delivery')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  layoutMode === 'delivery' ? 'bg-primary text-white shadow-sm' : 'text-neutral-450 hover:text-white'
                }`}
              >
                <Truck className="w-3.5 h-3.5" /> Delivery Label (Admin)
              </button>
            )}
          </div>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg smooth-transition cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" /> Print Document
          </button>
        </div>
      </div>

      {/* Printable Area Wrapper */}
      <div className="container mx-auto px-4 py-8 flex justify-center print:p-0 print:m-0 print:w-full">
        
        {layoutMode === 'invoice' ? (
          /* ========================================================================= */
          /* 1. Full A4 Tax Invoice Page                                               */
          /* ========================================================================= */
          <div className="bg-white border border-neutral-200 p-8 w-full max-w-[800px] shadow-sm rounded-xl print:shadow-none print:border-none print:p-0 print:m-0 print:w-full min-h-[1050px] flex flex-col justify-between">
            <div>
              {/* Header Grid */}
              <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-6 mb-6">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-wider text-neutral-900 font-sans">{settings?.businessName || 'SKULTURE'}</h2>
                  <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest mt-1">3D Printing Marketplace</p>
                  <div className="text-[10px] text-neutral-500 mt-3 space-y-0.5 font-sans leading-relaxed">
                    <p className="font-bold text-neutral-800">Sold By:</p>
                    <p className="max-w-xs">{settings?.returnAddress || 'Plot 4, Filament Industrial Area, Maker City'}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider rounded mb-4">Tax Invoice</span>
                  <div className="text-[10px] text-neutral-600 space-y-1 font-mono">
                    <p><span className="font-bold text-neutral-500 uppercase">Invoice No:</span> INV-{order.id.slice(-8).toUpperCase()}</p>
                    <p><span className="font-bold text-neutral-500 uppercase">Order ID:</span> #{order.orderNumber || order.id}</p>
                    <p><span className="font-bold text-neutral-500 uppercase">Date:</span> {formatDate(order.createdAt)}</p>
                    <p><span className="font-bold text-neutral-500 uppercase">Payment Method:</span> {order.paymentMethod === 'COD' ? 'Cash On Delivery' : 'Online (Razorpay)'}</p>
                    <p>
                      <span className="font-bold text-neutral-500 uppercase">Payment Status:</span>{' '}
                      <span className="font-sans font-bold capitalize">
                        {order.paymentStatus === 'REFUNDED'
                          ? 'Refunded'
                          : order.status?.toUpperCase() === 'CANCELLED'
                          ? 'Cancelled'
                          : order.paymentMethod === 'COD'
                          ? order.status?.toUpperCase() === 'DELIVERED'
                            ? 'Paid (Collected on Delivery)'
                            : 'Collect on Delivery'
                          : order.paymentStatus === 'PAID'
                          ? 'Paid'
                          : 'Pending'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Billing and Shipping Grid */}
              <div className="grid grid-cols-2 gap-8 border-b border-neutral-200 pb-6 mb-6">
                <div>
                  <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider mb-2">Billed To</h3>
                  <div className="text-xs text-neutral-800 space-y-1 font-sans capitalize">
                    <p className="font-bold text-neutral-900">{order.user?.name || 'Customer Details'}</p>
                    <p>{order.user?.email || 'N/A'}</p>
                    {addressInfo.phone && <p className="normal-case">Contact: {addressInfo.phone}</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider mb-2">Shipped To</h3>
                  <div className="text-xs text-neutral-800 space-y-1 font-sans leading-relaxed capitalize">
                    <p className="font-bold text-neutral-900">{order.user?.name || 'Customer'}</p>
                    {streetParts.streetNo && <p>House/Street: {streetParts.streetNo}</p>}
                    {streetParts.locality && <p>Locality: {streetParts.locality}</p>}
                    {streetParts.landmark && <p className="font-normal normal-case text-[10px] text-neutral-500">Landmark: {streetParts.landmark}</p>}
                    <p>{addressInfo.city || 'N/A'}, {addressInfo.state || 'N/A'} - {addressInfo.postalCode || 'N/A'}</p>
                    <p>{addressInfo.country || 'India'}</p>
                    {addressInfo.phone && <p className="normal-case font-bold mt-1 text-[11px]">Phone: {addressInfo.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-xs mb-8">
                <thead>
                  <tr className="border-b border-neutral-300 text-neutral-400 uppercase text-[9px] font-black tracking-wider pb-2">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Taxable Value</th>
                    <th className="py-2 text-right">IGST ({settings?.defaultGstRate || 0}%)</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {order.items?.map((item: any, idx: number) => {
                    const price = item.price || 0
                    const quantity = item.quantity || 1
                    const totalCost = price * quantity

                    // Standard Tax Breakdown Calculations (Reverse-Engineered if Tax is inclusive)
                    const taxRate = settings?.defaultGstRate || 0
                    const gstEnabled = settings?.isGstEnabled || false
                    let taxableValue = totalCost
                    let taxValue = 0

                    if (gstEnabled && taxRate > 0) {
                      taxableValue = totalCost / (1 + taxRate / 100)
                      taxValue = totalCost - taxableValue
                    }

                    return (
                      <tr key={idx} className="py-3">
                        <td className="py-3 pr-4">
                          <p className="font-bold text-neutral-900">{item.name || item.product?.name || '3D Printed Product'}</p>
                          {item.variant?.name && (
                            <span className="text-[10px] text-neutral-500 font-medium font-sans">Variant: {item.variant.name}</span>
                          )}
                          {item.product?.specifications && (
                            <div className="text-[9px] text-neutral-400 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                              {Object.entries(item.product.specifications).map(([k, v]: any) => (
                                <span key={k}>{k}: {v}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-center font-mono">{quantity}</td>
                        <td className="py-3 text-right font-mono">{formatCurrency(price)}</td>
                        <td className="py-3 text-right font-mono">{formatCurrency(taxableValue)}</td>
                        <td className="py-3 text-right font-mono">{formatCurrency(taxValue)}</td>
                        <td className="py-3 text-right font-bold font-mono">{formatCurrency(totalCost)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations and Footer summary */}
            <div className="border-t border-neutral-200 pt-6">
              <div className="grid grid-cols-5 gap-4">
                
                {/* Payment summary note */}
                <div className="col-span-3 text-[10px] text-neutral-500 leading-relaxed font-sans pr-6">
                  <p className="font-bold uppercase tracking-wider mb-1.5 text-neutral-700">Terms & Conditions:</p>
                  <p>1. Invoice is generated automatically upon payment authorization / delivery log confirmation.</p>
                  <p>2. Goods once sold are only eligible for returns within 3 days under marketplace policy rules.</p>
                  <p>3. Dynamic calculations are certified by Skulture Pricing Engine.</p>
                  
                  {order.paymentMethod === 'COD' && order.status !== 'DELIVERED' && (
                    <div className="mt-4 p-3 border border-amber-500/20 bg-amber-500/5 text-amber-600 font-bold rounded flex items-center gap-1.5 uppercase tracking-wider text-[9px]">
                      <span>⚠️</span> Cash On Delivery: Cash collection of {formatCurrency(grandTotalVal)} is required at doorstep.
                    </div>
                  )}
                </div>

                {/* Pricing Grid */}
                <div className="col-span-2 text-xs space-y-2 border-l border-neutral-100 pl-6 font-sans">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCurrency(subtotalVal)}</span>
                  </div>
                  {discountVal > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount</span>
                      <span className="font-mono">-{formatCurrency(discountVal)}</span>
                    </div>
                  )}
                  {settings?.isGstEnabled && gstVal > 0 && (
                    <div className="flex justify-between text-neutral-600">
                      <span>GST Amount</span>
                      <span className="font-mono">{formatCurrency(gstVal)}</span>
                    </div>
                  )}
                  {platformFeeVal > 0 && (
                    <div className="flex justify-between text-neutral-600">
                      <span>Platform Fee</span>
                      <span className="font-mono">{formatCurrency(platformFeeVal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-600">
                    <span>Shipping Charges</span>
                    <span className="font-mono">{formatCurrency(shippingVal)}</span>
                  </div>

                  <div className="border-t border-neutral-900 pt-2 flex justify-between font-black text-sm text-neutral-900 border-b pb-2">
                    <span>Grand Total</span>
                    <span className="font-mono text-base">{formatCurrency(grandTotalVal)}</span>
                  </div>

                  {order.paymentMethod === 'COD' && order.status !== 'DELIVERED' ? (
                    <p className="text-[10px] text-right font-black uppercase text-amber-500 tracking-wider mt-1.5">Collect on Delivery</p>
                  ) : (
                    <p className="text-[10px] text-right font-black uppercase text-green-600 tracking-wider mt-1.5 flex items-center justify-end gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Authorized Payment
                    </p>
                  )}
                </div>

              </div>

              {/* Print Date */}
              <div className="border-t border-neutral-100 pt-4 mt-8 flex justify-between items-center text-[9px] text-neutral-400 font-mono">
                <span>Printed on: {new Date().toLocaleString()}</span>
                <span>System Invoice ID: {order.id}</span>
              </div>
            </div>

          </div>
        ) : layoutMode === 'delivery' ? (
          /* ========================================================================= */
          /* 3. A4 Delivery Label (Admin Only - Stick on Package)                      */
          /* ========================================================================= */
          <div className="bg-white border-4 border-black p-6 w-full max-w-[800px] print:border-4 print:border-black print:p-5 print:m-0 print:w-full flex flex-col justify-start gap-4 font-sans select-none animate-fade-in">
            <div>
              {/* TOP HEADER - SENDER & BRAND */}
              <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-4">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-wider text-black">SKULTURE 3D PRINTING</h2>
                  <p className="text-xs uppercase font-bold text-neutral-500 tracking-wider mt-0.5">Fulfillment & Delivery Division</p>
                  
                  {/* Sender address */}
                  <div className="text-xs text-neutral-700 mt-3 space-y-0.5 font-sans">
                    <p className="font-bold text-black uppercase tracking-wider text-[9px]">Sender Details (If Undelivered, Return To):</p>
                    <p className="font-black text-black text-sm">{settings?.businessName || 'SKULTURE'}</p>
                    <p className="max-w-md font-bold leading-relaxed">{settings?.returnAddress || 'Plot 4, Filament Area, Maker City'}</p>
                    <p className="font-bold font-mono">ZIP/PIN: {settings?.sellerPincode || '140413'}</p>
                  </div>
                </div>

                {/* BIG ROUTING BOX */}
                <div className="border-4 border-black p-3 text-center min-w-[200px] bg-transparent text-black rounded-lg">
                  <span className="text-[9px] uppercase tracking-widest font-black text-neutral-500 block mb-0.5">Logistics Routing</span>
                  <p className="font-mono font-black text-base text-black">#{order.orderNumber || order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-[9px] text-neutral-500 font-mono mt-0.5">PIN: {addressInfo.postalCode || 'N/A'}</p>
                </div>
              </div>

              {/* GIANT PAYMENT COLLECT BLOCK */}
              <div className="mb-4">
                {order.paymentMethod === 'COD' ? (
                  <div className="border-4 border-black bg-transparent text-black p-4 rounded-lg text-left select-none flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-wider">CASH ON DELIVERY (COD)</h3>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Do not release parcel without cash collection</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black font-mono text-black">COLLECT: {formatCurrency(grandTotalVal)}</p>
                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-1 flex items-center justify-end gap-1 font-mono">
                        ⚠️ COLLECT ON DELIVERY
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border-4 border-black bg-transparent text-black p-4 rounded-lg text-left select-none flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-wider text-black">PREPAID PARCEL</h3>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Fully Paid Online • Hand Over Parcel Directly</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black font-mono text-black">COLLECT: NIL (₹0.00)</p>
                      <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mt-1 flex items-center justify-end gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-green-600" /> AUTHORIZED PAYMENT
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* COURIER LABEL PLACEHOLDER (Dashed outline) */}
              <div className="border-4 border-dashed border-neutral-400 rounded-xl h-32 bg-neutral-50/10 flex flex-col items-center justify-center text-center p-4 mb-4 select-none">
                <span className="text-xs font-black uppercase tracking-wider text-neutral-500 mb-1">Paste Carrier / AWB Shipping Label Here</span>
                <p className="text-[10px] text-neutral-400 max-w-md leading-relaxed font-medium">
                  This card area reserves space for the official barcode label generated by Shiprocket, Delhivery, or Blue Dart. Ensure it does not cover the customer address below.
                </p>
              </div>

              {/* GIANT SHIP TO DELIVERY BLOCK */}
              <div className="border-4 border-black rounded-xl p-4 bg-neutral-50/10 mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-450 block mb-2">DELIVER TO (RECIPIENT):</span>
                
                <div className="space-y-3">
                  {/* Customer name */}
                  <h4 className="text-xl font-black uppercase tracking-wide text-black leading-none">{order.user?.name || 'Recipient Details'}</h4>
                  
                  {/* Physical Address */}
                  <div className="text-xs text-black leading-relaxed font-bold space-y-1 capitalize">
                    {streetParts.streetNo && <p>Street/House No: {streetParts.streetNo}</p>}
                    {streetParts.locality && <p>Locality/Village: {streetParts.locality}</p>}
                    {streetParts.landmark && <p className="normal-case text-neutral-500 text-[10px] font-medium">Landmark: {streetParts.landmark}</p>}
                    <p className="text-sm font-black text-black">
                      {addressInfo.city || 'N/A'}, {addressInfo.state || 'N/A'} - <span className="font-mono bg-black text-white px-2 py-0.5 rounded text-[11px]">{addressInfo.postalCode || 'N/A'}</span>
                    </p>
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono mt-0.5">{addressInfo.country || 'India'}</p>
                  </div>

                  {/* GIANT CONTACT PHONE BLOCK */}
                  {addressInfo.phone && (
                    <div className="pt-2.5 border-t-2 border-black flex items-center gap-2 text-base font-black text-black font-mono select-none font-bold">
                      <Phone className="w-4 h-4 text-black shrink-0" />
                      <span>PRIMARY PHONE: {addressInfo.phone}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* MONOCHROME FOOTER & FRAGILE SYMBOLS */}
            <div className="border-t-4 border-black pt-4 mt-4">
              <div className="flex justify-between items-center text-[9px] text-neutral-500 font-mono uppercase tracking-wider select-none">
                <div>
                  <p className="font-black text-black">Skulture Fulfillment System</p>
                  <p className="text-[8px]">Order Ref: #{order.id}</p>
                </div>

                {/* Fragile Center Symbols */}
                <div className="flex flex-col items-center justify-center gap-1 font-black text-black">
                  <div className="flex items-center gap-4 text-[16px]">
                    <span>🍷</span>
                    <span>☔</span>
                    <span>⬆️</span>
                  </div>
                  <p className="text-[7px] tracking-widest">FRAGILE • KEEP DRY • THIS SIDE UP</p>
                </div>

                <div className="text-right">
                  <p className="text-[8px]">Label printed on: {new Date().toLocaleDateString()}</p>
                  <p className="font-black text-black">Version: LBL-4.0.0</p>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* 2. Redesigned Premium Packing Slip / Shipping Label (A4 Portrait)         */
          /* ========================================================================= */
          <div className="bg-white border border-neutral-300 p-6 w-full max-w-[800px] shadow-sm rounded-xl print:shadow-none print:border-none print:p-0 print:m-0 print:w-full flex flex-col justify-start gap-4 font-sans">
            <div>
              {/* BRAND HEADER ROW */}
              <div className="flex justify-between items-center border-b-2 border-neutral-900 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  {/* Premium geometric Cube SVG representing Skulture */}
                  <svg className="w-9 h-9 text-neutral-900 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-wider text-neutral-900">SKULTURE</h2>
                    <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Premium 3D Printing Marketplace</span>
                  </div>
                </div>

                {/* DYNAMIC GRScale BADGES */}
                <div className="flex flex-wrap gap-1.5 justify-end max-w-xs">
                  {order.paymentMethod === 'COD' && (
                    <span className="border border-neutral-900 bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono font-bold">
                      COD
                    </span>
                  )}
                  {order.shippingZone?.toLowerCase().includes('express') && (
                    <span className="border border-neutral-900 bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono font-bold">
                      EXPRESS SHIPPING
                    </span>
                  )}
                  {order.orderNumber?.startsWith('CR-') && (
                    <span className="border border-neutral-900 bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono font-bold">
                      CUSTOM PRINT
                    </span>
                  )}
                  {grandTotalVal > 5000 && (
                    <span className="border border-neutral-900 bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono font-bold">
                      BULK ORDER
                    </span>
                  )}
                  <span className="border border-neutral-950 bg-neutral-950 text-white px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono font-bold">
                    HIGH PRIORITY
                  </span>
                </div>
              </div>

              {/* TWO COLUMN GRID LAYOUT */}
              <div className="grid grid-cols-12 gap-6 items-start">
                
                {/* LEFT COLUMN: Ship To, Products, Courier Paste Area */}
                <div className="col-span-7 space-y-5">
                  
                  {/* SHIP TO (Customer Information Card) */}
                  <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
                    <h3 className="text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 stroke-[2.5]" /> Ship To
                    </h3>
                    <div className="space-y-2">
                      <h4 className="text-base font-black uppercase tracking-wide text-neutral-900">{order.user?.name || 'Customer Details'}</h4>
                      
                      <div className="text-xs text-neutral-800 space-y-1 font-sans leading-relaxed capitalize">
                        {streetParts.streetNo && <p>Street: {streetParts.streetNo}</p>}
                        {streetParts.locality && <p>Locality: {streetParts.locality}</p>}
                        {streetParts.landmark && <p className="normal-case text-neutral-500 text-[10px]">Landmark: {streetParts.landmark}</p>}
                        <p className="font-bold text-neutral-900">
                          {addressInfo.city || 'N/A'}, {addressInfo.state || 'N/A'} - {addressInfo.postalCode || 'N/A'}
                        </p>
                        <p className="text-[9px] text-neutral-400 font-mono uppercase tracking-wider mt-0.5">{addressInfo.country || 'India'}</p>
                      </div>

                      <div className="pt-2.5 border-t border-neutral-200/80 flex flex-col gap-1.5 text-xs text-neutral-700">
                        {addressInfo.phone && (
                          <div className="flex items-center gap-2 font-bold text-neutral-900">
                            <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="normal-case">{addressInfo.phone}</span>
                          </div>
                        )}
                        {order.user?.email && (
                          <div className="flex items-center gap-2 normal-case font-medium">
                            <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>{order.user.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PRODUCT INFORMATION (Product Cards) */}
                  <div className="border border-neutral-200 rounded-lg p-4">
                    <h3 className="text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-3">Product Information</h3>
                    <div className="space-y-4">
                      {order.items?.map((item: any, idx: number) => {
                        // Specs resolution
                        const specMaterial = item.product?.specifications?.Material || 'PLA'
                        const specColor = item.product?.specifications?.Color || 'Matte Black'
                        const specWeight = item.product?.specifications?.Weight || '620 g'
                        const specDimensions = item.product?.specifications?.Dimensions || '28 × 22 × 20 cm'
                        const specSku = item.product?.sku || `SKT-${(item.product?.category || '3DP').slice(0,3).toUpperCase()}-${order.id.slice(-6).toUpperCase()}-${idx + 1}`

                        return (
                          <div key={idx} className="flex gap-4 items-start border-b border-neutral-100 pb-4 last:border-0 last:pb-0">
                            {/* Product Thumbnail Mock */}
                            <div className="w-14 h-14 bg-neutral-100 border border-neutral-200 rounded-lg flex items-center justify-center shrink-0">
                              <svg className="w-7 h-7 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                                <polyline points="2 17 12 22 22 17" />
                                <polyline points="2 12 12 17 22 12" />
                              </svg>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-black text-neutral-900 truncate uppercase leading-tight">{item.name || item.product?.name || '3D Printed Product'}</h4>
                              <p className="text-[9px] text-neutral-400 font-mono mt-0.5">SKU: {specSku}</p>
                              
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-neutral-700 mt-2 font-sans">
                                <div><span className="text-neutral-400 font-medium">Qty:</span> <span className="font-bold text-neutral-900">{item.quantity || 1}</span></div>
                                <div><span className="text-neutral-400 font-medium">Material:</span> <span className="font-bold text-neutral-900">{specMaterial}</span></div>
                                <div><span className="text-neutral-400 font-medium">Color:</span> <span className="font-bold text-neutral-900">{specColor}</span></div>
                                <div><span className="text-neutral-400 font-medium">Weight:</span> <span className="font-bold text-neutral-900">{specWeight}</span></div>
                                <div className="col-span-2 mt-0.5"><span className="text-neutral-400 font-medium">Dimensions:</span> <span className="font-bold text-neutral-900">{specDimensions}</span></div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* CUSTOMER NOTES (Only show if present) */}
                  {order.returnReason && (
                    <div className="border border-amber-300 rounded-lg p-4 bg-amber-500/5 text-amber-800">
                      <h3 className="text-[9px] font-black uppercase tracking-wider text-amber-600 mb-2">Customer Instructions</h3>
                      <ul className="text-xs space-y-1 font-semibold leading-relaxed font-sans list-disc list-inside">
                        <li>{order.returnReason}</li>
                      </ul>
                    </div>
                  )}

                </div>

                {/* RIGHT COLUMN: Info Card, Checklist, Production, Packaging, QR Code */}
                <div className="col-span-5 space-y-5">
                  
                  {/* COMPACT ORDER INFO CARD */}
                  <div className="border border-neutral-900 rounded-lg p-4 bg-neutral-900 text-white font-mono text-[10px] space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 uppercase tracking-wider">Order #</span>
                      <span className="font-black text-xs">#{order.orderNumber || order.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 uppercase tracking-wider">Order Date</span>
                      <span className="font-bold text-neutral-200">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 uppercase tracking-wider">Payment Status</span>
                      <span className="font-black text-[9px] uppercase tracking-wide bg-white text-black px-1.5 py-0.5 rounded">
                        {order.paymentMethod === 'COD' ? 'COD' : 'PREPAID'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-neutral-800 pt-2 text-white">
                      <span className="text-neutral-400 uppercase tracking-wider text-xs font-bold">Payable</span>
                      <span className="font-black text-xs text-white">{formatCurrency(grandTotalVal)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-neutral-800 pt-2 text-white">
                      <span className="text-neutral-400 uppercase tracking-wider">Priority</span>
                      <span className="font-black text-[9px] text-amber-400 uppercase">HIGH PRIORITY</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-400 uppercase tracking-wider">Order Type</span>
                      <span className="font-bold text-neutral-200 uppercase">{order.orderNumber?.startsWith('CR-') ? 'Custom Print' : 'Marketplace'}</span>
                    </div>
                  </div>

                  {/* PACKING CHECKLIST */}
                  <div className="border border-neutral-200 rounded-lg p-4 bg-white shadow-sm">
                    <h3 className="text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-3">Packing Checklist</h3>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 font-mono text-[9px] font-bold text-neutral-800">
                      <div className="flex items-center gap-1.5"><span className="border-2 border-neutral-400 w-3 h-3 flex items-center justify-center shrink-0"></span> Product</div>
                      <div className="flex items-center gap-1.5"><span className="border-2 border-neutral-400 w-3 h-3 flex items-center justify-center shrink-0"></span> Accessories</div>
                      <div className="flex items-center gap-1.5"><span className="border-2 border-neutral-400 w-3 h-3 flex items-center justify-center shrink-0"></span> User Manual</div>
                      <div className="flex items-center gap-1.5"><span className="border-2 border-neutral-400 w-3 h-3 flex items-center justify-center shrink-0"></span> Thank You Card</div>
                      <div className="flex items-center gap-1.5"><span className="border-2 border-neutral-400 w-3 h-3 flex items-center justify-center shrink-0"></span> Invoice</div>
                      <div className="flex items-center gap-1.5"><span className="border-2 border-neutral-400 w-3 h-3 flex items-center justify-center shrink-0"></span> Stickers</div>
                      <div className="flex items-center gap-1.5 col-span-2 border-t border-neutral-100 pt-2.5 mt-1 font-sans text-[10px]"><span className="border-2 border-neutral-900 w-3.5 h-3.5 flex items-center justify-center shrink-0 bg-neutral-50"></span> Packaging Verified</div>
                    </div>
                  </div>

                  {/* INTERNAL PRODUCTION CARD */}
                  <div className="border border-neutral-200 rounded-lg p-4 bg-white shadow-sm">
                    <h3 className="text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-3">Production Information</h3>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[10px] text-neutral-700 font-sans">

                      <div>
                        <p className="text-[8px] text-neutral-400 font-bold uppercase font-mono leading-none mb-0.5">Material Used</p>
                        <p className="font-bold text-neutral-900">{order.items?.[0]?.product?.specifications?.Material || 'PLA Matte Black'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-neutral-400 font-bold uppercase font-mono leading-none mb-0.5">Quality Check</p>
                        <p className="font-bold text-green-600 flex items-center gap-0.5">Passed</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-neutral-400 font-bold uppercase font-mono leading-none mb-0.5">Post Processing</p>
                        <p className="font-bold text-neutral-900">Standard Cleanup</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-neutral-400 font-bold uppercase font-mono leading-none mb-0.5">Production Status</p>
                        <p className="font-bold text-neutral-900">Completed</p>
                      </div>
                    </div>
                  </div>


                </div>

              </div>
            </div>

            {/* MONOCHROME FOOTER */}
            <div className="border-t-2 border-neutral-900 pt-4 mt-6">
              <div className="grid grid-cols-3 gap-6 text-[8px] text-neutral-500 font-mono uppercase leading-tight select-none">
                
                {/* Left Column (From Info) */}
                <div>
                  <p className="font-bold text-neutral-800">From:</p>
                  <p className="font-bold text-neutral-900">{settings?.businessName || 'SKULTURE'}</p>
                  <p className="max-w-[200px] truncate">{settings?.returnAddress || 'Plot 4, Filament Area, Maker City'}</p>
                  <p className="normal-case">Support: {settings?.supportEmail || 'support@skulture.com'}</p>
                  <p className="normal-case">Web: www.skulture.com</p>
                </div>

                {/* Center Column (Fragile Icons) */}
                <div className="flex flex-col items-center justify-center gap-1.5 text-center font-bold text-neutral-800">
                  <div className="flex items-center gap-3 text-[14px]">
                    <span>🍷</span> {/* Fragile */}
                    <span>☔</span> {/* Keep Dry */}
                    <span>⬆️</span> {/* This Side Up */}
                  </div>
                  <p className="tracking-wide">Fragile • Handle With Care • Keep Dry • This Side Up</p>
                </div>

                {/* Right Column (Ref/Timestamp) */}
                <div className="text-right">
                  <p className="font-bold text-neutral-800">Order Reference:</p>
                  <p className="font-bold text-neutral-900">#{order.id}</p>
                  <p>Packed: {new Date().toLocaleString()}</p>
                  <p>Doc Ver: 3.0.0-PORTRAIT</p>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  )
}
