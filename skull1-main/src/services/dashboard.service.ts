import { prisma } from '../config/database';
import { OrderStatus, PaymentStatus, CustomRequestStatus, QuotationStatus } from '@prisma/client';

export class DashboardService {
  async getCustomerDashboard(userId: string): Promise<any> {
    const [ordersCount, pendingOrdersCount, reviewsCount, customRequestsCount] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.count({
        where: {
          userId,
          status: { in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING] },
        },
      }),
      prisma.review.count({ where: { userId } }),
      prisma.customRequest.count({ where: { userId } }),
    ]);

    return {
      orders: ordersCount,
      pendingOrders: pendingOrdersCount,
      reviews: reviewsCount,
      customRequests: customRequestsCount,
    };
  }

  async getAdminDashboard(): Promise<any> {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      pendingCustomRequests,
      pendingQuotes,
      revenueResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.customRequest.count({ where: { status: CustomRequestStatus.PENDING } }),
      prisma.quotation.count({ where: { status: QuotationStatus.PENDING } }),
      prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.PAID },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      pendingOrders,
      pendingCustomRequests,
      pendingQuotes,
      revenue: revenueResult._sum.totalAmount || 0,
    };
  }
}

export default DashboardService;
