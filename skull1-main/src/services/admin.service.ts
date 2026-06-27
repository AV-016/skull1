import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';

export class AdminService {
  async getSettings(): Promise<any> {
    let settings = await prisma.settings.findUnique({
      where: { id: 'global' },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'global',
          businessName: 'Skulture',
        },
      });
    }

    return settings;
  }

  async updateSettings(data: any): Promise<any> {
    const { supportEmail, ...settingsData } = data;
    return prisma.settings.upsert({
      where: { id: 'global' },
      update: settingsData,
      create: {
        id: 'global',
        ...settingsData,
      },
    });
  }

  async getActivityLogs(page: number = 1, limit: number = 10): Promise<any> {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
      }),
      prisma.activityLog.count(),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getActivityLogById(id: string): Promise<any> {
    const log = await prisma.activityLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!log) {
      throw new AppError(404, 'Activity log not found');
    }

    return log;
  }

  async logActivity(userId: string | null, action: string, details?: string, ipAddress?: string): Promise<any> {
    return prisma.activityLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress,
      },
    });
  }

  async getPendingLoyaltyDiscounts(): Promise<any> {
    return prisma.user.findMany({
      where: { loyaltyDiscountPending: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        loyaltyStamps: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async approveLoyaltyDiscount(userId: string, discountValue: number): Promise<any> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        loyaltyDiscountValue: discountValue,
        loyaltyDiscountSet: true,
        loyaltyDiscountPending: false,
      },
    });
  }
}

export default AdminService;
