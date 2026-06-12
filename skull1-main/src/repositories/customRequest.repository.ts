import { prisma } from '../config/database';
import { CustomRequest, CustomRequestStatus, Prisma } from '@prisma/client';

export class CustomRequestRepository {
  async findById(id: string): Promise<any> {
    return prisma.customRequest.findUnique({
      where: { id },
      include: {
        files: true,
        quotations: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string): Promise<CustomRequest[]> {
    return prisma.customRequest.findMany({
      where: { userId },
      include: {
        files: true,
        quotations: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ requests: CustomRequest[]; total: number }> {
    const skip = (page - 1) * limit;
    const [requests, total] = await Promise.all([
      prisma.customRequest.findMany({
        include: {
          files: true,
          quotations: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customRequest.count(),
    ]);

    return { requests, total };
  }

  async create(data: {
    userId: string;
    description: string;
    requirements?: string;
    files?: { url: string; fileType: string }[];
  }): Promise<CustomRequest> {
    const { userId, description, requirements, files = [] } = data;
    return prisma.customRequest.create({
      data: {
        userId,
        description,
        requirements,
        files: {
          create: files.map((file) => ({
            url: file.url,
            fileType: file.fileType,
          })),
        },
      },
    });
  }

  async updateStatus(id: string, status: CustomRequestStatus): Promise<CustomRequest> {
    return prisma.customRequest.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string): Promise<CustomRequest> {
    return prisma.customRequest.delete({
      where: { id },
    });
  }

  async addFile(customRequestId: string, url: string, fileType: string): Promise<any> {
    return prisma.customRequestFile.create({
      data: {
        customRequestId,
        url,
        fileType,
      },
    });
  }

  async deleteFile(fileId: string): Promise<any> {
    return prisma.customRequestFile.delete({
      where: { id: fileId },
    });
  }

  async countPending(): Promise<number> {
    return prisma.customRequest.count({
      where: { status: CustomRequestStatus.PENDING },
    });
  }
}

export default CustomRequestRepository;
