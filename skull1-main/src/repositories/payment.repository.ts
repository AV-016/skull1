// PaymentRepository: Handles direct database queries and mutations for the Payment model using Prisma client.
import { prisma } from '../config/database';
import { Payment, Prisma } from '@prisma/client';

export class PaymentRepository {
  // Query a specific payment log by its unique database ID.
  async findById(id: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { id },
    });
  }

  // Query a payment record by the Razorpay Order ID.
  async findByRazorpayOrderId(razorpayOrderId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { razorpayOrderId },
    });
  }

  // Create and save a new payment log.
  async create(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return prisma.payment.create({
      data,
    });
  }

  // Updates the payment record status (e.g. success, failed, created) and records the transaction receipt reference.
  async updateStatus(
    razorpayOrderId: string,
    status: string,
    razorpayPaymentId?: string,
    razorpaySignature?: string
  ): Promise<Payment> {
    return prisma.payment.update({
      where: { razorpayOrderId },
      data: {
        status,
        razorpayPaymentId,
        razorpaySignature,
      },
    });
  }

  // Retrieves all payment logs, sorted descending by creation date (newest first), with pagination support.
  async findAll(page: number = 1, limit: number = 10): Promise<{ payments: Payment[]; total: number }> {
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count(),
    ]);

    return { payments, total };
  }
}

export default PaymentRepository;
