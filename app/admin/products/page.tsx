'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { 
  useAdminProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct,
  useAdminCategories 
} from '@/hooks/useAdmin'
import { Plus, Edit2, Trash2, Search, Loader2, X, AlertTriangle, Upload } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import api from '@/lib/api'

const PREDEFINED_KEYS = ['Material', 'Dimensions', 'Height', 'Weight', 'Finish', 'Layer Height', 'Scale', 'Color']

export default function AdminProducts() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  
  // React Query queries and mutations
  const { data: products, isLoading, error, refetch } = useAdminProducts()
  const { data: categories } = useAdminCategories()
  
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    stock: '',
    categoryId: '',
    images: [] as string[],
    variants: [] as any[],
    isActive: true,
    isFeatured: false,
    bestSellerOrder: 0,
    specifications: [] as { key: string; value: string }[]
  })

  const [manualUrl, setManualUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const uploadFiles = async (files: FileList) => {
    const remaining = 6 - formData.images.length
    if (remaining <= 0) {
      alert('Maximum 6 images allowed')
      return
    }
    
    const filesToUpload = Array.from(files).slice(0, remaining)
    
    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image`)
        continue
      }
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
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, res.data.data.url]
          }))
        } else {
          alert(`Upload failed for ${file.name}`)
        }
      } catch (err: any) {
        alert(err.response?.data?.message || `Error uploading ${file.name}`)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return
    
    await uploadFiles(files)
  }

  const handleAddManualUrl = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') {
      return
    }
    e.preventDefault()
    
    if (!manualUrl.trim()) return
    
    if (formData.images.length >= 6) {
      alert('Maximum 6 images allowed')
      return
    }
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, manualUrl.trim()]
    }))
    setManualUrl('')
  }

  const openAddModal = () => {
    setSelectedProduct(null)
    setManualUrl('')
    setFormData({
      name: '',
      description: '',
      price: '',
      compareAtPrice: '',
      stock: '',
      categoryId: categories?.[0]?.id || '',
      images: [],
      variants: [],
      isActive: true,
      isFeatured: false,
      bestSellerOrder: 0,
      specifications: [
        { key: 'Material', value: '' },
        { key: 'Dimensions', value: '' },
        { key: 'Weight', value: '' },
        { key: 'Finish', value: '' }
      ]
    })
    setIsModalOpen(true)
  }

  const openEditModal = (product: any) => {
    setSelectedProduct(product)
    setManualUrl('')
    
    // Find all image URLs and sort so the primary one is first (or default to product.image)
    const imagesList = product.images 
      ? [...product.images]
          .sort((a: any, b: any) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
          .map((img: any) => img.url)
      : (product.image ? [product.image] : [])

    // Map backend variants to frontend format
    const variantsList = product.variants
      ? product.variants.map((v: any) => ({
          id: v.id,
          name: v.name,
          price: v.price ? String(v.price) : '',
          stock: String(v.stock ?? 0),
          images: v.images ? v.images.map((img: any) => img.url || img) : []
        }))
      : []

    // Convert specifications JSON object to array of { key, value }
    const specsList = product.specifications && typeof product.specifications === 'object'
      ? Object.entries(product.specifications).map(([key, value]) => ({ key, value: String(value) }))
      : []
    
    setFormData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
      stock: String(product.stock ?? 0),
      categoryId: product.categoryId || '',
      images: imagesList,
      variants: variantsList,
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured ?? false,
      bestSellerOrder: product.bestSellerOrder ?? 0,
      specifications: specsList
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Auto-generate slug from name
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

    // Convert specs array back to JSON object
    const specsObj = formData.specifications.reduce((acc: any, curr) => {
      if (curr.key.trim()) {
        acc[curr.key.trim()] = curr.value.trim()
      }
      return acc
    }, {})

    const productPayload = {
      name: formData.name,
      slug,
      description: formData.description,
      price: parseFloat(formData.price),
      compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
      stock: parseInt(formData.stock, 10),
      categoryId: formData.categoryId,
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,
      bestSellerOrder: Number(formData.bestSellerOrder),
      images: formData.images,
      specifications: Object.keys(specsObj).length > 0 ? specsObj : null,
      variants: formData.variants.map((v: any) => ({
        name: v.name,
        price: v.price ? parseFloat(v.price) : null,
        stock: parseInt(v.stock, 10) || 0,
        images: v.images || []
      }))
    }

    if (selectedProduct) {
      updateMutation.mutate(
        { id: selectedProduct.id, data: productPayload },
        {
          onSuccess: () => {
            setIsModalOpen(false)
            refetch()
          }
        }
      )
    } else {
      createMutation.mutate(productPayload, {
        onSuccess: () => {
          setIsModalOpen(false)
          refetch()
        }
      })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteMutation.mutate(id, {
        onSuccess: () => refetch()
      })
    }
  }

  // Filter products by search term
  const filteredProducts = products?.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category?.name && p.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || []

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
            <h1 className="heading-2 uppercase tracking-wide">Products</h1>
            <p className="text-xs text-muted-text uppercase tracking-widest">Manage your 3D print catalog</p>
          </div>
          <button 
            onClick={openAddModal}
            className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 smooth-transition flex items-center gap-2 text-xs tracking-wider uppercase cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-text" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-secondary/80 border border-border text-primary-text placeholder-muted-text text-sm focus:outline-none focus:border-primary/50 smooth-transition"
          />
        </div>

        {/* Products Catalog */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-secondary-text">Loading catalog...</p>
          </div>
        ) : error ? (
          <div className="p-6 border border-red-500/20 bg-red-500/5 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-red-500 text-sm">Failed to Load Products</h4>
              <p className="text-xs text-muted-text">Please verify your database is running and refresh the page.</p>
            </div>
          </div>
        ) : (
          <div className="glass-card overflow-x-auto border border-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/40 text-[10px] font-bold text-muted-text uppercase tracking-widest">
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Saled</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {filteredProducts.map((product: any) => {
                  const primaryImg = product.images?.find((img: any) => img.isPrimary)?.url || product.image || '/placeholder.jpg'
                  return (
                    <tr key={product.id} className="hover:bg-secondary/25 smooth-transition">
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 border border-border overflow-hidden bg-secondary">
                          <img 
                            src={primaryImg} 
                            alt={product.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.jpg'
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-primary-text">{product.name}</td>
                      <td className="px-6 py-4 text-secondary-text capitalize">
                        {product.category?.name || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4 font-bold text-primary-text">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4 text-secondary-text">{product.stock} units</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 border text-[10px] uppercase font-bold tracking-wider rounded ${
                          product.isActive 
                            ? 'bg-green-500/5 text-green-400 border-green-500/20' 
                            : 'bg-red-500/5 text-red-400 border-red-500/20'
                        }`}>
                          {product.isActive ? 'Active' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary-text">
                        {product.salesCount ?? 0} units
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(product)}
                            className="p-2 border border-border hover:border-primary/50 text-secondary-text hover:text-primary smooth-transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 border border-border hover:border-red-500/50 text-secondary-text hover:text-red-500 smooth-transition cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-muted-text uppercase tracking-widest text-[10px]">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Add / Edit Modal */}
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
                  {selectedProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-text hover:text-primary-text smooth-transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Product Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 resize-y"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Price */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Stock */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Inventory Stock</label>
                    <input
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Category</label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 cursor-pointer"
                    >
                      <option value="" disabled>Select Category</option>
                      {categories?.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Product Specifications Section */}
                <div className="border-t border-border/60 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Product Specifications</label>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          specifications: [
                            ...prev.specifications,
                            { key: '', value: '' }
                          ]
                        }))
                      }}
                      className="px-2 py-1 bg-secondary hover:bg-primary hover:text-white smooth-transition text-[10px] font-bold border border-border rounded"
                    >
                      + Add Specification
                    </button>
                  </div>

                  {formData.specifications.length > 0 ? (
                    <div className="space-y-2">
                      {formData.specifications.map((spec, sIdx) => {
                        const isPredefined = PREDEFINED_KEYS.includes(spec.key) || spec.key === '';
                        return (
                          <div key={sIdx} className="flex gap-2 items-center">
                            <div className="flex-1 flex gap-2">
                              <select
                                value={PREDEFINED_KEYS.includes(spec.key) ? spec.key : (spec.key ? 'Custom' : '')}
                                onChange={(e) => {
                                  const val = e.target.value
                                  const newSpecs = [...formData.specifications]
                                  if (val === 'Custom') {
                                    newSpecs[sIdx].key = ''
                                  } else {
                                    newSpecs[sIdx].key = val
                                  }
                                  setFormData({ ...formData, specifications: newSpecs })
                                }}
                                className="w-1/2 px-2 py-1.5 bg-secondary border border-border text-primary-text text-[11px] focus:outline-none focus:border-primary/50 cursor-pointer"
                              >
                                <option value="" disabled>Select Property</option>
                                {PREDEFINED_KEYS.map((k) => (
                                  <option key={k} value={k}>{k}</option>
                                ))}
                                <option value="Custom">Custom...</option>
                              </select>
                              
                              {(!isPredefined || !PREDEFINED_KEYS.includes(spec.key)) && (
                                <input
                                  type="text"
                                  placeholder="Property Name"
                                  required
                                  value={spec.key}
                                  onChange={(e) => {
                                    const newSpecs = [...formData.specifications]
                                    newSpecs[sIdx].key = e.target.value
                                    setFormData({ ...formData, specifications: newSpecs })
                                  }}
                                  className="w-1/2 px-2 py-1.5 bg-secondary border border-border text-primary-text text-[11px] focus:outline-none focus:border-primary/50"
                                />
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Value (e.g. Tough Resin)"
                              required
                              value={spec.value}
                              onChange={(e) => {
                                const newSpecs = [...formData.specifications]
                                newSpecs[sIdx].value = e.target.value
                                setFormData({ ...formData, specifications: newSpecs })
                              }}
                              className="flex-1 px-3 py-1.5 bg-secondary border border-border text-primary-text text-[11px] focus:outline-none focus:border-primary/50"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  specifications: prev.specifications.filter((_, i) => i !== sIdx)
                                }))
                              }}
                              className="p-1.5 border border-border hover:border-red-500/50 text-muted-text hover:text-red-500 rounded smooth-transition cursor-pointer"
                              title="Remove Specification"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-text italic">No specifications added yet. Adding specs (e.g. Material, Dimensions, Finish) helps customers understand the product details better.</p>
                  )}
                </div>

                {/* Product Images - Premium Multiple Image Upload Manager */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">
                      Product Images ({formData.images.length}/6)
                    </label>
                    <span className="text-[9px] text-muted-text uppercase tracking-wider">
                      First image is primary
                    </span>
                  </div>

                  {/* Manual input */}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste an image URL (https://...) and press Enter"
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      onKeyDown={handleAddManualUrl}
                      className="flex-1 px-4 py-2 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddManualUrl}
                      className="px-4 py-2 bg-secondary border border-border text-primary-text hover:bg-primary hover:text-white smooth-transition text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>

                  {/* Image grid & drag area */}
                  <div className="space-y-2">
                    {/* Existing Images Grid */}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {formData.images.map((url, idx) => (
                          <div key={idx} className="relative group aspect-square bg-secondary border border-border rounded overflow-hidden flex items-center justify-center">
                            <img 
                              src={url} 
                              alt={`Preview ${idx + 1}`} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.jpg'
                              }}
                            />
                            
                            {/* Badges */}
                            <div className="absolute top-1 left-1 flex flex-col gap-1">
                              {idx === 0 ? (
                                <span className="px-1.5 py-0.5 bg-primary text-white text-[8px] font-bold rounded uppercase tracking-wider shadow-sm">
                                  Primary
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => {
                                      const newImages = [...prev.images]
                                      const [moved] = newImages.splice(idx, 1)
                                      newImages.unshift(moved)
                                      return { ...prev, images: newImages }
                                    })
                                  }}
                                  className="px-1.5 py-0.5 bg-black/60 hover:bg-primary text-white text-[8px] font-bold rounded uppercase tracking-wider shadow-sm opacity-0 group-hover:opacity-100 smooth-transition cursor-pointer"
                                >
                                  Make Primary
                                </button>
                              )}
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  images: prev.images.filter((_, i) => i !== idx)
                                }))
                              }}
                              className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 smooth-transition shadow-md cursor-pointer"
                              title="Remove Image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Dropzone (if less than 6 images) */}
                    {formData.images.length < 6 && (
                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`relative border border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center smooth-transition min-h-[100px] ${
                          isDragActive 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border bg-secondary/40 hover:border-primary/30'
                        }`}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <span className="text-secondary-text font-medium text-[9px]">Uploading image...</span>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center gap-1.5 w-full h-full py-1">
                            <Upload className="w-5 h-5 text-muted-text" />
                            <div className="space-y-0.5">
                              <p className="font-bold text-primary-text text-[10px]">Drag & drop images here</p>
                              <p className="text-muted-text text-[8px]">or click to browse (supports multiple)</p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={async (e) => {
                                const files = e.target.files
                                if (files && files.length > 0) {
                                  await uploadFiles(files)
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Variants Section */}
                <div className="border-t border-border/60 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Product Variants</label>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          variants: [
                            ...prev.variants,
                            { name: '', price: '', stock: '', images: [], tempUrl: '', isUploading: false }
                          ]
                        }))
                      }}
                      className="px-2 py-1 bg-secondary hover:bg-primary hover:text-white smooth-transition text-[10px] font-bold border border-border rounded"
                    >
                      + Add Variant
                    </button>
                  </div>

                  {formData.variants.length > 0 ? (
                    <div className="space-y-4">
                      {formData.variants.map((variant, vIdx) => (
                        <div key={vIdx} className="p-3 bg-secondary/25 border border-border/80 rounded space-y-3 relative">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                variants: prev.variants.filter((_, i) => i !== vIdx)
                              }))
                            }}
                            className="absolute top-2 right-2 text-muted-text hover:text-destructive smooth-transition cursor-pointer"
                            title="Remove Variant"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* Inputs */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[8px] font-bold text-muted-text uppercase tracking-wider mb-1">Variant Name</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Gold"
                                value={variant.name}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants]
                                  newVariants[vIdx].name = e.target.value
                                  setFormData({ ...formData, variants: newVariants })
                                }}
                                className="w-full px-2 py-1 bg-secondary border border-border text-primary-text text-[11px]"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold text-muted-text uppercase tracking-wider mb-1">Stock</label>
                              <input
                                type="number"
                                required
                                placeholder="0"
                                value={variant.stock}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants]
                                  newVariants[vIdx].stock = e.target.value
                                  setFormData({ ...formData, variants: newVariants })
                                }}
                                className="w-full px-2 py-1 bg-secondary border border-border text-primary-text text-[11px]"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold text-muted-text uppercase tracking-wider mb-1">Price Override (₹)</label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Optional"
                                value={variant.price}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants]
                                  newVariants[vIdx].price = e.target.value
                                  setFormData({ ...formData, variants: newVariants })
                                }}
                                className="w-full px-2 py-1 bg-secondary border border-border text-primary-text text-[11px]"
                              />
                            </div>
                          </div>

                          {/* Variant Images */}
                          <div className="space-y-1.5">
                            <label className="block text-[8px] font-bold text-muted-text uppercase tracking-wider">
                              Variant Images ({variant.images?.length || 0}/6)
                            </label>

                            {/* Paste URL */}
                            <div className="flex gap-1.5">
                              <input
                                type="url"
                                placeholder="Paste image URL..."
                                value={variant.tempUrl || ''}
                                onChange={(e) => {
                                  const newVariants = [...formData.variants]
                                  newVariants[vIdx].tempUrl = e.target.value
                                  setFormData({ ...formData, variants: newVariants })
                                }}
                                className="flex-1 px-2 py-1 bg-secondary border border-border text-primary-text text-[10px]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!variant.tempUrl?.trim()) return
                                  if ((variant.images?.length || 0) >= 6) {
                                    alert('Max 6 images allowed per variant')
                                    return
                                  }
                                  const newVariants = [...formData.variants]
                                  newVariants[vIdx].images = [...(variant.images || []), variant.tempUrl.trim()]
                                  newVariants[vIdx].tempUrl = ''
                                  setFormData({ ...formData, variants: newVariants })
                                }}
                                className="px-2 py-1 bg-secondary border border-border text-primary-text hover:bg-primary hover:text-white smooth-transition text-[10px] font-bold"
                              >
                                Add
                              </button>
                            </div>

                            {/* Upload Files */}
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                id={`variant-upload-${vIdx}`}
                                className="hidden"
                                onChange={async (e) => {
                                  const files = e.target.files
                                  if (!files || files.length === 0) return
                                  const remaining = 6 - (variant.images?.length || 0)
                                  if (remaining <= 0) {
                                    alert('Max 6 images allowed per variant')
                                    return
                                  }
                                  
                                  const filesToUpload = Array.from(files).slice(0, remaining)
                                  const newVariants = [...formData.variants]
                                  newVariants[vIdx].isUploading = true
                                  setFormData({ ...formData, variants: newVariants })

                                  for (const file of filesToUpload) {
                                    if (!file.type.startsWith('image/')) continue
                                    try {
                                      const uploadFormData = new FormData()
                                      uploadFormData.append('file', file)
                                      const res = await api.post('/upload/product-image', uploadFormData, {
                                        headers: { 'Content-Type': 'multipart/form-data' }
                                      })
                                      if (res.data?.success && res.data?.data?.url) {
                                        setFormData(prev => {
                                          const updated = [...prev.variants]
                                          updated[vIdx].images = [...(updated[vIdx].images || []), res.data.data.url]
                                          return { ...prev, variants: updated }
                                        })
                                      }
                                    } catch (err: any) {
                                      alert('Error uploading variant image')
                                    }
                                  }
                                  
                                  setFormData(prev => {
                                    const updated = [...prev.variants]
                                    updated[vIdx].isUploading = false
                                    return { ...prev, variants: updated }
                                  })
                                }}
                              />
                              <label
                                htmlFor={`variant-upload-${vIdx}`}
                                className="cursor-pointer px-2 py-1 bg-secondary border border-dashed border-border hover:border-primary/50 text-[10px] text-muted-text font-bold rounded flex items-center gap-1"
                              >
                                <Upload className="w-3 h-3" />
                                {variant.isUploading ? 'Uploading...' : 'Upload Images'}
                              </label>
                            </div>

                            {/* Images Grid */}
                            {variant.images && variant.images.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {variant.images.map((url: string, imgIdx: number) => (
                                  <div key={imgIdx} className="relative w-10 h-10 border border-border rounded overflow-hidden group">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newVariants = [...formData.variants]
                                        newVariants[vIdx].images = variant.images.filter((_: any, i: number) => i !== imgIdx)
                                        setFormData({ ...formData, variants: newVariants })
                                      }}
                                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 smooth-transition text-white"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-text italic">No variants added yet. Adding variants lets you manage different stock/price overrides and variant-specific image sets.</p>
                  )}
                </div>

                {/* Toggles */}
                <div className="flex gap-6 items-center pt-2 select-none">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-secondary-text">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-0 accent-primary"
                    />
                    <span>Visible in Catalog</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-secondary-text">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                      className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-0 accent-primary"
                    />
                    <span>Feature on Home</span>
                  </label>
                </div>

                {/* Best Seller Order */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Best Seller Priority (1 to 10)</label>
                  <select
                    value={formData.bestSellerOrder}
                    onChange={(e) => setFormData({ ...formData, bestSellerOrder: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 cursor-pointer"
                  >
                    <option value={0}>Unset / None</option>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>Priority {i + 1} {i === 0 ? '(Highest)' : ''}</option>
                    ))}
                  </select>
                  <p className="text-[9px] text-muted-text">Controls the exact position (1 to 10) in the storefront Best Sellers grid.</p>
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
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-6 py-2.5 bg-primary text-white hover:bg-primary/95 smooth-transition uppercase tracking-widest text-[10px] font-bold flex items-center gap-2 cursor-pointer"
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    {selectedProduct ? 'Update Product' : 'Create Product'}
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
