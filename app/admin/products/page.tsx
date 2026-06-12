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
    imageUrl: '', // Primary image
    isActive: true,
    isFeatured: false
  })

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
        setFormData(prev => ({ ...prev, imageUrl: res.data.data.url }))
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
      alert('Only image files are allowed for product images')
      return
    }
    
    await uploadFile(file)
  }

  const openAddModal = () => {
    setSelectedProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      compareAtPrice: '',
      stock: '',
      categoryId: categories?.[0]?.id || '',
      imageUrl: '',
      isActive: true,
      isFeatured: false
    })
    setIsModalOpen(true)
  }

  const openEditModal = (product: any) => {
    setSelectedProduct(product)
    
    // Find primary image url if available
    const primaryImg = product.images?.find((img: any) => img.isPrimary)?.url || product.image || ''
    
    setFormData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
      stock: String(product.stock ?? 0),
      categoryId: product.categoryId || '',
      imageUrl: primaryImg,
      isActive: product.isActive ?? true,
      isFeatured: product.isFeatured ?? false
    })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Auto-generate slug from name
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

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
      // Pass images structure matching backend validation
      images: formData.imageUrl ? [formData.imageUrl] : []
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
                    <td colSpan={7} className="px-6 py-10 text-center text-muted-text uppercase tracking-widest text-[10px]">
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
              className="relative w-full max-w-lg bg-popover border border-border p-6 shadow-2xl z-10 space-y-6"
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
                    className="w-full px-4 py-2.5 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 resize-none"
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

                {/* Product Image - Premium Drag & Drop Dropzone */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-secondary-text uppercase tracking-wider">Product Image</label>
                  <input
                    type="url"
                    placeholder="Or paste an image URL here (https://...)"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 bg-secondary border border-border text-primary-text focus:outline-none focus:border-primary/50 text-xs mb-2"
                  />
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center smooth-transition min-h-[120px] ${
                      isDragActive 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border bg-secondary/40 hover:border-primary/30'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-secondary-text font-medium text-[10px]">Uploading image...</span>
                      </div>
                    ) : formData.imageUrl ? (
                      <div className="relative group w-full flex items-center justify-center">
                        <img 
                          src={formData.imageUrl} 
                          alt="Product Preview" 
                          className="max-h-24 object-contain rounded border border-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="absolute -top-2 right-2 p-1 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-600 smooth-transition shadow-md cursor-pointer"
                          title="Remove Image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2 w-full h-full py-2">
                        <Upload className="w-6 h-6 text-muted-text" />
                        <div className="space-y-0.5">
                          <p className="font-bold text-primary-text text-[11px]">Drag & drop your image here</p>
                          <p className="text-muted-text text-[9px]">or click to browse from device</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) await uploadFile(file)
                          }}
                        />
                      </label>
                    )}
                  </div>
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
