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

        if (order.paymentStatus === 'PAID') {
          throw new AppError(400, 'Order is already paid');
        }

        // 2. Check for an existing payment record
        const existingPayment = await tx.payment.findFirst({
          where: {
            orderId: order.id,
            status: { in: ['created', 'success'] },
          },
        });

        if (existingPayment) {
          if (existingPayment.status === 'success') {
            throw new AppError(400, 'Order is already paid');
          }
          // Reuse the existing Razorpay order
          return {
            keyId: env.RAZORPAY_KEY_ID,
            amount: Math.round(existingPayment.amount * 100),
            currency: 'INR',
            razorpayOrderId: existingPayment.razorpayOrderId,
            orderNumber: order.orderNumber,
          };
        }

        // 3. Create a new Razorpay order
        const options = {
          amount: Math.round(order.totalAmount * 100), // Razorpay expects amount in paise (cents)
          currency: 'INR',
          receipt: order.orderNumber,
        };

        const rzpOrder = await razorpay.orders.create(options);

        // 4. Store payment record
        await tx.payment.create({
          data: {
            orderId: order.id,
            razorpayOrderId: rzpOrder.id,
            amount: order.totalAmount,
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
      // Mark payment as successful, update order payment status
      await paymentRepository.updateStatus(
        razorpayOrderId,
        'success',
        razorpayPaymentId,
        razorpaySignature
      );

      await orderRepository.updatePaymentStatus(orderId, PaymentStatus.PAID, razorpayPaymentId);
      await orderRepository.updateStatus(orderId, OrderStatus.CONFIRMED, 'Payment received, order confirmed.');
      logger.info(`Payment successful (user checkout verified) - Order ID: ${orderId}, Number: ${order.orderNumber}, Razorpay Order: ${razorpayOrderId}, Payment ID: ${razorpayPaymentId}`);

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

        // Update the order details
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            paymentId: razorpayPaymentId,
            status: OrderStatus.CONFIRMED
          }
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            status: OrderStatus.CONFIRMED,
            notes: 'Payment confirmed via webhook.'
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
