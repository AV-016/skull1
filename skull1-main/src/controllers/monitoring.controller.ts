import { Request, Response, NextFunction } from 'express';
import { MonitoringService } from '../services/monitoring.service';

const monitoringService = new MonitoringService();

export class MonitoringController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await monitoringService.getStats();
      res.status(200).json({
        success: true,
        message: 'System health monitoring stats retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default MonitoringController;
