import { CustomRequestRepository } from '../repositories/customRequest.repository';
import { AppError } from '../middlewares/error.middleware';
import { CustomRequestStatus } from '@prisma/client';

const customRequestRepository = new CustomRequestRepository();

export class CustomRequestService {
  async getCustomRequests(userId: string): Promise<any[]> {
    return customRequestRepository.findByUserId(userId);
  }

  async getCustomRequestById(userId: string, id: string, isAdmin: boolean = false): Promise<any> {
    const request = await customRequestRepository.findById(id);
    if (!request) {
      throw new AppError(404, 'Custom request not found');
    }

    if (!isAdmin && request.userId !== userId) {
      throw new AppError(403, 'Forbidden access to this request');
    }

    return request;
  }

  async createCustomRequest(userId: string, data: any): Promise<any> {
    return customRequestRepository.create({
      userId,
      description: data.description,
      requirements: data.requirements,
      files: data.files,
    });
  }

  async updateCustomRequest(userId: string, id: string, data: any, isAdmin: boolean = false): Promise<any> {
    const request = await this.getCustomRequestById(userId, id, isAdmin);

    if (data.status && !isAdmin) {
      throw new AppError(403, 'Only admins can update custom request status');
    }

    return customRequestRepository.updateStatus(id, data.status || request.status);
  }

  async deleteCustomRequest(userId: string, id: string, isAdmin: boolean = false): Promise<void> {
    await this.getCustomRequestById(userId, id, isAdmin);
    await customRequestRepository.delete(id);
  }

  // File attachments
  async uploadRequestFile(userId: string, id: string, url: string, fileType: string): Promise<any> {
    await this.getCustomRequestById(userId, id);
    return customRequestRepository.addFile(id, url, fileType);
  }

  async deleteRequestFile(userId: string, fileId: string, isAdmin: boolean = false): Promise<void> {
    // Verify file exists
    const file = await prisma.customRequestFile.findUnique({ where: { id: fileId } });
    if (!file) {
      throw new AppError(404, 'File not found');
    }

    // Verify ownership
    await this.getCustomRequestById(userId, file.customRequestId, isAdmin);
    await customRequestRepository.deleteFile(fileId);
  }

  async getAllCustomRequests(page: number = 1, limit: number = 10): Promise<any> {
    const { requests, total } = await customRequestRepository.findAll(page, limit);
    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

// Global prisma import fallback if not defined
import { prisma } from '../config/database';

export default CustomRequestService;
