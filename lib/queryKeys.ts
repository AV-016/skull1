// React Query Key Factory
export const queryKeys = {
  // Auth
  auth: () => ['auth'],
  user: () => ['user'],
  me: () => ['auth', 'me'],

  // Products
  products: () => ['products'],
  productList: (filters?: Record<string, any>) => ['products', 'list', filters],
  featured: () => ['products', 'featured'],
  productDetail: (slug: string) => ['products', 'detail', slug],
  categories: () => ['categories'],
  categoryDetail: (slug: string) => ['categories', slug],
  tags: () => ['tags'],
  search: (query: string) => ['products', 'search', query],

  // Cart
  cart: () => ['cart'],
  cartItems: () => ['cart', 'items'],

  // Orders
  orders: () => ['orders'],
  orderList: () => ['orders', 'list'],
  orderDetail: (id: string) => ['orders', 'detail', id],

  // Custom Requests
  customRequests: () => ['customRequests'],
  customRequestList: () => ['customRequests', 'list'],
  customRequestDetail: (id: string) => ['customRequests', 'detail', id],

  // Reviews
  reviews: () => ['reviews'],
  productReviews: (productId: string) => ['reviews', 'product', productId],

  // Dashboard
  dashboard: () => ['dashboard'],
  stats: () => ['dashboard', 'stats'],
}
