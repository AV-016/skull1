import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';

const dashboardService = new DashboardService();

export class DashboardController {
  async getCustomerDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = await dashboardService.getCustomerDashboard(userId);
      res.status(200).json({
        success: true,
        message: 'Customer dashboard data retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dashboardService.getAdminDashboard();
      res.status(200).json({
        success: true,
        message: 'Admin dashboard metrics retrieved successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;
