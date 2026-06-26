// User & Auth Types
export interface User {
  id: string
  email: string
  name: string
  role: 'customer' | 'admin' | 'staff'
  picture?: string | null
  phone?: string | null
  isPhoneVerified?: boolean
  createdAt: string
  loyaltyStamps?: number
  loyaltyDiscountPending?: boolean
  loyaltyDiscountValue?: number
  loyaltyDiscountSet?: boolean
}


export interface ProductVariant {
  id: string
  name: string
  price: number | null
  stock: number
  images: string[]
}

// Product Types
export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  stock: number
  image: string
  images: string[]
  category: string
  specifications: Record<string, string>
  featured: boolean
  salesCount?: number
  createdAt: string
  variants?: ProductVariant[]
  eventPromo?: {
    eventId: string
    eventTitle: string
    discountPercentage: number
    discountedPrice: number
  } | null
}

// Category Types
export interface Category {
  id: string
  name: string
  slug: string
  description: string
  imageUrl?: string
}

// Cart Types
export interface CartItem {
  productId: string
  variantId?: string | null
  quantity: number
  product?: Product
  variant?: ProductVariant | null
}

// Order Types
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface Order {
  id: string
  orderNumber?: string
  userId: string
  items: any[]
  totalAmount?: number
  total: number
  status: OrderStatus | string
  address?: any
  shippingAddress?: Address
  billingAddress?: Address
  trackingId?: string | null
  carrier?: string | null
  trackingUrl?: string | null
  statusHistory?: any[]
  returnReason?: string | null
  returnImage?: string | null
  createdAt: string
  updatedAt: string
  paymentStatus?: string
  shippingWeightGrams?: number
  subtotal?: number
  shippingCharge?: number
  platformFee?: number
  gstAmount?: number
  discountAmount?: number
  paymentMethod?: string
  paymentId?: string
  shippingZone?: string
  shippingEstDays?: number
  inquiries?: any[]
}

// Address Types
export interface Address {
  fullName: string
  email: string
  phone: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

// Custom Request Types
export enum CustomRequestStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  QUOTED = 'QUOTED',
  ACCEPTED = 'ACCEPTED',
  PRINTING = 'PRINTING',
  COMPLETED = 'COMPLETED',
}

export interface Quotation {
  id: string
  amount: number
  validityDate: string
  specifications: string
  timeline: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
}

export interface CustomRequest {
  id: string
  userId: string
  title: string
  description: string
  files: string[]
  status: CustomRequestStatus | string
  quotation?: Quotation
  quotations?: any[]
  createdAt: string
  updatedAt: string
}

// Review Types
export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// Auth Request Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  token: string
  user: User
}
