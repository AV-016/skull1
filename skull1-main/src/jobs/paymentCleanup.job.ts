import logger from '../utils/logger';
import { prisma } from '../config/database';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export const startPaymentCleanupJob = () => {
  logger.info('Initializing Payment Cleanup Job (runs every 30 minutes)...');

  setInterval(async () => {
    try {
      logger.info('Running Payment Cleanup Job...');
      
      const cutoffDate = new Date();
      cutoffDate.setMinutes(cutoffDate.getMinutes() - 30); // 30 minutes limit

      // Query orders that have been pending payment for more than 30 minutes
      const expiredOrders = await prisma.order.findMany({
        where: {
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          createdAt: { lte: cutoffDate },
        },
        include: {
          items: true,
        },
      });

      logger.info(`Found ${expiredOrders.length} expired orders to cleanup.`);

      for (const order of expiredOrders) {
        await prisma.$transaction(async (tx) => {
          // 1. Cancel order
          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.CANCELLED },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: OrderStatus.CANCELLED,
              notes: 'Cancelled automatically due to payment timeout.',
            },
          });

          // 2. Return products or variants to stock atomically
          for (const item of order.items) {
            if (item.variantId) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                  stock: {
                    increment: item.quantity,
                  },
                },
              });
            } else {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stock: {
                    increment: item.quantity,
                  },
                },
              });
            }
          }
        });
        
        logger.info(`Cleaned up and cancelled unpaid order: ${order.orderNumber}`);
      }

    } catch (error) {
      logger.error('Error running Payment Cleanup Job:', error);
    }
  }, 30 * 60 * 1000); // 30 minutes interval
};

export default startPaymentCleanupJob;
