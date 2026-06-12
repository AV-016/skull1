import logger from '../utils/logger';
import { prisma } from '../config/database';
import { PaymentStatus } from '@prisma/client';

export const startAnalyticsJob = () => {
  logger.info('Initializing Sales Analytics Job (runs every 12 hours)...');

  setInterval(async () => {
    try {
      logger.info('Running Sales Analytics Aggregator...');
      
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [ordersToday, revenueToday] = await Promise.all([
        prisma.order.count({
          where: {
            createdAt: { gte: startOfDay },
          },
        }),
        prisma.order.aggregate({
          where: {
            paymentStatus: PaymentStatus.PAID,
            createdAt: { gte: startOfDay },
          },
          _sum: {
            totalAmount: true,
          },
        }),
      ]);

      const salesVolume = revenueToday._sum.totalAmount || 0;
      logger.info(`[Analytics] Daily Aggregation Summary: Orders Created: ${ordersToday}, Net Revenue Captured: INR ${salesVolume}`);

    } catch (error) {
      logger.error('Error running Sales Analytics Job:', error);
    }
  }, 12 * 60 * 60 * 1000); // 12 hours interval
};

export default startAnalyticsJob;
