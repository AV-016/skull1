import { QuotationRepository } from '../repositories/quotation.repository';
import { CustomRequestRepository } from '../repositories/customRequest.repository';
import { AppError } from '../middlewares/error.middleware';
import { QuotationStatus, CustomRequestStatus } from '@prisma/client';
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

  async deleteQuotation(id: string): Promise<void> {
    const quotation = await quotationRepository.findById(id);
    if (!quotation) {
      throw new AppError(404, 'Quotation not found');
    }
    await quotationRepository.delete(id);
  }
}

export default QuotationService;
