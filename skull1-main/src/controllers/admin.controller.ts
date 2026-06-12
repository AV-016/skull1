import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';

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
}

export default AdminController;
