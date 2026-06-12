import { prisma } from '../config/database';
import { Inquiry, InquiryStatus, Role } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

export class InquiryService {
  async createInquiry(data: any): Promise<Inquiry> {
    return prisma.inquiry.create({
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        userId: data.userId || null,
        productId: data.productId || null,
        orderId: data.orderId || null,
        status: InquiryStatus.PENDING,
      },
    });
  }

  async getInquiries(page: number = 1, limit: number = 10): Promise<{ data: any[]; meta: any }> {
    const skip = (page - 1) * limit;
    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          product: {
            select: {
              name: true,
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          order: {
            select: {
              orderNumber: true,
            },
          },
        },
      }),
      prisma.inquiry.count(),
    ]);

    return {
      data: inquiries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInquiryById(id: string): Promise<Inquiry> {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    } as any);
    if (!inquiry) {
      throw new AppError(404, 'Inquiry not found');
    }
    return inquiry;
  }

  async getMyInquiries(userId: string): Promise<Inquiry[]> {
    return prisma.inquiry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            name: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  async createInquiryMessage(inquiryId: string, senderId: string | null, senderRole: Role, message: string) {
    const inquiry = await this.getInquiryById(inquiryId);
    
    const newMessage = await prisma.inquiryMessage.create({
      data: {
        inquiryId,
        senderId,
        senderRole,
        message,
      },
    });

    // Automatically mark inquiry as PENDING/OPEN if customer replied, or keep active
    if (senderRole === Role.ADMIN) {
      // Set to RESOLVED or answered status if desired, here we just keep it PENDING or update updated time
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { updatedAt: new Date() },
      });
    }

    return newMessage;
  }

  async updateInquiryStatus(id: string, status: InquiryStatus): Promise<Inquiry> {
    await this.getInquiryById(id);
    return prisma.inquiry.update({
      where: { id },
      data: { status },
    });
  }

  async deleteInquiry(id: string): Promise<void> {
    await this.getInquiryById(id);
    await prisma.inquiry.delete({
      where: { id },
    });
  }
}

export default InquiryService;

