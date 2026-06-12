import logger from '../utils/logger';
import { prisma } from '../config/database';
import { OrderStatus } from '@prisma/client';

export const startOrderReminderJob = () => {
  logger.info('Initializing Order Reminder Job (runs every 24 hours)...');

  // Simulated cron job using setInterval
  setInterval(async () => {
    try {
      logger.info('Running Order Reminder Job...');
      
      // Query pending orders older than 2 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 2);

      const pendingOrders = await prisma.order.findMany({
        where: {
          status: OrderStatus.PENDING,
          createdAt: { lte: cutoffDate },
        },
        include: {
          user: true,
        },
      });

      logger.info(`Found ${pendingOrders.length} pending orders requiring reminders.`);
      
      for (const order of pendingOrders) {
        logger.info(`Sending payment reminder email to ${order.user.email} for order ${order.orderNumber}`);
        // In production, integrate email sending service here (e.g., SendGrid, Nodemailer)
      }

    } catch (error) {
      logger.error('Error running Order Reminder Job:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours interval
};

export default startOrderReminderJob;
