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
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError(404, 'Order not found');
    }

    if (order.userId !== userId) {
      throw new AppError(403, 'Forbidden checkout order access');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new AppError(400, 'Order is already paid');
    }

    const options = {
      amount: Math.round(order.totalAmount * 100), // Razorpay expects amount in paise (cents)
      currency: 'INR',
      receipt: order.orderNumber,
    };

    try {
      const rzpOrder = await razorpay.orders.create(options);
      
      // Store payment record
      await paymentRepository.create({
        order: { connect: { id: order.id } },
        razorpayOrderId: rzpOrder.id,
        amount: order.totalAmount,
        status: 'created',
      });

      return {
        keyId: env.RAZORPAY_KEY_ID,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        razorpayOrderId: rzpOrder.id,
        orderNumber: order.orderNumber,
      };
    } catch (error) {
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
      throw new AppError(400, 'Invalid webhook signature');
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    logger.info(`Processing payment webhook event: ${event}`);

    if (event === 'payment.captured') {
      const paymentDetails = payload.payload.payment.entity;
      const razorpayOrderId = paymentDetails.order_id;
      const razorpayPaymentId = paymentDetails.id;

      const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);
      if (payment) {
        const order = await orderRepository.findById(payment.orderId);
        if (order && order.paymentStatus !== PaymentStatus.PAID) {
          await paymentRepository.updateStatus(
            razorpayOrderId,
            'success',
            razorpayPaymentId,
            signature
          );
          await orderRepository.updatePaymentStatus(payment.orderId, PaymentStatus.PAID, razorpayPaymentId);
          await orderRepository.updateStatus(payment.orderId, OrderStatus.CONFIRMED, 'Payment confirmed via webhook.');

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
      }
    } else if (event === 'payment.failed') {
      const paymentDetails = payload.payload.payment.entity;
      const razorpayOrderId = paymentDetails.order_id;
      
      const payment = await paymentRepository.findByRazorpayOrderId(razorpayOrderId);
      if (payment) {
        await paymentRepository.updateStatus(razorpayOrderId, 'failed');
        await orderRepository.updatePaymentStatus(payment.orderId, PaymentStatus.FAILED);
      }
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
