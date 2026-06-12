import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

const userService = new UserService();

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const profile = await userService.getProfile(userId);
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const profile = await userService.updateProfile(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      await userService.deleteAccount(userId);
      res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const stats = await userService.getUserDashboard(userId);
      res.status(200).json({
        success: true,
        message: 'User dashboard data retrieved',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const logs = await userService.getUserActivity(userId);
      res.status(200).json({
        success: true,
        message: 'User activity log retrieved',
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
