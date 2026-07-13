import { prisma } from '../config/database';
import logger from '../utils/logger';

export interface MonitoringStats {
  status: 'healthy' | 'warning' | 'critical';
  counts: {
    errors500: number;
    paymentFailures: number;
    webhookFailures: number;
    smtpFailures: number;
    dbFailures: number;
  };
  recentAlerts: Array<{
    category: string;
    message: string;
    timestamp: string;
  }>;
}

export class MonitoringService {
  async getStats(): Promise<MonitoringStats> {
    const timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 hours

    let paymentFailures = 0;
    try {
      paymentFailures = await prisma.order.count({
        where: {
          paymentStatus: 'FAILED',
          createdAt: { gte: timeLimit }
        },
      });
    } catch (dbErr) {
      logger.error('Error counting failed orders in monitoring:', dbErr);
    }

    let errors500 = 0;
    let webhookFailures = 0;
    let smtpFailures = 0;
    let dbFailures = 0;

    try {
      errors500 = await prisma.alertLog.count({
        where: {
          category: '500 Internal Error',
          timestamp: { gte: timeLimit }
        }
      });
      webhookFailures = await prisma.alertLog.count({
        where: {
          category: 'Webhook Verification',
          timestamp: { gte: timeLimit }
        }
      });
      smtpFailures = await prisma.alertLog.count({
        where: {
          category: 'SMTP Delivery',
          timestamp: { gte: timeLimit }
        }
      });
      dbFailures = await prisma.alertLog.count({
        where: {
          category: 'Database / Timeout',
          timestamp: { gte: timeLimit }
        }
      });
    } catch (err) {
      logger.error('Error querying AlertLog counts:', err);
    }

    const recentAlerts: Array<{ category: string; message: string; timestamp: string }> = [];
    try {
      const logs = await prisma.alertLog.findMany({
        where: {
          timestamp: { gte: timeLimit }
        },
        orderBy: { timestamp: 'desc' },
        take: 15,
      });
      for (const log of logs) {
        recentAlerts.push({
          category: log.category,
          message: log.message,
          timestamp: log.timestamp.toISOString(),
        });
      }
    } catch (err) {
      logger.error('Error querying AlertLog list:', err);
    }

    // Compute status level
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const totalIssues = errors500 + webhookFailures + smtpFailures + dbFailures + paymentFailures;

    if (dbFailures > 5 || errors500 > 10) {
      status = 'critical';
    } else if (totalIssues > 0) {
      status = 'warning';
    }

    return {
      status,
      counts: {
        errors500,
        paymentFailures,
        webhookFailures,
        smtpFailures,
        dbFailures,
      },
      recentAlerts,
    };
  }
}

export default MonitoringService;
