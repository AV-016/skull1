import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { prisma } from '../config/database';
import { sendOtpEmail } from '../utils/mail';

const adminService = new AdminService();

export class AdminController {
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await adminService.getSettings();
      res.status(200).json({
        success: true,
        message: 'Admin settings retrieved successfully',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await adminService.updateSettings(req.body);
      res.status(200).json({
        success: true,
        message: 'Admin settings updated successfully',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivityLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const result = await adminService.getActivityLogs(page, limit);
      res.status(200).json({
        success: true,
        message: 'Activity logs list retrieved successfully',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivityLogById(req: Request, res: Response, next: NextFunction) {
    try {
      const log = await adminService.getActivityLogById(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Activity log details retrieved successfully',
        data: log,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingLoyaltyDiscounts(req: Request, res: Response, next: NextFunction) {
    try {
      const discounts = await adminService.getPendingLoyaltyDiscounts();
      res.status(200).json({
        success: true,
        message: 'Pending loyalty discounts retrieved successfully',
        data: discounts,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveLoyaltyDiscount(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, discountValue } = req.body;
      const user = await adminService.approveLoyaltyDiscount(userId, Number(discountValue));
      res.status(200).json({
        success: true,
        message: 'Loyalty discount approved successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendSettingsOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await prisma.emailOTP.deleteMany({
        where: { email: user.email },
      });

      await prisma.emailOTP.create({
        data: {
          email: user.email,
          otp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      await sendOtpEmail(user.email, user.name || 'Admin', otp);

      return res.status(200).json({
        success: true,
        message: 'Verification OTP sent to your email successfully',
      });
    } catch (error) {
      return next(error);
    }
  }

  async updateSupportEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { supportEmail, otp } = req.body;
      if (!supportEmail || !otp) {
        return res.status(400).json({ success: false, message: 'Support email and OTP are required' });
      }

      const record = await prisma.emailOTP.findFirst({
        where: { email: user.email, otp },
      });

      if (!record) {
        return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
      }

      if (new Date() > record.expiresAt) {
        return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new one.' });
      }

      await prisma.emailOTP.delete({
        where: { id: record.id },
      });

      const settings = await prisma.settings.upsert({
        where: { id: 'global' },
        update: { supportEmail },
        create: { id: 'global', supportEmail },
      });

      return res.status(200).json({
        success: true,
        message: 'Support email updated successfully',
        data: settings,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default AdminController;
