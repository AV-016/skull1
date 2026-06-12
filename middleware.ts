import { NextRequest, NextResponse } from 'next/server'

// Protected routes that require authentication
const customerRoutes = [
  '/dashboard',
  '/orders',
  '/custom-requests',
  '/account',
  '/cart',
  '/checkout',
]

// Admin routes that require admin role
const adminRoutes = ['/admin']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check for admin routes
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  // Check for customer protected routes
  const isCustomerRoute = customerRoutes.some(route => pathname.startsWith(route))

  // Get token from localStorage (client-side) or cookies (server-side)
  const token = request.cookies.get('sk_token')?.value || request.cookies.get('authToken')?.value
  const userRole = (request.cookies.get('sk_role')?.value || request.cookies.get('userRole')?.value)?.toLowerCase()

  console.log(`[MIDDLEWARE DEBUG] Path: ${pathname} | Has Token: ${!!token} | User Role: ${userRole}`)

  // Redirect to login if accessing protected routes without token
  if ((isCustomerRoute || isAdminRoute) && !token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }


  // Redirect to home if non-admin tries to access admin routes
  if (isAdminRoute && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Allow the request
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
