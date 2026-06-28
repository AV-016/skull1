import { QuotationRepository } from '../repositories/quotation.repository';
import { CustomRequestRepository } from '../repositories/customRequest.repository';
import { AppError } from '../middlewares/error.middleware';
import { QuotationStatus, CustomRequestStatus, InquiryStatus, Role, OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../config/database';

const quotationRepository = new QuotationRepository();
const customRequestRepository = new CustomRequestRepository();

export class QuotationService {
  async getQuotationById(userId: string, id: string): Promise<any> {
    const quotation = await quotationRepository.findById(id);
    if (!quotation) {
      throw new AppError(404, 'Quotation not found');
    }

    // Verify ownership
    const customRequest = await customRequestRepository.findById(quotation.customRequestId);
    if (customRequest.userId !== userId) {
      throw new AppError(403, 'Forbidden access to this quotation');
    }

    return quotation;
  }

  async acceptQuotation(userId: string, id: string): Promise<any> {
    const quotation = await this.getQuotationById(userId, id);

    if (quotation.status !== QuotationStatus.PENDING) {
      throw new AppError(400, 'Quotation is already processed');
    }

    if (new Date() > quotation.expiresAt) {
      throw new AppError(400, 'Quotation has expired');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Accept quotation
      const q = await tx.quotation.update({
        where: { id },
        data: { status: QuotationStatus.ACCEPTED },
      });

      // 2. Reject other quotations for this request
      await tx.quotation.updateMany({
        where: {
          customRequestId: quotation.customRequestId,
          id: { not: id },
        },
        data: { status: QuotationStatus.REJECTED },
      });

      // 3. Update custom request status to ACCEPTED
      await tx.customRequest.update({
        where: { id: quotation.customRequestId },
        data: { status: CustomRequestStatus.ACCEPTED },
      });

      return q;
    });
  }

  async rejectQuotation(userId: string, id: string): Promise<any> {
    const quotation = await this.getQuotationById(userId, id);

    if (quotation.status !== QuotationStatus.PENDING) {
      throw new AppError(400, 'Quotation is already processed');
    }

    return prisma.$transaction(async (tx) => {
      const q = await tx.quotation.update({
        where: { id },
        data: { status: QuotationStatus.REJECTED },
      });

      await tx.customRequest.update({
        where: { id: quotation.customRequestId },
        data: { status: CustomRequestStatus.REJECTED },
      });

      return q;
    });
  }

  async createQuotation(data: any): Promise<any> {
    const customRequest = await customRequestRepository.findById(data.customRequestId);
    if (!customRequest) {
      throw new AppError(404, 'Custom request not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.validityDays || 7));

    return prisma.$transaction(async (tx) => {
      const q = await tx.quotation.create({
        data: {
          customRequestId: data.customRequestId,
          price: data.price,
          notes: data.notes,
          status: QuotationStatus.PENDING,
          expiresAt,
        },
      });

      await tx.customRequest.update({
        where: { id: data.customRequestId },
        data: { status: CustomRequestStatus.QUOTED },
      });

      // Notify customer via support notification
      const user = await tx.user.findUnique({
        where: { id: customRequest.userId },
      });

      if (user) {
        const inquiry = await tx.inquiry.create({
          data: {
            userId: user.id,
            name: user.name || 'Customer',
            email: user.email,
            subject: 'Custom Request Quoted',
            message: `Your custom request has been quoted! Price: Rs. ${data.price}. Please check your Custom Projects dashboard to review details.`,
            status: InquiryStatus.PENDING,
          },
        });

        await tx.inquiryMessage.create({
          data: {
            inquiryId: inquiry.id,
            senderRole: Role.ADMIN,
            message: `Your custom request has been quoted! Price: Rs. ${data.price}. Please check your Custom Projects dashboard to accept or reject this quote.`,
          },
        });
      }

      return q;
    });
  }

  async updateQuotation(id: string, data: any): Promise<any> {
    const quotation = await quotationRepository.findById(id);
    if (!quotation) {
      throw new AppError(404, 'Quotation not found');
    }

    return quotationRepository.update(id, data);
  }

  async acceptQuotationAndCreateOrder(userId: string, id: string): Promise<any> {
    const quotation = await this.getQuotationById(userId, id);

    if (quotation.status !== QuotationStatus.PENDING) {
      throw new AppError(400, 'Quotation is already processed');
    }

    if (new Date() > quotation.expiresAt) {
      throw new AppError(400, 'Quotation has expired');
    }

    const customRequest = await prisma.customRequest.findUnique({
      where: { id: quotation.customRequestId },
      include: { user: true }
    });

    if (!customRequest) {
      throw new AppError(404, 'Custom request not found');
    }

    const advanceAmount = Math.round(quotation.price * 0.20); // 20% advance

    const getRequestTitle = (req: any) => {
      if (!req.requirements) return 'Custom Project Request';
      const titleMatch = req.requirements.match(/Project Title:\s*(.*)/);
      if (titleMatch && titleMatch[1]) return titleMatch[1].trim();
      return 'Custom Project Request';
    };

    const projectTitle = getRequestTitle(customRequest);

    return prisma.$transaction(async (tx) => {
      let category = await tx.category.findUnique({
        where: { slug: 'custom-orders' },
      });
      if (!category) {
        category = await tx.category.create({
          data: {
            name: 'Custom Orders',
            slug: 'custom-orders',
            description: 'Custom print designs and orders',
          },
        });
      }

      const product = await tx.product.create({
        data: {
          name: `${projectTitle} (20% Advance)`,
          slug: `custom-project-${customRequest.id}-${Date.now()}`,
          description: customRequest.description,
          price: advanceAmount,
          categoryId: category.id,
          stock: 1,
          isActive: false,
        },
      });

      let address = await tx.address.findFirst({
        where: { userId: customRequest.userId, isActive: true },
        orderBy: { isDefault: 'desc' },
      });

      if (!address) {
        address = await tx.address.create({
          data: {
            userId: customRequest.userId,
            street: 'Custom Order Shipping',
            city: 'Custom City',
            state: 'Custom State',
            postalCode: '000000',
            country: 'Custom Country',
            phone: '0000000000',
            isDefault: true,
          },
        });
      }

      const orderNumber = `CR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: customRequest.userId,
          addressId: address.id,
          totalAmount: advanceAmount,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: 'CARD', // Force online card payment
          items: {
            create: {
              productId: product.id,
              quantity: 1,
              price: advanceAmount,
            },
          },
        },
        include: {
          items: true,
        },
      });

      return order;
    });
  }

  async deleteQuotation(id: string): Promise<void> {
    const quotation = await quotationRepository.findById(id);
    if (!quotation) {
      throw new AppError(404, 'Quotation not found');
    }
    await quotationRepository.delete(id);
  }
}

export default QuotationService;
