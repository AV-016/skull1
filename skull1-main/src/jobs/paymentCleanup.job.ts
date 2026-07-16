// Payment Cleanup Job: Automatically runs periodically to cancel unpaid orders and return reserved products to inventory stock.
import logger from '../utils/logger';
import { prisma } from '../config/database';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export const startPaymentCleanupJob = () => {
  logger.info('Initializing Payment Cleanup Job (runs every 30 minutes)...');

  setInterval(async () => {
    try {
      logger.info('Running Payment Cleanup Job...');
      
      // Define cleanup threshold (e.g., unpaid order is older than 30 minutes)
      const cutoffDate = new Date();
      cutoffDate.setMinutes(cutoffDate.getMinutes() - 30); 

      // Step 1: Query orders that remain pending payment for more than 30 minutes
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

      // Step 2: Process cancellation and inventory replenishment for each expired order
      for (const order of expiredOrders) {
        await prisma.$transaction(async (tx) => {
          // Cancel order status
          await tx.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.CANCELLED },
          });

          // Log status history transition
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              status: OrderStatus.CANCELLED,
              notes: 'Cancelled automatically due to payment timeout.',
            },
          });

          // Replenish stock for each item in the cancelled order
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
  }, 30 * 60 * 1000); // Run interval: 30 minutes
};

export default startPaymentCleanupJob;
