import { prisma } from '../config/database';
import { Payment, Prisma } from '@prisma/client';

export class PaymentRepository {
  async findById(id: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { id },
    });
  }

  async findByRazorpayOrderId(razorpayOrderId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { razorpayOrderId },
    });
  }

  async create(data: Prisma.PaymentCreateInput): Promise<Payment> {
    return prisma.payment.create({
      data,
    });
  }

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
