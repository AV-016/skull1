import { PaymentRepository } from '../repositories/payment.repository';
import { OrderRepository } from '../repositories/order.repository';
import { razorpay } from '../config/razorpay';
import { env } from '../config/env';
import { verifyRazorpaySignature, verifyWebhookSignature } from '../utils/razorpayVerify';
import { AppError } from '../middlewares/error.middleware';
import { PaymentStatus, OrderStatus } from '@prisma/client';
import logger from '../utils/logger';
import { sendOrderConfirmationEmail } from '../utils/mail';
import { prisma } from '../config/database';

const paymentRepository = new PaymentRepository();
const orderRepository = new OrderRepository();

export class PaymentService {
  async createRazorpayOrder(userId: string, orderId: string): Promise<any> {
    try {
      // Use an interactive transaction with a row lock on the Order to serialize concurrent payment session creations for the same order
      return await prisma.$transaction(async (tx) => {
        // 1. Lock the order row using SELECT FOR UPDATE
        const orders = await tx.$queryRaw`
          SELECT "id", "userId", "totalAmount", "orderNumber", "paymentStatus"
          FROM "Order"
          WHERE "id" = ${orderId}
          LIMIT 1
          FOR UPDATE
        `;

        if (!orders || !Array.isArray(orders) || orders.length === 0) {
          throw new AppError(404, 'Order not found');
        }

        const order = orders[0];

        if (order.userId !== userId) {
          throw new AppError(403, 'Forbidden checkout order access');
        }

        const isCustomOrder = order.orderNumber.startsWith('CR-');
        if (order.paymentStatus === 'PAID' && !isCustomOrder) {
          throw new AppError(400, 'Order is already paid');
        }

        // 2. Calculate paid amounts and check payment status
        const successfulPayments = await tx.payment.findMany({
          where: {
            orderId: order.id,
            status: 'success',
          },
        });

        const totalPaid = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

        if (totalPaid >= order.totalAmount) {
          throw new AppError(400, 'Order is already fully paid');
        }

        // Check for an existing pending payment record
        const existingPayment = await tx.payment.findFirst({
          where: {
            orderId: order.id,
            status: 'created',
          },
        });

        if (existingPayment) {
          return {
            keyId: env.RAZORPAY_KEY_ID,
            amount: Math.round(existingPayment.amount * 100),
            currency: 'INR',
            razorpayOrderId: existingPayment.razorpayOrderId,
            orderNumber: order.orderNumber,
          };
        }

        // 3. Create a new Razorpay order
        isCustomOrder;
        let payAmount = order.totalAmount;
        if (isCustomOrder) {
          if (successfulPayments.length === 0) {
            payAmount = Math.round(order.totalAmount * 0.20);
          } else {
            payAmount = Math.round(order.totalAmount - totalPaid);
          }
        }

        const options = {
          amount: Math.round(payAmount * 100), // Razorpay expects amount in paise (cents)
          currency: 'INR',
          receipt: order.orderNumber,
        };

        const rzpOrder = await razorpay.orders.create(options);

        // 4. Store payment record
        await tx.payment.create({
          data: {
            orderId: order.id,
            razorpayOrderId: rzpOrder.id,
            amount: payAmount,
            status: 'created',
          },
        });

        return {
          keyId: env.RAZORPAY_KEY_ID,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          razorpayOrderId: rzpOrder.id,
          orderNumber: order.orderNumber,
        };
      }, {
        timeout: 10000 // 10 seconds timeout for interactive transaction
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Error creating Razorpay order:', error);
      throw new AppError(500, 'Failed to initialize payment gateway order');
    }
  }

  async verifyPayment(
    userId: string,
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<boolean> {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.userId !== userId) {
      throw new AppError(403, 'Forbidden order access');
    }

    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      logger.error(`Payment verification failed - signature invalid for Razorpay Order ID: ${razorpayOrderId}, Payment ID: ${razorpayPaymentId}`);
      // Mark payment as failed
      await paymentRepository.updateStatus(razorpayOrderId, 'failed');
      await orderRepository.updatePaymentStatus(orderId, PaymentStatus.FAILED);
      throw new AppError(400, 'Payment signature verification failed');
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      // Retrieve total paid including current verified payment (which is set to success now)
      await paymentRepository.updateStatus(
        razorpayOrderId,
        'success',
        razorpayPaymentId,
        razorpaySignature
      );

      const allPayments = await prisma.payment.findMany({
        where: { orderId, status: 'success' }
      });
      let totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
      const isCustom = order.orderNumber.startsWith('CR-');
      if (isCustom && order.status !== OrderStatus.PENDING) {
        const hasAdvance = allPayments.some(p => p.amount === Math.round(order.totalAmount * 0.20));
        if (!hasAdvance) {
          totalPaid += Math.round(order.totalAmount * 0.20);
        }
      }
      const isFullyPaid = totalPaid >= order.totalAmount;
      const nextPaymentStatus = isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PENDING;

      await orderRepository.updatePaymentStatus(orderId, nextPaymentStatus, razorpayPaymentId);
      
      if (order.status === OrderStatus.PENDING) {
        await orderRepository.updateStatus(orderId, OrderStatus.CONFIRMED, 'Advance payment received, order confirmed.');
      }
      
      logger.info(`Payment successful (user checkout verified) - Order ID: ${orderId}, Number: ${order.orderNumber}, Razorpay Order: ${razorpayOrderId}, Payment ID: ${razorpayPaymentId}, fullyPaid: ${isFullyPaid}`);

      // Handle custom request quotation acceptance automatically
      try {
        await prisma.$transaction(async (tx) => {
          await this.handleCustomRequestOrderPayment(tx, orderId, order.orderNumber);
        });
      } catch (err) {
        logger.error(`Error in handleCustomRequestOrderPayment for Order ID: ${orderId}:`, err);
      }

      // Send order confirmation email
      const email = order.user?.email;
      const name = order.user?.name;
      if (email) {
        sendOrderConfirmationEmail(
          email,
          name || 'Customer',
          order.orderNumber,
          order.totalAmount
        ).catch((err) => logger.error(`Error sending online order confirmation email to ${email}:`, err));
      }
    }

    return true;
  }

  async handleCustomRequestOrderPayment(tx: any, orderId: string, orderNumber: string) {
    if (!orderNumber.startsWith('CR-')) return;
    
    // Find the order items and get the customRequest ID from the product slug
    const orderItems = await tx.orderItem.findMany({
      where: { orderId },
      include: { product: true }
    });

    if (orderItems && orderItems.length > 0) {
      const productSlug = orderItems[0].product.slug;
      const parts = productSlug.split('-');
      if (parts.length >= 3 && productSlug.startsWith('custom-project-')) {
        const customRequestId = parts[2];
        
        const customRequest = await tx.customRequest.findUnique({
          where: { id: customRequestId },
          include: { quotations: true }
        });

        if (customRequest) {
          const pendingQuotation = customRequest.quotations.find((q: any) => q.status === 'PENDING');
          if (pendingQuotation) {
            await tx.quotation.update({
              where: { id: pendingQuotation.id },
              data: { status: 'ACCEPTED' }
            });

            await tx.quotation.updateMany({
              where: {
                customRequestId,
                id: { not: pendingQuotation.id }
              },
              data: { status: 'REJECTED' }
            });
          }

          await tx.customRequest.update({
            where: { id: customRequestId },
            data: { status: 'COMPLETED' }
          });
          
          logger.info(`Custom Request #${customRequestId} automatically ACCEPTED following 20% advance payment verification for Order ID: ${orderId}`);
        }
      }
    }
  }

  async handleWebhook(rawBody: string, signature: string): Promise<void> {
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.error(`Webhook signature verification failed!`);
      throw new AppError(400, 'Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const eventId = payload.id;
    logger.info(`Processing payment webhook event: ${event} (Event ID: ${eventId})`);

    // Webhook event idempotency check: store event ID in DB
    if (eventId) {
      try {
        await prisma.processedWebhook.create({
          data: { id: eventId }
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          logger.warn(`Duplicate webhook event ignored - Event ID: ${eventId}`);
          return;
        }
        throw err;
      }
    }

    if (event === 'payment.captured') {
      const paymentDetails = payload.payload.payment.entity;
      const razorpayOrderId = paymentDetails.order_id;
      const razorpayPaymentId = paymentDetails.id;

      // We run everything in a transaction to make it atomic
      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { razorpayOrderId },
          include: { order: { include: { user: true } } }
        });

        if (!payment) {
          logger.warn(`No payment record found for Razorpay Order: ${razorpayOrderId}`);
          return;
        }

        // Lock/update payment atomically using updateMany to verify status has not been set to 'success'
        const updatedPayment = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: { not: 'success' }
          },
          data: {
            status: 'success',
            razorpayPaymentId,
            razorpaySignature: signature
          }
        });

