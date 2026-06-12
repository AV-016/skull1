import { prisma } from '../config/database';
import { Quotation, QuotationStatus, Prisma } from '@prisma/client';

export class QuotationRepository {
  async findById(id: string): Promise<Quotation | null> {
    return prisma.quotation.findUnique({
      where: { id },
      include: {
        customRequest: true,
      },
    });
  }

  async findByCustomRequestId(customRequestId: string): Promise<Quotation[]> {
    return prisma.quotation.findMany({
      where: { customRequestId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.QuotationCreateInput): Promise<Quotation> {
    return prisma.quotation.create({
      data,
    });
  }

  async updateStatus(id: string, status: QuotationStatus): Promise<Quotation> {
    return prisma.quotation.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<Quotation> {
    return prisma.quotation.delete({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.QuotationUpdateInput): Promise<Quotation> {
    return prisma.quotation.update({
      where: { id },
      data,
    });
  }
}

export default QuotationRepository;
