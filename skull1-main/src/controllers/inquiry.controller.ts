import { Request, Response, NextFunction } from 'express';
import { InquiryService } from '../services/inquiry.service';
import MESSAGES from '../constants/messages';

const inquiryService = new InquiryService();

export class InquiryController {
  async createInquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const inquiry = await inquiryService.createInquiry(req.body);
      res.status(201).json({
        success: true,
        message: MESSAGES.INQUIRY.SUBMITTED,
        data: inquiry,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllInquiries(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const result = await inquiryService.getInquiries(page, limit);
      res.status(200).json({
        success: true,
        message: 'Inquiries list retrieved successfully',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInquiryById(req: Request, res: Response, next: NextFunction) {
    try {
      const inquiry = await inquiryService.getInquiryById(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Inquiry details retrieved',
        data: inquiry,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateInquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const inquiry = await inquiryService.updateInquiryStatus(req.params.id, status);
      res.status(200).json({
        success: true,
        message: MESSAGES.INQUIRY.UPDATED,
        data: inquiry,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteInquiry(req: Request, res: Response, next: NextFunction) {
    try {
      await inquiryService.deleteInquiry(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Inquiry deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyInquiries(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const inquiries = await inquiryService.getMyInquiries(userId);
      return res.status(200).json({
        success: true,
        data: inquiries,
      });
    } catch (error) {
      return next(error);
    }
  }

  async createInquiryMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const role = user.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
      const msg = await inquiryService.createInquiryMessage(id, user.id, role, message);
      return res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: msg,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default InquiryController;