        if (updatedPayment.count === 0) {
          logger.info(`Payment status is already success for Razorpay Order: ${razorpayOrderId}. Skipping status update.`);
          return;
        }

        // Update the order details based on total payment sum
        const allPayments = await tx.payment.findMany({
          where: { orderId: payment.orderId, status: 'success' }
        });
        let totalPaid = allPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
        const isCustom = payment.order.orderNumber.startsWith('CR-');
        if (isCustom && payment.order.status !== OrderStatus.PENDING) {
          const hasAdvance = allPayments.some((p: any) => p.amount === Math.round(payment.order.totalAmount * 0.20));
          if (!hasAdvance) {
            totalPaid += Math.round(payment.order.totalAmount * 0.20);
          }
        }
        const isFullyPaid = totalPaid >= payment.order.totalAmount;
        const nextPaymentStatus = isFullyPaid ? PaymentStatus.PAID : PaymentStatus.PENDING;

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: nextPaymentStatus,
            paymentId: razorpayPaymentId,
            status: payment.order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : payment.order.status
          }
        });

        // Handle custom request quotation acceptance automatically
        await this.handleCustomRequestOrderPayment(tx, payment.orderId, payment.order.orderNumber);

        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            status: payment.order.status === OrderStatus.PENDING ? OrderStatus.CONFIRMED : payment.order.status,
            notes: isFullyPaid ? 'Full payment confirmed via webhook.' : 'Advance payment confirmed via webhook.'
          }
        });

        logger.info(`Webhook payment success - Order ID: ${payment.orderId}, Razorpay Order: ${razorpayOrderId}, Payment ID: ${razorpayPaymentId}`);

        // Send order confirmation email
        const email = payment.order.user?.email;
        const name = payment.order.user?.name;
        if (email) {
          sendOrderConfirmationEmail(
            email,
            name || 'Customer',
            payment.order.orderNumber,
            payment.order.totalAmount
          ).catch((err) => logger.error(`Error sending online order confirmation email to ${email}:`, err));
        }
      });
    } else if (event === 'payment.failed') {
      const paymentDetails = payload.payload.payment.entity;
      const razorpayOrderId = paymentDetails.order_id;

      await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findUnique({
          where: { razorpayOrderId }
        });

        if (!payment) {
          logger.warn(`No payment record found for Razorpay Order on failure: ${razorpayOrderId}`);
          return;
        }

        const updatedPayment = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: { not: 'success' }
          },
          data: {
            status: 'failed'
          }
        });

        if (updatedPayment.count > 0) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              paymentStatus: PaymentStatus.FAILED
            }
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId: payment.orderId,
              status: OrderStatus.PENDING,
              notes: 'Payment failed via webhook.'
            }
          });
          logger.warn(`Webhook payment failed event received - Razorpay Order: ${razorpayOrderId}`);
        }
      });
    }
  }

  async getPayments(page: number = 1, limit: number = 10): Promise<any> {
    return paymentRepository.findAll(page, limit);
  }

  async getPaymentById(id: string): Promise<any> {
    const payment = await paymentRepository.findById(id);
    if (!payment) {
      throw new AppError(404, 'Payment log not found');
    }
    return payment;
  }
}

export default PaymentService;
